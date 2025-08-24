import BusinessTemplateManager, { BusinessTemplate } from './businessTemplates';
import { CombinedImageRequirement } from '@/analyzers/imageRequirements';
import { BusinessContext } from '@/analyzers/prdAnalyzer';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  baseTemplate: string;
  variables: TemplateVariable[];
  modifiers: TemplateModifier[];
  contexts: string[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'select' | 'multiselect' | 'number';
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

export interface TemplateModifier {
  type: 'style' | 'quality' | 'mood' | 'composition' | 'lighting';
  name: string;
  prompt: string;
  conditions?: {
    categories?: string[];
    priority?: string[];
    businessTypes?: string[];
    aspectRatios?: string[];
  };
}

export interface GeneratedPromptSet {
  primary: string;
  alternatives: string[];
  negativePrompts: string[];
  styleModifiers: string[];
  qualityEnhancers: string[];
  metadata: {
    businessType: string;
    imageCategory: string;
    style: string;
    confidence: number;
  };
}

export class PromptTemplateEngine {
  private businessTemplates: BusinessTemplateManager;
  private modifiers: Record<string, TemplateModifier[]> = {};

  constructor() {
    this.businessTemplates = new BusinessTemplateManager();
    this.initializeModifiers();
  }

  private initializeModifiers() {
    this.modifiers = {
      style: [
        {
          type: 'style',
          name: 'photorealistic',
          prompt: 'photorealistic, highly detailed, realistic photography, lifelike quality',
          conditions: { categories: ['team', 'before-after', 'location'] }
        },
        {
          type: 'style',
          name: 'professional',
          prompt: 'professional photography, commercial quality, corporate standard',
          conditions: { priority: ['high', 'medium'] }
        },
        {
          type: 'style',
          name: 'artistic',
          prompt: 'artistic composition, creative photography, aesthetic appeal',
          conditions: { categories: ['hero', 'gallery'] }
        },
        {
          type: 'style',
          name: 'lifestyle',
          prompt: 'lifestyle photography, authentic moments, natural interactions',
          conditions: { categories: ['hero', 'team'] }
        }
      ],
      quality: [
        {
          type: 'quality',
          name: 'ultra-high',
          prompt: 'ultra high quality, 8K resolution, studio lighting, razor sharp focus, professional photography',
          conditions: { priority: ['high'] }
        },
        {
          type: 'quality',
          name: 'high',
          prompt: 'high quality, professional photography, excellent lighting, sharp focus',
          conditions: { priority: ['medium'] }
        },
        {
          type: 'quality',
          name: 'good',
          prompt: 'good quality, clear image, proper lighting, well-composed',
          conditions: { priority: ['low'] }
        }
      ],
      mood: [
        {
          type: 'mood',
          name: 'bright-energetic',
          prompt: 'bright cheerful lighting, vibrant colors, energetic atmosphere, uplifting mood',
          conditions: { businessTypes: ['fitness', 'coffee-shops', 'beauty'] }
        },
        {
          type: 'mood',
          name: 'warm-inviting',
          prompt: 'warm inviting lighting, cozy atmosphere, welcoming ambiance, comfortable feeling',
          conditions: { businessTypes: ['coffee-shops', 'hair-salons', 'restaurants'] }
        },
        {
          type: 'mood',
          name: 'professional-confident',
          prompt: 'professional lighting, confident atmosphere, trustworthy appearance, corporate mood',
          conditions: { businessTypes: ['professional-services', 'medical', 'legal'] }
        },
        {
          type: 'mood',
          name: 'clean-fresh',
          prompt: 'clean bright lighting, fresh atmosphere, pristine environment, spotless appearance',
          conditions: { businessTypes: ['house-cleaning', 'auto-detailing', 'medical'] }
        }
      ],
      composition: [
        {
          type: 'composition',
          name: 'hero-wide',
          prompt: 'wide panoramic composition, cinematic framing, expansive view, dramatic perspective',
          conditions: { categories: ['hero'], aspectRatios: ['16:9'] }
        },
        {
          type: 'composition',
          name: 'portrait-vertical',
          prompt: 'vertical portrait composition, professional headshot framing, centered subject',
          conditions: { categories: ['team'], aspectRatios: ['9:16', '3:4'] }
        },
        {
          type: 'composition',
          name: 'before-after-split',
          prompt: 'split comparison composition, clear before/after division, balanced layout',
          conditions: { categories: ['before-after'] }
        },
        {
          type: 'composition',
          name: 'product-centered',
          prompt: 'centered product focus, clean composition, minimal distractions',
          conditions: { categories: ['product', 'service'] }
        }
      ],
      lighting: [
        {
          type: 'lighting',
          name: 'studio-professional',
          prompt: 'professional studio lighting, soft key light, balanced exposure, no harsh shadows',
          conditions: { categories: ['team', 'product'] }
        },
        {
          type: 'lighting',
          name: 'natural-soft',
          prompt: 'natural soft lighting, window light, gentle shadows, warm color temperature',
          conditions: { businessTypes: ['coffee-shops', 'hair-salons'] }
        },
        {
          type: 'lighting',
          name: 'bright-commercial',
          prompt: 'bright commercial lighting, even illumination, vibrant colors, high visibility',
          conditions: { categories: ['hero', 'location'] }
        }
      ]
    };
  }

  generatePromptSet(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext,
    options: {
      style?: string;
      includeAlternatives?: boolean;
      variationCount?: number;
    } = {}
  ): GeneratedPromptSet {
    const businessType = this.mapBusinessContextToTemplate(businessContext);
    const template = this.businessTemplates.getTemplate(businessType);
    
    if (!template) {
      return this.generateFallbackPromptSet(requirement, businessContext, options);
    }

    // Generate primary prompt
    const primaryPrompt = this.buildPrimaryPrompt(requirement, template, businessContext, options.style);
    
    // Generate alternatives if requested
    const alternatives: string[] = [];
    if (options.includeAlternatives) {
      alternatives.push(...this.generateAlternatives(requirement, template, options.variationCount || 2));
    }

    // Get negative prompts
    const negativePrompts = this.buildNegativePrompts(requirement, template, options.style);

    // Get style modifiers
    const styleModifiers = this.getApplicableModifiers('style', requirement, businessContext);

    // Get quality enhancers
    const qualityEnhancers = this.getApplicableModifiers('quality', requirement, businessContext);

    return {
      primary: primaryPrompt,
      alternatives,
      negativePrompts,
      styleModifiers: styleModifiers.map(m => m.prompt),
      qualityEnhancers: qualityEnhancers.map(m => m.prompt),
      metadata: {
        businessType,
        imageCategory: requirement.category,
        style: options.style || 'professional',
        confidence: this.calculateConfidence(template, requirement)
      }
    };
  }

  private mapBusinessContextToTemplate(businessContext: BusinessContext): string {
    const businessType = businessContext.businessType.toLowerCase().replace(/\s+/g, '-');
    const industry = businessContext.industry;

    // Direct mappings
    const directMappings: Record<string, string> = {
      'automotive-detailing': 'auto-detailing',
      'coffee-shop': 'coffee-shops',
      'hair-salon': 'hair-salons',
      'house-cleaning': 'house-cleaning',
      'auto-detailing-shops': 'auto-detailing',
      'coffee-shops': 'coffee-shops',
      'hair-salons': 'hair-salons',
      'house-cleaning-services': 'house-cleaning'
    };

    if (directMappings[businessType]) {
      return directMappings[businessType];
    }

    // Industry-based fallbacks
    const industryMappings: Record<string, string> = {
      'automotive': 'auto-detailing',
      'food-beverage': 'coffee-shops',
      'beauty': 'hair-salons',
      'home-services': 'house-cleaning'
    };

    return industryMappings[industry] || 'house-cleaning'; // Default fallback
  }

  private buildPrimaryPrompt(
    requirement: CombinedImageRequirement,
    template: BusinessTemplate,
    businessContext: BusinessContext,
    style?: string
  ): string {
    const parts: string[] = [];

    // Get base prompt from template
    const basePrompt = this.businessTemplates.generatePrompt(
      template.id,
      requirement.category,
      style,
      {
        business_tone: businessContext.brandTone,
        business_type: businessContext.businessType,
        service_context: requirement.context
      }
    );

    if (basePrompt) {
      parts.push(basePrompt);
    } else {
      // Fallback prompt generation
      parts.push(this.generateFallbackPrompt(requirement, businessContext));
    }

    // Add applicable modifiers
    const modifiers = this.getAllApplicableModifiers(requirement, businessContext);
    modifiers.forEach(modifier => {
      parts.push(modifier.prompt);
    });

    return parts.join(', ');
  }

  private generateAlternatives(
    requirement: CombinedImageRequirement,
    template: BusinessTemplate,
    count: number
  ): string[] {
    const alternatives: string[] = [];

    // Generate variations using template variations
    const templateVariations = this.businessTemplates.createVariations(
      template.id,
      requirement.category,
      count
    );
    
    alternatives.push(...templateVariations);

    // Generate style variations
    const styleVariations = this.generateStyleVariations(requirement, template, count);
    alternatives.push(...styleVariations);

    // Return unique alternatives up to requested count
    const uniqueAlternatives = [...new Set(alternatives)];
    return uniqueAlternatives.slice(0, count);
  }

  private generateStyleVariations(
    requirement: CombinedImageRequirement,
    template: BusinessTemplate,
    count: number
  ): string[] {
    const variations: string[] = [];
    const basePrompt = requirement.subject;

    // Different style approaches
    const styleApproaches = [
      'photorealistic professional photography',
      'artistic commercial photography',
      'lifestyle documentary style',
      'clean modern aesthetic'
    ];

    for (let i = 0; i < Math.min(count, styleApproaches.length); i++) {
      const approach = styleApproaches[i];
      const variation = `${basePrompt}, ${approach}, ${template.commonPromptElements.join(', ')}`;
      variations.push(variation);
    }

    return variations;
  }

  private buildNegativePrompts(
    requirement: CombinedImageRequirement,
    template: BusinessTemplate,
    style?: string
  ): string[] {
    let negativePrompts = [...template.negativePrompts];

    // Add category-specific negative prompts
    const categoryNegatives = this.getCategoryNegativePrompts(requirement.category);
    negativePrompts = negativePrompts.concat(categoryNegatives);

    // Add style-specific negative prompts
    if (style) {
      const styleNegatives = this.businessTemplates.getNegativePrompts(template.id, style);
      negativePrompts = negativePrompts.concat(styleNegatives);
    }

    // Remove duplicates
    return [...new Set(negativePrompts)];
  }

  private getCategoryNegativePrompts(category: string): string[] {
    const categoryNegatives: Record<string, string[]> = {
      'team': ['unflattering angle', 'poor posture', 'unprofessional attire', 'distracting background'],
      'product': ['poor product placement', 'unflattering angle', 'cluttered background', 'poor lighting'],
      'before-after': ['inconsistent lighting', 'different angles', 'poor comparison'],
      'hero': ['cluttered composition', 'poor focal point', 'distracting elements'],
      'location': ['messy environment', 'poor architectural photography', 'unflattering perspective'],
      'service': ['unprofessional technique', 'poor action shot', 'unclear service demonstration'],
      'equipment': ['disorganized display', 'poor product photography', 'cluttered workspace'],
      'gallery': ['poor portfolio quality', 'inconsistent style', 'amateur composition']
    };

    return categoryNegatives[category] || [];
  }

  private getAllApplicableModifiers(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext
  ): TemplateModifier[] {
    const allModifiers: TemplateModifier[] = [];

    // Get modifiers from each category
    Object.keys(this.modifiers).forEach(category => {
      const categoryModifiers = this.getApplicableModifiers(category as keyof typeof this.modifiers, requirement, businessContext);
      allModifiers.push(...categoryModifiers);
    });

    return allModifiers;
  }

  private getApplicableModifiers(
    modifierType: keyof typeof this.modifiers,
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext
  ): TemplateModifier[] {
    const modifiers = this.modifiers[modifierType];
    const applicable: TemplateModifier[] = [];

    for (const modifier of modifiers) {
      if (this.isModifierApplicable(modifier, requirement, businessContext)) {
        applicable.push(modifier);
      }
    }

    return applicable;
  }

  private isModifierApplicable(
    modifier: TemplateModifier,
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext
  ): boolean {
    if (!modifier.conditions) return true;

    // Check category conditions
    if (modifier.conditions.categories) {
      if (!modifier.conditions.categories.includes(requirement.category)) {
        return false;
      }
    }

    // Check priority conditions
    if (modifier.conditions.priority) {
      if (!modifier.conditions.priority.includes(requirement.priority)) {
        return false;
      }
    }

    // Check business type conditions
    if (modifier.conditions.businessTypes) {
      const businessType = this.mapBusinessContextToTemplate(businessContext);
      if (!modifier.conditions.businessTypes.includes(businessType)) {
        return false;
      }
    }

    // Check aspect ratio conditions
    if (modifier.conditions.aspectRatios) {
      if (!modifier.conditions.aspectRatios.includes(requirement.aspectRatio)) {
        return false;
      }
    }

    return true;
  }

  private calculateConfidence(template: BusinessTemplate, requirement: CombinedImageRequirement): number {
    let confidence = 0.7; // Base confidence

    // Check if template has the required category
    const hasCategory = template.imageCategories.some(cat => cat.category === requirement.category);
    if (hasCategory) {
      confidence += 0.2;
    }

    // Check if template supports before-after for that category
    if (requirement.category === 'before-after' && template.beforeAfterSupport) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private generateFallbackPromptSet(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext,
    options: { style?: string; includeAlternatives?: boolean; variationCount?: number }
  ): GeneratedPromptSet {
    const fallbackPrompt = this.generateFallbackPrompt(requirement, businessContext);
    
    return {
      primary: fallbackPrompt,
      alternatives: options.includeAlternatives ? [
        `${fallbackPrompt}, professional photography style`,
        `${fallbackPrompt}, commercial quality`
      ] : [],
      negativePrompts: ['low quality', 'blurry', 'distorted', 'unprofessional'],
      styleModifiers: ['professional', 'high quality'],
      qualityEnhancers: ['sharp focus', 'good lighting'],
      metadata: {
        businessType: 'general',
        imageCategory: requirement.category,
        style: options.style || 'professional',
        confidence: 0.5
      }
    };
  }

  private generateFallbackPrompt(requirement: CombinedImageRequirement, businessContext: BusinessContext): string {
    const parts = [
      requirement.subject,
      businessContext.businessType,
      'professional photography',
      `${businessContext.brandTone} atmosphere`,
      'high quality'
    ];

    return parts.join(', ');
  }

  // Utility method to get all available templates
  getAvailableTemplates(): BusinessTemplate[] {
    return this.businessTemplates.getAllTemplates();
  }

  // Utility method to preview a prompt before generation
  previewPrompt(
    businessType: string,
    imageCategory: string,
    style?: string,
    variables?: Record<string, string>
  ): string | null {
    return this.businessTemplates.generatePrompt(businessType, imageCategory, style, variables);
  }
}

export default PromptTemplateEngine;