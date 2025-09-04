'use server'

import { createModelGeneration, waitForGenerationCompletion, getGenerationStatus } from './models'
import prisma from '@/lib/db/prisma'
import type { PredictionInput } from '@/lib/models/types'

async function ensureDefaultUser() {
  return await prisma.user.upsert({
    where: { id: 'anonymous-user' },
    update: {},
    create: {
      id: 'anonymous-user',
      email: 'anonymous@app.local',
      name: 'Anonymous User',
      preferences: {}
    }
  })
}

export async function generateImageWithReplicate(
  modelSlug: string,
  prompt: string,
  modelConfig: PredictionInput
): Promise<{ success: boolean; data?: { predictionId: string; status: string }; error?: string }> {
  try {
    // Ensure a default user exists for anonymous usage
    const user = await ensureDefaultUser()

    // Combine prompt with model configuration
    const input: PredictionInput = {
      prompt,
      ...modelConfig
    }

    // Create generation using existing infrastructure
    const result = await createModelGeneration({
      modelSlug,
      input,
      userId: user.id
    })

    if (!result.success || !result.data) {
      return { 
        success: false, 
        error: result.error || 'Failed to create generation' 
      }
    }

    return {
      success: true,
      data: {
        predictionId: result.data.predictionId,
        status: result.data.status
      }
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }
  }
}

export async function pollPredictionStatus(
  predictionId: string
): Promise<{ success: boolean; data?: { status: string; output?: any; error?: string }; error?: string }> {
  try {
    const result = await getGenerationStatus(predictionId)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to get prediction status'
      }
    }

    const responseData: { status: string; output?: any; error?: string } = {
      status: result.data.status
    }
    if (result.data.output !== undefined) {
      responseData.output = result.data.output
    }
    if (result.data.error !== undefined) {
      responseData.error = result.data.error
    }
    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('Error polling prediction status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to poll status'
    }
  }
}

export async function waitForImageCompletion(
  predictionId: string
): Promise<{ success: boolean; data?: { status: string; imageUrl?: string; error?: string }; error?: string }> {
  try {
    const result = await waitForGenerationCompletion(predictionId)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to wait for completion'
      }
    }

    let imageUrl: string | undefined

    // Extract image URL from output
    if (result.data.output) {
      if (Array.isArray(result.data.output)) {
        // Some models return an array of images
        imageUrl = result.data.output[0]
      } else if (typeof result.data.output === 'string') {
        // Some models return a single image URL
        imageUrl = result.data.output
      }
    }

    const responseData: { status: string; imageUrl?: string; error?: string } = {
      status: result.data.status
    }
    if (imageUrl !== undefined) {
      responseData.imageUrl = imageUrl
    }
    if (result.data.error !== undefined) {
      responseData.error = result.data.error
    }
    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('Error waiting for image completion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to wait for completion'
    }
  }
}