import ReplicateModelManager, { ReplicateGenerationRequest, ReplicateGenerationResult } from './models';
import { CombinedImageRequirement } from '@/analyzers/imageRequirements';
import { BusinessContext } from '@/analyzers/prdAnalyzer';

export interface ImageToImageRequest {
  sourceImage: string; // URL or base64
  targetPrompt: string;
  strength: number; // 0-1, how much to change the source
  requirement: CombinedImageRequirement;
  businessContext: BusinessContext;
  transformationType: 'enhancement' | 'style-transfer' | 'before-after' | 'modification';
}

export interface BeforeAfterPairRequest {
  businessType: string;
  serviceType: string;
  requirement: CombinedImageRequirement;
  beforePrompt: string;
  afterPrompt: string;
  transformationInstructions: string;
  quantity: number; // Number of pairs to generate
}

export interface BeforeAfterResult {
  success: boolean;
  pairs: BeforeAfterPair[];
  totalCost: number;
  error?: string;
}

export interface BeforeAfterPair {
  before: ReplicateGenerationResult;
  after: ReplicateGenerationResult;
  transformationInstructions: string;
  coherenceScore: number; // 0-1, how well the pair matches
}

export class ImageToImageGenerator {
  private modelManager: ReplicateModelManager;

  constructor(apiKey?: string) {
    this.modelManager = new ReplicateModelManager(apiKey);
  }

  async transformImage(request: ImageToImageRequest): Promise<ReplicateGenerationResult> {
    const modelId = this.selectTransformationModel(request.transformationType);
    const dimensions = ReplicateModelManager.getBestDimensions(request.requirement, modelId);

    const replicateRequest: ReplicateGenerationRequest = {
      modelId,
      prompt: request.targetPrompt,
      image: request.sourceImage,
      width: dimensions.width,
      height: dimensions.height,
      strength: request.strength,
      numOutputs: 1,
      numInferenceSteps: this.getOptimalSteps(request.transformationType),
      guidanceScale: this.getOptimalGuidance(request.transformationType)
    };

    const results = await this.modelManager.generateImages([replicateRequest]);
    return results[0];
  }

  async generateBeforeAfterPairs(request: BeforeAfterPairRequest): Promise<BeforeAfterResult> {
    const pairs: BeforeAfterPair[] = [];
    let totalCost = 0;

    try {
      for (let i = 0; i < request.quantity; i++) {
        // Generate "before" image
        const beforeResult = await this.generateBeforeImage(request, i);
        if (!beforeResult.success) {
          continue;
        }

        // Use the "before" image to generate corresponding "after" image
        const afterResult = await this.generateAfterImage(
          request,
          beforeResult.images[0].url
        );

        if (afterResult.success) {
          const coherenceScore = this.calculateCoherenceScore(beforeResult, afterResult);
          
          pairs.push({
            before: beforeResult,
            after: afterResult,
            transformationInstructions: request.transformationInstructions,
            coherenceScore
          });
        }

        totalCost += beforeResult.cost + afterResult.cost;
        
        // Small delay between pairs
        await this.delay(1000);
      }

      return {
        success: pairs.length > 0,
        pairs,
        totalCost,
        error: pairs.length === 0 ? 'Failed to generate any valid pairs' : undefined
      };

    } catch (error) {
      return {
        success: false,
        pairs: [],
        totalCost,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateBeforeImage(
    request: BeforeAfterPairRequest,
    index: number
  ): Promise<ReplicateGenerationResult> {
    const modelId = 'realvis-xl'; // Use photorealistic model for before images
    const dimensions = ReplicateModelManager.getBestDimensions(request.requirement, modelId);
    
    // Create seed for consistency
    const seed = this.generateConsistentSeed(request.businessType, index);

    const beforeRequest: ReplicateGenerationRequest = {
      modelId,
      prompt: this.enhanceBeforePrompt(request.beforePrompt, request.businessType),
      width: dimensions.width,
      height: dimensions.height,
      numOutputs: 1,
      seed,
      numInferenceSteps: 30,
      guidanceScale: 7,
      negativePrompt: this.getBeforeNegativePrompt(request.businessType)
    };

    const results = await this.modelManager.generateImages([beforeRequest]);
    return results[0];
  }

  private async generateAfterImage(
    request: BeforeAfterPairRequest,
    beforeImageUrl: string
  ): Promise<ReplicateGenerationResult> {
    const modelId = 'instruct-pix2pix'; // Use instruction-based transformation
    const dimensions = ReplicateModelManager.getBestDimensions(request.requirement, modelId);

    const afterRequest: ReplicateGenerationRequest = {
      modelId,
      prompt: request.transformationInstructions,
      image: beforeImageUrl,
      imagePrompt: this.enhanceAfterPrompt(request.afterPrompt, request.businessType),
      width: dimensions.width,
      height: dimensions.height,
      numOutputs: 1,
      strength: 0.75, // Moderate transformation
      numInferenceSteps: 20,
      guidanceScale: 7.5
    };

    const results = await this.modelManager.generateImages([afterRequest]);
    return results[0];
  }

  private selectTransformationModel(transformationType: string): string {
    switch (transformationType) {
      case 'before-after':
        return 'instruct-pix2pix';
      case 'enhancement':
        return 'sdxl';
      case 'style-transfer':
        return 'sdxl-controlnet';
      case 'modification':
        return 'instruct-pix2pix';
      default:
        return 'instruct-pix2pix';
    }
  }

  private getOptimalSteps(transformationType: string): number {
    const stepsMap: Record<string, number> = {
      'before-after': 20,
      'enhancement': 30,
      'style-transfer': 50,
      'modification': 25
    };
    return stepsMap[transformationType] || 20;
  }

  private getOptimalGuidance(transformationType: string): number {
    const guidanceMap: Record<string, number> = {
      'before-after': 7.5,
      'enhancement': 7,
      'style-transfer': 8,
      'modification': 7.5
    };
    return guidanceMap[transformationType] || 7.5;
  }

  private enhanceBeforePrompt(basePrompt: string, businessType: string): string {
    const businessEnhancements: Record<string, string> = {
      'auto-detailing': 'dirty car, needs cleaning, before detailing, worn appearance, realistic automotive photography',
      'house-cleaning': 'messy room, needs cleaning, cluttered space, before cleaning service, realistic interior photography',
      'pressure-washing': 'dirty surface, stained, weathered, needs pressure washing, before cleaning, realistic exterior',
      'carpet-cleaning': 'stained carpet, dirty flooring, needs professional cleaning, before treatment, realistic interior',
      'landscaping': 'overgrown yard, unmaintained landscape, before landscaping work, needs improvement',
      'painting': 'old paint, weathered surface, needs repainting, before painting service',
      'roofing': 'damaged roof, worn shingles, needs repair, before roofing work',
      'hvac': 'old system, needs maintenance, before HVAC service',
      'hair-salon': 'before hair treatment, natural hair, needs styling, before transformation',
      'dental': 'before dental treatment, natural teeth, needs improvement',
      'fitness': 'before fitness program, starting point, needs improvement',
      'med-spa': 'before treatment, natural appearance, needs enhancement'
    };

    const enhancement = businessEnhancements[businessType] || 'before service, needs improvement, realistic photography';
    return `${basePrompt}, ${enhancement}`;
  }

  private enhanceAfterPrompt(basePrompt: string, businessType: string): string {
    const businessEnhancements: Record<string, string> = {
      'auto-detailing': 'clean shiny car, perfectly detailed, showroom quality, after professional detailing',
      'house-cleaning': 'spotless clean room, organized, pristine, after professional cleaning service',
      'pressure-washing': 'clean surface, like new, pristine condition, after pressure washing',
      'carpet-cleaning': 'clean pristine carpet, fresh appearance, after professional cleaning',
      'landscaping': 'beautiful maintained landscape, professional landscaping, perfectly manicured',
      'painting': 'fresh new paint, perfect finish, professional painting job',
      'roofing': 'new roof, perfect condition, professional roofing work',
      'hvac': 'new efficient system, professional installation, modern HVAC',
      'hair-salon': 'beautiful styled hair, professional hair transformation, salon quality',
      'dental': 'perfect smile, professional dental work, beautiful teeth',
      'fitness': 'fit and healthy, fitness transformation, improved physique',
      'med-spa': 'enhanced appearance, professional treatment results, beautiful outcome'
    };

    const enhancement = businessEnhancements[businessType] || 'after professional service, perfect results, high quality outcome';
    return `${basePrompt}, ${enhancement}`;
  }

  private getBeforeNegativePrompt(businessType: string): string {
    const commonNegatives = 'blurry, low quality, distorted, unrealistic, oversaturated';
    
    const businessNegatives: Record<string, string> = {
      'auto-detailing': 'clean car, shiny, perfect condition, showroom',
      'house-cleaning': 'clean room, organized, spotless, pristine',
      'pressure-washing': 'clean surface, new appearance, pristine condition',
      'carpet-cleaning': 'clean carpet, spotless, pristine flooring',
      'landscaping': 'perfect landscape, maintained yard, professional landscaping',
      'hair-salon': 'perfect hair, styled, salon quality',
      'dental': 'perfect teeth, beautiful smile',
      'fitness': 'perfect physique, ideal body',
      'med-spa': 'perfect appearance, enhanced beauty'
    };

    const businessSpecific = businessNegatives[businessType] || 'perfect condition, already improved';
    return `${commonNegatives}, ${businessSpecific}`;
  }

  private generateConsistentSeed(businessType: string, index: number): number {
    // Generate consistent but varied seeds based on business type and index
    const businessHash = businessType.split('').reduce((hash, char) => 
      hash + char.charCodeAt(0), 0);
    return (businessHash * 1000) + index;
  }

  private calculateCoherenceScore(
    beforeResult: ReplicateGenerationResult, 
    afterResult: ReplicateGenerationResult
  ): number {
    // This is a simplified coherence score
    // In a real implementation, you might use image analysis to compare
    // composition, colors, and overall consistency
    
    let score = 0.7; // Base score

    // Both generations successful
    if (beforeResult.success && afterResult.success) {
      score += 0.2;
    }

    // Similar processing times (indicates similar complexity)
    const timeDiff = Math.abs(beforeResult.processingTime - afterResult.processingTime);
    if (timeDiff < 5000) { // Within 5 seconds
      score += 0.1;
    }

    // Both have images
    if (beforeResult.images.length > 0 && afterResult.images.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to create transformation instructions for different business types
  static createTransformationInstructions(
    businessType: string,
    serviceType: string
  ): string {
    const instructions: Record<string, Record<string, string>> = {
      'auto-detailing': {
        'exterior': 'Transform this dirty car into a clean, shiny, perfectly detailed vehicle with glossy paint and spotless exterior',
        'interior': 'Transform this messy car interior into a spotless, perfectly clean interior with pristine upholstery',
        'engine': 'Transform this dirty engine bay into a clean, detailed engine compartment'
      },
      'house-cleaning': {
        'kitchen': 'Transform this messy kitchen into a spotless, organized, clean kitchen with shining surfaces',
        'bathroom': 'Transform this dirty bathroom into a pristine, sparkling clean bathroom',
        'living-room': 'Transform this cluttered living room into a clean, organized, beautiful living space'
      },
      'pressure-washing': {
        'driveway': 'Transform this stained driveway into a clean, like-new concrete surface',
        'siding': 'Transform this dirty house siding into clean, fresh-looking exterior walls',
        'deck': 'Transform this weathered deck into a clean, restored wooden surface'
      },
      'hair-salon': {
        'cut-color': 'Transform this hair into a beautiful, professionally styled and colored hair',
        'styling': 'Transform this hair into a gorgeous, professionally styled hairdo'
      },
      'landscaping': {
        'yard': 'Transform this overgrown yard into a beautiful, professionally maintained landscape',
        'garden': 'Transform this neglected garden into a stunning, well-designed garden space'
      }
    };

    return instructions[businessType]?.[serviceType] || 
           `Transform this into a professional, high-quality result after ${businessType} service`;
  }

  // Method to estimate cost for before/after generation
  estimateBeforeAfterCost(quantity: number): number {
    const beforeCost = (2.5 / 1000) * quantity; // RealVis XL cost
    const afterCost = (1.5 / 1000) * quantity;  // InstructPix2Pix cost
    return Math.round((beforeCost + afterCost) * 100) / 100;
  }
}

export default ImageToImageGenerator;