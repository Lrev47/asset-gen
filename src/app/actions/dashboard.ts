'use server'

import prisma from '@/lib/db/prisma'
import type { Project, Generation, Media } from '@prisma/client'

// Types for dashboard data
export interface DashboardStats {
  totalProjects: number
  activeGenerations: number
  totalMedia: number
  recentActivity: number
}

export interface RecentProject {
  id: string
  name: string
  type: string
  status: string
  updatedAt: Date
  mediaCount: number
  fieldsCount: number
  previewImage?: string | undefined
}

export interface ActivityItem {
  id: string
  type: 'project_created' | 'media_generated' | 'media_uploaded' | 'generation_completed'
  title: string
  description: string
  timestamp: Date
  projectId?: string | undefined
  projectName?: string | undefined
  mediaUrl?: string | undefined
}

export interface ResourceUsage {
  generationsThisMonth: number
  generationsLimit: number
  storageUsed: number // in MB
  storageLimit: number // in MB
  apiCallsThisMonth: number
  costThisMonth: number
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    // For now, we'll get stats for the first user or create mock data
    // In a real app, this would be based on the authenticated user
    
    const [totalProjects, activeGenerations, totalMedia, recentGenerations] = await Promise.all([
      prisma.project.count({
        where: { status: { not: 'archived' } }
      }),
      prisma.generation.count({
        where: { status: { in: ['pending', 'running'] } }
      }),
      prisma.media.count(),
      prisma.generation.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return {
      success: true,
      data: {
        totalProjects,
        activeGenerations,
        totalMedia,
        recentActivity: recentGenerations
      }
    }
  } catch (error) {
    console.error('Failed to get dashboard stats:', error)
    return {
      success: false,
      error: 'Failed to load dashboard statistics'
    }
  }
}

/**
 * Get recent projects for dashboard
 */
export async function getRecentProjects(limit: number = 5): Promise<{ success: boolean; data?: RecentProject[]; error?: string }> {
  try {
    const projects = await prisma.project.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        fields: {
          select: { id: true }
        },
        media: {
          select: { 
            id: true, 
            url: true,
            type: true 
          },
          take: 1,
          where: {
            type: 'image' // Prefer images for previews
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            media: true,
            fields: true
          }
        }
      }
    })

    const recentProjects: RecentProject[] = projects.map(project => ({
      id: project.id,
      name: project.name,
      type: project.type,
      status: project.status,
      updatedAt: project.updatedAt,
      mediaCount: project._count.media,
      fieldsCount: project._count.fields,
      previewImage: project.media[0]?.url
    }))

    return {
      success: true,
      data: recentProjects
    }
  } catch (error) {
    console.error('Failed to get recent projects:', error)
    return {
      success: false,
      error: 'Failed to load recent projects'
    }
  }
}

/**
 * Get recent activity feed
 */
export async function getRecentActivity(limit: number = 10): Promise<{ success: boolean; data?: ActivityItem[]; error?: string }> {
  try {
    // Get recent projects, generations, and media
    const [recentProjects, recentGenerations, recentMedia] = await Promise.all([
      prisma.project.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.generation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          field: {
            include: {
              project: true
            }
          }
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.media.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          field: {
            include: {
              project: true
            }
          }
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    const activities: ActivityItem[] = []

    // Add project activities
    recentProjects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project_created',
        title: 'New Project Created',
        description: `Created project "${project.name}"`,
        timestamp: project.createdAt,
        projectId: project.id,
        projectName: project.name
      })
    })

    // Add generation activities
    recentGenerations.forEach(generation => {
      activities.push({
        id: `generation-${generation.id}`,
        type: generation.status === 'completed' ? 'generation_completed' : 'media_generated',
        title: generation.status === 'completed' ? 'Generation Completed' : 'Generation Started',
        description: `${generation.status === 'completed' ? 'Completed' : 'Started'} generation for "${generation.field?.project?.name || 'Unknown Project'}"`,
        timestamp: generation.createdAt,
        projectId: generation.field?.project?.id,
        projectName: generation.field?.project?.name
      })
    })

    // Add media activities
    recentMedia.forEach(media => {
      activities.push({
        id: `media-${media.id}`,
        type: 'media_uploaded',
        title: 'Media Added',
        description: `Added ${media.type} "${media.name}" to "${media.field?.project?.name || 'Unknown Project'}"`,
        timestamp: media.createdAt,
        projectId: media.field?.project?.id,
        projectName: media.field?.project?.name,
        mediaUrl: media.url
      })
    })

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)

    return {
      success: true,
      data: sortedActivities
    }
  } catch (error) {
    console.error('Failed to get recent activity:', error)
    return {
      success: false,
      error: 'Failed to load recent activity'
    }
  }
}

/**
 * Get resource usage statistics
 */
export async function getResourceUsage(): Promise<{ success: boolean; data?: ResourceUsage; error?: string }> {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [generationsThisMonth, totalGenerations, totalMedia] = await Promise.all([
      prisma.generation.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      prisma.generation.count(),
      prisma.media.count()
    ])

    // Calculate estimated storage (mock calculation)
    const estimatedStoragePerMedia = 2 // 2MB average per media file
    const storageUsed = totalMedia * estimatedStoragePerMedia

    // Mock data for limits and costs (in real app, this would come from user plan/billing)
    const resourceUsage: ResourceUsage = {
      generationsThisMonth,
      generationsLimit: 100, // Mock limit
      storageUsed,
      storageLimit: 5000, // 5GB limit
      apiCallsThisMonth: generationsThisMonth * 3, // Estimate 3 API calls per generation
      costThisMonth: generationsThisMonth * 0.05 // $0.05 per generation estimate
    }

    return {
      success: true,
      data: resourceUsage
    }
  } catch (error) {
    console.error('Failed to get resource usage:', error)
    return {
      success: false,
      error: 'Failed to load resource usage'
    }
  }
}