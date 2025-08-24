import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ImageRequirementsAnalyzer, { ProjectAnalysis } from '@/analyzers/imageRequirements';
import PromptTemplateEngine from '@/generators/templates/promptTemplates';
import PromptEnhancer from '@/generators/openai/promptEnhancer';
import DalleGenerator from '@/generators/openai/dalle';
import ReplicateModelManager from '@/generators/replicate/models';
import ImageToImageGenerator from '@/generators/replicate/imageToImage';
import ImageProcessor from '@/processors/imageProcessor';
import { GeneratedImageData } from '@/types/api';
import { convertToProcessorTypes } from '@/utils/typeConverters';
import path from 'path';

const prisma = new PrismaClient();

export interface GenerationRequest {
  projectPath?: string; // For file-based projects
  projectId?: string; // For database-stored projects
  projectData?: {
    name: string;
    businessType: string;
    prdContent: string;
    schemaContent: string;
  }; // For inline project data
  options: {
    quantity?: number;
    style?: 'photorealistic' | 'professional' | 'artistic' | 'illustration';
    mood?: 'bright' | 'warm' | 'cool' | 'dramatic' | 'soft';
    useOpenAI?: boolean;
    useReplicate?: boolean;
    generateBeforeAfter?: boolean;
    outputFormat?: 'web-optimized' | 'high-quality' | 'maximum-compression';
    outputSizes?: 'web-standard' | 'social-media' | 'print-ready';
  };
}

export interface GenerationResponse {
  success: boolean;
  message: string;
  data?: {
    analysis: ProjectAnalysis;
    generatedImages: number;
    totalCost: number;
    processingTime: number;
    outputPath: string;
    imageVariants: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    
    // Validate that we have a project source
    if (!body.projectPath && !body.projectId && !body.projectData) {
      return NextResponse.json({
        success: false,
        error: 'Project path, project ID, or project data is required'
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Initialize all components
    const analyzer = new ImageRequirementsAnalyzer();
    const promptEngine = new PromptTemplateEngine();
    const promptEnhancer = new PromptEnhancer();
    const dalleGenerator = new DalleGenerator();
    const replicateManager = new ReplicateModelManager();
    const imageToImageGenerator = new ImageToImageGenerator();
    const imageProcessor = new ImageProcessor();

    // Step 1: Analyze the project
    console.log('🔍 Analyzing project...');
    let analysis: ProjectAnalysis;

    if (body.projectPath) {
      // File-based project
      analysis = await analyzer.analyzeProject(body.projectPath);
    } else if (body.projectId) {
      // Database-stored project
      const project = await prisma.project.findUnique({
        where: { id: body.projectId }
      });

      if (!project) {
        return NextResponse.json({
          success: false,
          error: 'Project not found'
        }, { status: 404 });
      }

      analysis = await analyzer.analyzeProject({
        name: project.name,
        businessType: project.businessType || project.type,
        prdContent: project.prdContent || '',
        schemaContent: project.schemaContent || ''
      });
    } else if (body.projectData) {
      // Inline project data
      analysis = await analyzer.analyzeProject(body.projectData);
    } else {
      throw new Error('Invalid project source');
    }

    // Step 2: Generate enhanced prompts
    console.log('✨ Generating enhanced prompts...');
    const promptSets = [];
    
    for (const requirement of analysis.imageRequirements) {
      const promptSet = promptEngine.generatePromptSet(requirement, analysis.businessContext, {
        style: body.options.style,
        includeAlternatives: true,
        variationCount: 2
      });

      // Enhance the primary prompt
      const enhancedPrompt = await promptEnhancer.enhancePrompt({
        requirement: {
          name: requirement.subject,
          description: requirement.context,
          category: requirement.category,
          priority: requirement.priority,
          dimensions: requirement.dimensions
        },
        businessContext: analysis.businessContext,
        style: body.options.style,
        mood: body.options.mood
      });

      promptSets.push({
        requirement,
        promptSet,
        enhancedPrompt
      });
    }

    // Step 3: Generate images
    console.log('🎨 Generating images...');
    const allGeneratedImages: GeneratedImageData[] = [];
    let totalCost = 0;

    for (const { requirement, enhancedPrompt } of promptSets) {
      const quantity = body.options.quantity || requirement.quantity;

      // Choose generator based on requirements and options
      if (body.options.useOpenAI !== false && requirement.priority === 'high') {
        // Use DALL-E for high priority images
        const dalleRequests = [{
          requirement,
          enhancedPrompt: enhancedPrompt.enhanced,
          quantity: Math.min(quantity, 4), // DALL-E has lower batch limits
          quality: DalleGenerator.getBestQuality(requirement),
          style: DalleGenerator.getBestStyle(requirement),
          size: DalleGenerator.getBestSize(requirement)
        }];

        const dalleResults = await dalleGenerator.generateImages(dalleRequests);
        for (const result of dalleResults) {
          allGeneratedImages.push(...(result.images as unknown as GeneratedImageData[]));
          totalCost += result.cost;
        }
      }

      if (body.options.useReplicate !== false) {
        // Use Replicate for additional images or as fallback
        const modelId = ReplicateModelManager.selectBestModel(requirement);
        const dimensions = ReplicateModelManager.getBestDimensions(requirement, modelId);
        
        const replicateRequests = [{
          modelId,
          prompt: enhancedPrompt.enhanced,
          negativePrompt: enhancedPrompt.negativePrompts?.join(', '),
          width: dimensions.width,
          height: dimensions.height,
          numOutputs: Math.min(quantity, 4),
          numInferenceSteps: 30,
          guidanceScale: 7.5
        }];

        const replicateResults = await replicateManager.generateImages(replicateRequests);
        for (const result of replicateResults) {
          allGeneratedImages.push(...(result.images as unknown as GeneratedImageData[]));
          totalCost += result.cost;
        }
      }

      // Generate before/after pairs if requested
      if (body.options.generateBeforeAfter && requirement.category === 'before-after') {
        const beforeAfterRequest = {
          businessType: analysis.businessContext.businessType,
          serviceType: 'general',
          requirement,
          beforePrompt: enhancedPrompt.enhanced.replace('after', 'before'),
          afterPrompt: enhancedPrompt.enhanced,
          transformationInstructions: ImageToImageGenerator.createTransformationInstructions(
            analysis.businessContext.businessType.toLowerCase().replace(/\s+/g, '-'),
            'general'
          ),
          quantity: Math.min(quantity, 3) // Limit before/after pairs
        };

        const beforeAfterResult = await imageToImageGenerator.generateBeforeAfterPairs(beforeAfterRequest);
        
        if (beforeAfterResult.success) {
          for (const pair of beforeAfterResult.pairs) {
            allGeneratedImages.push(...(pair.before.images as unknown as GeneratedImageData[]), ...(pair.after.images as unknown as GeneratedImageData[]));
          }
          totalCost += beforeAfterResult.totalCost;
        }
      }
    }

    // Step 4: Process images
    console.log('🖼️ Processing images...');
    const outputDir = path.join(process.cwd(), 'outputs', analysis.projectName, new Date().toISOString().split('T')[0]);
    
    const processingOptions = {
      outputDir,
      formats: imageProcessor.getStandardFormats(body.options.outputFormat || 'web-optimized'),
      sizes: imageProcessor.getStandardSizes(body.options.outputSizes || 'web-standard'),
      quality: 85,
      optimization: 'basic' as const,
      preserveOriginal: true,
      generateThumbnails: true
    };

    const processedImages = await imageProcessor.processImages(
      convertToProcessorTypes(allGeneratedImages),
      processingOptions,
      {
        businessType: analysis.businessContext.businessType,
        category: 'generated',
        tags: ['ai-generated', analysis.projectName]
      }
    );

    const totalVariants = processedImages.reduce((sum, img) => sum + img.variants.length, 0);
    const processingTime = Date.now() - startTime;

    const response: GenerationResponse = {
      success: true,
      message: `Successfully generated ${allGeneratedImages.length} images with ${totalVariants} variants`,
      data: {
        analysis,
        generatedImages: allGeneratedImages.length,
        totalCost: Math.round(totalCost * 100) / 100,
        processingTime,
        outputPath: outputDir,
        imageVariants: totalVariants
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to generate images'
    }, { status: 500 });
  }
}

// GET endpoint to analyze a project without generating images
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectPath = url.searchParams.get('projectPath');
    const projectId = url.searchParams.get('projectId');
    
    if (!projectPath && !projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project path or project ID is required'
      }, { status: 400 });
    }

    const analyzer = new ImageRequirementsAnalyzer();
    let analysis: ProjectAnalysis;

    if (projectPath) {
      // File-based project
      analysis = await analyzer.analyzeProject(projectPath);
    } else if (projectId) {
      // Database-stored project
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
      analysis = await analyzer.analyzeProject({
        name: project.name,
        businessType: project.businessType || project.type,
        prdContent: project.prdContent || '',
        schemaContent: project.schemaContent || ''
      });
    } else {
      throw new Error('Invalid project source');
    }

    return NextResponse.json({
      success: true,
      message: 'Project analyzed successfully',
      data: {
        analysis,
        summary: analyzer.generateSummary(analysis)
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to analyze project'
    }, { status: 500 });
  }
}

// PUT endpoint to update generation settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This would update generation settings in a database
    // For now, just return the settings
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: body
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}