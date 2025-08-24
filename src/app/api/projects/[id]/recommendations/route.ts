import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import RecommendationGenerator from '@/utils/recommendationGenerator';
import ImageRequirementsAnalyzer from '@/analyzers/imageRequirements';

const prisma = new PrismaClient();

// GET - Generate detailed AI recommendations for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Perform fresh analysis
    const analyzer = new ImageRequirementsAnalyzer();
    const analysis = await analyzer.analyzeProject({
      name: project.name,
      businessType: project.businessType || project.type,
      prdContent: project.prdContent || '',
      schemaContent: project.schemaContent || ''
    });

    // Generate detailed recommendations
    const recommendationGenerator = new RecommendationGenerator();
    const recommendations = await recommendationGenerator.generateDetailedRecommendations(
      analysis.businessContext,
      analysis.imageRequirements
    );

    // Create ProjectField records from recommendations
    const createdFields = [];
    
    // First, ensure we have the required asset types
    const assetTypeMap = new Map();
    
    for (const rec of recommendations.recommendations) {
      if (!assetTypeMap.has(rec.category)) {
        // Try to find existing asset type or create a generic one
        let assetType = await prisma.assetType.findFirst({
          where: { 
            OR: [
              { name: { contains: rec.category } },
              { category: { contains: rec.category } }
            ]
          }
        });
        
        if (!assetType) {
          // Create a generic asset type for this category
          assetType = await prisma.assetType.create({
            data: {
              name: rec.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              displayName: rec.title,
              category: rec.category,
              description: rec.description,
              specifications: {
                dimensions: rec.technicalSpecs.dimensions,
                aspectRatio: rec.technicalSpecs.aspectRatio,
                format: rec.technicalSpecs.preferredFormat
              },
              modelPreferences: '[]'
            }
          });
        }
        assetTypeMap.set(rec.category, assetType);
      }
    }

    // Create ProjectField for each recommendation
    for (const rec of recommendations.recommendations) {
      const assetType = assetTypeMap.get(rec.category);
      
      const field = await prisma.projectField.create({
        data: {
          projectId,
          name: rec.title,
          description: rec.description,
          assetTypeId: assetType.id,
          requirements: {
            quantity: rec.quantity,
            priority: rec.priority,
            composition: rec.composition,
            lighting: rec.lighting,
            mood: rec.mood,
            technicalSpecs: rec.technicalSpecs,
            examples: rec.examples,
            reasoning: rec.reasoning,
            colorPalette: rec.colorPalette || []
          },
          isImageToImage: false
        }
      });
      
      createdFields.push(field);
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendations generated successfully',
      data: {
        recommendations: {
          projectId,
          analysis: {
            websiteStyle: recommendations.websiteStyle,
            summary: recommendations.summary,
            recommendations: recommendations.recommendations
          },
          generatedFields: createdFields,
          estimatedCost: recommendations.summary.totalCost,
          estimatedTime: recommendations.summary.timeEstimate
        }
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to generate recommendations'
    }, { status: 500 });
  }
}