import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get specific field details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;

    const field = await prisma.projectField.findUnique({
      where: { id: fieldId },
      include: {
        project: true,
        assetType: true,
        prompts: {
          include: {
            model: true,
            images: {
              orderBy: { createdAt: 'desc' }
            },
            tags: {
              include: {
                tag: true
              }
            }
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

    // Calculate field stats
    const totalPrompts = field.prompts.length;
    const totalImages = field.prompts.reduce((sum, prompt) => sum + prompt.images.length, 0);
    const requirements = field.requirements as { quantity?: number; technicalSpecs?: { estimatedCost?: number } };
    const targetQuantity = requirements?.quantity || 1;
    const estimatedCost = requirements?.technicalSpecs?.estimatedCost || 0;
    
    const fieldWithStats = {
      ...field,
      stats: {
        promptsGenerated: totalPrompts,
        imagesGenerated: totalImages,
        targetQuantity,
        completionPercentage: Math.round((totalImages / targetQuantity) * 100),
        totalEstimatedCost: estimatedCost * targetQuantity,
        status: totalImages >= targetQuantity ? 'completed' : 
               totalImages > 0 ? 'in-progress' : 'pending'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Field details retrieved',
      data: { field: fieldWithStats }
    });

  } catch (error) {
    console.error('Error fetching field details:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch field details'
    }, { status: 500 });
  }
}

// PUT - Update field details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;
    const body = await request.json();

    // Check if field exists
    const existingField = await prisma.projectField.findUnique({
      where: { id: fieldId }
    });

    if (!existingField) {
      return NextResponse.json({
        success: false,
        error: 'Field not found'
      }, { status: 404 });
    }

    // Update field
    const field = await prisma.projectField.update({
      where: { id: fieldId },
      data: {
        name: body.name || existingField.name,
        description: body.description || existingField.description,
        requirements: body.requirements || existingField.requirements,
        isImageToImage: body.isImageToImage ?? existingField.isImageToImage,
        sourceFieldId: body.sourceFieldId || existingField.sourceFieldId
      },
      include: {
        assetType: true,
        prompts: {
          include: {
            model: true,
            images: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Field updated successfully',
      data: { field }
    });

  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update field'
    }, { status: 500 });
  }
}

// DELETE - Delete field
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;

    // Check if field exists
    const field = await prisma.projectField.findUnique({
      where: { id: fieldId }
    });

    if (!field) {
      return NextResponse.json({
        success: false,
        error: 'Field not found'
      }, { status: 404 });
    }

    // Delete field (cascades to prompts and images)
    await prisma.projectField.delete({
      where: { id: fieldId }
    });

    return NextResponse.json({
      success: true,
      message: 'Field deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to delete field'
    }, { status: 500 });
  }
}