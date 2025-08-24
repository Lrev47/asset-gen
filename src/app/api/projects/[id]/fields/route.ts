import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all fields for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const fields = await prisma.projectField.findMany({
      where: { projectId },
      include: {
        assetType: true,
        prompts: {
          include: {
            model: true,
            images: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate stats for each field
    const fieldsWithStats = fields.map(field => {
      const totalPrompts = field.prompts.length;
      const totalImages = field.prompts.reduce((sum, prompt) => sum + prompt.images.length, 0);
      const requirements = field.requirements as { quantity?: number };
      const targetQuantity = requirements?.quantity || 1;
      
      return {
        ...field,
        stats: {
          promptsGenerated: totalPrompts,
          imagesGenerated: totalImages,
          targetQuantity,
          completionPercentage: Math.round((totalImages / targetQuantity) * 100),
          status: totalImages >= targetQuantity ? 'completed' : 
                 totalImages > 0 ? 'in-progress' : 'pending'
        }
      };
    });

    return NextResponse.json({
      success: true,
      message: `Found ${fields.length} fields`,
      data: { fields: fieldsWithStats }
    });

  } catch (error) {
    console.error('Error fetching project fields:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch project fields'
    }, { status: 500 });
  }
}

// POST - Create a new field for the project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.description || !body.assetTypeId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, description, and assetTypeId are required'
      }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Verify asset type exists
    const assetType = await prisma.assetType.findUnique({
      where: { id: body.assetTypeId }
    });

    if (!assetType) {
      return NextResponse.json({
        success: false,
        error: 'Asset type not found'
      }, { status: 404 });
    }

    const field = await prisma.projectField.create({
      data: {
        projectId,
        name: body.name,
        description: body.description,
        assetTypeId: body.assetTypeId,
        requirements: body.requirements || {},
        isImageToImage: body.isImageToImage || false,
        sourceFieldId: body.sourceFieldId || null
      },
      include: {
        assetType: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Field created successfully',
      data: { field }
    });

  } catch (error) {
    console.error('Error creating field:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to create field'
    }, { status: 500 });
  }
}