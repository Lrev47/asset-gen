import { BusinessContext } from '@/analyzers/prdAnalyzer';
import { CombinedImageRequirement } from '@/analyzers/imageRequirements';

interface BusinessStyleInfo {
  colors: string[];
  style: string;
  focus: string;
}

interface CategoryTemplate {
  title: string;
  description: string;
  compositionRules: string;
  lighting: string;
  examples: string[];
}

export interface DetailedRecommendation {
  category: string;
  title: string;
  description: string;
  composition: string;
  lighting: string;
  colorPalette: string[];
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

export interface WebsiteStyleAnalysis {
  primaryStyle: string;
  colorScheme: string[];
  designDirection: string;
  targetAudience: string;
  brandPersonality: string[];
  visualPriorities: string[];
}

export interface RecommendationSet {
  websiteStyle: WebsiteStyleAnalysis;
  summary: {
    totalImages: number;
    totalCost: number;
    timeEstimate: string;
    categories: string[];
  };
  recommendations: DetailedRecommendation[];
}

export class RecommendationGenerator {
  private businessTypeStyles: Record<string, BusinessStyleInfo> = {
    'auto-detailing': {
      colors: ['#1E40AF', '#FFFFFF', '#374151', '#EF4444'],
      style: 'clean, professional, high-energy',
      focus: 'transformation, cleanliness, attention to detail'
    },
    'coffee-shop': {
      colors: ['#92400E', '#FBBF24', '#374151', '#F3F4F6'],
      style: 'warm, inviting, cozy',
      focus: 'atmosphere, community, quality ingredients'
    },
    'hair-salon': {
      colors: ['#EC4899', '#F9FAFB', '#374151', '#FBBF24'],
      style: 'modern, stylish, aspirational',
      focus: 'transformation, style, personal care'
    },
    'restaurant': {
      colors: ['#DC2626', '#FBBF24', '#374151', '#F3F4F6'],
      style: 'appetizing, inviting, quality-focused',
      focus: 'food presentation, atmosphere, dining experience'
    },
    'real-estate': {
      colors: ['#1D4ED8', '#FFFFFF', '#374151', '#FBBF24'],
      style: 'trustworthy, professional, aspirational',
      focus: 'homes, lifestyle, investment value'
    },
    'healthcare': {
      colors: ['#059669', '#FFFFFF', '#374151', '#EFF6FF'],
      style: 'clean, trustworthy, caring',
      focus: 'health, wellness, professional care'
    },
    'saas': {
      colors: ['#6366F1', '#FFFFFF', '#1F2937', '#F3F4F6'],
      style: 'modern, tech-forward, efficient',
      focus: 'functionality, innovation, user experience'
    }
  };

  private categoryTemplates: Record<string, CategoryTemplate> = {
    'hero': {
      title: 'Hero/Banner Images',
      description: 'Main banner images that capture attention and communicate your value proposition',
      compositionRules: 'Wide shots with clear focal point, rule of thirds, dynamic angles',
      lighting: 'Bright, professional lighting with minimal shadows',
      examples: ['Service in action', 'Happy customers', 'Professional team at work', 'Clean, modern facilities']
    },
    'service': {
      title: 'Service Showcase',
      description: 'Images highlighting individual services and their benefits',
      compositionRules: 'Close-up and medium shots showing process and results',
      lighting: 'Bright, even lighting to show detail and quality',
      examples: ['Before/during/after shots', 'Tools and equipment', 'Service being performed', 'End results']
    },
    'gallery': {
      title: 'Portfolio Gallery',
      description: 'Collection of work examples to showcase quality and variety',
      compositionRules: 'Consistent style, multiple angles, detail shots',
      lighting: 'Natural light preferred, consistent across set',
      examples: ['Completed work', 'Process shots', 'Detail photography', 'Comparison images']
    },
    'team': {
      title: 'Team & Staff',
      description: 'Professional photos of team members to build trust and connection',
      compositionRules: 'Portrait and environmental shots, authentic expressions',
      lighting: 'Soft, flattering lighting, professional headshot style',
      examples: ['Individual portraits', 'Team working together', 'Candid work moments', 'Professional headshots']
    },
    'location': {
      title: 'Location & Facilities',
      description: 'Images showcasing your physical space and environment',
      compositionRules: 'Wide and detail shots, architectural elements, spatial flow',
      lighting: 'Natural light with supplemental lighting for interiors',
      examples: ['Exterior views', 'Reception area', 'Work spaces', 'Equipment and facilities']
    },
    'before-after': {
      title: 'Transformation Showcase',
      description: 'Before and after comparisons demonstrating your results',
      compositionRules: 'Identical angles and lighting for comparison, clear differences',
      lighting: 'Consistent lighting between before/after shots',
      examples: ['Same angle before/after', 'Multiple angle transformations', 'Process documentation', 'Time-lapse style']
    }
  };

  async generateDetailedRecommendations(
    businessContext: BusinessContext,
    imageRequirements: CombinedImageRequirement[]
  ): Promise<RecommendationSet> {
    // Analyze website style
    const websiteStyle = this.analyzeWebsiteStyle(businessContext);
    
    // Generate detailed recommendations for each requirement
    const recommendations: DetailedRecommendation[] = [];
    
    for (const requirement of imageRequirements) {
      const recommendation = this.generateCategoryRecommendation(
        requirement,
        businessContext
      );
      recommendations.push(recommendation);
    }

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Generate summary
    const summary = {
      totalImages: recommendations.reduce((sum, rec) => sum + rec.quantity, 0),
      totalCost: recommendations.reduce((sum, rec) => sum + rec.technicalSpecs.estimatedCost, 0),
      timeEstimate: this.estimateTimeframe(recommendations.length),
      categories: [...new Set(recommendations.map(rec => rec.category))]
    };

    return {
      websiteStyle,
      summary,
      recommendations
    };
  }

  private analyzeWebsiteStyle(businessContext: BusinessContext): WebsiteStyleAnalysis {
    const businessKey = this.mapBusinessTypeToKey(businessContext.businessType);
    const styleInfo = this.businessTypeStyles[businessKey] || this.businessTypeStyles['saas'];

    return {
      primaryStyle: `${businessContext.brandTone} ${styleInfo.style}`,
      colorScheme: styleInfo.colors,
      designDirection: this.extractDesignDirection(businessContext),
      targetAudience: businessContext.targetAudience.join(', ') || 'General consumers',
      brandPersonality: this.extractBrandPersonality(businessContext),
      visualPriorities: this.extractVisualPriorities(businessContext, styleInfo.focus)
    };
  }

  private generateCategoryRecommendation(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext
  ): DetailedRecommendation {
    const template = this.categoryTemplates[requirement.category] || this.categoryTemplates['service'];
    const businessKey = this.mapBusinessTypeToKey(businessContext.businessType);
    const styleInfo = this.businessTypeStyles[businessKey] || this.businessTypeStyles['saas'];

    return {
      category: requirement.category,
      title: template.title,
      description: template.description,
      composition: this.generateCompositionAdvice(requirement, businessContext, template),
      lighting: this.generateLightingAdvice(requirement, businessContext, template),
      colorPalette: styleInfo.colors,
      mood: this.generateMoodAdvice(requirement, businessContext),
      technicalSpecs: {
        dimensions: requirement.dimensions,
        aspectRatio: requirement.aspectRatio,
        preferredFormat: this.selectOptimalFormat(requirement),
        estimatedCost: this.estimateCategoryCost(requirement)
      },
      examples: this.generateSpecificExamples(requirement, businessContext, template),
      priority: requirement.priority,
      quantity: requirement.quantity,
      reasoning: this.generateReasoning(requirement, businessContext)
    };
  }

  private generateCompositionAdvice(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext,
    template: CategoryTemplate
  ): string {
    const baseRules = template.compositionRules;
    const businessSpecific = this.getBusinessSpecificComposition(businessContext.businessType, requirement.category);
    
    return `${baseRules}. For ${businessContext.businessType}: ${businessSpecific}. Focus on ${requirement.subject} with ${requirement.context}.`;
  }

  private generateLightingAdvice(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext,
    template: CategoryTemplate
  ): string {
    const baseLighting = template.lighting;
    const moodLighting = this.getMoodBasedLighting(businessContext.brandTone);
    
    return `${baseLighting}. ${moodLighting} to convey ${businessContext.brandTone} atmosphere.`;
  }

  private generateMoodAdvice(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext
  ): string {
    const baseMood = businessContext.brandTone;
    const categoryMood = this.getCategoryMood(requirement.category);
    
    return `${baseMood} and ${categoryMood}, reflecting ${businessContext.businessType} values of quality and professionalism`;
  }

  private generateSpecificExamples(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext,
    template: CategoryTemplate
  ): string[] {
    const baseExamples = template.examples;
    const businessSpecific = this.getBusinessSpecificExamples(
      businessContext.businessType,
      requirement.category
    );
    
    return [...baseExamples, ...businessSpecific].slice(0, 4);
  }

  private generateReasoning(
    requirement: CombinedImageRequirement,
    businessContext: BusinessContext
  ): string {
    const priorityReason = this.getPriorityReason(requirement.priority);
    const businessReason = this.getBusinessReason(businessContext.businessType, requirement.category);
    
    return `${priorityReason} ${businessReason} This supports ${businessContext.businessType} by ${requirement.context}.`;
  }

  // Helper methods
  private mapBusinessTypeToKey(businessType: string): string {
    const mapping: Record<string, string> = {
      'Auto Detailing Shop': 'auto-detailing',
      'Coffee Shop': 'coffee-shop',
      'Hair Salon': 'hair-salon',
      'Restaurant': 'restaurant',
      'Real Estate Agency': 'real-estate',
      'Dental Practice': 'healthcare',
      'SaaS Application': 'saas',
      'Mobile App': 'saas'
    };
    
    return mapping[businessType] || 'saas';
  }

  private extractDesignDirection(businessContext: BusinessContext): string {
    if (businessContext.description.toLowerCase().includes('modern')) return 'Modern and minimalist';
    if (businessContext.description.toLowerCase().includes('traditional')) return 'Traditional and timeless';
    if (businessContext.description.toLowerCase().includes('luxury')) return 'Luxury and premium';
    return 'Contemporary and professional';
  }

  private extractBrandPersonality(businessContext: BusinessContext): string[] {
    const personality = [];
    const desc = businessContext.description.toLowerCase();
    
    if (desc.includes('innovative') || desc.includes('cutting-edge')) personality.push('Innovative');
    if (desc.includes('reliable') || desc.includes('trusted')) personality.push('Trustworthy');
    if (desc.includes('friendly') || desc.includes('welcoming')) personality.push('Approachable');
    if (desc.includes('professional') || desc.includes('expert')) personality.push('Professional');
    if (desc.includes('premium') || desc.includes('luxury')) personality.push('Premium');
    
    return personality.length > 0 ? personality : ['Professional', 'Reliable'];
  }

  private extractVisualPriorities(businessContext: BusinessContext, focusAreas: string): string[] {
    const priorities = focusAreas.split(', ');
    
    // Add business-specific priorities
    if (businessContext.specialRequirements.includes('before-after-pairs')) {
      priorities.push('transformation showcase');
    }
    if (businessContext.specialRequirements.includes('team-photos')) {
      priorities.push('team credibility');
    }
    if (businessContext.specialRequirements.includes('location-shots')) {
      priorities.push('facility showcase');
    }
    
    return priorities;
  }

  private getBusinessSpecificComposition(businessType: string, category: string): string {
    const compositions: Record<string, Record<string, string>> = {
      'auto-detailing': {
        'hero': 'Show vehicle transformation with clean, dramatic before/after contrast',
        'service': 'Capture hands-on work with detailed tool and technique shots',
        'before-after': 'Use identical angles and lighting to emphasize transformation'
      },
      'coffee-shop': {
        'hero': 'Feature latte art, steaming coffee, or cozy seating areas',
        'service': 'Show barista skills, coffee preparation process, fresh ingredients',
        'location': 'Capture warm lighting, comfortable seating, community atmosphere'
      },
      'saas': {
        'hero': 'Clean interface screenshots with clear value proposition',
        'service': 'Feature screenshots showing key functionality and user benefits',
        'team': 'Modern, tech-forward portraits in collaborative environments'
      }
    };
    
    const businessKey = this.mapBusinessTypeToKey(businessType);
    return compositions[businessKey]?.[category] || 'Follow standard composition principles with business-appropriate context';
  }

  private getMoodBasedLighting(brandTone: string): string {
    const lightingMap: Record<string, string> = {
      'professional': 'Use clean, bright lighting with minimal shadows',
      'warm': 'Employ soft, golden lighting to create welcoming atmosphere',
      'modern': 'Utilize crisp, contemporary lighting with strategic highlights',
      'premium': 'Apply dramatic lighting with careful shadow play for sophistication',
      'casual': 'Use natural, relaxed lighting that feels authentic and approachable'
    };
    
    return lightingMap[brandTone] || lightingMap['professional'];
  }

  private getCategoryMood(category: string): string {
    const moodMap: Record<string, string> = {
      'hero': 'inspiring and aspirational',
      'service': 'focused and competent',
      'gallery': 'impressive and quality-focused',
      'team': 'approachable and trustworthy',
      'location': 'inviting and professional',
      'before-after': 'dramatic and convincing'
    };
    
    return moodMap[category] || 'professional and engaging';
  }

  private getBusinessSpecificExamples(businessType: string, category: string): string[] {
    const examples: Record<string, Record<string, string[]>> = {
      'auto-detailing': {
        'hero': ['Gleaming car in dramatic lighting', 'Detailer working with precision tools'],
        'service': ['Paint correction process', 'Interior deep cleaning', 'Ceramic coating application'],
        'before-after': ['Heavily soiled vs. pristine vehicle', 'Faded paint vs. mirror finish']
      },
      'coffee-shop': {
        'hero': ['Perfect latte art in natural light', 'Barista crafting specialty drink'],
        'service': ['Espresso extraction process', 'Latte art creation', 'Bean roasting'],
        'location': ['Cozy seating area', 'Coffee bar setup', 'Window-lit reading nook']
      },
      'saas': {
        'hero': ['Clean dashboard interface', 'User achieving success with product'],
        'service': ['Key feature demonstrations', 'User workflow examples', 'Integration capabilities'],
        'team': ['Collaborative development work', 'Customer support interaction']
      }
    };
    
    const businessKey = this.mapBusinessTypeToKey(businessType);
    return examples[businessKey]?.[category] || ['Professional quality work', 'Satisfied customers'];
  }

  private getPriorityReason(priority: string): string {
    const reasons: Record<string, string> = {
      'high': 'Critical for first impressions and conversion.',
      'medium': 'Important for building trust and showcasing capabilities.',
      'low': 'Valuable for comprehensive brand presentation and SEO.'
    };
    
    return reasons[priority] || reasons['medium'];
  }

  private getBusinessReason(businessType: string, category: string): string {
    if (category === 'hero') return `${businessType} businesses need strong visual impact to capture attention immediately.`;
    if (category === 'service') return `Service-based businesses like ${businessType} must demonstrate capability and results.`;
    if (category === 'before-after') return `Transformation businesses like ${businessType} rely on visual proof of results.`;
    
    return `${businessType} businesses benefit from professional imagery to build credibility.`;
  }

  private selectOptimalFormat(requirement: CombinedImageRequirement): string {
    if (requirement.priority === 'high') return 'WebP with JPEG fallback';
    if (requirement.category === 'gallery') return 'WebP optimized';
    return 'WebP standard';
  }

  private estimateCategoryCost(requirement: CombinedImageRequirement): number {
    const baseCost = requirement.priority === 'high' ? 0.04 : 0.002; // DALL-E vs Replicate
    return baseCost * requirement.quantity;
  }

  private estimateTimeframe(categoryCount: number): string {
    const minutes = categoryCount * 3; // 3 minutes per category
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

}

export default RecommendationGenerator;