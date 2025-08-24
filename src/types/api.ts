import { ProjectAnalysis } from './project';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GeneratedImageData {
  id?: string;
  url: string;
  filename: string;
  dimensions: {
    width: number;
    height: number;
  };
  metadata: ImageMetadata;
  cost: number;
  generationTime: number;
  rating?: number;
  selected?: boolean;
  notes?: string;
}

export interface ImageMetadata {
  model: string;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  quality?: string;
  seed?: number;
  steps?: number;
  cfgScale?: number;
  timestamp: Date;
  [key: string]: unknown;
}

export interface BatchProcessingResult {
  sessionId: string;
  totalImages: number;
  successfulImages: number;
  failedImages: number;
  totalCost: number;
  processingTime: number;
  images: GeneratedImageData[];
  errors: string[];
}

export interface RecommendationRequest {
  projectId: string;
  projectDescription: string;
  websiteType: string;
  analysisMode?: 'basic' | 'detailed';
}

export interface RecommendationResponse {
  projectId: string;
  analysis: ProjectAnalysis;
  generatedFields: ProjectFieldRecommendation[];
  estimatedCost: number;
  estimatedTime: string;
}

export interface ProjectFieldRecommendation {
  name: string;
  description: string;
  assetType: string;
  requirements: {
    quantity: number;
    priority: 'high' | 'medium' | 'low';
    dimensions?: {
      width: number;
      height: number;
    };
    variations?: string[];
  };
}

// Additional types for services and utilities
export interface FieldRequirements {
  quantity: number;
  variations: number;
  priority: 'high' | 'medium' | 'low';
}

export interface PromptGenerationAnalysis {
  improvements: string[];
  tokenReduction?: number;
  qualityScore?: number;
}

export interface OptimizationResult {
  originalContent: string;
  optimizedContent: string;
  improvements: string[];
  suggestedTags: string[];
  tokenReduction: number;
  qualityScore: number;
}

export interface GeneratedPromptSuggestion {
  content: string;
  negativePrompt: string;
  suggestedModelId: string | null;
  suggestedTags: string[];
  estimatedTokens: number;
  suggestions: {
    improvements: string[];
    alternatives: string[];
  };
}