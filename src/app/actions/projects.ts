'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db/prisma'
import type { Project, Prisma } from '@prisma/client'

// Define proper types for project metadata
export interface ProjectMetadata {
  client?: string
  deadline?: string
  budget?: string
  [key: string]: string | undefined
}

// Define proper types for project settings  
export interface ProjectSettings {
  [key: string]: any
}

// Types for our functions
export interface ProjectFilters {
  search?: string
  status?: string
  type?: string
  dateRange?: {
    from: Date
    to: Date
  }
  teamMember?: string
}

export interface ProjectSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'status' | 'type'
  direction: 'asc' | 'desc'
}

export type ProjectWithRelations = Project & {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
  fields: {
    id: string
    name: string
    type: string
    requirements: any
  }[]
  media: {
    id: string
    name: string
    type: string
    url: string
  }[]
  teamProjects: {
    id: string
    team: {
      id: string
      name: string
    }
  }[]
  _count: {
    fields: number
    media: number
    generations: number
  }
}

// Get projects with filtering, sorting, and search
export async function getProjects(params: {
  userId?: string
  search?: string
  filters?: ProjectFilters
  sortBy?: ProjectSortOptions
} = {}): Promise<{ projects: ProjectWithRelations[] }> {
  const { userId, search, filters = {}, sortBy = { field: 'updatedAt', direction: 'desc' } } = params
  try {
    const where: Prisma.ProjectWhereInput = {
      ...(userId && { userId }),
      AND: [
        // Search filter
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { type: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        // Status filter
        filters.status ? { status: filters.status } : {},
        // Type filter
        filters.type ? { type: filters.type } : {},
        // Date range filter
        filters.dateRange ? {
          createdAt: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to
          }
        } : {}
      ]
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        fields: {
          select: {
            id: true,
            name: true,
            type: true,
            requirements: true
          },
          orderBy: { position: 'asc' }
        },
        media: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true
          },
          take: 3, // Only get first 3 for preview
          orderBy: { createdAt: 'desc' }
        },
        teamProjects: {
          include: {
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            fields: true,
            media: true,
            generations: true
          }
        }
      },
      orderBy: { [sortBy.field]: sortBy.direction }
    })

    return { projects: projects as ProjectWithRelations[] }
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Failed to fetch projects')
  }
}

// Create a new project with proper typing
export async function createProject(data: {
  name: string
  description?: string
  type: string
  status?: string
  userId: string
  metadata?: ProjectMetadata
  settings?: ProjectSettings
}) {
  try {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check if slug exists and make unique
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.project.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        slug: uniqueSlug,
        description: data.description || null,
        type: data.type,
        status: data.status || 'active',
        userId: data.userId,
        metadata: data.metadata || {},
        settings: data.settings || {}
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            fields: true,
            media: true,
            generations: true
          }
        }
      }
    })

    revalidatePath('/projects')
    return { success: true, data: project }
  } catch (error) {
    console.error('Error creating project:', error)
    return { success: false, error: 'Failed to create project' }
  }
}

// Update a project
export async function updateProject(
  id: string, 
  data: Partial<{
    name: string
    description: string | null
    type: string
    status: string
    metadata: any
    settings: any
  }>
) {
  try {
    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { success: true, data: project }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: 'Failed to update project' }
  }
}

// Duplicate a project
export async function duplicateProject(id: string, userId?: string) {
  try {
    const originalProject = await prisma.project.findUnique({
      where: { id },
      include: {
        fields: true
      }
    })

    if (!originalProject) {
      return { success: false, error: 'Project not found' }
    }

    // Generate new slug
    const baseName = `${originalProject.name} (Copy)`
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    let uniqueSlug = baseSlug
    let counter = 1
    while (await prisma.project.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`
      counter++
    }

    const duplicatedProject = await prisma.project.create({
      data: {
        name: baseName,
        slug: uniqueSlug,
        description: originalProject.description,
        type: originalProject.type,
        status: 'active',
        userId: userId || originalProject.userId,
        metadata: originalProject.metadata as any,
        settings: originalProject.settings as any
      }
    })

    // Duplicate fields if any exist
    if (originalProject.fields.length > 0) {
      await prisma.field.createMany({
        data: originalProject.fields.map(field => ({
          name: field.name,
          type: field.type,
          description: field.description,
          requirements: field.requirements as any,
          position: field.position,
          projectId: duplicatedProject.id
        }))
      })
    }

    revalidatePath('/projects')
    return { success: true, data: duplicatedProject }
  } catch (error) {
    console.error('Error duplicating project:', error)
    return { success: false, error: 'Failed to duplicate project' }
  }
}

// Archive projects (bulk operation)
export async function archiveProjects(projectIds: string[]) {
  try {
    await prisma.project.updateMany({
      where: {
        id: { in: projectIds }
      },
      data: {
        status: 'archived'
      }
    })

    revalidatePath('/projects')
    return { success: true }
  } catch (error) {
    console.error('Error archiving projects:', error)
    return { success: false, error: 'Failed to archive projects' }
  }
}

// Delete projects (bulk operation)
export async function deleteProjects(projectIds: string[]) {
  try {
    // Delete in transaction to ensure data integrity
    await prisma.$transaction([
      // Delete related data first
      prisma.generation.deleteMany({
        where: { projectId: { in: projectIds } }
      }),
      prisma.media.deleteMany({
        where: { projectId: { in: projectIds } }
      }),
      prisma.field.deleteMany({
        where: { projectId: { in: projectIds } }
      }),
      prisma.teamProject.deleteMany({
        where: { projectId: { in: projectIds } }
      }),
      // Then delete projects
      prisma.project.deleteMany({
        where: { id: { in: projectIds } }
      })
    ])

    revalidatePath('/projects')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projects:', error)
    return { success: false, error: 'Failed to delete projects' }
  }
}

// Get unique project types for filter
export async function getProjectTypes(userId: string): Promise<string[]> {
  try {
    const types = await prisma.project.findMany({
      where: { userId },
      select: { type: true },
      distinct: ['type']
    })
    
    return types.map(t => t.type)
  } catch (error) {
    console.error('Error fetching project types:', error)
    return []
  }
}

// Get project statistics
export async function getProjectStats(userId: string) {
  try {
    const stats = await prisma.project.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        id: true
      }
    })

    const totalProjects = await prisma.project.count({
      where: { userId }
    })

    return {
      total: totalProjects,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>)
    }
  } catch (error) {
    console.error('Error fetching project stats:', error)
    return {
      total: 0,
      byStatus: {}
    }
  }
}