import type { AiModel, Prisma } from '@prisma/client'

// ==================== CORE TYPES ====================

export type ModelType = 'image' | 'text' | 'video' | 'audio' | 'utility'
export type ModelProvider = 'replicate' | 'openai' | 'local'
export type ModelStatus = 'active' | 'inactive' | 'error' | 'maintenance'
export type DeploymentType = 'api' | 'local'

// ==================== SCHEMA TYPES ====================

export interface SchemaField {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'enum' | 'file' | 'array'
  required?: boolean
  optional?: boolean
  default?: any
  min?: number
  max?: number
  options?: string[] // for enum type
  accept?: string // for file type (e.g., "audio/*")
  description?: string
  placeholder?: string
  validation?: {
    pattern?: string
    message?: string
  }
}

export interface InputSchema {
  [key: string]: SchemaField
}

export interface OutputSchema {
  type: string
  format?: string
  description?: string
}

// ==================== MODEL CONFIGURATION ====================

export interface ModelCapabilities {
  operations: string[]
  mediaTypes: string[]
  maxTokens?: number
  maxResolution?: string
  maxDuration?: number
  maxFileSize?: string
  supportedFormats?: string[]
  supportedLanguages?: string[]
  features: string[]
  streaming: boolean
  batch: boolean
  webhook: boolean
}

export interface ModelConfig {
  replicateId?: string
  version: string
  replicateUrl: string
  inputSchema: InputSchema
  outputSchema?: OutputSchema
  outputType: string
  supportedFormats?: string[]
  streaming?: boolean
  webhookEvents?: string[]
}

export interface ModelLimits {
  maxTokens?: number
  maxResolution?: string
  maxFrames?: number
  maxDuration?: number
  maxFileSize?: string
  maxBatchSize?: number
  timeoutSeconds: number
}

// ==================== EXTENDED MODEL TYPE ====================

export interface ExtendedAiModel {
  // Base AiModel fields
  id: string
  name?: string | null
  slug: string
  provider: string
  type: string
  costPerUse?: number | null
  avgLatency?: number | null
  createdAt: Date
  updatedAt: Date
  
  // Extended typed fields (optional for compatibility)
  capabilities?: ModelCapabilities
  config?: ModelConfig
  parameters?: Record<string, any>
  limits?: ModelLimits
}

// ==================== ADAPTER INTERFACES ====================

export interface PredictionInput {
  [key: string]: any
}

export interface PredictionOutput {
  [key: string]: any
}

export interface PredictionResult {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input: PredictionInput
  output?: PredictionOutput
  error?: string
  logs?: string[]
  metrics?: {
    predict_time?: number
    total_time?: number
  }
  urls?: {
    stream?: string
    get?: string
    cancel?: string
  }
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface StreamEvent {
  event: string
  data: string
  id?: string
  retry?: number
}

export interface AdapterConfig {
  apiToken: string
  baseUrl?: string
  timeout?: number
  retries?: number
}

export interface ModelAdapter {
  provider: ModelProvider
  config: AdapterConfig
  
  // Core methods
  run(model: ExtendedAiModel, input: PredictionInput): Promise<PredictionResult>
  getStatus(predictionId: string): Promise<PredictionResult>
  cancel(predictionId: string): Promise<boolean>
  
  // Schema methods
  fetchSchema(modelId: string, version?: string): Promise<InputSchema>
  validateInput(model: ExtendedAiModel, input: PredictionInput): ValidationResult
  
  // Streaming support
  createStream?(predictionId: string): AsyncIterable<StreamEvent>
}

// ==================== VALIDATION ====================

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  sanitizedInput?: PredictionInput
}

// ==================== REGISTRY INTERFACES ====================

export interface ModelFilter {
  type?: ModelType
  provider?: ModelProvider
  status?: ModelStatus
  capabilities?: string[]
  search?: string
}

export interface ModelRegistryOptions {
  cacheTimeout?: number
  autoSync?: boolean
  syncInterval?: number
}

export interface ModelRegistry {
  // Core methods
  getModel(slug: string): Promise<ExtendedAiModel | null>
  getAllModels(filter?: ModelFilter): Promise<ExtendedAiModel[]>
  getModelsByType(type: ModelType): Promise<ExtendedAiModel[]>
  
  // Management methods
  registerModel(model: Partial<ExtendedAiModel>): Promise<ExtendedAiModel>
  updateModel(slug: string, updates: Partial<ExtendedAiModel>): Promise<ExtendedAiModel>
  deleteModel(slug: string): Promise<boolean>
  
  // Schema methods
  syncModelSchema(slug: string): Promise<ExtendedAiModel>
  refreshCache(): Promise<void>
  
  // Search and filter
  searchModels(query: string): Promise<ExtendedAiModel[]>
  getModelCapabilities(): Promise<Record<string, string[]>>
}

// ==================== GENERATION WORKFLOW ====================

export interface GenerationRequest {
  modelSlug: string
  input: PredictionInput
  userId: string
  projectId?: string
  fieldId?: string
  webhookUrl?: string
  stream?: boolean
}

export interface GenerationResponse {
  predictionId: string
  status: string
  estimatedTime?: number
  estimatedCost?: number
  streamUrl?: string
  webhookUrl?: string
}

export interface GenerationStatus {
  predictionId: string
  status: PredictionResult['status']
  progress?: number
  output?: PredictionOutput
  error?: string
  metrics?: {
    startTime?: string
    endTime?: string
    duration?: number
    cost?: number
  }
}

// ==================== UI INTERFACES ====================

export interface FormFieldProps {
  name: string
  schema: SchemaField
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
}

export interface ModelFormProps {
  model: ExtendedAiModel
  initialValues?: Record<string, any>
  onSubmit: (values: PredictionInput) => void
  onValidate?: (values: PredictionInput) => ValidationResult
  loading?: boolean
  disabled?: boolean
}

export interface ModelSelectorProps {
  selectedModel?: string
  onModelSelect: (model: ExtendedAiModel) => void
  filter?: ModelFilter
  showPricing?: boolean
  showDescription?: boolean
}

// ==================== COST ESTIMATION ====================

export interface CostEstimate {
  baseCost: number
  additionalCosts: Record<string, number>
  totalCost: number
  currency: string
  breakdown: {
    item: string
    cost: number
    description?: string
  }[]
}

export interface CostCalculator {
  estimateCost(model: ExtendedAiModel, input: PredictionInput): CostEstimate
  getModelPricing(modelSlug: string): Promise<ModelPricing>
}

export interface ModelPricing {
  basePrice: number
  pricePerUnit: number
  unit: string
  currency: string
  additionalFees?: Record<string, number>
}

// ==================== ERROR HANDLING ====================

export class ModelError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ModelError'
  }
}

export class ValidationError extends ModelError {
  constructor(message: string, public errors: ValidationError[]) {
    super(message, 'VALIDATION_ERROR', { errors })
  }
}

export class AdapterError extends ModelError {
  constructor(
    message: string,
    public provider: ModelProvider,
    public statusCode?: number
  ) {
    super(message, 'ADAPTER_ERROR', { provider, statusCode })
  }
}

export class SchemaError extends ModelError {
  constructor(message: string, public modelSlug: string) {
    super(message, 'SCHEMA_ERROR', { modelSlug })
  }
}

// ==================== UTILITY TYPES ====================

export type ModelWithStats = ExtendedAiModel & {
  _count?: {
    generations: number
  }
  avgRating?: number
  usageCount?: number
  successRate?: number
  lastUsed?: Date
}

export type CreateModelInput = Omit<ExtendedAiModel, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateModelInput = Partial<ExtendedAiModel>

// ==================== WEBHOOK TYPES ====================

export interface WebhookPayload {
  id: string
  version: string
  created_at: string
  started_at?: string
  completed_at?: string
  status: PredictionResult['status']
  input: PredictionInput
  output?: PredictionOutput
  error?: string
  logs?: string[]
  metrics?: Record<string, any>
}

export interface WebhookHandler {
  handleWebhook(payload: WebhookPayload): Promise<void>
  validateWebhook(signature: string, body: string): boolean
}