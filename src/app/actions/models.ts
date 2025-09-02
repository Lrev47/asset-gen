'use server'

import { revalidatePath } from 'next/cache'
import { modelRegistry } from '@/lib/models/registry/ModelRegistry'
import { createReplicateAdapter } from '@/lib/models/adapters/ReplicateAdapter'
import prisma from '@/lib/db/prisma'
import type {
  ExtendedAiModel,
  ModelFilter,
  ModelType,
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
  PredictionInput,
  ValidationResult,
  CostEstimate,
  ModelWithStats
} from '@/lib/models/types'
import { createGenerationWithPrompt } from './generation'

// ==================== MODEL FETCHING ====================

export async function getAvailableModels(
  filter?: ModelFilter
): Promise<{ success: boolean; data?: ExtendedAiModel[]; error?: string }> {
  try {
    const models = await modelRegistry.getAllModels(filter)
    return { success: true, data: models }
  } catch (error) {
    console.error('Error fetching available models:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch models' 
    }
  }
}

export async function getModelById(
  slug: string
): Promise<{ success: boolean; data?: ExtendedAiModel; error?: string }> {
  try {
    const model = await modelRegistry.getModel(slug)
    if (!model) {
      return { success: false, error: 'Model not found' }
    }
    return { success: true, data: model }
  } catch (error) {
    console.error(`Error fetching model ${slug}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch model' 
    }
  }
}

export async function getModelsByType(
  type: ModelType
): Promise<{ success: boolean; data?: ExtendedAiModel[]; error?: string }> {
  try {
    const models = await modelRegistry.getModelsByType(type)
    return { success: true, data: models }
  } catch (error) {
    console.error(`Error fetching models by type ${type}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Failed to fetch ${type} models` 
    }
  }
}

export async function getModelWithStats(
  slug: string
): Promise<{ success: boolean; data?: ModelWithStats; error?: string }> {
  try {
    const model = await modelRegistry.getModelStats(slug)
    if (!model) {
      return { success: false, error: 'Model not found' }
    }
    return { success: true, data: model }
  } catch (error) {
    console.error(`Error fetching model stats for ${slug}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch model stats' 
    }
  }
}

export async function searchModels(
  query: string
): Promise<{ success: boolean; data?: ExtendedAiModel[]; error?: string }> {
  try {
    const models = await modelRegistry.searchModels(query)
    return { success: true, data: models }
  } catch (error) {
    console.error(`Error searching models with query "${query}":`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search models' 
    }
  }
}

export async function getModelCapabilities(): Promise<{ 
  success: boolean; 
  data?: Record<string, string[]>; 
  error?: string 
}> {
  try {
    const capabilities = await modelRegistry.getModelCapabilities()
    return { success: true, data: capabilities }
  } catch (error) {
    console.error('Error fetching model capabilities:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch capabilities' 
    }
  }
}

// ==================== MODEL VALIDATION ====================

export async function validateModelInput(
  modelSlug: string,
  input: PredictionInput
): Promise<{ success: boolean; data?: ValidationResult; error?: string }> {
  try {
    const validation = await modelRegistry.validateModelInput(modelSlug, input)
    return { success: true, data: validation }
  } catch (error) {
    console.error(`Error validating input for model ${modelSlug}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate input' 
    }
  }
}

// ==================== COST ESTIMATION ====================

export async function estimateGenerationCost(
  modelSlug: string,
  input: PredictionInput
): Promise<{ success: boolean; data?: CostEstimate; error?: string }> {
  try {
    const model = await modelRegistry.getModel(modelSlug)
    if (!model) {
      return { success: false, error: 'Model not found' }
    }

    const adapter = createReplicateAdapter()
    const estimatedCost = await adapter.estimateCost(model, input)
    
    const costEstimate: CostEstimate = {
      baseCost: model.costPerUse || 0,
      additionalCosts: {},
      totalCost: estimatedCost,
      currency: 'USD',
      breakdown: [
        {
          item: 'Base prediction cost',
          cost: estimatedCost,
          description: `Cost for running ${model.name}`
        }
      ]
    }

    // Add specific cost breakdowns based on model type
    if (model.type === 'text' && input.max_tokens) {
      const tokens = input.max_tokens as number
      costEstimate.breakdown = [
        {
          item: 'Token generation',
          cost: estimatedCost,
          description: `~${tokens} tokens @ $${(estimatedCost / (tokens / 1000)).toFixed(6)}/1K tokens`
        }
      ]
    } else if (model.type === 'image' && input.num_outputs) {
      const images = input.num_outputs as number
      costEstimate.breakdown = [
        {
          item: 'Image generation',
          cost: estimatedCost,
          description: `${images} image${images > 1 ? 's' : ''} @ $${(estimatedCost / images).toFixed(4)}/image`
        }
      ]
    } else if (model.type === 'video' && input.num_frames) {
      const frames = input.num_frames as number
      costEstimate.breakdown = [
        {
          item: 'Video generation',
          cost: estimatedCost,
          description: `${frames} frames @ $${(estimatedCost / frames).toFixed(6)}/frame`
        }
      ]
    }

    return { success: true, data: costEstimate }
  } catch (error) {
    console.error(`Error estimating cost for model ${modelSlug}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to estimate cost' 
    }
  }
}

// ==================== GENERATION WORKFLOW ====================

export async function createModelGeneration(
  request: GenerationRequest
): Promise<{ success: boolean; data?: GenerationResponse; error?: string }> {
  try {
    // Get the model
    const model = await modelRegistry.getModel(request.modelSlug)
    if (!model) {
      return { success: false, error: 'Model not found' }
    }

    // Validate input
    const validation = await modelRegistry.validateModelInput(request.modelSlug, request.input)
    if (!validation.valid) {
      return { 
        success: false, 
        error: `Invalid input: ${validation.errors.map(e => e.message).join(', ')}` 
      }
    }

    // Create the generation using existing generation workflow
    const generationInput: any = {
      promptText: JSON.stringify(request.input), // Store full input as prompt
      modelId: model.id,
      userId: request.userId,
      type: 'single',
      parameters: validation.sanitizedInput || request.input
    }

    // Only add optional fields if they have values
    if (request.projectId !== undefined) {
      generationInput.projectId = request.projectId
    }
    if (request.fieldId !== undefined) {
      generationInput.fieldId = request.fieldId
    }

    const result = await createGenerationWithPrompt(generationInput)

    if (result.error || !result.generation) {
      return { success: false, error: result.error || 'Failed to create generation' }
    }

    // Estimate cost
    const costResult = await estimateGenerationCost(request.modelSlug, request.input)
    const estimatedCost = costResult.data?.totalCost

    // Start the actual prediction with the adapter
    const adapter = createReplicateAdapter()
    const predictionResult = await adapter.run(model, validation.sanitizedInput || request.input)

    const response: GenerationResponse = {
      predictionId: predictionResult.id,
      status: predictionResult.status
    }

    // Only add optional properties when they have values
    if (estimatedCost !== undefined) {
      response.estimatedCost = estimatedCost
    }
    if (model.avgLatency) {
      response.estimatedTime = model.avgLatency
    }
    if (predictionResult.urls?.stream) {
      response.streamUrl = predictionResult.urls.stream
    }
    if (process.env.REPLICATE_WEBHOOK_URL) {
      response.webhookUrl = process.env.REPLICATE_WEBHOOK_URL
    }

    // Update generation with prediction ID
    await updateGenerationWithPrediction(result.generation.id, predictionResult.id, estimatedCost)

    // Revalidate relevant paths
    if (request.projectId) {
      revalidatePath(`/projects/${request.projectId}`)
    }
    if (request.fieldId) {
      revalidatePath(`/projects/${request.projectId}/fields/${request.fieldId}`)
    }

    return { success: true, data: response }
  } catch (error) {
    console.error('Error creating model generation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create generation' 
    }
  }
}

/**
 * Wait for generation completion using Replicate's built-in wait method
 */
export async function waitForGenerationCompletion(
  predictionId: string
): Promise<{ success: boolean; data?: GenerationStatus; error?: string }> {
  try {
    const adapter = createReplicateAdapter()
    const result = await adapter.waitForCompletion(predictionId, { interval: 1500 })
    
    const status: GenerationStatus = {
      predictionId: result.id,
      status: result.status
    }

    // Only add optional properties when they have values
    if (result.output) {
      status.output = result.output
    }
    if (result.error) {
      status.error = result.error
    }
    if (result.metrics && result.metrics.predict_time) {
      status.metrics = {
        duration: result.metrics.predict_time
      }
    }

    return { success: true, data: status }
  } catch (error) {
    console.error('Error waiting for generation completion:', error)
    return { 
      success: false, 
      error: `Failed to wait for completion: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function getGenerationStatus(
  predictionId: string
): Promise<{ success: boolean; data?: GenerationStatus; error?: string }> {
  try {
    const adapter = createReplicateAdapter()
    const result = await adapter.getStatus(predictionId)
    
    const status: GenerationStatus = {
      predictionId: result.id,
      status: result.status
    }

    // Only add optional properties when they have values
    if (result.output !== undefined) {
      status.output = result.output
    }
    if (result.error !== undefined) {
      status.error = result.error
    }

    // Only add metrics if at least one value is defined
    const metrics: any = {}
    if (result.started_at) {
      metrics.startTime = result.started_at
    }
    if (result.completed_at) {
      metrics.endTime = result.completed_at
    }
    if (result.metrics?.total_time) {
      metrics.duration = result.metrics.total_time
    }

    // Only add metrics object if it has properties
    if (Object.keys(metrics).length > 0) {
      status.metrics = metrics
    }

    return { success: true, data: status }
  } catch (error) {
    console.error(`Error getting generation status ${predictionId}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get generation status' 
    }
  }
}

export async function updateGenerationFromPrediction(
  predictionId: string,
  status: string,
  output?: any,
  error?: string,
  metrics?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the generation record that has this prediction ID in its output
    const generation = await prisma.generation.findFirst({
      where: {
        output: {
          path: ['predictionId'],
          equals: predictionId
        }
      }
    })

    if (!generation) {
      return { success: false, error: `Generation not found for prediction ${predictionId}` }
    }

    // Map Replicate status to our status format
    let dbStatus = status
    switch (status) {
      case 'starting':
      case 'processing':
        dbStatus = 'processing'
        break
      case 'succeeded':
        dbStatus = 'completed'
        break
      case 'failed':
      case 'canceled':
        dbStatus = 'failed'
        break
    }

    // Prepare update data
    const updateData: any = {
      status: dbStatus
    }

    // Update output with new data
    if (output || error) {
      updateData.output = {
        ...generation.output as any,
        ...(output && { result: output }),
        ...(error && { error }),
        ...(metrics && { metrics }),
        lastUpdated: new Date().toISOString()
      }
    }

    // Calculate duration if we have metrics
    if (metrics?.total_time) {
      updateData.duration = Math.round(metrics.total_time * 1000) // Convert to ms
    }

    // Set completion time for completed/failed generations
    if (dbStatus === 'completed' || dbStatus === 'failed') {
      updateData.completedAt = new Date()
    }

    await prisma.generation.update({
      where: { id: generation.id },
      data: updateData
    })

    console.log(`Updated generation ${generation.id} from prediction ${predictionId} to status: ${dbStatus}`)
    
    // Revalidate model detail page to refresh Recent Generations tab
    const generationWithModel = await prisma.generation.findUnique({
      where: { id: generation.id },
      include: { model: true }
    })
    
    if (generationWithModel) {
      revalidatePath(`/models/${generationWithModel.model.slug}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating generation from prediction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update generation' 
    }
  }
}

export async function cancelGeneration(
  predictionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adapter = createReplicateAdapter()
    const cancelled = await adapter.cancel(predictionId)
    
    if (!cancelled) {
      return { success: false, error: 'Failed to cancel generation' }
    }

    return { success: true }
  } catch (error) {
    console.error(`Error canceling generation ${predictionId}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel generation' 
    }
  }
}

export async function refreshGenerationStatuses(
  modelSlug: string
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    console.log(`Refreshing generation statuses for model: ${modelSlug}`)
    
    // Find the model
    const model = await prisma.aiModel.findUnique({
      where: { slug: modelSlug }
    })

    if (!model) {
      return { success: false, updated: 0, error: 'Model not found' }
    }

    // Find pending generations for this model
    const pendingGenerations = await prisma.generation.findMany({
      where: {
        modelId: model.id,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    })

    if (pendingGenerations.length === 0) {
      return { success: true, updated: 0 }
    }

    const adapter = createReplicateAdapter()
    let updated = 0

    // Process each pending generation
    for (const generation of pendingGenerations) {
      try {
        const output = generation.output as any
        const predictionId = output?.predictionId

        if (!predictionId) {
          continue // Skip generations without prediction ID
        }

        // Check status with Replicate
        const status = await adapter.getStatus(predictionId)
        
        // Update if status changed
        const result = await updateGenerationFromPrediction(
          predictionId,
          status.status,
          status.output,
          status.error,
          status.metrics
        )

        if (result.success) {
          updated++
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error refreshing generation ${generation.id}:`, error)
        // Continue with other generations
      }
    }

    // Revalidate the model page
    revalidatePath(`/models/${modelSlug}`)

    console.log(`Refreshed ${updated} out of ${pendingGenerations.length} generations for ${modelSlug}`)
    return { success: true, updated }

  } catch (error) {
    console.error('Error refreshing generation statuses:', error)
    return { 
      success: false, 
      updated: 0,
      error: error instanceof Error ? error.message : 'Failed to refresh statuses' 
    }
  }
}

// ==================== MODEL MANAGEMENT ====================

export async function syncModelSchema(
  modelSlug: string
): Promise<{ success: boolean; data?: ExtendedAiModel; error?: string }> {
  try {
    const updatedModel = await modelRegistry.syncModelSchema(modelSlug)
    
    revalidatePath('/models') // Revalidate models page
    revalidatePath(`/models/${modelSlug}`)
    
    return { success: true, data: updatedModel }
  } catch (error) {
    console.error(`Error syncing schema for model ${modelSlug}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync model schema' 
    }
  }
}

export async function refreshModelCache(): Promise<{ success: boolean; error?: string }> {
  try {
    await modelRegistry.refreshCache()
    
    revalidatePath('/models')
    
    return { success: true }
  } catch (error) {
    console.error('Error refreshing model cache:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh model cache' 
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

async function updateGenerationWithPrediction(
  generationId: string,
  predictionId: string,
  estimatedCost?: number
): Promise<void> {
  try {
    // Update the generation record with prediction details
    const updateData: any = {
      status: 'processing',
      output: {
        predictionId,
        provider: 'replicate',
        timestamp: new Date().toISOString()
      }
    }

    if (estimatedCost !== undefined) {
      updateData.cost = estimatedCost
    }

    // Actually update the Generation record in the database
    await prisma.generation.update({
      where: { id: generationId },
      data: updateData
    })

    console.log(`Updated generation ${generationId} with prediction ${predictionId}`)
  } catch (error) {
    console.error('Error updating generation with prediction:', error)
    throw error
  }
}

// ==================== BATCH OPERATIONS ====================

export async function createBatchGeneration(
  modelSlug: string,
  inputs: PredictionInput[],
  userId: string,
  projectId?: string,
  fieldId?: string
): Promise<{ success: boolean; data?: GenerationResponse[]; error?: string }> {
  try {
    const model = await modelRegistry.getModel(modelSlug)
    if (!model) {
      return { success: false, error: 'Model not found' }
    }

    if (!model.capabilities?.batch) {
      return { success: false, error: 'Model does not support batch operations' }
    }

    const adapter = createReplicateAdapter()
    const results = await adapter.runBatch(model, inputs)
    
    const responses: GenerationResponse[] = results.map(result => {
      const response: GenerationResponse = {
        predictionId: result.id,
        status: result.status
      }

      // Only add optional properties when they have values
      if (model.avgLatency) {
        response.estimatedTime = model.avgLatency
      }
      if (result.urls?.stream) {
        response.streamUrl = result.urls.stream
      }
      if (process.env.REPLICATE_WEBHOOK_URL) {
        response.webhookUrl = process.env.REPLICATE_WEBHOOK_URL
      }

      return response
    })

    return { success: true, data: responses }
  } catch (error) {
    console.error('Error creating batch generation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create batch generation' 
    }
  }
}

// ==================== COMPREHENSIVE STATISTICS ====================


export async function getModelsWithStats(): Promise<{
  success: boolean
  data?: (ExtendedAiModel & { 
    generationCount: number
    successRate: number
    avgCost: number
    recentMetrics?: any
  })[]
  error?: string
}> {
  try {
    const models = await prisma.aiModel.findMany({
      include: {
        _count: {
          select: { generations: true }
        },
        generations: {
          select: { status: true, cost: true, duration: true },
          take: 100, // Recent generations for calculating stats
          orderBy: { createdAt: 'desc' }
        },
        modelMetrics: {
          orderBy: { date: 'desc' },
          take: 30 // For trend analysis
        }
      }
    })

    const modelsWithStats = models.map(model => {
      const generations = model.generations
      const completedGenerations = generations.filter(g => g.status === 'completed')
      const totalGenerations = generations.length

      // Calculate success rate
      const successRate = totalGenerations > 0 
        ? (completedGenerations.length / totalGenerations) * 100 
        : 0

      // Calculate average cost from actual generations
      const totalCost = generations.reduce((sum, g) => sum + (g.cost || 0), 0)
      const avgCost = totalGenerations > 0 ? totalCost / totalGenerations : model.costPerUse || 0

      // Transform to ExtendedAiModel
      const extendedModel = {
        ...model,
        // Add default empty values for removed fields
        avgLatency: null,
        capabilities: {} as any,
        config: {} as any, 
        parameters: {} as any,
        limits: {} as any,
        generationCount: model._count.generations,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
        avgCost: Math.round(avgCost * 10000) / 10000, // Round to 4 decimal places
        recentMetrics: model.modelMetrics[0] || null
      }

      return extendedModel
    })

    return { success: true, data: modelsWithStats }
  } catch (error) {
    console.error('Error fetching models with stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch models with stats'
    }
  }
}

export async function getModelOverviewStats(): Promise<{
  success: boolean
  data?: {
    totalModels: number
    modelsByType: Record<string, number>
    totalGenerations: number
    overallSuccessRate: number
    avgCostPerGeneration: number
    monthOverMonthGrowth: {
      generations: number
      successRate: number
      avgCost: number
    }
  }
  error?: string
}> {
  try {
    // Get all models with their type distribution
    const models = await prisma.aiModel.findMany({
      select: { type: true }
    })

    // Get generation statistics
    const generationStats = await prisma.generation.aggregate({
      _count: true,
      _avg: { cost: true },
      where: {
        status: { in: ['completed', 'failed', 'processing', 'pending'] }
      }
    })

    const completedGenerations = await prisma.generation.count({
      where: { status: 'completed' }
    })

    // Calculate model distribution by type
    const modelsByType = models.reduce((acc, model) => {
      acc[model.type] = (acc[model.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate success rate
    const totalGenerations = generationStats._count
    const overallSuccessRate = totalGenerations > 0 
      ? (completedGenerations / totalGenerations) * 100 
      : 0

    // Get month-over-month comparison (simplified for now)
    const currentDate = new Date()
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const [currentMonthStats, lastMonthStats] = await Promise.all([
      prisma.generation.aggregate({
        _count: true,
        _avg: { cost: true },
        where: {
          createdAt: { gte: currentMonth },
          status: { in: ['completed', 'failed'] }
        }
      }),
      prisma.generation.aggregate({
        _count: true,
        _avg: { cost: true },
        where: {
          createdAt: { gte: lastMonth, lt: currentMonth },
          status: { in: ['completed', 'failed'] }
        }
      })
    ])

    const [currentMonthCompleted, lastMonthCompleted] = await Promise.all([
      prisma.generation.count({
        where: {
          createdAt: { gte: currentMonth },
          status: 'completed'
        }
      }),
      prisma.generation.count({
        where: {
          createdAt: { gte: lastMonth, lt: currentMonth },
          status: 'completed'
        }
      })
    ])

    // Calculate growth percentages
    const generationsGrowth = lastMonthStats._count > 0 
      ? ((currentMonthStats._count - lastMonthStats._count) / lastMonthStats._count) * 100 
      : 0

    const currentMonthSuccessRate = currentMonthStats._count > 0 
      ? (currentMonthCompleted / currentMonthStats._count) * 100 
      : 0
    const lastMonthSuccessRate = lastMonthStats._count > 0 
      ? (lastMonthCompleted / lastMonthStats._count) * 100 
      : 0
    const successRateGrowth = lastMonthSuccessRate > 0 
      ? currentMonthSuccessRate - lastMonthSuccessRate 
      : 0

    const avgCostGrowth = (lastMonthStats._avg.cost && currentMonthStats._avg.cost) 
      ? ((currentMonthStats._avg.cost - lastMonthStats._avg.cost) / lastMonthStats._avg.cost) * 100 
      : 0

    return {
      success: true,
      data: {
        totalModels: models.length,
        modelsByType,
        totalGenerations,
        overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
        avgCostPerGeneration: Math.round((generationStats._avg.cost || 0) * 10000) / 10000,
        monthOverMonthGrowth: {
          generations: Math.round(generationsGrowth * 100) / 100,
          successRate: Math.round(successRateGrowth * 100) / 100,
          avgCost: Math.round(avgCostGrowth * 100) / 100
        }
      }
    }
  } catch (error) {
    console.error('Error fetching overview stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch overview stats'
    }
  }
}

export async function getModelDetailedStats(
  slug: string
): Promise<{
  success: boolean
  data?: ModelWithStats & {
    detailedMetrics: {
      totalGenerations: number
      successRate: number
      avgLatency: number
      avgCost: number
      monthOverMonthGrowth: {
        generations: number
        successRate: number
        latency: number
        cost: number
      }
      recentGenerations: Array<{
        id: string
        status: string
        cost?: number
        duration?: number
        createdAt: Date
      }>
    }
  }
  error?: string
}> {
  try {
    const model = await prisma.aiModel.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { generations: true }
        },
        generations: {
          select: { id: true, status: true, cost: true, duration: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 100 // For detailed analysis
        },
        modelMetrics: {
          orderBy: { date: 'desc' },
          take: 60 // Two months of metrics for comparison
        }
      }
    })

    if (!model) {
      return { success: false, error: 'Model not found' }
    }

    const generations = model.generations
    const completedGenerations = generations.filter(g => g.status === 'completed')
    const totalGenerations = generations.length

    // Calculate current metrics
    const successRate = totalGenerations > 0 
      ? (completedGenerations.length / totalGenerations) * 100 
      : 0

    const avgLatency = completedGenerations.length > 0
      ? completedGenerations.reduce((sum, g) => sum + (g.duration || 0), 0) / completedGenerations.length
      : 0

    const totalCost = generations.reduce((sum, g) => sum + (g.cost || 0), 0)
    const avgCost = totalGenerations > 0 ? totalCost / totalGenerations : model.costPerUse || 0

    // Calculate month-over-month growth
    const currentDate = new Date()
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const currentMonthGenerations = generations.filter(g => 
      new Date(g.createdAt) >= currentMonth
    )
    const lastMonthGenerations = generations.filter(g => 
      new Date(g.createdAt) >= lastMonth && new Date(g.createdAt) < currentMonth
    )

    const currentMonthCompleted = currentMonthGenerations.filter(g => g.status === 'completed')
    const lastMonthCompleted = lastMonthGenerations.filter(g => g.status === 'completed')

    const generationsGrowth = lastMonthGenerations.length > 0 
      ? ((currentMonthGenerations.length - lastMonthGenerations.length) / lastMonthGenerations.length) * 100 
      : 0

    const currentMonthSuccessRate = currentMonthGenerations.length > 0 
      ? (currentMonthCompleted.length / currentMonthGenerations.length) * 100 
      : 0
    const lastMonthSuccessRate = lastMonthGenerations.length > 0 
      ? (lastMonthCompleted.length / lastMonthGenerations.length) * 100 
      : 0
    const successRateGrowth = currentMonthSuccessRate - lastMonthSuccessRate

    const currentMonthAvgLatency = currentMonthCompleted.length > 0
      ? currentMonthCompleted.reduce((sum, g) => sum + (g.duration || 0), 0) / currentMonthCompleted.length
      : 0
    const lastMonthAvgLatency = lastMonthCompleted.length > 0
      ? lastMonthCompleted.reduce((sum, g) => sum + (g.duration || 0), 0) / lastMonthCompleted.length
      : 0
    const latencyGrowth = lastMonthAvgLatency > 0 
      ? ((currentMonthAvgLatency - lastMonthAvgLatency) / lastMonthAvgLatency) * 100 
      : 0

    const currentMonthAvgCost = currentMonthGenerations.length > 0
      ? currentMonthGenerations.reduce((sum, g) => sum + (g.cost || 0), 0) / currentMonthGenerations.length
      : 0
    const lastMonthAvgCost = lastMonthGenerations.length > 0
      ? lastMonthGenerations.reduce((sum, g) => sum + (g.cost || 0), 0) / lastMonthGenerations.length
      : 0
    const costGrowth = lastMonthAvgCost > 0 
      ? ((currentMonthAvgCost - lastMonthAvgCost) / lastMonthAvgCost) * 100 
      : 0

    // Transform to ModelWithStats
    const extendedModel = {
      ...model,
      // Add default empty values for removed fields
      avgLatency: null,
      capabilities: {} as any,
      config: {} as any,
      parameters: {} as any,
      limits: {} as any,
      _count: { generations: model._count.generations }
    } as ModelWithStats

    // Add recent metrics if available
    if (model.modelMetrics && model.modelMetrics.length > 0) {
      const recentMetrics = model.modelMetrics[0]
      if (recentMetrics) {
        extendedModel.avgRating = recentMetrics.successRate
        extendedModel.usageCount = recentMetrics.usageCount
        extendedModel.successRate = recentMetrics.successRate
      }
    }

    const result = {
      ...extendedModel,
      detailedMetrics: {
        totalGenerations,
        successRate: Math.round(successRate * 100) / 100,
        avgLatency: Math.round(avgLatency),
        avgCost: Math.round(avgCost * 10000) / 10000,
        monthOverMonthGrowth: {
          generations: Math.round(generationsGrowth * 100) / 100,
          successRate: Math.round(successRateGrowth * 100) / 100,
          latency: Math.round(latencyGrowth * 100) / 100,
          cost: Math.round(costGrowth * 100) / 100
        },
        recentGenerations: generations.slice(0, 10).map(g => {
          const generation: any = {
            id: g.id,
            status: g.status,
            createdAt: g.createdAt
          }
          
          // Handle legacy generations that might be stuck in pending
          // If generation is old (> 1 hour) and still pending, mark as failed
          const isOldPending = g.status === 'pending' && 
            (Date.now() - g.createdAt.getTime()) > (60 * 60 * 1000) // 1 hour
          
          if (isOldPending) {
            generation.status = 'failed'
            generation.legacyGeneration = true // Flag for UI to show differently
          }
          
          // Only add cost and duration if they have values
          if (g.cost !== null) {
            generation.cost = g.cost
          }
          if (g.duration !== null) {
            generation.duration = g.duration
          }
          
          return generation
        })
      }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error(`Error fetching detailed stats for model ${slug}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch detailed model stats'
    }
  }
}

// ==================== DISCOVERY METHODS ====================

export async function discoverReplicateModels(
  owner?: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const adapter = createReplicateAdapter()
    const models = await adapter.discoverModels(owner)
    
    return { success: true, data: models }
  } catch (error) {
    console.error('Error discovering Replicate models:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to discover models' 
    }
  }
}