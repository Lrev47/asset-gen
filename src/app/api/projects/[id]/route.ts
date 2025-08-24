import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Analysis results are now handled through separate services

    return NextResponse.json({
      success: true,
      message: 'Project found',
      data: {
        project
      }
    });

  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch project'
    }, { status: 500 });
  }
}

// PUT - Update a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.businessType || !body.prdContent || !body.schemaContent) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, businessType, prdContent, and schemaContent are required'
      }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Check if another project with the same name exists (excluding current project)
    const duplicateProject = await prisma.project.findFirst({
      where: { 
        name: body.name,
        id: { not: projectId }
      }
    });

    if (duplicateProject) {
      return NextResponse.json({
        success: false,
        error: 'A project with this name already exists'
      }, { status: 409 });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name,
        businessType: body.businessType,
        githubUrl: body.githubUrl || null,
        prdContent: body.prdContent,
        schemaContent: body.schemaContent
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update project'
    }, { status: 500 });
  }
}

// DELETE - Remove a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to delete project'
    }, { status: 500 });
  }
}