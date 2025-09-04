'use server'

import prisma from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { createMediaFromGeneration } from './generation'
import type { Media, Generation } from '@prisma/client'

export interface CreateMediaParams {
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  format: string
  url: string
  generationId?: string
  userId: string
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Create media directly (for uploads or direct media creation)
 */
export async function createMedia(params: CreateMediaParams): Promise<{
  media: Media | null
  error?: string
}> {
  try {
    const media = await prisma.media.create({
      data: {
        name: params.name,
        type: params.type,
        format: params.format,
        url: params.url,
        thumbnailUrl: params.url,
        metadata: params.metadata || {},
        tags: params.tags || [],
        userId: params.userId,
        generationId: params.generationId || null
      }
    })

    return { media }
  } catch (error) {
    console.error('Error creating media:', error)
    return { media: null, error: 'Failed to create media' }
  }
}

/**
 * Get media with generation details
 */
export async function getMediaWithDetails(mediaId: string): Promise<{
  media: (Media & { generation?: Generation }) | null
  error?: string
}> {
  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        generation: {
          include: {
            model: true
          }
        }
      }
    })

    if (!media) {
      return { media: null, error: 'Media not found' }
    }

    return { media: media as any }
  } catch (error) {
    console.error('Error fetching media with details:', error)
    return { media: null, error: 'Failed to fetch media' }
  }
}

/**
 * Get user's media gallery
 */
export async function getUserMedia(
  userId: string,
  type?: 'image' | 'video' | 'audio' | 'document',
  limit: number = 50
): Promise<{
  media: (Media & { generation?: Generation })[]
  error?: string
}> {
  try {
    const whereClause: any = { userId }
    if (type) {
      whereClause.type = type
    }

    const media = await prisma.media.findMany({
      where: whereClause,
      include: {
        generation: {
          include: {
            model: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return { media: media as any }
  } catch (error) {
    console.error('Error fetching user media:', error)
    return { media: [], error: 'Failed to fetch user media' }
  }
}

/**
 * Delete media
 */
export async function deleteMedia(mediaId: string, userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Verify ownership
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { userId: true }
    })

    if (!media) {
      return { success: false, error: 'Media not found' }
    }

    if (media.userId !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.media.delete({
      where: { id: mediaId }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting media:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}