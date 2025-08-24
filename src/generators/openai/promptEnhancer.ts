import OpenAI from 'openai';
import { BusinessContext } from '@/analyzers/prdAnalyzer';

interface CombinedImageRequirement {
  name: string;
  description: string;
  category: string;
  priority?: 'high' | 'medium' | 'low';
  dimensions?: { width: number; height: number };
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16' | '3:2';
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  style: string;
  quality: string;
  negativePrompts?: string[];
  tags: string[];
}

export interface PromptEnhancementRequest {
  requirement: CombinedImageRequirement;
  businessContext: BusinessContext;
  additionalContext?: string;
  style?: 'photorealistic' | 'professional' | 'artistic' | 'illustration';
  mood?: 'bright' | 'warm' | 'cool' | 'dramatic' | 'soft';
}

export class PromptEnhancer {
  private openai?: OpenAI;
  
  // Style templates for different business types
  private styleTemplates = {
    'automotive': {
      'photorealistic': 'professional automotive photography, clean modern lighting, showroom quality',
      'professional': 'professional automotive service environment, clean and organized workspace',
      'artistic': 'automotive art photography, dynamic angles, premium aesthetic',
      'illustration': 'modern automotive illustration, clean vector style, professional branding'
    },
    'food-beverage': {
      'photorealistic': 'professional food photography, natural lighting, appetizing presentation',
      'professional': 'clean modern restaurant environment, professional kitchen, hygienic',
      'artistic': 'artistic food styling, warm ambient lighting, inviting atmosphere',
      'illustration': 'modern food illustration, clean menu style, appetizing colors'
    },
    'healthcare': {
      'photorealistic': 'professional medical photography, clean clinical environment, bright lighting',
      'professional': 'modern medical facility, professional healthcare setting, sterile',
      'artistic': 'wellness photography, calming colors, peaceful atmosphere',
      'illustration': 'medical illustration, clean professional style, educational'
    },
    'home-services': {
      'photorealistic': 'professional service photography, before and after transformation, realistic',
      'professional': 'professional home service environment, tools and equipment, organized',
      'artistic': 'home transformation photography, dramatic before/after contrast',
      'illustration': 'service illustration, clean professional style, instructional'
    },
    'beauty': {
      'photorealistic': 'professional beauty photography, soft flattering lighting, high-end quality',
      'professional': 'modern salon environment, professional beauty tools, clean aesthetic',
      'artistic': 'beauty portrait photography, creative lighting, glamorous',
      'illustration': 'beauty illustration, elegant style, premium branding'
    },
    'professional': {
      'photorealistic': 'professional corporate photography, modern office environment',
      'professional': 'corporate business setting, professional attire, confidence',
      'artistic': 'professional portrait photography, executive style, premium quality',
      'illustration': 'professional business illustration, corporate style, modern'
    },
    'fitness': {
      'photorealistic': 'fitness photography, active lifestyle, motivational energy',
      'professional': 'modern fitness facility, professional equipment, clean environment',
      'artistic': 'fitness lifestyle photography, dynamic movement, energetic',
      'illustration': 'fitness illustration, active lifestyle, motivational design'
    }
  };

  // Quality enhancers
  private qualityEnhancers = {
    'high': 'ultra high quality, 8K resolution, professional photography, studio lighting, sharp focus, highly detailed',
    'medium': 'high quality, professional photography, good lighting, sharp focus, detailed',
    'standard': 'good quality, clear image, proper lighting, focused'
  };

  // Mood modifiers
  private moodModifiers = {
    'bright': 'bright cheerful lighting, vibrant colors, energetic atmosphere',
    'warm': 'warm inviting lighting, cozy atmosphere, welcoming ambiance',
    'cool': 'cool professional lighting, modern aesthetic, clean atmosphere',
    'dramatic': 'dramatic lighting, strong contrast, impactful composition',
    'soft': 'soft gentle lighting, calm peaceful atmosphere, subtle tones'
  };

  constructor(apiKey?: string) {
    if (apiKey || process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
      });
    }
  }

  async enhancePrompt(request: PromptEnhancementRequest): Promise<EnhancedPrompt> {
    const basePrompt = this.buildBasePrompt(request);
    
    // Try to use GPT for enhancement if available, otherwise use template-based
    let enhanced: string;
    
    if (this.openai) {
      try {
        enhanced = await this.enhanceWithGPT(basePrompt, request);
      } catch (error) {
        console.warn('GPT enhancement failed, using template-based enhancement:', error);
        enhanced = this.enhanceWithTemplates(basePrompt, request);
      }
    } else {
      enhanced = this.enhanceWithTemplates(basePrompt, request);
    }

    return {
      original: basePrompt,
      enhanced: enhanced,
      style: request.style || 'professional',
      quality: this.getQualityLevel(request.requirement.priority || 'medium'),
      tags: this.generateTags(request),
      negativePrompts: this.generateNegativePrompts(request)
    };
  }

  private buildBasePrompt(request: PromptEnhancementRequest): string {
    const { requirement, businessContext } = request;
    const parts: string[] = [];

    // Subject
    parts.push(requirement.name);

    // Business context
    if (businessContext.businessType) {
      parts.push(`for ${businessContext.businessType}`);
    }

    // Category-specific details
    switch (requirement.category) {
      case 'hero':
        parts.push('hero banner image');
        break;
      case 'before-after':
        parts.push('transformation showcase');
        break;
      case 'service':
        parts.push('service showcase');
        break;
      case 'team':
        parts.push('professional team member');
        break;
      case 'gallery':
        parts.push('portfolio showcase');
        break;
      case 'location':
        parts.push('business location');
        break;
      case 'equipment':
        parts.push('professional equipment');
        break;
      case 'product':
        parts.push('product showcase');
        break;
    }

    // Add business description context
    if (businessContext.description) {
      const shortDesc = businessContext.description.substring(0, 100);
      parts.push(`(${shortDesc})`);
    }

    return parts.join(' ');
  }

  private async enhanceWithGPT(basePrompt: string, request: PromptEnhancementRequest): Promise<string> {
    const systemPrompt = `You are an expert at creating detailed image generation prompts for business marketing materials. 

Your task is to enhance the given basic prompt into a detailed, professional image generation prompt that will produce high-quality marketing images.

Guidelines:
1. Keep the core subject and intent
2. Add professional photography details (lighting, composition, quality)
3. Include relevant business context and atmosphere
4. Add specific style and mood descriptors
5. Ensure the prompt is clear and specific
6. Maximum 500 characters
7. Focus on visual elements that convey professionalism and quality

Business Context:
- Type: ${request.businessContext.businessType}
- Industry: ${request.businessContext.industry}
- Target Audience: ${request.businessContext.targetAudience.join(', ')}
- Brand Tone: ${request.businessContext.brandTone}

Image Details:
- Category: ${request.requirement.category}
- Priority: ${request.requirement.priority}
- Style: ${request.style || 'professional'}
- Dimensions: ${request.requirement.dimensions?.width || 1024}x${request.requirement.dimensions?.height || 1024}

Respond with only the enhanced prompt, no explanations.`;

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Enhance this prompt: "${basePrompt}"` }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || basePrompt;
  }

  private enhanceWithTemplates(basePrompt: string, request: PromptEnhancementRequest): string {
    const parts = [basePrompt];

    // Add industry-specific styling
    const industryStyle = this.getIndustryStyle(request.businessContext.industry, request.style);
    if (industryStyle) {
      parts.push(industryStyle);
    }

    // Add quality enhancer
    const qualityLevel = this.getQualityLevel(request.requirement.priority || 'medium');
    parts.push(this.qualityEnhancers[qualityLevel]);

    // Add mood modifier
    if (request.mood) {
      parts.push(this.moodModifiers[request.mood]);
    }

    // Add category-specific enhancements
    const categoryEnhancer = this.getCategoryEnhancer(request.requirement.category);
    if (categoryEnhancer) {
      parts.push(categoryEnhancer);
    }

    // Add aspect ratio optimization
    const aspectRatio = request.requirement.aspectRatio || '16:9';
    const compositionHint = this.getCompositionHint(aspectRatio, request.requirement.category);
    parts.push(compositionHint);

    return parts.join(', ');
  }

  private getIndustryStyle(industry: string, style?: string): string {
    const styleKey = style || 'professional';
    
    if (this.styleTemplates[industry as keyof typeof this.styleTemplates]) {
      return this.styleTemplates[industry as keyof typeof this.styleTemplates][styleKey as keyof typeof this.styleTemplates.professional];
    }
    
    // Fallback to general professional style
    return this.styleTemplates.professional[styleKey as keyof typeof this.styleTemplates.professional];
  }

  private getQualityLevel(priority: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'standard' {
    switch (priority) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'standard';
      default: return 'medium';
    }
  }

  private getCategoryEnhancer(category: string): string {
    const enhancers: Record<string, string> = {
      'hero': 'compelling composition, brand-focused, attention-grabbing',
      'before-after': 'clear comparison, dramatic transformation, side-by-side composition',
      'service': 'service in action, professional execution, customer satisfaction',
      'team': 'confident pose, professional attire, approachable expression',
      'gallery': 'showcase quality, portfolio piece, impressive results',
      'location': 'welcoming environment, professional facility, inviting atmosphere',
      'equipment': 'professional tools, quality equipment, organized workspace',
      'product': 'product focus, commercial quality, appealing presentation'
    };

    return enhancers[category] || 'professional quality, commercial standard';
  }

  private getCompositionHint(aspectRatio: string, category: string): string {
    const hints: Record<string, Record<string, string>> = {
      '16:9': {
        'hero': 'panoramic composition, wide angle view, cinematic framing',
        'location': 'wide establishing shot, comprehensive view',
        'default': 'landscape composition, wide format'
      },
      '1:1': {
        'team': 'centered portrait, professional headshot composition',
        'product': 'centered product focus, square format optimization',
        'default': 'balanced square composition, centered focus'
      },
      '9:16': {
        'team': 'vertical portrait, full body or upper body composition',
        'location': 'vertical architecture, height emphasis',
        'default': 'vertical composition, portrait orientation'
      },
      '4:3': {
        'before-after': 'balanced comparison layout, clear before/after division',
        'service': 'professional service composition, balanced framing',
        'default': 'classic composition, balanced proportions'
      },
      '3:2': {
        'gallery': 'classic photography ratio, professional composition',
        'equipment': 'professional equipment layout, organized display',
        'default': 'professional photography composition, classic proportions'
      }
    };

    const ratioHints = hints[aspectRatio];
    return ratioHints?.[category] || ratioHints?.['default'] || 'well-composed professional image';
  }

  private generateTags(request: PromptEnhancementRequest): string[] {
    const tags: string[] = [];
    
    // Business type tags
    tags.push(request.businessContext.businessType.toLowerCase().replace(/\s+/g, '-'));
    tags.push(request.businessContext.industry);
    
    // Category tags
    tags.push(request.requirement.category);
    
    // Priority tags
    tags.push(request.requirement.priority || 'medium');
    
    // Style tags
    if (request.style) {
      tags.push(request.style);
    }
    
    // Mood tags
    if (request.mood) {
      tags.push(request.mood);
    }

    return tags;
  }

  private generateNegativePrompts(request: PromptEnhancementRequest): string[] {
    const negativePrompts: string[] = [
      'blurry', 'low quality', 'pixelated', 'distorted',
      'unprofessional', 'messy', 'cluttered', 'dark',
      'grainy', 'amateur', 'poor lighting'
    ];

    // Category-specific negative prompts
    switch (request.requirement.category) {
      case 'team':
        negativePrompts.push('unflattering pose', 'poor grooming', 'unprofessional attire');
        break;
      case 'food':
        negativePrompts.push('unappetizing', 'stale', 'unclean', 'poor plating');
        break;
      case 'location':
        negativePrompts.push('dirty', 'cluttered', 'unprofessional environment');
        break;
      case 'product':
        negativePrompts.push('damaged product', 'poor presentation', 'unappealing');
        break;
    }

    // Business type specific negative prompts
    if (request.businessContext.industry === 'healthcare') {
      negativePrompts.push('unsanitary', 'unprofessional medical environment');
    }

    return negativePrompts;
  }

  // Batch enhancement for multiple requirements
  async enhanceMultiplePrompts(requests: PromptEnhancementRequest[]): Promise<EnhancedPrompt[]> {
    const results: EnhancedPrompt[] = [];
    
    for (const request of requests) {
      try {
        const enhanced = await this.enhancePrompt(request);
        results.push(enhanced);
        
        // Small delay to respect rate limits
        await this.delay(100);
      } catch (error) {
        console.error('Error enhancing prompt:', error);
        // Fallback to template-based enhancement
        const fallback = await this.enhancePrompt({ ...request });
        results.push(fallback);
      }
    }
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to create before/after prompts
  createBeforeAfterPrompts(
    baseRequest: PromptEnhancementRequest
  ): { before: EnhancedPrompt; after: EnhancedPrompt } {
    const beforeRequest = {
      ...baseRequest,
      requirement: {
        ...baseRequest.requirement,
        name: baseRequest.requirement.name.replace('transformation', 'before state'),
        description: baseRequest.requirement.description + ' - before treatment/service'
      }
    };

    const afterRequest = {
      ...baseRequest,
      requirement: {
        ...baseRequest.requirement,
        name: baseRequest.requirement.name.replace('transformation', 'after results'),
        description: baseRequest.requirement.description + ' - after treatment/service'
      }
    };

    // These would be called asynchronously in practice
    return {
      before: {
        original: beforeRequest.requirement.name,
        enhanced: this.enhanceWithTemplates(beforeRequest.requirement.name, beforeRequest),
        style: beforeRequest.style || 'professional',
        quality: this.getQualityLevel(beforeRequest.requirement.priority || 'medium'),
        tags: this.generateTags(beforeRequest),
        negativePrompts: this.generateNegativePrompts(beforeRequest)
      },
      after: {
        original: afterRequest.requirement.name,
        enhanced: this.enhanceWithTemplates(afterRequest.requirement.name, afterRequest),
        style: afterRequest.style || 'professional',
        quality: this.getQualityLevel(afterRequest.requirement.priority || 'medium'),
        tags: this.generateTags(afterRequest),
        negativePrompts: this.generateNegativePrompts(afterRequest)
      }
    };
  }
}

export default PromptEnhancer;