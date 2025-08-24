import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const model = await prisma.aIModel.findUnique({
      where: { id }
    });

    if (!model) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Model retrieved successfully',
      data: { model }
    });

  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch model'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const model = await prisma.aIModel.update({
      where: { id },
      data: {
        displayName: body.displayName,
        category: body.category,
        subcategory: body.subcategory,
        tags: body.tags,
        replicateUrl: body.replicateUrl,
        documentationUrl: body.documentationUrl,
        capabilities: body.capabilities,
        costPerImage: body.costPerImage,
        speedRating: body.speedRating,
        qualityRating: body.qualityRating,
        maxDimensions: body.maxDimensions,
        supportedFormats: body.supportedFormats,
        defaultSettings: body.defaultSettings,
        configurationSchema: body.configurationSchema,
        examples: body.examples,
        isEnabled: body.isEnabled,
        isFeatured: body.isFeatured
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Model updated successfully',
      data: { model }
    });

  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update model'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.aIModel.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to delete model'
    }, { status: 500 });
  }
}