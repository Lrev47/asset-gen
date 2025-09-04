'use server'

import prisma from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import type { Generation, Media, AiModel } from '@prisma/client'

// Interface for generation input
export interface GenerationInput {
  promptText: string
  modelId: string
  userId: string
  type?: 'single' | 'multi' | 'variation'
  parameters?: Record<string, any>
}

// Interface for media creation from generation
export interface MediaInput {
  generationId: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  format: string
  url: string
  userId: string
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Create a generation for image creation
 */
export async function createGeneration(input: GenerationInput): Promise<{
  generation: Generation | null
  error?: string
}> {
  try {
    const generation = await prisma.generation.create({
      data: {
        type: input.type || 'single',
        status: 'pending',
        input: {
          prompt: input.promptText,
          parameters: input.parameters || {},
          timestamp: new Date().toISOString()
        },
        modelId: input.modelId,
        userId: input.userId
      }
    })

    return { generation }
  } catch (error) {
    console.error('Error creating generation:', error)
    return { generation: null, error: 'Failed to create generation' }
  }
}

/**
 * Create media from a generation
 */
export async function createMediaFromGeneration(input: MediaInput): Promise<{
  media: Media | null
  error?: string
}> {
  try {
    // Verify the generation exists
    const generation = await prisma.generation.findUnique({
      where: { id: input.generationId }
    })

    if (!generation) {
      return { media: null, error: 'Generation not found' }
    }

    // Create the media record
    const media = await prisma.media.create({
      data: {
        name: input.name,
        type: input.type,
        format: input.format,
        url: input.url,
        thumbnailUrl: input.url, // Can be updated later with actual thumbnail
        metadata: input.metadata || {
          createdAt: new Date().toISOString(),
          generationType: generation.type,
          modelUsed: generation.modelId
        },
        tags: input.tags || [],
        userId: input.userId,
        generationId: input.generationId
      }
    })

    // Update generation status to completed
    await prisma.generation.update({
      where: { id: input.generationId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        output: {
          mediaId: media.id,
          url: media.url,
          success: true
        }
      }
    })

    return { media }
  } catch (error) {
    console.error('Error creating media from generation:', error)
    return { media: null, error: 'Failed to create media' }
  }
}

/**
 * Update generation status (for processing updates)
 */
export async function updateGenerationStatus(
  generationId: string,
  status: 'processing' | 'completed' | 'failed',
  output?: any,
  cost?: number,
  duration?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      output: output || null
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date()
    }

    if (cost !== undefined) {
      updateData.cost = cost
    }

    if (duration !== undefined) {
      updateData.duration = duration
    }

    await prisma.generation.update({
      where: { id: generationId },
      data: updateData
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating generation status:', error)
    return { success: false, error: 'Failed to update generation status' }
  }
}

/**
 * Get generation with full details
 */
export async function getGenerationWithDetails(generationId: string): Promise<{
  generation: (Generation & { model: AiModel; media?: Media }) | null
  error?: string
}> {
  try {
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      include: {
        model: true,
        media: true
      }
    })

    if (!generation) {
      return { generation: null, error: 'Generation not found' }
    }

    return { generation: generation as any }
  } catch (error) {
    console.error('Error fetching generation:', error)
    return { generation: null, error: 'Failed to fetch generation' }
  }
}

/**
 * Get user's recent generations
 */
export async function getUserGenerations(
  userId: string,
  limit: number = 20
): Promise<{
  generations: (Generation & { model: AiModel; media?: Media })[]
  error?: string
}> {
  try {
    const generations = await prisma.generation.findMany({
      where: { userId },
      include: {
        model: true,
        media: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return { generations: generations as any }
  } catch (error) {
    console.error('Error fetching user generations:', error)
    return { generations: [], error: 'Failed to fetch generations' }
  }
}