import { Project } from './project';

export interface ModelFormCallback {
  (model: AIModel): void;
}

export interface ProjectFormCallback {
  (project: Project): void;
}

export interface ProjectFormData {
  name: string;
  description: string;
  type: string;
  businessType?: string;
  githubUrl?: string;
}

export interface ModelFormData {
  name: string;
  displayName: string;
  provider: string;
  modelId: string;
  category: string;
  subcategory?: string;
  capabilities: ModelCapabilities;
  costPerImage: number;
  speedRating: number;
  qualityRating: number;
  maxDimensions: ModelDimensions;
  supportedFormats: string[];
  defaultSettings: ModelDefaultSettings;
  isActive: boolean;
  isEnabled: boolean;
  isFeatured: boolean;
}

export interface ModelCapabilities {
  textToImage: boolean;
  imageToImage: boolean;
  inpainting: boolean;
  upscaling: boolean;
  aspectRatios: string[];
  styles: string[];
  maxResolution: string;
  description: string;
}

export interface ModelDimensions {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export interface ModelDefaultSettings {
  steps?: number;
  cfgScale?: number;
  seed?: number;
  sampler?: string;
  scheduler?: string;
  strength?: number;
  guidance?: number;
  [key: string]: unknown;
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  modelId: string;
  category: string;
  subcategory?: string;
  tags?: string;
  replicateUrl?: string;
  documentationUrl?: string;
  capabilities: ModelCapabilities;
  costPerImage: number;
  speedRating: number;
  qualityRating: number;
  maxDimensions: ModelDimensions;
  supportedFormats: string[];
  defaultSettings: ModelDefaultSettings;
  configurationSchema?: ModelConfigurationSchema;
  examples?: ModelExample[];
  usageCount: number;
  totalCost: number;
  avgGenerationTime?: number;
  isActive: boolean;
  isEnabled: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelConfigurationSchema {
  properties: Record<string, {
    type: string;
    minimum?: number;
    maximum?: number;
    enum?: string[];
    default?: unknown;
    description?: string;
  }>;
  required?: string[];
}

export interface ModelExample {
  prompt: string;
  imageUrl: string;
  settings: ModelDefaultSettings;
  description?: string;
}

// Additional model-related types
export interface ModelUpdateData {
  name?: string;
  displayName?: string;
  costPerImage?: number;
  speedRating?: number;
  qualityRating?: number;
  isActive?: boolean;
  isEnabled?: boolean;
  isFeatured?: boolean;
  [key: string]: unknown;
}

export interface ModelLimitations {
  maxBatchSize: number;
  supportedFeatures: {
    imageToImage: boolean;
    inpainting: boolean;
    outpainting: boolean;
    styleTransfer: boolean;
  };
  dimensionLimits: ModelDimensions;
  costWarnings: {
    expensive: boolean;
    veryExpensive: boolean;
  };
}