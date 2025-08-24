import OpenAI from 'openai';
import { CombinedImageRequirement } from '@/analyzers/imageRequirements';

export interface DalleGenerationRequest {
  requirement: CombinedImageRequirement;
  enhancedPrompt: string;
  quantity: number;
  quality: 'standard' | 'hd';
  style: 'natural' | 'vivid';
  size: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface DalleGenerationResult {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  cost: number;
  processingTime: number;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
  filename: string;
  dimensions: { width: number; height: number };
  metadata: {
    model: string;
    prompt: string;
    style: string;
    quality: string;
    timestamp: Date;
  };
}

export class DalleGenerator {
  private openai: OpenAI;
  private rateLimitDelay = 1000; // 1 second between requests
  private maxRetries = 3;

  // DALL-E 3 pricing (as of 2024)
  private readonly pricing = {
    'standard-1024x1024': 0.040,
    'standard-1792x1024': 0.080,
    'standard-1024x1792': 0.080,
    'hd-1024x1024': 0.080,
    'hd-1792x1024': 0.120,
    'hd-1024x1792': 0.120,
  };

  constructor(apiKey?: string) {
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateImages(requests: DalleGenerationRequest[]): Promise<DalleGenerationResult[]> {
    const results: DalleGenerationResult[] = [];

    for (const request of requests) {
      // Rate limiting
      if (results.length > 0) {
        await this.delay(this.rateLimitDelay);
      }

      try {
        const result = await this.generateSingleBatch(request);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          images: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          cost: 0,
          processingTime: 0
        });
      }
    }

    return results;
  }

  private async generateSingleBatch(request: DalleGenerationRequest): Promise<DalleGenerationResult> {
    const startTime = Date.now();
    const images: GeneratedImage[] = [];
    let totalCost = 0;

    // DALL-E 3 can only generate 1 image per request
    for (let i = 0; i < request.quantity; i++) {
      try {
        const response = await this.retryRequest(async () => {
          return await this.openai.images.generate({
            model: 'dall-e-3',
            prompt: request.enhancedPrompt,
            n: 1,
            quality: request.quality,
            response_format: 'url',
            size: request.size,
            style: request.style,
          });
        });

        if (response.data && response.data.length > 0) {
          const imageData = response.data[0];
          
          const filename = this.generateFilename(request.requirement, i + 1, request.size);
          const dimensions = this.parseDimensions(request.size);
          
          images.push({
            url: imageData.url!,
            revisedPrompt: imageData.revised_prompt,
            filename,
            dimensions,
            metadata: {
              model: 'dall-e-3',
              prompt: request.enhancedPrompt,
              style: request.style,
              quality: request.quality,
              timestamp: new Date(),
            }
          });

          totalCost += this.calculateCost(request.quality, request.size);
        }

        // Small delay between individual requests in a batch
        if (i < request.quantity - 1) {
          await this.delay(500);
        }

      } catch (error) {
        console.error(`Error generating image ${i + 1}/${request.quantity}:`, error);
        // Continue with next image rather than failing entire batch
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: images.length > 0,
      images,
      cost: totalCost,
      processingTime,
      error: images.length === 0 ? 'Failed to generate any images' : undefined
    };
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
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
          console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await this.delay(delay);
          continue;
        }
        
        // For other errors, don't retry
        throw error;
      }
    }

    throw lastError;
  }

  private isRateLimitError(error: unknown): boolean {
    const err = error as Record<string, unknown>; // Cast needed for OpenAI error types
    return err?.status === 429 || 
           err?.code === 'rate_limit_exceeded' ||
           (typeof err?.message === 'string' && err.message.toLowerCase().includes('rate limit'));
  }

  private generateFilename(requirement: CombinedImageRequirement, index: number, size: string): string {
    const category = requirement.category.replace('-', '_');
    const timestamp = Date.now();
    const dimensions = size.replace('x', '_');
    
    return `dalle_${category}_${String(index).padStart(2, '0')}_${dimensions}_${timestamp}.png`;
  }

  private parseDimensions(size: string): { width: number; height: number } {
    const [width, height] = size.split('x').map(Number);
    return { width, height };
  }

  private calculateCost(quality: string, size: string): number {
    const key = `${quality}-${size}` as keyof typeof this.pricing;
    return this.pricing[key] || 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to determine best size for requirement
  static getBestSize(requirement: CombinedImageRequirement): DalleGenerationRequest['size'] {
    const { width, height } = requirement.dimensions;
    const aspectRatio = width / height;

    // DALL-E 3 supports: 1024×1024, 1792×1024, or 1024×1792
    if (Math.abs(aspectRatio - 1) < 0.2) {
      return '1024x1024'; // Square
    } else if (aspectRatio > 1.2) {
      return '1792x1024'; // Landscape
    } else {
      return '1024x1792'; // Portrait
    }
  }

  // Utility method to determine quality based on requirement
  static getBestQuality(requirement: CombinedImageRequirement): DalleGenerationRequest['quality'] {
    return requirement.priority === 'high' || requirement.category === 'hero' ? 'hd' : 'standard';
  }

  // Utility method to determine style based on requirement
  static getBestStyle(requirement: CombinedImageRequirement): DalleGenerationRequest['style'] {
    const styleContext = requirement.style.toLowerCase();
    
    if (styleContext.includes('vibrant') || styleContext.includes('dramatic') || 
        styleContext.includes('bold') || requirement.category === 'hero') {
      return 'vivid';
    }
    
    return 'natural';
  }

  // Method to estimate cost for a batch of requirements
  static estimateCost(requirements: CombinedImageRequirement[]): number {
    const generator = new DalleGenerator('dummy-key'); // Just for cost calculation
    let totalCost = 0;

    for (const requirement of requirements) {
      const size = DalleGenerator.getBestSize(requirement);
      const quality = DalleGenerator.getBestQuality(requirement);
      const cost = generator.calculateCost(quality, size);
      totalCost += cost * requirement.quantity;
    }

    return Math.round(totalCost * 100) / 100;
  }

  // Method to validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch (_error) {
      return false;
    }
  }

  // Method to get current usage/limits (if available)
  async getUsageInfo(): Promise<{ requests: number; limit: number } | null> {
    try {
      // OpenAI doesn't provide usage info via API currently
      // This is a placeholder for future implementation
      return null;
    } catch (_error) {
      return null;
    }
  }
}

export default DalleGenerator;