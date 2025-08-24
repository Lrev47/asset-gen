import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { APIResponse } from '@/types/api';
import { Project, ProjectWithStats } from '@/types/project';

const prisma = new PrismaClient();

export interface ProjectData {
  id?: string;
  name: string;
  description: string;
  type: string;
  githubUrl?: string;
  businessType?: string; // Legacy field for migration
  prdContent?: string; // Legacy field for migration
  schemaContent?: string; // Legacy field for migration
}

export interface ProjectResponse extends APIResponse<{ projects?: ProjectWithStats[]; project?: Project }> {
  message: string;
}

// GET - List all projects
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        fields: {
          include: {
            assetType: true,
            prompts: {
              include: {
                images: true
              }
            }
          }
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Calculate statistics for each project
    const projectsWithStats = projects.map(project => {
      const totalFields = project.fields.length;
      const totalPrompts = project.fields.reduce((sum, field) => sum + field.prompts.length, 0);
      const totalImages = project.fields.reduce((sum, field) => 
        sum + field.prompts.reduce((promptSum, prompt) => promptSum + prompt.images.length, 0), 0
      );
      const lastSession = project.sessions[0];

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        githubUrl: project.githubUrl,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // Legacy fields for compatibility
        businessType: project.businessType || project.type,
        // Statistics
        stats: {
          totalFields,
          totalPrompts,
          totalImages,
          lastGeneratedAt: lastSession?.createdAt || null
        }
      };
    });

    return NextResponse.json({
      success: true,
      message: `Found ${projects.length} projects`,
      data: { projects: projectsWithStats }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch projects'
    }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    const body: ProjectData = await request.json();

    // Validate required fields for new schema
    if (!body.name || !body.description || !body.type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, description, and type are required'
      }, { status: 400 });
    }

    // Check if project with same name already exists for this user
    const existingProject = await prisma.project.findFirst({
      where: { 
        userId: session.user.id,
        name: body.name 
      }
    });

    if (existingProject) {
      return NextResponse.json({
        success: false,
        error: 'A project with this name already exists'
      }, { status: 409 });
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name: body.name,
        description: body.description,
        type: body.type,
        githubUrl: body.githubUrl || null,
        // Legacy fields for backward compatibility
        businessType: body.businessType || body.type,
        prdContent: body.prdContent || '',
        schemaContent: body.schemaContent || ''
      },
      include: {
        fields: {
          include: {
            assetType: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to create project'
    }, { status: 500 });
  }
}

// PUT - Update existing project
export async function PUT(request: NextRequest) {
  try {
    const body: ProjectData & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required for updates'
      }, { status: 400 });
    }

    // Validate required fields for new schema
    if (!body.name || !body.description || !body.type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, description, and type are required'
      }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: body.id }
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
        id: { not: body.id }
      }
    });

    if (duplicateProject) {
      return NextResponse.json({
        success: false,
        error: 'A project with this name already exists'
      }, { status: 409 });
    }

    const project = await prisma.project.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        githubUrl: body.githubUrl || null,
        // Legacy fields for backward compatibility
        businessType: body.businessType || body.type,
        prdContent: body.prdContent || existingProject.prdContent,
        schemaContent: body.schemaContent || existingProject.schemaContent
      },
      include: {
        fields: {
          include: {
            assetType: true
          }
        }
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

// DELETE - Remove project
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
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