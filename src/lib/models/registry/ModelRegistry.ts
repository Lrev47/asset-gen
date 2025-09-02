import prisma from '@/lib/db/prisma'
import type { 
  ExtendedAiModel, 
  ModelFilter, 
  ModelType, 
  ModelRegistry as IModelRegistry,
  ModelRegistryOptions,
  ModelWithStats,
  CreateModelInput,
  UpdateModelInput,
  ValidationResult,
  PredictionInput,
  ValidationError as IValidationError
} from '../types'
import { ModelError } from '../types'
import { SchemaManager } from '../schemas/SchemaManager'

export class ModelRegistry implements IModelRegistry {
  private static instance: ModelRegistry
  private cache: Map<string, ExtendedAiModel> = new Map()
  private cacheTimeout: number
  private lastCacheUpdate: Date | null = null
  private schemaManager: SchemaManager

  constructor(private options: ModelRegistryOptions = {}) {
    this.cacheTimeout = options.cacheTimeout || 300000 // 5 minutes default
    this.schemaManager = new SchemaManager()
  }

  // Singleton pattern
  public static getInstance(options?: ModelRegistryOptions): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry(options)
    }
    return ModelRegistry.instance
  }

  // ==================== CORE METHODS ====================

  async getModel(slug: string): Promise<ExtendedAiModel | null> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.has(slug)) {
        return this.cache.get(slug)!
      }

      // Fetch from database
      const model = await prisma.aiModel.findUnique({
        where: { slug },
        include: {
          generations: {
            select: { id: true },
            take: 1 // Just to check if any exist
          },
          modelMetrics: {
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days
          }
        }
      })

      if (!model) {
        return null
      }

      const extendedModel = this.transformToExtendedModel(model)
      
      // Update cache
      this.cache.set(slug, extendedModel)
      
      return extendedModel
    } catch (error) {
      console.error(`Error fetching model ${slug}:`, error)
      throw new ModelError(`Failed to fetch model: ${slug}`, 'MODEL_FETCH_ERROR')
    }
  }

  async getAllModels(filter?: ModelFilter): Promise<ExtendedAiModel[]> {
    try {
      // Build where clause
      const where: any = {}
      
      if (filter?.type) {
        where.type = filter.type
      }
      
      if (filter?.provider) {
        where.provider = filter.provider
      }
      
      if (filter?.status) {
        where.status = filter.status
      }
      
      if (filter?.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { slug: { contains: filter.search, mode: 'insensitive' } },
          { type: { contains: filter.search, mode: 'insensitive' } }
        ]
      }

      const models = await prisma.aiModel.findMany({
        where,
        include: {
          _count: {
            select: { generations: true }
          },
          modelMetrics: {
            orderBy: { date: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      })

      const extendedModels = models.map(model => this.transformToExtendedModel(model))

      // Filter by capabilities if specified
      if (filter?.capabilities && filter.capabilities.length > 0) {
        return extendedModels.filter(model => 
          filter.capabilities!.some(cap => 
            model.capabilities?.features.includes(cap) ||
            model.capabilities?.operations.includes(cap)
          )
        )
      }

      return extendedModels
    } catch (error) {
      console.error('Error fetching models:', error)
      throw new ModelError('Failed to fetch models', 'MODELS_FETCH_ERROR')
    }
  }

  async getModelsByType(type: ModelType): Promise<ExtendedAiModel[]> {
    return this.getAllModels({ type })
  }

  // ==================== MANAGEMENT METHODS ====================

  async registerModel(modelData: CreateModelInput): Promise<ExtendedAiModel> {
    try {
      // Validate required fields
      if (!modelData.name || !modelData.slug || !modelData.provider || !modelData.type) {
        throw new ModelError('Missing required fields', 'VALIDATION_ERROR')
      }

      // Check if slug already exists
      const existingModel = await prisma.aiModel.findUnique({
        where: { slug: modelData.slug }
      })

      if (existingModel) {
        throw new ModelError(`Model with slug '${modelData.slug}' already exists`, 'DUPLICATE_SLUG')
      }

      // Create model data without undefined values
      const createData: any = {
        slug: modelData.slug,
        provider: modelData.provider,
        type: modelData.type
      }
      
      if (modelData.name !== undefined) createData.name = modelData.name
      if (modelData.costPerUse !== undefined) createData.costPerUse = modelData.costPerUse
      
      const model = await prisma.aiModel.create({
        data: createData
      })

      const extendedModel = this.transformToExtendedModel(model)

      // Update cache
      this.cache.set(model.slug, extendedModel)

      // Try to sync schema if it's a replicate model
      if (modelData.provider === 'replicate' && modelData.config?.replicateId) {
        try {
          await this.syncModelSchema(model.slug)
        } catch (error) {
          console.warn(`Failed to sync schema for new model ${model.slug}:`, error)
        }
      }

      return extendedModel
    } catch (error) {
      console.error('Error registering model:', error)
      if (error instanceof ModelError) {
        throw error
      }
      throw new ModelError('Failed to register model', 'MODEL_REGISTRATION_ERROR')
    }
  }

  async updateModel(slug: string, updates: UpdateModelInput): Promise<ExtendedAiModel> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }
      
      // Only add defined properties to avoid TypeScript strict optional properties issues
      Object.keys(updates).forEach(key => {
        const value = updates[key as keyof UpdateModelInput]
        if (value !== undefined) {
          if (['capabilities', 'config', 'parameters', 'limits', 'credentials'].includes(key)) {
            updateData[key] = value as any
          } else {
            updateData[key] = value
          }
        }
      })
      
      const model = await prisma.aiModel.update({
        where: { slug },
        data: updateData
      })

      const extendedModel = this.transformToExtendedModel(model)

      // Update cache
      this.cache.set(slug, extendedModel)

      return extendedModel
    } catch (error) {
      console.error(`Error updating model ${slug}:`, error)
      throw new ModelError(`Failed to update model: ${slug}`, 'MODEL_UPDATE_ERROR')
    }
  }

  async deleteModel(slug: string): Promise<boolean> {
    try {
      await prisma.aiModel.delete({
        where: { slug }
      })

      // Remove from cache
      this.cache.delete(slug)

      return true
    } catch (error) {
      console.error(`Error deleting model ${slug}:`, error)
      return false
    }
  }

  // ==================== SCHEMA METHODS ====================

  async syncModelSchema(slug: string): Promise<ExtendedAiModel> {
    try {
      const model = await this.getModel(slug)
      if (!model) {
        throw new ModelError(`Model not found: ${slug}`, 'MODEL_NOT_FOUND')
      }

      if (model.provider !== 'replicate' || !model.config?.replicateId) {
        throw new ModelError(`Schema sync not supported for model: ${slug}`, 'SCHEMA_SYNC_NOT_SUPPORTED')
      }

      // Fetch latest schema from provider
      const schema = await this.schemaManager.fetchSchema(
        model.config?.replicateId!, 
        model.config?.version
      )

      // Update model with new schema
      const updatedModel = await this.updateModel(slug, {
        config: {
          ...model.config,
          inputSchema: schema,
          version: model.config?.version // Keep current version unless changed
        },
        // lastChecked: new Date() // Field doesn't exist in simplified schema
      })

      console.log(`✅ Schema synced for model: ${slug}`)
      return updatedModel
    } catch (error) {
      console.error(`Error syncing schema for model ${slug}:`, error)
      throw new ModelError(`Failed to sync schema: ${slug}`, 'SCHEMA_SYNC_ERROR')
    }
  }

  async refreshCache(): Promise<void> {
    try {
      this.cache.clear()
      this.lastCacheUpdate = null
      
      // Pre-load active models
      const activeModels = await this.getAllModels({ status: 'active' })
      console.log(`✅ Cache refreshed with ${activeModels.length} active models`)
    } catch (error) {
      console.error('Error refreshing cache:', error)
      throw new ModelError('Failed to refresh cache', 'CACHE_REFRESH_ERROR')
    }
  }

  // ==================== SEARCH AND FILTER ====================

  async searchModels(query: string): Promise<ExtendedAiModel[]> {
    return this.getAllModels({ search: query })
  }

  async getModelCapabilities(): Promise<Record<string, string[]>> {
    try {
      const models = await this.getAllModels()
      const capabilities = {
        operations: [] as string[],
        features: [] as string[],
        mediaTypes: [] as string[],
        providers: [] as string[]
      }

      models.forEach(model => {
        // Collect unique operations
        if (model.capabilities?.operations) {
          model.capabilities.operations.forEach(op => {
            if (!capabilities.operations.includes(op)) {
              capabilities.operations.push(op)
            }
          })
        }

        // Collect unique features
        if (model.capabilities?.features) {
          model.capabilities.features.forEach(feature => {
            if (!capabilities.features.includes(feature)) {
              capabilities.features.push(feature)
            }
          })
        }

        // Collect unique media types
        if (model.capabilities?.mediaTypes) {
          model.capabilities.mediaTypes.forEach(mediaType => {
            if (!capabilities.mediaTypes.includes(mediaType)) {
              capabilities.mediaTypes.push(mediaType)
            }
          })
        }

        // Collect unique providers
        if (!capabilities.providers.includes(model.provider)) {
          capabilities.providers.push(model.provider)
        }
      })

      return capabilities
    } catch (error) {
      console.error('Error getting model capabilities:', error)
      throw new ModelError('Failed to get model capabilities', 'CAPABILITIES_FETCH_ERROR')
    }
  }

  // ==================== UTILITY METHODS ====================

  async validateModelInput(slug: string, input: PredictionInput): Promise<ValidationResult> {
    const model = await this.getModel(slug)
    if (!model) {
      return {
        valid: false,
        errors: [{ field: 'model', message: `Model not found: ${slug}` }] as IValidationError[]
      }
    }

    return this.schemaManager.validateInput(model.config?.inputSchema || {}, input)
  }

  async getModelStats(slug: string): Promise<ModelWithStats | null> {
    try {
      const model = await prisma.aiModel.findUnique({
        where: { slug },
        include: {
          _count: {
            select: { generations: true }
          },
          modelMetrics: {
            orderBy: { date: 'desc' },
            take: 30
          }
        }
      })

      if (!model) {
        return null
      }

      const extendedModel = this.transformToExtendedModel(model) as ModelWithStats

      // Add stats
      extendedModel._count = { generations: model._count.generations }
      
      if (model.modelMetrics && model.modelMetrics.length > 0) {
        const recentMetrics = model.modelMetrics[0]
        if (recentMetrics) {
          extendedModel.avgRating = recentMetrics.successRate
          extendedModel.usageCount = recentMetrics.usageCount
          extendedModel.successRate = recentMetrics.successRate
        }
      }

      return extendedModel
    } catch (error) {
      console.error(`Error getting stats for model ${slug}:`, error)
      return null
    }
  }

  // ==================== PRIVATE METHODS ====================

  private transformToExtendedModel(model: any): ExtendedAiModel {
    return {
      ...model,
      capabilities: model.capabilities as any,
      config: model.config as any,
      parameters: model.parameters as any,
      limits: model.limits as any
    }
  }

  private isCacheValid(): boolean {
    if (!this.lastCacheUpdate) {
      return false
    }
    
    const now = new Date().getTime()
    const cacheAge = now - this.lastCacheUpdate.getTime()
    
    return cacheAge < this.cacheTimeout
  }

  // ==================== LIFECYCLE METHODS ====================

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Model Registry...')
      
      // Pre-load active models into cache
      await this.refreshCache()
      
      // Start auto-sync if enabled
      if (this.options.autoSync) {
        this.startAutoSync()
      }
      
      console.log('✅ Model Registry initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Model Registry:', error)
      throw error
    }
  }

  private startAutoSync(): void {
    const interval = this.options.syncInterval || 3600000 // 1 hour default
    
    setInterval(async () => {
      try {
        console.log('🔄 Auto-syncing model schemas...')
        const models = await this.getAllModels({ 
          provider: 'replicate', 
          status: 'active' 
        })

        for (const model of models) {
          try {
            await this.syncModelSchema(model.slug)
          } catch (error) {
            console.warn(`Failed to sync ${model.slug}:`, error)
          }
        }
        
        console.log('✅ Auto-sync completed')
      } catch (error) {
        console.error('❌ Auto-sync failed:', error)
      }
    }, interval)
  }
}

// Export singleton instance
export const modelRegistry = ModelRegistry.getInstance({
  cacheTimeout: 300000, // 5 minutes
  autoSync: process.env.NODE_ENV === 'production',
  syncInterval: 3600000 // 1 hour
})