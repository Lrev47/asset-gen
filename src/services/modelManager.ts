import { PrismaClient } from '@prisma/client';
import { AIModel, ModelUpdateData } from '@/types/forms';

const prisma = new PrismaClient();

export interface ModelCapabilities {
  photorealistic: number; // 1-5 rating
  artistic: number;
  illustrations: number;
  portraits: number;
  landscapes: number;
  products: number;
  ui_elements: number;
  text_rendering: number;
  batch_generation: boolean;
  image_to_image: boolean;
  inpainting: boolean;
  outpainting: boolean;
  style_transfer: boolean;
}

export interface ModelDimensions {
  min: { width: number; height: number };
  max: { width: number; height: number };
  recommended: { width: number; height: number }[];
  aspectRatios: string[];
}

export interface ModelSettings {
  steps?: { min: number; max: number; default: number };
  cfgScale?: { min: number; max: number; default: number };
  seed?: boolean;
  sampler?: string[];
  scheduler?: string[];
  customParameters?: Record<string, unknown>;
}

export class ModelManager {
  private static instance: ModelManager;
  private models: Map<string, AIModel> = new Map();

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  async initialize() {
    await this.seedDefaultModels();
    await this.loadModels();
  }

  async seedDefaultModels() {
    const defaultModels = [
      {
        name: 'dall-e-3',
        displayName: 'DALL-E 3',
        provider: 'openai',
        modelId: 'dall-e-3',
        category: 'text-to-image',
        subcategory: 'high-quality',
        replicateUrl: null,
        documentationUrl: 'https://platform.openai.com/docs/guides/images',
        tags: '["creative", "text-rendering", "artistic", "high-quality"]',
        capabilities: {
          photorealistic: 4,
          artistic: 5,
          illustrations: 5,
          portraits: 4,
          landscapes: 4,
          products: 3,
          ui_elements: 2,
          text_rendering: 5,
          batch_generation: false,
          image_to_image: false,
          inpainting: false,
          outpainting: false,
          style_transfer: false
        },
        costPerImage: 0.04,
        speedRating: 3,
        qualityRating: 5,
        maxDimensions: {
          min: { width: 1024, height: 1024 },
          max: { width: 1792, height: 1024 },
          recommended: [
            { width: 1024, height: 1024 },
            { width: 1792, height: 1024 },
            { width: 1024, height: 1792 }
          ],
          aspectRatios: ['1:1', '16:9', '9:16']
        },
        supportedFormats: '["png", "webp"]',
        defaultSettings: {
          quality: 'hd',
          style: 'natural',
          size: '1024x1024'
        }
      },
      {
        name: 'stable-diffusion-xl',
        displayName: 'Stable Diffusion XL',
        provider: 'replicate',
        modelId: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        category: 'text-to-image',
        subcategory: 'versatile',
        replicateUrl: 'https://replicate.com/stability-ai/sdxl',
        documentationUrl: 'https://replicate.com/stability-ai/sdxl',
        tags: '["photorealistic", "versatile", "fast", "batch-capable"]',
        capabilities: {
          photorealistic: 5,
          artistic: 4,
          illustrations: 4,
          portraits: 5,
          landscapes: 5,
          products: 4,
          ui_elements: 3,
          text_rendering: 2,
          batch_generation: true,
          image_to_image: true,
          inpainting: true,
          outpainting: false,
          style_transfer: true
        },
        costPerImage: 0.002,
        speedRating: 4,
        qualityRating: 4,
        maxDimensions: {
          min: { width: 512, height: 512 },
          max: { width: 2048, height: 2048 },
          recommended: [
            { width: 1024, height: 1024 },
            { width: 1536, height: 1024 },
            { width: 1024, height: 1536 },
            { width: 2048, height: 1024 }
          ],
          aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16', '4:3', '3:4']
        },
        supportedFormats: '["png", "jpg", "webp"]',
        defaultSettings: {
          num_inference_steps: 30,
          guidance_scale: 7.5,
          num_outputs: 1,
          scheduler: 'K_EULER'
        }
      },
      {
        name: 'flux-dev',
        displayName: 'Flux Dev',
        provider: 'replicate',
        modelId: 'black-forest-labs/flux-dev',
        category: 'text-to-image',
        subcategory: 'cutting-edge',
        replicateUrl: 'https://replicate.com/black-forest-labs/flux-dev',
        documentationUrl: 'https://replicate.com/black-forest-labs/flux-dev',
        tags: '["state-of-the-art", "high-quality", "artistic", "versatile"]',
        capabilities: {
          photorealistic: 5,
          artistic: 5,
          illustrations: 5,
          portraits: 4,
          landscapes: 4,
          products: 4,
          ui_elements: 4,
          text_rendering: 4,
          batch_generation: true,
          image_to_image: true,
          inpainting: false,
          outpainting: false,
          style_transfer: true
        },
        costPerImage: 0.003,
        speedRating: 3,
        qualityRating: 5,
        maxDimensions: {
          min: { width: 512, height: 512 },
          max: { width: 1440, height: 1440 },
          recommended: [
            { width: 1024, height: 1024 },
            { width: 1152, height: 896 },
            { width: 896, height: 1152 },
            { width: 1344, height: 768 }
          ],
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16']
        },
        supportedFormats: '["png", "jpg", "webp"]',
        defaultSettings: {
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_outputs: 1
        }
      },
      {
        name: 'realvis-xl',
        displayName: 'RealVis XL V4.0',
        provider: 'replicate',
        modelId: 'adirik/realvisxl-v4.0:7fcb4908bce91b2b45ae62c9084fc1fa5c27e4b3c3cdde21f8c869d061cf85a4',
        category: 'text-to-image',
        subcategory: 'photorealistic',
        replicateUrl: 'https://replicate.com/adirik/realvisxl-v4.0',
        documentationUrl: 'https://replicate.com/adirik/realvisxl-v4.0',
        tags: '["photorealistic", "portraits", "products", "commercial"]',
        capabilities: {
          photorealistic: 5,
          artistic: 3,
          illustrations: 2,
          portraits: 5,
          landscapes: 5,
          products: 5,
          ui_elements: 2,
          text_rendering: 1,
          batch_generation: true,
          image_to_image: true,
          inpainting: true,
          outpainting: false,
          style_transfer: false
        },
        costPerImage: 0.0025,
        speedRating: 4,
        qualityRating: 5,
        maxDimensions: {
          min: { width: 512, height: 512 },
          max: { width: 1536, height: 1536 },
          recommended: [
            { width: 1024, height: 1024 },
            { width: 1216, height: 832 },
            { width: 832, height: 1216 },
            { width: 1344, height: 768 }
          ],
          aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16', '4:3']
        },
        supportedFormats: '["png", "jpg"]',
        defaultSettings: {
          num_inference_steps: 25,
          guidance_scale: 7,
          num_outputs: 1,
          scheduler: 'DPMSolverMultistep'
        }
      },
      {
        name: 'instruct-pix2pix',
        displayName: 'InstructPix2Pix',
        provider: 'replicate',
        modelId: 'timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493a5d61ee27491ab2a60437c13c588468b9810ec23f',
        category: 'image-to-image',
        subcategory: 'instruction-based',
        replicateUrl: 'https://replicate.com/timothybrooks/instruct-pix2pix',
        documentationUrl: 'https://replicate.com/timothybrooks/instruct-pix2pix',
        tags: '["image-editing", "instruction-based", "transformation", "style-transfer"]',
        capabilities: {
          photorealistic: 4,
          artistic: 3,
          illustrations: 3,
          portraits: 4,
          landscapes: 4,
          products: 4,
          ui_elements: 3,
          text_rendering: 1,
          batch_generation: false,
          image_to_image: true,
          inpainting: false,
          outpainting: false,
          style_transfer: true
        },
        costPerImage: 0.004,
        speedRating: 3,
        qualityRating: 4,
        maxDimensions: {
          min: { width: 512, height: 512 },
          max: { width: 1024, height: 1024 },
          recommended: [
            { width: 512, height: 512 },
            { width: 768, height: 768 },
            { width: 1024, height: 1024 }
          ],
          aspectRatios: ['1:1']
        },
        supportedFormats: '["png", "jpg"]',
        defaultSettings: {
          num_inference_steps: 20,
          guidance_scale: 7.5,
          image_guidance_scale: 1.5
        }
      }
    ];

    for (const modelData of defaultModels) {
      await prisma.aIModel.upsert({
        where: { name: modelData.name },
        update: modelData,
        create: modelData
      });
    }
  }

  async loadModels() {
    const models = await prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { qualityRating: 'desc' }
    });
    
    for (const model of models) {
      this.models.set(model.id, model as unknown as AIModel);
    }
  }

  async getModel(modelId: string) {
    return this.models.get(modelId) || await prisma.aIModel.findUnique({
      where: { id: modelId }
    });
  }

  async getAllModels() {
    return await prisma.aIModel.findMany({
      orderBy: [
        { qualityRating: 'desc' },
        { speedRating: 'desc' }
      ]
    });
  }

  async getModelsByCategory(category: string) {
    const models = await prisma.aIModel.findMany({
      orderBy: [
        { qualityRating: 'desc' },
        { speedRating: 'desc' }
      ]
    });
    
    // Filter by category if the field exists
    return models.filter((model) => 
      !model.category || model.category === category || category === 'all'
    );
  }

  async getModelCategories() {
    const models = await prisma.aIModel.findMany();
    const categories = [...new Set(models.map((model) => model.category).filter(Boolean))];
    return categories;
  }

  async getFeaturedModels() {
    const models = await prisma.aIModel.findMany({
      orderBy: { qualityRating: 'desc' }
    });
    
    return models.filter((model) => model.isFeatured);
  }

  async searchModels(query: string) {
    const models = await prisma.aIModel.findMany({
      orderBy: { qualityRating: 'desc' }
    });
    
    return models.filter((model) => 
      model.name?.toLowerCase().includes(query.toLowerCase()) ||
      model.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      model.tags?.toLowerCase().includes(query.toLowerCase())
    );
  }

  async updateModelUsage(modelId: string, cost: number) {
    try {
      await prisma.aIModel.update({
        where: { id: modelId },
        data: {
          usageCount: { increment: 1 },
          totalCost: { increment: cost }
        }
      });
    } catch (error) {
      console.warn('Could not update model usage stats:', error);
    }
  }

  async getModelsByCapability(capability: keyof ModelCapabilities, minRating: number = 3) {
    const allModels = await this.getAllModels();
    return allModels.filter(model => {
      const capabilities = model.capabilities as unknown as ModelCapabilities;
      const value = capabilities[capability];
      return typeof value === 'number' ? value >= minRating : Boolean(value);
    });
  }

  async recommendModelForAssetType(assetTypeName: string) {
    const assetType = await prisma.assetType.findUnique({
      where: { name: assetTypeName }
    });

    if (!assetType) return null;

    const preferences = JSON.parse(assetType.modelPreferences || '[]');
    if (preferences.length > 0) {
      return await this.getModel(preferences[0]);
    }

    // Fallback to capability-based recommendation
    if (assetTypeName.includes('portrait') || assetTypeName.includes('profile')) {
      const models = await this.getModelsByCapability('portraits', 4);
      return models[0];
    }
    
    if (assetTypeName.includes('hero') || assetTypeName.includes('banner')) {
      const models = await this.getModelsByCapability('artistic', 4);
      return models[0];
    }

    if (assetTypeName.includes('product')) {
      const models = await this.getModelsByCapability('products', 4);
      return models[0];
    }

    // Default to highest quality general model
    const models = await this.getAllModels();
    return models[0];
  }

  async calculateCost(modelId: string, quantity: number) {
    const model = await this.getModel(modelId);
    return model ? model.costPerImage * quantity : 0;
  }

  async updateModel(modelId: string, updates: ModelUpdateData) {
    const updated = await prisma.aIModel.update({
      where: { id: modelId },
      data: updates
    });
    
    this.models.set(modelId, updated as unknown as AIModel);
    return updated;
  }

  async addCustomModel(modelData: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await prisma.aIModel.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: modelData as any
    });
    
    this.models.set(created.id, created as unknown as AIModel);
    return created;
  }

  async deactivateModel(modelId: string) {
    await this.updateModel(modelId, { isActive: false });
    this.models.delete(modelId);
  }

  getModelLimitations(modelId: string) {
    const model = this.models.get(modelId);
    if (!model) return null;

    const capabilities = model.capabilities as unknown as ModelCapabilities;
    const dimensions = model.maxDimensions as unknown as ModelDimensions;

    return {
      maxBatchSize: capabilities.batch_generation ? 4 : 1,
      supportedFeatures: {
        imageToImage: capabilities.image_to_image,
        inpainting: capabilities.inpainting,
        outpainting: capabilities.outpainting,
        styleTransfer: capabilities.style_transfer
      },
      dimensionLimits: dimensions,
      costWarnings: {
        expensive: model.costPerImage > 0.01,
        veryExpensive: model.costPerImage > 0.03
      }
    };
  }
}

export default ModelManager;