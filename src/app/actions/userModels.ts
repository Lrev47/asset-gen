'use server'

import prisma from '@/lib/db/prisma'
import type { ModelType } from '@/lib/models/types'
import { detectModelType, type ReplicateModel } from '@/lib/models/utils/typeDetection'

const DEFAULT_USER_ID = 'user-1' // Using the same default user as in our seeded data

interface UserModelData {
  id: string
  userId: string
  modelSlug: string
  modelName: string
  modelType: ModelType
  addedAt: Date
  lastUsedAt?: Date | null
  settings?: any
  coverImageUrl?: string | null
}

interface AddModelInput {
  modelSlug: string // e.g., "black-forest-labs/flux-1.1-pro"
  modelName: string
  modelType?: ModelType // Optional - will be detected if not provided
  coverImageUrl?: string | undefined // Optional - cover image URL from the model
}

// ==================== GET USER MODELS ====================

export async function getUserModels(userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    const userModels = await prisma.userModel.findMany({
      where: { userId: actualUserId },
      orderBy: [
        { lastUsedAt: 'desc' }, // Recently used first
        { addedAt: 'desc' }     // Then by recently added
      ]
    })

    // Get AiModel data for cover images
    const modelSlugs = userModels.map(m => m.modelSlug)
    const aiModels = await prisma.aiModel.findMany({
      where: { slug: { in: modelSlugs } },
      select: { slug: true, coverImageUrl: true }
    })
    
    const aiModelMap = new Map(aiModels.map(m => [m.slug, m]))

    // Merge user model data with cover images
    const modelsWithImages: UserModelData[] = userModels.map(model => ({
      ...model,
      modelType: model.modelType as ModelType,
      coverImageUrl: model.coverImageUrl || aiModelMap.get(model.modelSlug)?.coverImageUrl || null
    }))

    return {
      success: true,
      data: modelsWithImages
    }
  } catch (error) {
    console.error('Error fetching user models:', error)
    return {
      success: false,
      error: 'Failed to fetch user models'
    }
  }
}

// ==================== ADD MODEL TO COLLECTION ====================

export async function addUserModel(input: AddModelInput, userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    // Check if model is already in user's collection
    const existingModel = await prisma.userModel.findFirst({
      where: {
        userId: actualUserId,
        modelSlug: input.modelSlug
      }
    })

    if (existingModel) {
      return {
        success: false,
        error: 'Model already in your collection'
      }
    }

    // If modelType or coverImageUrl not provided, try to fetch from Replicate API
    let modelType = input.modelType
    let coverImageUrl: string | null = input.coverImageUrl || null
    
    if (!modelType || !coverImageUrl) {
      try {
        const replicateResponse = await fetch(
          `https://api.replicate.com/v1/models/${input.modelSlug}`,
          {
            headers: {
              'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (replicateResponse.ok) {
          const replicateModel: ReplicateModel = await replicateResponse.json()
          if (!modelType) {
            modelType = detectModelType(replicateModel)
          }
          if (!coverImageUrl) {
            coverImageUrl = replicateModel.cover_image_url || null
          }
        } else {
          if (!modelType) {
            modelType = 'utility' // Default fallback
          }
        }
      } catch (error) {
        console.warn('Failed to fetch model data from Replicate:', error)
        if (!modelType) {
          modelType = 'utility' // Default fallback
        }
      }
    }

    const userModel = await prisma.userModel.create({
      data: {
        userId: actualUserId,
        modelSlug: input.modelSlug,
        modelName: input.modelName,
        modelType: modelType!,
        coverImageUrl
      }
    })

    return {
      success: true,
      data: userModel as UserModelData
    }
  } catch (error) {
    console.error('Error adding model to user collection:', error)
    return {
      success: false,
      error: 'Failed to add model to collection'
    }
  }
}

// ==================== REMOVE MODEL FROM COLLECTION ====================

export async function removeUserModel(modelId: string, userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    await prisma.userModel.delete({
      where: {
        id: modelId,
        userId: actualUserId // Ensure user can only remove their own models
      }
    })

    return {
      success: true,
      message: 'Model removed from collection'
    }
  } catch (error) {
    console.error('Error removing model from user collection:', error)
    return {
      success: false,
      error: 'Failed to remove model from collection'
    }
  }
}

// ==================== UPDATE MODEL SETTINGS ====================

export async function updateUserModelSettings(
  modelId: string, 
  settings: any, 
  userId?: string
) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    const updatedModel = await prisma.userModel.update({
      where: {
        id: modelId,
        userId: actualUserId
      },
      data: {
        settings: settings
      }
    })

    return {
      success: true,
      data: updatedModel as UserModelData
    }
  } catch (error) {
    console.error('Error updating model settings:', error)
    return {
      success: false,
      error: 'Failed to update model settings'
    }
  }
}

// ==================== UPDATE LAST USED TIME ====================

export async function updateModelLastUsed(modelSlug: string, userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    await prisma.userModel.updateMany({
      where: {
        userId: actualUserId,
        modelSlug: modelSlug
      },
      data: {
        lastUsedAt: new Date()
      }
    })

    return {
      success: true,
      message: 'Model usage updated'
    }
  } catch (error) {
    console.error('Error updating model last used time:', error)
    return {
      success: false,
      error: 'Failed to update model usage'
    }
  }
}

// ==================== GET USER MODEL BY SLUG ====================

export async function getUserModel(modelSlug: string, userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    const userModel = await prisma.userModel.findFirst({
      where: {
        userId: actualUserId,
        modelSlug: modelSlug
      }
    })

    if (!userModel) {
      return {
        success: false,
        error: 'Model not found in your collection'
      }
    }

    return {
      success: true,
      data: userModel as UserModelData
    }
  } catch (error) {
    console.error('Error fetching user model:', error)
    return {
      success: false,
      error: 'Failed to fetch model'
    }
  }
}

// ==================== CHECK IF MODEL IS IN COLLECTION ====================

export async function isModelInCollection(modelSlug: string, userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    const userModel = await prisma.userModel.findFirst({
      where: {
        userId: actualUserId,
        modelSlug: modelSlug
      },
      select: { id: true }
    })

    return {
      success: true,
      data: { inCollection: !!userModel, modelId: userModel?.id }
    }
  } catch (error) {
    console.error('Error checking if model is in collection:', error)
    return {
      success: false,
      error: 'Failed to check model status'
    }
  }
}

// ==================== GET USER COLLECTION STATS ====================

export async function getUserModelStats(userId?: string) {
  try {
    const actualUserId = userId || DEFAULT_USER_ID
    
    const models = await prisma.userModel.findMany({
      where: { userId: actualUserId },
      select: { modelType: true, addedAt: true }
    })

    const stats = {
      total: models.length,
      byType: {
        image: models.filter(m => m.modelType === 'image').length,
        text: models.filter(m => m.modelType === 'text').length,
        video: models.filter(m => m.modelType === 'video').length,
        audio: models.filter(m => m.modelType === 'audio').length,
        utility: models.filter(m => m.modelType === 'utility').length
      },
      recentlyAdded: models.filter(m => {
        const daysSinceAdded = (Date.now() - new Date(m.addedAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceAdded <= 7 // Added in last 7 days
      }).length
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Error fetching user model stats:', error)
    return {
      success: false,
      error: 'Failed to fetch model statistics'
    }
  }
}