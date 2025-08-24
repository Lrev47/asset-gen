export interface FieldRequirements {
  quantity: number;
  priority: 'high' | 'medium' | 'low';
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
  reasoning: string;
  colorPalette?: string[];
}

export interface FieldStats {
  promptsGenerated: number;
  imagesGenerated: number;
  targetQuantity: number;
  completionPercentage: number;
  totalEstimatedCost?: number;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface ProjectField {
  id: string;
  projectId: string;
  name: string;
  description: string;
  assetTypeId: string;
  requirements: FieldRequirements;
  isImageToImage: boolean;
  sourceFieldId?: string | null;
  createdAt: string;
  updatedAt: string;
  assetType?: {
    id: string;
    name: string;
    displayName: string;
    category: string;
    description: string;
  };
  prompts?: Array<{
    id: string;
    version: number;
    name: string;
    content: string;
    negativePrompt?: string | null;
    modelId: string;
    status: string;
    model?: {
      id: string;
      name: string;
      displayName: string;
      provider: string;
      costPerImage: number;
    };
    images?: Array<{
      id: string;
      originalUrl: string;
      localPath?: string | null;
      rating?: number | null;
      isSelected: boolean;
      createdAt: string;
    }>;
    tags?: Array<{
      tag: {
        id: string;
        name: string;
        displayName: string;
        category: string;
      };
    }>;
  }>;
  stats?: FieldStats;
}

export interface ProjectFieldWithStats extends ProjectField {
  stats: FieldStats;
}