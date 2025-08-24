import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DalleGenerator } from '@/generators/openai/dalle';

const prisma = new PrismaClient();

// POST - Generate images for field prompts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;
    const body = await request.json();

    // Check if field exists
    const field = await prisma.projectField.findUnique({
      where: { id: fieldId },
      include: { 
        assetType: true, 
        project: true,
        prompts: {
          include: {
            model: true,
            tags: { include: { tag: true } }
          },
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!field) {
      return NextResponse.json({
        success: false,
        error: 'Field not found'
      }, { status: 404 });
    }

    // Get prompt to generate from
    const { promptId, quantity = 1 } = body;
    let targetPrompt = null;

    if (promptId) {
      targetPrompt = field.prompts.find(p => p.id === promptId);
      if (!targetPrompt) {
        return NextResponse.json({
          success: false,
          error: 'Prompt not found'
        }, { status: 404 });
      }
    } else {
      // Use latest prompt if no specific prompt provided
      targetPrompt = field.prompts[0];
      if (!targetPrompt) {
        return NextResponse.json({
          success: false,
          error: 'No prompts found for this field. Create a prompt first.'
        }, { status: 400 });
      }
    }

    // Create generation session
    const session = await prisma.generationSession.create({
      data: {
        projectId: field.projectId,
        name: `Generate ${field.name} - ${new Date().toLocaleString()}`,
        type: 'single',
        status: 'processing',
        settings: {
          fieldId: fieldId,
          promptId: targetPrompt.id,
          quantity
        },
        totalImages: quantity
      }
    });

    // Check if model is DALL-E (we only support DALL-E for now)
    if (targetPrompt.model.provider !== 'openai' || targetPrompt.model.modelId !== 'dall-e-3') {
      return NextResponse.json({
        success: false,
        error: 'Only DALL-E 3 is currently supported for image generation'
      }, { status: 400 });
    }

    // Generate images using DALL-E
    const dalleGenerator = new DalleGenerator();
    const requirements = field.requirements as Record<string, unknown>;
    
    // Prepare generation request
    const generationRequest = {
      requirement: {
        title: field.name,
        description: field.description,
        category: (field.assetType.category as 'hero' | 'service' | 'gallery' | 'before-after' | 'team' | 'product' | 'location' | 'equipment') || 'gallery',
        quantity: quantity,
        priority: ((requirements.priority as string) as 'high' | 'medium' | 'low') || 'medium',
        technicalSpecs: (requirements.technicalSpecs as Record<string, unknown>) || {},
        merged: true,
        dimensions: { width: 1024, height: 1024 },
        aspectRatio: '1:1' as const,
        style: 'professional',
        variations: 1,
        composition: (requirements.composition as string) || 'centered',
        lighting: (requirements.lighting as string) || 'natural',
        mood: (requirements.mood as string) || 'neutral',
        subject: field.name,
        context: field.description
      },
      enhancedPrompt: targetPrompt.content,
      quantity: quantity,
      quality: 'hd' as const,
      style: 'natural' as const,
      size: '1024x1024' as const
    };

    try {
      const results = await dalleGenerator.generateImages([generationRequest]);
      const result = results[0];

      if (!result.success) {
        // Update session status
        await prisma.generationSession.update({
          where: { id: session.id },
          data: {
            status: 'failed',
            errorMessage: result.error
          }
        });

        return NextResponse.json({
          success: false,
          error: result.error || 'Image generation failed'
        }, { status: 500 });
      }

      // Save generated images to database
      const savedImages = [];
      for (const image of result.images) {
        const savedImage = await prisma.generatedImage.create({
          data: {
            promptId: targetPrompt.id,
            sessionId: session.id,
            originalUrl: image.url,
            optimizedPaths: {}, // Empty for now, can be filled by image processor later
            metadata: image.metadata,
            cost: result.cost / result.images.length, // Split cost among images
            generationTime: result.processingTime
          }
        });
        savedImages.push(savedImage);
      }

      // Update session status
      await prisma.generationSession.update({
        where: { id: session.id },
        data: {
          status: 'completed',
          totalCost: result.cost,
          processingTime: result.processingTime
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Images generated successfully',
        data: {
          sessionId: session.id,
          images: savedImages.map(img => ({
            id: img.id,
            url: img.originalUrl,
            metadata: img.metadata,
            cost: img.cost,
            generationTime: img.generationTime,
            createdAt: img.createdAt
          })),
          totalCost: result.cost,
          processingTime: result.processingTime
        }
      });

    } catch (generationError) {
      // Update session status
      await prisma.generationSession.update({
        where: { id: session.id },
        data: {
          status: 'failed',
          errorMessage: generationError instanceof Error ? generationError.message : 'Unknown generation error'
        }
      });

      throw generationError;
    }

  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to generate images'
    }, { status: 500 });
  }
}