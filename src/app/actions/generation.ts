'use server'

import prisma from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import type { Prompt, Generation, Media, AiModel } from '@prisma/client'

// Interface for prompt creation
export interface PromptInput {
  content: string | Record<string, any>
  name?: string
  mediaType: 'image' | 'video' | 'audio' | 'text' | 'document'
  userId: string
  fieldId?: string
  projectId?: string
  tags?: string[]
  category?: string
  isTemplate?: boolean
}

// Interface for generation input
export interface GenerationInput {
  promptText: string
  modelId: string
  userId: string
  projectId?: string
  fieldId?: string
  type?: 'single' | 'batch' | 'variation'
  batchSize?: number
  parameters?: Record<string, any>
}

// Interface for media creation from generation
export interface MediaInput {
  generationId: string
  promptId: string
  name: string
  type: 'image' | 'video' | 'audio' | 'text' | 'document'
  format: string
  url: string
  userId: string
  projectId?: string
  fieldId?: string
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Create or find a prompt record
 * This ensures we always have a prompt saved for every generation
 */
export async function createPromptRecord(input: PromptInput): Promise<{
  prompt: Prompt | null
  error?: string
}> {
  try {
    // Generate a unique slug for the prompt
    const timestamp = Date.now()
    const slug = `prompt-${input.mediaType}-${timestamp}`
    
    // Create the prompt record
    const prompt = await prisma.prompt.create({
      data: {
        name: input.name || `${input.mediaType} prompt ${new Date().toLocaleDateString()}`,
        slug,
        mediaType: input.mediaType,
        content: typeof input.content === 'string' 
          ? { text: input.content }
          : input.content,
        userId: input.userId,
        tags: input.tags || [],
        category: input.category || null,
        isTemplate: input.isTemplate || false,
        isPublic: false,
        performance: {
          usageCount: 0,
          successRate: 0,
          averageRating: 0
        }
      }
    })

    return { prompt }
  } catch (error) {
    console.error('Error creating prompt record:', error)
    return { prompt: null, error: 'Failed to create prompt record' }
  }
}

/**
 * Create a generation with an associated prompt
 * This ensures every generation has a prompt linked to it
 */
export async function createGenerationWithPrompt(input: GenerationInput): Promise<{
  generation: Generation | null
  prompt: Prompt | null
  error?: string
}> {
  try {
    // First, create the prompt record
    const { prompt, error: promptError } = await createPromptRecord({
      content: input.promptText,
      mediaType: 'image', // Default, should be passed based on model type
      userId: input.userId,
      ...(input.fieldId && { fieldId: input.fieldId }),
      ...(input.projectId && { projectId: input.projectId })
    })

    if (promptError || !prompt) {
      return { generation: null, prompt: null, error: promptError || 'Failed to create prompt' }
    }

    // Create the generation linked to the prompt
    const generation = await prisma.generation.create({
      data: {
        type: input.type || 'single',
        status: 'pending',
        input: {
          prompt: input.promptText,
          parameters: input.parameters || {},
          batchSize: input.batchSize || 1,
          timestamp: new Date().toISOString()
        },
        modelId: input.modelId,
        userId: input.userId,
        projectId: input.projectId || null,
        fieldId: input.fieldId || null,
        promptId: prompt.id // Link to the prompt
      }
    })

    // Update prompt usage count
    await prisma.prompt.update({
      where: { id: prompt.id },
      data: {
        performance: {
          usageCount: 1,
          successRate: 0,
          averageRating: 0,
          lastUsed: new Date().toISOString()
        }
      }
    })

    if (input.projectId) {
      revalidatePath(`/projects/${input.projectId}`)
    }
    if (input.fieldId && input.projectId) {
      revalidatePath(`/projects/${input.projectId}/fields/${input.fieldId}`)
    }

    return { generation, prompt }
  } catch (error) {
    console.error('Error creating generation with prompt:', error)
    return { generation: null, prompt: null, error: 'Failed to create generation' }
  }
}

/**
 * Create media from a generation, ensuring prompt is linked
 * This ensures every media item has both generation and prompt references
 */
export async function createMediaFromGeneration(input: MediaInput): Promise<{
  media: Media | null
  error?: string
}> {
  try {
    // Verify the generation exists and has a prompt
    const generation = await prisma.generation.findUnique({
      where: { id: input.generationId },
      include: { prompt: true }
    })

    if (!generation) {
      return { media: null, error: 'Generation not found' }
    }

    // Use the prompt from generation if not provided
    const promptId = input.promptId || generation.promptId

    if (!promptId) {
      return { media: null, error: 'No prompt associated with this generation' }
    }

    // Create the media record with both generation and prompt links
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
        projectId: input.projectId || null,
        fieldId: input.fieldId || null,
        generationId: input.generationId,
        promptId: promptId // Ensure prompt is always linked
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

    // Update prompt performance metrics
    if (promptId) {
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { performance: true }
      })
      
      const currentPerformance = prompt?.performance as any || {}
      await prisma.prompt.update({
        where: { id: promptId },
        data: {
          performance: {
            ...currentPerformance,
            usageCount: (currentPerformance.usageCount || 0) + 1,
            successRate: currentPerformance.usageCount 
              ? ((currentPerformance.successCount || 0) + 1) / ((currentPerformance.usageCount || 0) + 1) * 100
              : 100,
            successCount: (currentPerformance.successCount || 0) + 1,
            lastUsed: new Date().toISOString()
          }
        }
      })
    }

    if (input.projectId) {
      revalidatePath(`/projects/${input.projectId}`)
    }
    if (input.fieldId && input.projectId) {
      revalidatePath(`/projects/${input.projectId}/fields/${input.fieldId}`)
    }

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

    const generation = await prisma.generation.update({
      where: { id: generationId },
      data: updateData,
      include: {
        project: true,
        field: true,
        prompt: true
      }
    })

    // Update prompt performance if generation failed
    if (status === 'failed' && generation.promptId) {
      const prompt = await prisma.prompt.findUnique({
        where: { id: generation.promptId },
        select: { performance: true }
      })
      
      const currentPerformance = prompt?.performance as any || {}
      await prisma.prompt.update({
        where: { id: generation.promptId },
        data: {
          performance: {
            ...currentPerformance,
            usageCount: (currentPerformance.usageCount || 0) + 1,
            failureCount: (currentPerformance.failureCount || 0) + 1,
            successRate: currentPerformance.usageCount 
              ? (currentPerformance.successCount || 0) / ((currentPerformance.usageCount || 0) + 1) * 100
              : 0
          }
        }
      })
    }

    if (generation.projectId) {
      revalidatePath(`/projects/${generation.projectId}`)
    }
    if (generation.fieldId && generation.projectId) {
      revalidatePath(`/projects/${generation.projectId}/fields/${generation.fieldId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating generation status:', error)
    return { success: false, error: 'Failed to update generation status' }
  }
}

/**
 * Get generation with full details including prompt
 */
export async function getGenerationWithPrompt(generationId: string): Promise<{
  generation: (Generation & { prompt: Prompt | null; model: AiModel }) | null
  error?: string
}> {
  try {
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      include: {
        prompt: true,
        model: true,
        media: true
      }
    })

    if (!generation) {
      return { generation: null, error: 'Generation not found' }
    }

    return { generation: generation as any }
  } catch (error) {
    console.error('Error fetching generation with prompt:', error)
    return { generation: null, error: 'Failed to fetch generation' }
  }
}

/**
 * Batch create generations with prompts
 * Used for bulk operations where multiple generations are created at once
 */
export async function batchCreateGenerations(
  inputs: GenerationInput[]
): Promise<{
  generations: Generation[]
  prompts: Prompt[]
  errors: string[]
}> {
  const generations: Generation[] = []
  const prompts: Prompt[] = []
  const errors: string[] = []

  for (const input of inputs) {
    const { generation, prompt, error } = await createGenerationWithPrompt(input)
    
    if (error) {
      errors.push(error)
    } else {
      if (generation) generations.push(generation)
      if (prompt) prompts.push(prompt)
    }
  }

  return { generations, prompts, errors }
}