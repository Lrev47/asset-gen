'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db/prisma'
import type { Project, Field, Media, Generation, Prisma } from '@prisma/client'

// Types for project detail data
export type ProjectWithFullDetails = Project & {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
  fields: (Field & {
    media: Media[]
    _count: {
      media: number
      generations: number
    }
  })[]
  media: Media[]
  generations: (Generation & {
    model: {
      id: string
      name: string
      provider: string
    } | null
  })[]
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

export interface ProjectMetrics {
  totalFields: number
  completedFields: number
  totalMedia: number
  totalGenerations: number
  successfulGenerations: number
  failedGenerations: number
  pendingGenerations: number
  totalCost: number
  avgGenerationTime: number
  lastActivity: Date | null
}

export interface RecentActivity {
  id: string
  type: 'field_created' | 'media_added' | 'generation_completed' | 'project_updated'
  description: string
  timestamp: Date
  userId: string
  userName: string | null
}

// Get complete project data by ID
export async function getProjectById(projectId: string): Promise<{ 
  project: ProjectWithFullDetails | null 
  error?: string 
}> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
          include: {
            media: {
              orderBy: { createdAt: 'desc' },
              take: 5 // Latest 5 media per field
            },
            _count: {
              select: {
                media: true,
                generations: true
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        media: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Latest 20 media for overview
        },
        generations: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                provider: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Latest 10 generations
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
      }
    })

    if (!project) {
      return { project: null, error: 'Project not found' }
    }

    return { project: project as ProjectWithFullDetails }
  } catch (error) {
    console.error('Error fetching project:', error)
    return { project: null, error: 'Failed to fetch project' }
  }
}

// Calculate project metrics
export async function getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
  try {
    const [project, generations, usageLogs] = await Promise.all([
      // Basic counts
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          _count: {
            select: {
              fields: true,
              media: true,
              generations: true
            }
          }
        }
      }),

      // Generation statistics
      prisma.generation.groupBy({
        where: { projectId },
        by: ['status'],
        _count: {
          status: true
        }
      }),

      // Usage tracking for activity
      prisma.usageLog.findFirst({
        where: { 
          AND: [
            { metadata: { path: ['projectId'], equals: projectId } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (!project) {
      throw new Error('Project not found')
    }

    // Process generation stats
    let successfulGenerations = 0
    let failedGenerations = 0
    let pendingGenerations = 0

    generations.forEach(group => {
      switch (group.status) {
        case 'completed':
          successfulGenerations = group._count.status
          break
        case 'failed':
          failedGenerations = group._count.status
          break
        case 'pending':
        case 'processing':
          pendingGenerations += group._count.status
          break
      }
    })

    // Calculate completion (fields with at least 1 media)
    const fieldsWithMedia = await prisma.field.count({
      where: {
        projectId,
        media: {
          some: {}
        }
      }
    })

    return {
      totalFields: project._count.fields,
      completedFields: fieldsWithMedia,
      totalMedia: project._count.media,
      totalGenerations: project._count.generations,
      successfulGenerations,
      failedGenerations,
      pendingGenerations,
      totalCost: 0, // TODO: Calculate from cost tracking
      avgGenerationTime: 0, // TODO: Calculate from generation durations
      lastActivity: usageLogs?.createdAt || new Date()
    }
  } catch (error) {
    console.error('Error calculating project metrics:', error)
    // Return default metrics on error
    return {
      totalFields: 0,
      completedFields: 0,
      totalMedia: 0,
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      pendingGenerations: 0,
      totalCost: 0,
      avgGenerationTime: 0,
      lastActivity: null
    }
  }
}

// Get recent project activity
export async function getRecentActivity(projectId: string, limit: number = 10): Promise<RecentActivity[]> {
  try {
    // Fetch recent related records to build activity feed
    const [recentFields, recentMedia, recentGenerations, projectUpdates] = await Promise.all([
      // Recent fields
      prisma.field.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Recent media
      prisma.media.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Recent generations
      prisma.generation.findMany({
        where: { projectId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Project updates
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ])

    // Build activity feed
    const activities: RecentActivity[] = []

    // Add field activities
    recentFields.forEach(field => {
      activities.push({
        id: `field_${field.id}`,
        type: 'field_created',
        description: `Created field "${field.name}"`,
        timestamp: field.createdAt,
        userId: 'system', // TODO: Track who created fields
        userName: 'System'
      })
    })

    // Add media activities
    recentMedia.forEach(media => {
      activities.push({
        id: `media_${media.id}`,
        type: 'media_added',
        description: `Added media "${media.name}"`,
        timestamp: media.createdAt,
        userId: media.user.id,
        userName: media.user.name
      })
    })

    // Add generation activities
    recentGenerations.forEach(generation => {
      if (generation.status === 'completed') {
        activities.push({
          id: `generation_${generation.id}`,
          type: 'generation_completed',
          description: `Generation completed successfully`,
          timestamp: generation.createdAt,
          userId: generation.user.id,
          userName: generation.user.name
        })
      }
    })

    // Add project update
    if (projectUpdates) {
      activities.push({
        id: `project_${projectId}`,
        type: 'project_updated',
        description: 'Project updated',
        timestamp: new Date(),
        userId: projectUpdates.user.id,
        userName: projectUpdates.user.name
      })
    }

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

// Update project settings
export async function updateProjectSettings(
  projectId: string, 
  updates: {
    name?: string
    description?: string | null
    status?: string
    metadata?: any
    settings?: any
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: 'Failed to update project' }
  }
}

// Export project data
export async function exportProjectData(
  projectId: string,
  format: 'json' | 'csv' = 'json'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        fields: {
          include: {
            media: true
          }
        },
        media: true,
        generations: {
          include: {
            model: {
              select: {
                name: true,
                provider: true
              }
            }
          }
        }
      }
    })

    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Return project data for download
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
        type: project.type,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      fields: project.fields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        description: field.description,
        requirements: field.requirements,
        mediaCount: field.media.length
      })),
      media: project.media.map(media => ({
        id: media.id,
        name: media.name,
        type: media.type,
        format: media.format,
        url: media.url,
        createdAt: media.createdAt
      })),
      generations: project.generations.map(gen => ({
        id: gen.id,
        status: gen.status,
        type: gen.type,
        model: gen.model?.name,
        provider: gen.model?.provider,
        createdAt: gen.createdAt
      })),
      summary: {
        totalFields: project.fields.length,
        totalMedia: project.media.length,
        totalGenerations: project.generations.length
      }
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error('Error exporting project data:', error)
    return { success: false, error: 'Failed to export project data' }
  }
}