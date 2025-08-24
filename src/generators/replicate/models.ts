import Replicate from 'replicate';
import { CombinedImageRequirement } from '@/analyzers/imageRequirements';
// import { EnhancedPrompt } from '@/generators/openai/promptEnhancer';

export interface ReplicateModel {
  id: string;
  name: string;
  description: string;
  costPer1000: number; // Cost per 1000 images
  maxBatchSize: number;
  supportedSizes: string[];
  supportsImageToImage: boolean;
  bestFor: string[];
}

export interface ReplicateGenerationRequest {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  numOutputs?: number;
  scheduler?: string;
  stylePreset?: string;
  // Image-to-image specific
  image?: string; // Base64 or URL
  imagePrompt?: string;
  strength?: number; // 0-1, how much to change the input image
}

export interface ReplicateGenerationResult {
  success: boolean;
  images: ReplicateImage[];
  error?: string;
  cost: number;
  processingTime: number;
  modelUsed: string;
}

export interface ReplicateImage {
  url: string;
  filename: string;
  dimensions: { width: number; height: number };
  seed?: number;
  metadata: {
    model: string;
    prompt: string;
    negativePrompt?: string;
    parameters: Record<string, unknown>;
    timestamp: Date;
  };
}

export class ReplicateModelManager {
  private replicate: Replicate;
  private rateLimitDelay = 500; // 500ms between requests
  private maxRetries = 3;

  // Available models with their configurations
  private models: Record<string, ReplicateModel> = {
    'sdxl': {
      id: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      name: 'Stable Diffusion XL',
      description: 'High-quality general purpose image generation',
      costPer1000: 2.0, // $0.002 per image
      maxBatchSize: 4,
      supportedSizes: ['1024x1024', '1152x896', '896x1152', '1216x832', '832x1216'],
      supportsImageToImage: true,
      bestFor: ['general', 'professional', 'marketing', 'products']
    },
    'flux-dev': {
      id: 'black-forest-labs/flux-dev:7b6fc88a7d7e4d95b3e6b3c95a1e87e80c6c47c2a9b9a9f9c9a9e9b9c9d9e9f',
      name: 'Flux Dev',
      description: 'High-quality realistic image generation',
      costPer1000: 3.0,
      maxBatchSize: 1,
      supportedSizes: ['1024x1024', '1024x768', '768x1024', '1024x576', '576x1024'],
      supportsImageToImage: true,
      bestFor: ['photorealistic', 'portraits', 'professional', 'high-quality']
    },
    'realvis-xl': {
      id: 'SG161222/RealVisXL_V4.0:a7f19cd7e68b22afc4a1e5c2b1edf4b1d76a2b78c3e8c8c8c8c8c8c8c8c8c8c8',
      name: 'RealVis XL',
      description: 'Photorealistic image generation',
      costPer1000: 2.5,
      maxBatchSize: 4,
      supportedSizes: ['1024x1024', '1152x896', '896x1152', '1216x832', '832x1216'],
      supportsImageToImage: true,
      bestFor: ['photorealistic', 'people', 'locations', 'vehicles']
    },
    'instruct-pix2pix': {
      id: 'timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493a5d61ee27491ab2a60437c13c588468b9810ec23f',
      name: 'InstructPix2Pix',
      description: 'Image-to-image transformation based on instructions',
      costPer1000: 1.5,
      maxBatchSize: 1,
      supportedSizes: ['512x512', '768x768', '1024x1024'],
      supportsImageToImage: true,
      bestFor: ['before-after', 'transformations', 'modifications', 'style-transfer']
    },
    'sdxl-controlnet': {
      id: 'stability-ai/controlnet:9ec58480e3ab3ea9c1e8e6d6b1b5b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
      name: 'SDXL ControlNet',
      description: 'Controlled image generation with pose/edge guidance',
      costPer1000: 3.5,
      maxBatchSize: 1,
      supportedSizes: ['1024x1024', '1152x896', '896x1152'],
      supportsImageToImage: true,
      bestFor: ['controlled-generation', 'pose-matching', 'before-after', 'specific-composition']
    }
  };

  constructor(apiKey?: string) {
    if (!apiKey && !process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token is required');
    }

    this.replicate = new Replicate({
      auth: apiKey || process.env.REPLICATE_API_TOKEN,
    });
  }

  async generateImages(requests: ReplicateGenerationRequest[]): Promise<ReplicateGenerationResult[]> {
    const results: ReplicateGenerationResult[] = [];

    for (const request of requests) {
      // Rate limiting
      if (results.length > 0) {
        await this.delay(this.rateLimitDelay);
      }

      try {
        const result = await this.generateSingle(request);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          images: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          cost: 0,
          processingTime: 0,
          modelUsed: request.modelId
        });
      }
    }

    return results;
  }

  private async generateSingle(request: ReplicateGenerationRequest): Promise<ReplicateGenerationResult> {
    const startTime = Date.now();
    const model = this.models[request.modelId];

    if (!model) {
      throw new Error(`Unknown model: ${request.modelId}`);
    }

    const input = this.buildModelInput(request);
    
    try {
      const output = await this.retryRequest(async () => {
        return await this.replicate.run(model.id as `${string}/${string}`, { input });
      });

      const images = this.processOutput(output, request, model);
      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(model, images.length);

      return {
        success: true,
        images,
        cost,
        processingTime,
        modelUsed: model.name
      };

    } catch (error) {
      throw new Error(`Model execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildModelInput(request: ReplicateGenerationRequest): Record<string, unknown> {
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      width: request.width,
      height: request.height,
      num_outputs: request.numOutputs || 1,
    };

    // Add negative prompt if provided
    if (request.negativePrompt) {
      input.negative_prompt = request.negativePrompt;
    }

    // Model-specific configurations
    switch (request.modelId) {
      case 'sdxl':
        input.num_inference_steps = request.numInferenceSteps || 50;
        input.guidance_scale = request.guidanceScale || 7.5;
        input.scheduler = request.scheduler || 'K_EULER';
        if (request.seed) input.seed = request.seed;
        if (request.stylePreset) input.style_preset = request.stylePreset;
        break;

      case 'flux-dev':
        input.num_inference_steps = request.numInferenceSteps || 28;
        input.guidance_scale = request.guidanceScale || 3.5;
        if (request.seed) input.seed = request.seed;
        break;

      case 'realvis-xl':
        input.num_inference_steps = request.numInferenceSteps || 30;
        input.guidance_scale = request.guidanceScale || 7;
        input.scheduler = request.scheduler || 'DPM++ 2M Karras';
        if (request.seed) input.seed = request.seed;
        break;

      case 'instruct-pix2pix':
        if (!request.image) {
          throw new Error('Image input required for InstructPix2Pix');
        }
        input.image = request.image;
        input.prompt = request.imagePrompt || request.prompt;
        input.num_inference_steps = request.numInferenceSteps || 20;
        input.guidance_scale = request.guidanceScale || 7.5;
        input.image_guidance_scale = 1.5;
        break;

      case 'sdxl-controlnet':
        if (request.image) {
          input.image = request.image;
          input.strength = request.strength || 0.8;
        }
        input.num_inference_steps = request.numInferenceSteps || 50;
        input.guidance_scale = request.guidanceScale || 7.5;
        input.controlnet_conditioning_scale = 1.0;
        break;
    }

    return input;
  }

  private processOutput(
    output: unknown, 
    request: ReplicateGenerationRequest, 
    model: ReplicateModel
  ): ReplicateImage[] {
    const images: ReplicateImage[] = [];
    const urls = Array.isArray(output) ? output : [output];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (typeof url === 'string' && url.startsWith('http')) {
        const filename = this.generateFilename(request, model, i + 1);
        
        images.push({
          url,
          filename,
          dimensions: { width: request.width, height: request.height },
          seed: request.seed,
          metadata: {
            model: model.name,
            prompt: request.prompt,
            negativePrompt: request.negativePrompt,
            parameters: {
              width: request.width,
              height: request.height,
              numInferenceSteps: request.numInferenceSteps,
              guidanceScale: request.guidanceScale,
              scheduler: request.scheduler,
              seed: request.seed
            },
            timestamp: new Date()
          }
        });
      }
    }

    return images;
  }

  private generateFilename(
    request: ReplicateGenerationRequest, 
    model: ReplicateModel, 
    index: number
  ): string {
    const modelName = request.modelId.replace('-', '_');
    const timestamp = Date.now();
    const dimensions = `${request.width}x${request.height}`;
    
    return `${modelName}_${String(index).padStart(2, '0')}_${dimensions}_${timestamp}.png`;
  }

  private calculateCost(model: ReplicateModel, imageCount: number): number {
    return (model.costPer1000 / 1000) * imageCount;
  }

  private async retryRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 60000); // Exponential backoff, max 60s
          console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await this.delay(delay);
          continue;
        }
        
        // For other errors, don't retry immediately
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError;
  }

  private isRateLimitError(error: unknown): boolean {
    const err = error as { status?: number; message?: string };
    return err?.status === 429 || 
           err?.message?.toLowerCase().includes('rate limit') ||
           err?.message?.toLowerCase().includes('too many requests') || false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for selecting the best model
  static selectBestModel(
    requirement: CombinedImageRequirement, 
    hasSourceImage: boolean = false
  ): string {
    // If we have a source image and need transformation, use image-to-image models
    if (hasSourceImage && requirement.category === 'before-after') {
      return 'instruct-pix2pix';
    }

    // For high-quality photorealistic needs
    if (requirement.priority === 'high' && requirement.style.includes('photorealistic')) {
      return 'flux-dev';
    }

    // For professional portraits and team photos
    if (requirement.category === 'team' || requirement.subject.includes('portrait')) {
      return 'realvis-xl';
    }

    // For vehicles and before/after scenarios
    if (requirement.category === 'before-after' || requirement.subject.includes('vehicle')) {
      return 'realvis-xl';
    }

    // Default to SDXL for general purpose
    return 'sdxl';
  }

  static getBestDimensions(
    requirement: CombinedImageRequirement, 
    modelId: string
  ): { width: number; height: number } {
    const model = new ReplicateModelManager().models[modelId];
    if (!model) return requirement.dimensions;

    const targetRatio = requirement.dimensions.width / requirement.dimensions.height;
    
    // Find the supported size with the closest aspect ratio
    let bestSize = model.supportedSizes[0];
    let bestRatioDiff = Infinity;

    for (const size of model.supportedSizes) {
      const [w, h] = size.split('x').map(Number);
      const ratio = w / h;
      const diff = Math.abs(ratio - targetRatio);
      
      if (diff < bestRatioDiff) {
        bestRatioDiff = diff;
        bestSize = size;
      }
    }

    const [width, height] = bestSize.split('x').map(Number);
    return { width, height };
  }

  // Method to get model information
  getModelInfo(modelId: string): ReplicateModel | null {
    return this.models[modelId] || null;
  }

  // Method to list all available models
  getAvailableModels(): ReplicateModel[] {
    return Object.values(this.models);
  }

  // Method to estimate cost for multiple requirements
  estimateCost(requirements: CombinedImageRequirement[]): number {
    let totalCost = 0;

    for (const requirement of requirements) {
      const modelId = ReplicateModelManager.selectBestModel(requirement);
      const model = this.models[modelId];
      if (model) {
        totalCost += this.calculateCost(model, requirement.quantity);
      }
    }

    return Math.round(totalCost * 100) / 100;
  }

  // Method to validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to access account information
      await this.replicate.accounts.current();
      return true;
    } catch (_error) {
      return false;
    }
  }
}

export default ReplicateModelManager;