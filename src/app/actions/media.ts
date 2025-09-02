'use server'

import prisma from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { createMediaFromGeneration } from './generation'
import type { Media, Generation, Prompt } from '@prisma/client'

export interface CreateMediaParams {
  name: string
  type: 'image' | 'video' | 'audio' | 'text' | 'document'
  format: string
  url: string
  generationId?: string
  promptText?: string
  userId: string
  projectId?: string
  fieldId?: string
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Create media with guaranteed prompt association
 * This is the primary function to use when creating any media item
 */
export async function createMediaWithPrompt(params: CreateMediaParams): Promise<{
  media: Media | null
  prompt: Prompt | null
  generation: Generation | null
  error?: string
}> {
  try {
    let generation: Generation | null = null
    let prompt: Prompt | null = null

    // If we have a generation ID, use existing generation and its prompt
    if (params.generationId) {
      generation = await prisma.generation.findUnique({
        where: { id: params.generationId },
        include: { prompt: true }
      })
      
      if (!generation) {
        return { media: null, prompt: null, generation: null, error: 'Generation not found' }
      }
      
      // Get the prompt via the generation's promptId
      if (generation.promptId) {
        prompt = await prisma.prompt.findUnique({
          where: { id: generation.promptId }
        })
      }
    }
    
    // If no generation or prompt exists, create them
    if (!generation || !prompt) {
      const { createGenerationWithPrompt, createPromptRecord } = await import('./generation')
      
      // Create prompt if we have prompt text but no existing prompt
      if (params.promptText && !prompt) {
        const { prompt: newPrompt, error: promptError } = await createPromptRecord({
          content: params.promptText,
          mediaType: params.type,
          userId: params.userId,
          ...(params.fieldId && { fieldId: params.fieldId }),
          ...(params.projectId && { projectId: params.projectId })
        })
        
        if (promptError || !newPrompt) {
          return { media: null, prompt: null, generation: null, error: promptError || 'Failed to create prompt' }
        }
        
        prompt = newPrompt
      }
      
      // Create generation if we don't have one
      if (!generation) {
        if (!prompt && !params.promptText) {
          return { 
            media: null, 
            prompt: null, 
            generation: null, 
            error: 'Either generationId or promptText must be provided' 
          }
        }
        
        // Get a default model for this media type
        const defaultModel = await prisma.aiModel.findFirst({
          where: { 
            type: params.type === 'text' ? 'text' : 'image' 
          }
        })
        
        if (!defaultModel) {
          return { 
            media: null, 
            prompt: null, 
            generation: null, 
            error: 'No available AI model found' 
          }
        }
        
        const { generation: newGeneration, error: genError } = await createGenerationWithPrompt({
          promptText: params.promptText || (prompt?.content as any)?.text || 'Generated content',
          modelId: defaultModel.id,
          userId: params.userId,
          ...(params.projectId && { projectId: params.projectId }),
          ...(params.fieldId && { fieldId: params.fieldId }),
          type: 'single'
        })
        
        if (genError || !newGeneration) {
          return { media: null, prompt: null, generation: null, error: genError || 'Failed to create generation' }
        }
        
        generation = newGeneration
        // Get the prompt from the generation if we don't have one
        if (!prompt && newGeneration.promptId) {
          prompt = await prisma.prompt.findUnique({
            where: { id: newGeneration.promptId }
          })
        }
      }
    }

    if (!generation || !prompt) {
      return { 
        media: null, 
        prompt: null, 
        generation: null, 
        error: 'Failed to create or find generation and prompt' 
      }
    }

    // Create the media using the generation helper
    const { media, error } = await createMediaFromGeneration({
      generationId: generation.id,
      promptId: prompt.id,
      name: params.name,
      type: params.type,
      format: params.format,
      url: params.url,
      userId: params.userId,
      ...(params.projectId && { projectId: params.projectId }),
      ...(params.fieldId && { fieldId: params.fieldId }),
      ...(params.metadata && { metadata: params.metadata }),
      ...(params.tags && { tags: params.tags })
    })

    if (error || !media) {
      return { media: null, prompt, generation, error: error || 'Failed to create media' }
    }

    return { media, prompt, generation }
  } catch (error) {
    console.error('Error creating media with prompt:', error)
    return { 
      media: null, 
      prompt: null, 
      generation: null, 
      error: 'Failed to create media with prompt' 
    }
  }
}

/**
 * Batch create multiple media items, each with their own prompt
 */
export async function batchCreateMediaWithPrompts(
  mediaItems: CreateMediaParams[]
): Promise<{
  success: Media[]
  failures: { params: CreateMediaParams; error: string }[]
  prompts: Prompt[]
  generations: Generation[]
}> {
  const success: Media[] = []
  const failures: { params: CreateMediaParams; error: string }[] = []
  const prompts: Prompt[] = []
  const generations: Generation[] = []

  for (const params of mediaItems) {
    const { media, prompt, generation, error } = await createMediaWithPrompt(params)
    
    if (error || !media) {
      failures.push({ params, error: error || 'Unknown error' })
    } else {
      success.push(media)
      if (prompt) prompts.push(prompt)
      if (generation) generations.push(generation)
    }
  }

  return { success, failures, prompts, generations }
}

/**
 * Get media with full prompt and generation details
 */
export async function getMediaWithPrompt(mediaId: string): Promise<{
  media: (Media & { 
    prompt: Prompt | null
    generation: (Generation & { prompt: Prompt | null }) | null 
  }) | null
  error?: string
}> {
  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        prompt: true,
        generation: {
          include: {
            prompt: true,
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
    console.error('Error fetching media with prompt:', error)
    return { media: null, error: 'Failed to fetch media' }
  }
}

/**
 * Update media with new prompt (creates new version)
 */
export async function updateMediaPrompt(
  mediaId: string,
  newPromptText: string,
  userId: string
): Promise<{
  media: Media | null
  newPrompt: Prompt | null
  error?: string
}> {
  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { prompt: true }
    })

    if (!media) {
      return { media: null, newPrompt: null, error: 'Media not found' }
    }

    // Create new prompt
    const { createPromptRecord } = await import('./generation')
    const { prompt: newPrompt, error } = await createPromptRecord({
      content: newPromptText,
      mediaType: media.type as any,
      userId,
      ...(media.fieldId && { fieldId: media.fieldId }),
      ...(media.projectId && { projectId: media.projectId }),
      name: `Updated prompt for ${media.name}`
    })

    if (error || !newPrompt) {
      return { media: null, newPrompt: null, error: error || 'Failed to create prompt' }
    }

    // Update media to reference new prompt
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        promptId: newPrompt.id,
        updatedAt: new Date()
      }
    })

    // Revalidate paths
    if (media.projectId) {
      revalidatePath(`/projects/${media.projectId}`)
      if (media.fieldId) {
        revalidatePath(`/projects/${media.projectId}/fields/${media.fieldId}`)
      }
    }

    return { media: updatedMedia, newPrompt }
  } catch (error) {
    console.error('Error updating media prompt:', error)
    return { media: null, newPrompt: null, error: 'Failed to update media prompt' }
  }
}

/**
 * Get all media for a field with their prompts
 */
export async function getFieldMediaWithPrompts(fieldId: string): Promise<{
  media: (Media & { 
    prompt: Prompt | null
    generation: (Generation & { prompt: Prompt | null }) | null 
  })[]
  error?: string
}> {
  try {
    const media = await prisma.media.findMany({
      where: { fieldId },
      include: {
        prompt: true,
        generation: {
          include: {
            prompt: true,
            model: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { media: media as any }
  } catch (error) {
    console.error('Error fetching field media with prompts:', error)
    return { media: [], error: 'Failed to fetch field media' }
  }
}