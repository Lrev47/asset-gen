import { Project, ProjectAnalysis } from './project';
import { GeneratedImageData } from './api';

export interface ProjectDetailViewProps {
  project: Project;
  analysis: ProjectAnalysis;
  generatedImages: GeneratedImageData[];
}

export interface ProjectInputFormProps {
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ProjectFormData>;
  isLoading?: boolean;
}

export interface ProjectFormData {
  name: string;
  description: string;
  type: string;
  businessType?: string;
  githubUrl?: string;
}

export interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export interface AppSettings {
  apiKeys: {
    openai?: string;
    replicate?: string;
  };
  preferences: {
    defaultModel?: string;
    imageQuality: 'standard' | 'hd';
    outputFormat: 'png' | 'jpg' | 'webp';
    autoSave: boolean;
    darkMode: boolean;
  };
  generation: {
    maxConcurrentJobs: number;
    retryAttempts: number;
    timeout: number;
  };
  storage: {
    maxStorageSize: number;
    autoCleanup: boolean;
    cleanupAfterDays: number;
  };
}

export interface BatchProcessorProps {
  projectId: string;
  prompts: PromptData[];
  onComplete: (results: BatchResults) => void;
  onProgress: (progress: BatchProgress) => void;
}

export interface PromptData {
  id: string;
  content: string;
  negativePrompt?: string;
  modelId: string;
  settings: Record<string, unknown>;
}

export interface BatchResults {
  totalProcessed: number;
  successful: number;
  failed: number;
  images: GeneratedImageData[];
  errors: string[];
  totalCost: number;
  duration: number;
}

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  currentPrompt: string;
  estimatedTimeRemaining: number;
}

export interface ImagePreviewProps {
  images: GeneratedImageData[];
  selectedImages: string[];
  onImageSelect: (imageId: string) => void;
  onImageRate: (imageId: string, rating: number) => void;
  onImageNote: (imageId: string, note: string) => void;
}

export interface IconMapType {
  [key: string]: React.ComponentType<{ className?: string }>;
}

// Enhanced form and view types
export interface ProjectInputFormData {
  name: string;
  businessType: string;
  githubUrl?: string;
  prdContent: string;
  schemaContent: string;
}

export interface ProjectViewProps {
  project: Project;
  analysis: ProjectAnalysis | null;
  recommendations: ProjectAnalysis | null;
  onGenerateImages: () => void;
}

export interface GenerationOptions {
  quantity: number;
  style: 'photorealistic' | 'professional' | 'artistic' | 'illustration';
  mood: 'bright' | 'warm' | 'cool' | 'dramatic' | 'soft';
  useOpenAI: boolean;
  useReplicate: boolean;
  generateBeforeAfter: boolean;
  outputFormat: 'web-optimized' | 'high-quality' | 'maximum-compression';
  outputSizes: 'web-standard' | 'social-media' | 'print-ready';
}

export interface RecommendationProps {
  title: string;
  description: string;
  composition: string;
  lighting: string;
  mood: string;
  technicalSpecs: {
    dimensions: { width: number; height: number };
    aspectRatio: string;
    preferredFormat: string;
    estimatedCost: number;
  };
  examples: string[];
  priority: 'high' | 'medium' | 'low';
  quantity: number;
  reasoning: string;
}