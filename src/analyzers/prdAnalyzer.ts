import fs from 'fs';
import path from 'path';

export interface BusinessContext {
  businessType: string;
  industry: string;
  description: string;
  targetAudience: string[];
  keyFeatures: string[];
  serviceAreas: string[];
  brandTone: string;
  specialRequirements: string[];
}

export interface ImageRequirement {
  category: 'hero' | 'service' | 'gallery' | 'before-after' | 'team' | 'product' | 'location' | 'equipment';
  quantity: number;
  dimensions: { width: number; height: number };
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '3:2';
  style: string;
  subject: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}

export class PRDAnalyzer {
  private businessTypeMap: Record<string, string> = {
    'auto-detailing': 'Automotive Detailing',
    'coffee-shops': 'Coffee Shop',
    'house-cleaning': 'House Cleaning',
    'hair-salons': 'Hair Salon',
    'pizza-shops': 'Restaurant',
    'yoga-studios': 'Fitness/Wellness',
    'real-estate': 'Real Estate',
    'dental-practices': 'Healthcare',
    'law-firms': 'Professional Services',
    'photographers': 'Creative Services',
    'hvac-contractor': 'Home Services',
    'roofing-companies': 'Construction',
    'financial-advisory': 'Financial Services',
    'marketing-agencies': 'Marketing',
    'med-spas': 'Beauty/Wellness'
  };

  private styleKeywords = {
    'professional': ['professional', 'corporate', 'business', 'executive'],
    'warm': ['warm', 'friendly', 'welcoming', 'cozy', 'inviting'],
    'modern': ['modern', 'contemporary', 'sleek', 'minimalist', 'clean'],
    'premium': ['premium', 'luxury', 'high-end', 'sophisticated', 'elegant'],
    'casual': ['casual', 'relaxed', 'laid-back', 'informal', 'comfortable']
  };

  async analyzePRD(contentOrPath: string, projectName?: string): Promise<{ context: BusinessContext; requirements: ImageRequirement[] }> {
    let prdContent: string;
    let projectPath: string;

    // Check if it's content or file path
    if (contentOrPath.includes('\n') || contentOrPath.includes('#') || !contentOrPath.includes('/')) {
      // It's content
      prdContent = contentOrPath;
      projectPath = projectName || 'manual-project';
    } else {
      // It's a file path
      projectPath = contentOrPath;
      const prdPath = path.join(projectPath, 'PRD.md');
      
      if (!fs.existsSync(prdPath)) {
        throw new Error(`PRD file not found at ${prdPath}`);
      }

      prdContent = fs.readFileSync(prdPath, 'utf-8');
    }

    const businessContext = this.extractBusinessContext(prdContent, projectPath);
    const imageRequirements = this.generateImageRequirements(businessContext);

    return { context: businessContext, requirements: imageRequirements };
  }

  private extractBusinessContext(prdContent: string, projectPath: string): BusinessContext {
    const projectName = path.basename(projectPath);
    const businessType = this.determineBusinessType(projectName, prdContent);
    
    return {
      businessType,
      industry: this.extractIndustry(prdContent),
      description: this.extractDescription(prdContent),
      targetAudience: this.extractTargetAudience(prdContent),
      keyFeatures: this.extractKeyFeatures(prdContent),
      serviceAreas: this.extractServiceAreas(prdContent),
      brandTone: this.extractBrandTone(prdContent),
      specialRequirements: this.extractSpecialRequirements(prdContent)
    };
  }

  private determineBusinessType(projectName: string, prdContent: string): string {
    // Check project name first
    for (const [key, value] of Object.entries(this.businessTypeMap)) {
      if (projectName.includes(key)) {
        return value;
      }
    }

    // Fallback to PRD content analysis
    const title = this.extractTitle(prdContent);
    for (const [key, value] of Object.entries(this.businessTypeMap)) {
      if (title.toLowerCase().includes(key.replace('-', ' '))) {
        return value;
      }
    }

    return 'General Business';
  }

  private extractTitle(prdContent: string): string {
    const titleMatch = prdContent.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '';
  }

  private extractIndustry(prdContent: string): string {
    const industryKeywords = {
      'automotive': ['automotive', 'car', 'vehicle', 'detailing', 'auto'],
      'food-beverage': ['coffee', 'restaurant', 'food', 'beverage', 'dining', 'catering'],
      'healthcare': ['medical', 'dental', 'health', 'clinic', 'spa', 'wellness'],
      'home-services': ['cleaning', 'hvac', 'roofing', 'contractor', 'handyman', 'flooring'],
      'beauty': ['salon', 'beauty', 'hair', 'nail', 'spa', 'cosmetic'],
      'professional': ['law', 'legal', 'financial', 'consulting', 'marketing', 'business'],
      'fitness': ['yoga', 'gym', 'fitness', 'training', 'exercise', 'wellness'],
      'real-estate': ['real estate', 'property', 'homes', 'buying', 'selling'],
      'creative': ['photography', 'design', 'creative', 'art', 'media']
    };

    const lowerContent = prdContent.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  private extractDescription(prdContent: string): string {
    // Look for executive summary or first paragraph
    const summaryMatch = prdContent.match(/## Executive Summary\s*\n\n([\s\S]+?)(?:\n\n|\n##)/);
    if (summaryMatch) {
      return summaryMatch[1].trim().substring(0, 500);
    }

    // Fallback to first paragraph
    const firstParaMatch = prdContent.match(/\n\n([\s\S]+?)(?:\n\n|\n##)/);
    return firstParaMatch ? firstParaMatch[1].trim().substring(0, 500) : '';
  }

  private extractTargetAudience(prdContent: string): string[] {
    const audiences: string[] = [];
    const lowerContent = prdContent.toLowerCase();

    const audienceKeywords = {
      'professionals': ['professional', 'business', 'executive', 'corporate'],
      'families': ['family', 'families', 'parents', 'children'],
      'young-adults': ['young adult', 'millennial', 'gen z', 'student'],
      'seniors': ['senior', 'elderly', 'mature', 'retirement'],
      'luxury-clients': ['luxury', 'premium', 'high-end', 'affluent', 'wealthy'],
      'budget-conscious': ['budget', 'affordable', 'cost-effective', 'economical']
    };

    for (const [audience, keywords] of Object.entries(audienceKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        audiences.push(audience);
      }
    }

    return audiences;
  }

  private extractKeyFeatures(prdContent: string): string[] {
    const features: string[] = [];
    
    // Look for feature lists
    const featureMatches = prdContent.match(/(?:^|\n)[-*]\s+(.+)/gm);
    if (featureMatches) {
      features.push(...featureMatches.map(match => match.replace(/^[-*]\s+/, '').trim()));
    }

    return features.slice(0, 10); // Limit to 10 features
  }

  private extractServiceAreas(prdContent: string): string[] {
    const services: string[] = [];

    // Common service patterns
    const servicePatterns = [
      /service[s]?\s*[:]\s*([^\n]+)/gi,
      /offering[s]?\s*[:]\s*([^\n]+)/gi,
      /package[s]?\s*[:]\s*([^\n]+)/gi,
      /solution[s]?\s*[:]\s*([^\n]+)/gi
    ];

    servicePatterns.forEach(pattern => {
      const matches = prdContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const service = match.replace(pattern, '$1').trim();
          services.push(service);
        });
      }
    });

    return services.slice(0, 8);
  }

  private extractBrandTone(prdContent: string): string {
    const lowerContent = prdContent.toLowerCase();
    
    for (const [tone, keywords] of Object.entries(this.styleKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return tone;
      }
    }

    return 'professional'; // Default
  }

  private extractSpecialRequirements(prdContent: string): string[] {
    const requirements: string[] = [];
    const lowerContent = prdContent.toLowerCase();

    // Look for special image requirements
    if (lowerContent.includes('before') && lowerContent.includes('after')) {
      requirements.push('before-after-pairs');
    }
    if (lowerContent.includes('gallery') || lowerContent.includes('portfolio')) {
      requirements.push('gallery-showcase');
    }
    if (lowerContent.includes('team') || lowerContent.includes('staff')) {
      requirements.push('team-photos');
    }
    if (lowerContent.includes('product') || lowerContent.includes('menu')) {
      requirements.push('product-images');
    }
    if (lowerContent.includes('location') || lowerContent.includes('facility')) {
      requirements.push('location-shots');
    }

    return requirements;
  }

  private generateImageRequirements(context: BusinessContext): ImageRequirement[] {
    const requirements: ImageRequirement[] = [];
    
    // Hero images (always needed)
    requirements.push({
      category: 'hero',
      quantity: 3,
      dimensions: { width: 1920, height: 1080 },
      aspectRatio: '16:9',
      style: `${context.brandTone}, ${context.industry} style`,
      subject: `${context.businessType} hero image`,
      context: context.description,
      priority: 'high'
    });

    // Service images based on business type
    const serviceCount = this.getServiceImageCount(context.businessType);
    requirements.push({
      category: 'service',
      quantity: serviceCount,
      dimensions: { width: 600, height: 400 },
      aspectRatio: '3:2',
      style: `${context.brandTone}, professional`,
      subject: `${context.businessType} services`,
      context: context.serviceAreas.join(', '),
      priority: 'high'
    });

    // Before/After images for applicable businesses
    if (context.specialRequirements.includes('before-after-pairs')) {
      requirements.push({
        category: 'before-after',
        quantity: 6, // 3 pairs
        dimensions: { width: 800, height: 600 },
        aspectRatio: '4:3',
        style: `realistic, ${context.brandTone}`,
        subject: `${context.businessType} transformation`,
        context: 'Before and after transformation showcase',
        priority: 'high'
      });
    }

    // Team photos if mentioned
    if (context.specialRequirements.includes('team-photos')) {
      requirements.push({
        category: 'team',
        quantity: 4,
        dimensions: { width: 400, height: 600 },
        aspectRatio: '3:2',
        style: 'professional, portrait style',
        subject: `${context.businessType} team members`,
        context: 'Professional team portraits',
        priority: 'medium'
      });
    }

    // Gallery/Portfolio images
    if (context.specialRequirements.includes('gallery-showcase')) {
      requirements.push({
        category: 'gallery',
        quantity: 8,
        dimensions: { width: 800, height: 800 },
        aspectRatio: '1:1',
        style: `${context.brandTone}, showcase style`,
        subject: `${context.businessType} work examples`,
        context: 'Portfolio showcase images',
        priority: 'medium'
      });
    }

    // Location/facility images
    if (context.specialRequirements.includes('location-shots')) {
      requirements.push({
        category: 'location',
        quantity: 3,
        dimensions: { width: 1200, height: 800 },
        aspectRatio: '3:2',
        style: `${context.brandTone}, architectural`,
        subject: `${context.businessType} location`,
        context: 'Business location and facilities',
        priority: 'medium'
      });
    }

    return requirements;
  }

  private getServiceImageCount(businessType: string): number {
    const serviceCountMap: Record<string, number> = {
      'Automotive Detailing': 6,
      'Coffee Shop': 8,
      'Hair Salon': 5,
      'Restaurant': 8,
      'Healthcare': 4,
      'Home Services': 6,
      'Professional Services': 4,
      'Creative Services': 6
    };

    return serviceCountMap[businessType] || 5;
  }
}

export default PRDAnalyzer;