export interface BusinessTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  imageCategories: ImageCategoryTemplate[];
  stylePresets: StylePreset[];
  commonPromptElements: string[];
  negativePrompts: string[];
  beforeAfterSupport: boolean;
  preferredModels: string[];
}

export interface ImageCategoryTemplate {
  category: 'hero' | 'service' | 'gallery' | 'before-after' | 'team' | 'product' | 'location' | 'equipment';
  name: string;
  description: string;
  promptTemplate: string;
  defaultQuantity: number;
  recommendedDimensions: { width: number; height: number }[];
  priority: 'high' | 'medium' | 'low';
  styleHints: string[];
  variations?: string[];
}

export interface StylePreset {
  name: string;
  description: string;
  promptModifiers: string[];
  negativePrompts: string[];
  preferredModel: string;
  mood: 'professional' | 'warm' | 'modern' | 'luxury' | 'casual';
}

export class BusinessTemplateManager {
  private templates: Record<string, BusinessTemplate> = {
    'auto-detailing': {
      id: 'auto-detailing',
      name: 'Auto Detailing Services',
      category: 'automotive',
      description: 'Professional automotive detailing and car care services',
      beforeAfterSupport: true,
      preferredModels: ['realvis-xl', 'sdxl', 'instruct-pix2pix'],
      commonPromptElements: [
        'professional automotive photography',
        'clean modern lighting',
        'showroom quality',
        'automotive service environment',
        'professional tools and equipment'
      ],
      negativePrompts: [
        'amateur photography', 'poor lighting', 'messy environment',
        'unprofessional setup', 'low quality', 'blurry', 'distorted'
      ],
      stylePresets: [
        {
          name: 'Professional Showroom',
          description: 'Clean, professional automotive showroom style',
          promptModifiers: ['showroom lighting', 'professional automotive photography', 'clean background', 'studio quality'],
          negativePrompts: ['outdoor lighting', 'cluttered background', 'amateur'],
          preferredModel: 'realvis-xl',
          mood: 'professional'
        },
        {
          name: 'Service Bay',
          description: 'Active service environment with tools and workspace',
          promptModifiers: ['professional garage', 'automotive tools', 'work environment', 'organized workspace'],
          negativePrompts: ['messy workspace', 'unprofessional tools', 'cluttered'],
          preferredModel: 'sdxl',
          mood: 'professional'
        }
      ],
      imageCategories: [
        {
          category: 'hero',
          name: 'Hero/Banner Images',
          description: 'Main website banner images showcasing premium service quality',
          promptTemplate: 'Professional auto detailing hero image, luxury car being detailed by professional technician, {business_tone} automotive service environment, high-end detailing equipment, pristine showroom lighting',
          defaultQuantity: 3,
          recommendedDimensions: [
            { width: 1920, height: 1080 },
            { width: 1600, height: 900 }
          ],
          priority: 'high',
          styleHints: ['showroom quality', 'professional lighting', 'premium service'],
          variations: ['exterior detailing focus', 'interior detailing focus', 'full service showcase']
        },
        {
          category: 'before-after',
          name: 'Before & After Transformations',
          description: 'Dramatic before/after comparisons showing service results',
          promptTemplate: 'Auto detailing transformation, {vehicle_type} {before_or_after} professional detailing service, realistic automotive photography, {transformation_context}',
          defaultQuantity: 6,
          recommendedDimensions: [
            { width: 800, height: 600 },
            { width: 1024, height: 768 }
          ],
          priority: 'high',
          styleHints: ['realistic photography', 'clear transformation', 'professional results'],
          variations: ['sedan', 'SUV', 'luxury car', 'truck', 'motorcycle']
        },
        {
          category: 'service',
          name: 'Service Showcase',
          description: 'Individual services being performed',
          promptTemplate: 'Professional auto detailing service, {service_type} in progress, skilled technician using professional equipment, clean organized workspace, high-quality automotive care',
          defaultQuantity: 6,
          recommendedDimensions: [
            { width: 600, height: 400 },
            { width: 800, height: 600 }
          ],
          priority: 'high',
          styleHints: ['action shot', 'professional technique', 'quality equipment'],
          variations: ['exterior washing', 'paint correction', 'interior detailing', 'wheel cleaning', 'engine bay cleaning', 'ceramic coating application']
        },
        {
          category: 'team',
          name: 'Team Members',
          description: 'Professional staff portraits',
          promptTemplate: 'Professional auto detailing technician portrait, confident pose, {business_tone} automotive service uniform, clean professional appearance, automotive service background',
          defaultQuantity: 4,
          recommendedDimensions: [
            { width: 400, height: 600 },
            { width: 500, height: 750 }
          ],
          priority: 'medium',
          styleHints: ['professional portrait', 'confident expression', 'uniform/branded clothing'],
          variations: ['senior technician', 'detailing specialist', 'customer service', 'team leader']
        },
        {
          category: 'equipment',
          name: 'Professional Equipment',
          description: 'High-end detailing tools and equipment',
          promptTemplate: 'Professional auto detailing equipment, {equipment_type}, organized workspace, quality automotive tools, clean professional environment',
          defaultQuantity: 4,
          recommendedDimensions: [
            { width: 800, height: 600 },
            { width: 600, height: 800 }
          ],
          priority: 'medium',
          styleHints: ['professional tools', 'organized display', 'quality equipment'],
          variations: ['pressure washers', 'polishing machines', 'vacuum systems', 'chemical products', 'protective equipment']
        },
        {
          category: 'location',
          name: 'Facility Images',
          description: 'Professional service facility and workspace',
          promptTemplate: 'Professional auto detailing facility, clean organized service bays, modern automotive service environment, professional workspace, inviting customer area',
          defaultQuantity: 3,
          recommendedDimensions: [
            { width: 1200, height: 800 },
            { width: 1000, height: 750 }
          ],
          priority: 'medium',
          styleHints: ['clean environment', 'professional facility', 'organized workspace'],
          variations: ['service bay', 'customer waiting area', 'exterior facility']
        }
      ]
    },

    'coffee-shops': {
      id: 'coffee-shops',
      name: 'Coffee Shops',
      category: 'food-beverage',
      description: 'Cozy coffee shops and cafes',
      beforeAfterSupport: false,
      preferredModels: ['sdxl', 'flux-dev'],
      commonPromptElements: [
        'warm inviting atmosphere',
        'professional food photography',
        'cozy coffee shop ambiance',
        'artisan coffee culture',
        'welcoming cafe environment'
      ],
      negativePrompts: [
        'cold atmosphere', 'poor food presentation', 'unappetizing',
        'cluttered space', 'unprofessional', 'harsh lighting'
      ],
      stylePresets: [
        {
          name: 'Cozy Artisan',
          description: 'Warm, inviting artisan coffee shop atmosphere',
          promptModifiers: ['warm lighting', 'cozy atmosphere', 'artisan coffee', 'rustic charm', 'inviting ambiance'],
          negativePrompts: ['cold lighting', 'sterile environment', 'corporate feel'],
          preferredModel: 'sdxl',
          mood: 'warm'
        },
        {
          name: 'Modern Minimalist',
          description: 'Clean, modern coffee shop design',
          promptModifiers: ['modern design', 'minimalist aesthetic', 'clean lines', 'contemporary coffee shop'],
          negativePrompts: ['cluttered', 'outdated design', 'messy'],
          preferredModel: 'flux-dev',
          mood: 'modern'
        }
      ],
      imageCategories: [
        {
          category: 'hero',
          name: 'Coffee Shop Hero',
          description: 'Inviting coffee shop atmosphere',
          promptTemplate: 'Inviting coffee shop interior, {business_tone} atmosphere, customers enjoying coffee, warm lighting, cozy seating area, artisan coffee culture',
          defaultQuantity: 3,
          recommendedDimensions: [
            { width: 1920, height: 1080 },
            { width: 1600, height: 900 }
          ],
          priority: 'high',
          styleHints: ['warm atmosphere', 'inviting space', 'coffee culture'],
          variations: ['morning rush', 'quiet afternoon', 'evening ambiance']
        },
        {
          category: 'product',
          name: 'Coffee & Menu Items',
          description: 'Beautifully presented coffee drinks and food',
          promptTemplate: 'Professional coffee photography, {product_type}, artisan presentation, beautiful latte art, appetizing food styling, warm natural lighting',
          defaultQuantity: 8,
          recommendedDimensions: [
            { width: 600, height: 600 },
            { width: 800, height: 600 }
          ],
          priority: 'high',
          styleHints: ['food photography', 'appetizing presentation', 'latte art'],
          variations: ['espresso drinks', 'latte art', 'pastries', 'sandwiches', 'seasonal specials', 'cold brew', 'tea selection', 'desserts']
        },
        {
          category: 'team',
          name: 'Barista Team',
          description: 'Skilled baristas at work',
          promptTemplate: 'Professional barista portrait, skilled coffee preparation, {business_tone} coffee shop uniform, friendly welcoming expression, coffee shop background',
          defaultQuantity: 3,
          recommendedDimensions: [
            { width: 400, height: 600 },
            { width: 500, height: 750 }
          ],
          priority: 'medium',
          styleHints: ['professional barista', 'friendly expression', 'coffee preparation'],
          variations: ['head barista', 'latte art specialist', 'customer service']
        },
        {
          category: 'location',
          name: 'Cafe Atmosphere',
          description: 'Coffee shop interior and seating areas',
          promptTemplate: 'Coffee shop interior design, {area_type}, cozy seating arrangement, warm inviting atmosphere, modern cafe furniture, natural lighting',
          defaultQuantity: 4,
          recommendedDimensions: [
            { width: 1200, height: 800 },
            { width: 1000, height: 750 }
          ],
          priority: 'medium',
          styleHints: ['cozy interior', 'comfortable seating', 'atmospheric lighting'],
          variations: ['main seating area', 'counter service', 'outdoor seating', 'reading corner']
        }
      ]
    },

    'hair-salons': {
      id: 'hair-salons',
      name: 'Hair Salons',
      category: 'beauty',
      description: 'Professional hair styling and beauty services',
      beforeAfterSupport: true,
      preferredModels: ['flux-dev', 'realvis-xl', 'instruct-pix2pix'],
      commonPromptElements: [
        'professional beauty salon',
        'skilled hair stylist',
        'modern salon equipment',
        'elegant beauty environment',
        'professional hair care'
      ],
      negativePrompts: [
        'unprofessional appearance', 'messy salon', 'poor lighting',
        'amateur styling', 'outdated equipment', 'cluttered workspace'
      ],
      stylePresets: [
        {
          name: 'Luxury Salon',
          description: 'High-end luxury salon environment',
          promptModifiers: ['luxury salon interior', 'premium beauty services', 'elegant atmosphere', 'high-end equipment'],
          negativePrompts: ['budget salon', 'basic equipment', 'plain interior'],
          preferredModel: 'flux-dev',
          mood: 'luxury'
        },
        {
          name: 'Modern Professional',
          description: 'Contemporary professional salon',
          promptModifiers: ['modern salon design', 'professional beauty services', 'contemporary styling', 'clean aesthetic'],
          negativePrompts: ['outdated design', 'amateur setup', 'cluttered'],
          preferredModel: 'realvis-xl',
          mood: 'professional'
        }
      ],
      imageCategories: [
        {
          category: 'hero',
          name: 'Salon Hero',
          description: 'Beautiful salon atmosphere and service',
          promptTemplate: 'Professional hair salon hero image, skilled stylist working with client, {business_tone} salon environment, modern beauty salon, elegant atmosphere',
          defaultQuantity: 3,
          recommendedDimensions: [
            { width: 1920, height: 1080 },
            { width: 1600, height: 900 }
          ],
          priority: 'high',
          styleHints: ['professional service', 'elegant salon', 'skilled stylist'],
          variations: ['cutting service', 'coloring service', 'styling service']
        },
        {
          category: 'before-after',
          name: 'Hair Transformations',
          description: 'Dramatic hair transformation results',
          promptTemplate: 'Hair transformation {before_or_after}, professional hair styling, {transformation_type}, realistic beauty photography, salon quality results',
          defaultQuantity: 6,
          recommendedDimensions: [
            { width: 600, height: 800 },
            { width: 500, height: 750 }
          ],
          priority: 'high',
          styleHints: ['professional styling', 'dramatic transformation', 'beauty photography'],
          variations: ['color transformation', 'cut and style', 'special occasion styling']
        },
        {
          category: 'service',
          name: 'Beauty Services',
          description: 'Various salon services being performed',
          promptTemplate: 'Professional {service_type} service, skilled beautician, modern salon equipment, professional beauty treatment, elegant salon environment',
          defaultQuantity: 5,
          recommendedDimensions: [
            { width: 800, height: 600 },
            { width: 600, height: 800 }
          ],
          priority: 'high',
          styleHints: ['professional service', 'skilled technique', 'modern equipment'],
          variations: ['hair cutting', 'hair coloring', 'hair styling', 'hair treatment', 'makeup application']
        },
        {
          category: 'team',
          name: 'Salon Team',
          description: 'Professional stylists and beauty experts',
          promptTemplate: 'Professional hair stylist portrait, confident beauty expert, {business_tone} salon uniform, skilled professional appearance, salon background',
          defaultQuantity: 4,
          recommendedDimensions: [
            { width: 400, height: 600 },
            { width: 500, height: 750 }
          ],
          priority: 'medium',
          styleHints: ['professional portrait', 'confident pose', 'beauty expert'],
          variations: ['senior stylist', 'colorist specialist', 'beauty consultant', 'salon manager']
        },
        {
          category: 'location',
          name: 'Salon Interior',
          description: 'Beautiful salon interior and stations',
          promptTemplate: 'Professional hair salon interior, {area_type}, modern beauty salon design, elegant styling stations, professional salon atmosphere',
          defaultQuantity: 4,
          recommendedDimensions: [
            { width: 1200, height: 800 },
            { width: 1000, height: 750 }
          ],
          priority: 'medium',
          styleHints: ['salon interior design', 'professional atmosphere', 'modern equipment'],
          variations: ['styling stations', 'washing area', 'reception area', 'treatment rooms']
        }
      ]
    },

    'house-cleaning': {
      id: 'house-cleaning',
      name: 'House Cleaning Services',
      category: 'home-services',
      description: 'Professional residential cleaning services',
      beforeAfterSupport: true,
      preferredModels: ['realvis-xl', 'instruct-pix2pix', 'sdxl'],
      commonPromptElements: [
        'professional cleaning service',
        'spotless clean results',
        'organized home environment',
        'quality cleaning supplies',
        'professional cleaning team'
      ],
      negativePrompts: [
        'messy appearance', 'dirty environment', 'unprofessional service',
        'cluttered space', 'amateur cleaning', 'poor results'
      ],
      stylePresets: [
        {
          name: 'Pristine Clean',
          description: 'Spotless, professionally cleaned spaces',
          promptModifiers: ['spotless clean', 'pristine condition', 'professional cleaning results', 'organized space'],
          negativePrompts: ['messy', 'cluttered', 'dirty', 'disorganized'],
          preferredModel: 'realvis-xl',
          mood: 'professional'
        },
        {
          name: 'Homely Fresh',
          description: 'Clean, warm, inviting home environment',
          promptModifiers: ['fresh clean home', 'inviting atmosphere', 'comfortable living space', 'well-maintained'],
          negativePrompts: ['sterile', 'cold', 'unwelcoming', 'institutional'],
          preferredModel: 'sdxl',
          mood: 'warm'
        }
      ],
      imageCategories: [
        {
          category: 'hero',
          name: 'Cleaning Service Hero',
          description: 'Professional cleaning service in action',
          promptTemplate: 'Professional house cleaning service hero image, skilled cleaning team, pristine clean home interior, {business_tone} cleaning service, quality results',
          defaultQuantity: 3,
          recommendedDimensions: [
            { width: 1920, height: 1080 },
            { width: 1600, height: 900 }
          ],
          priority: 'high',
          styleHints: ['professional service', 'clean results', 'skilled team'],
          variations: ['team cleaning', 'individual cleaner', 'results focus']
        },
        {
          category: 'before-after',
          name: 'Cleaning Transformations',
          description: 'Dramatic before/after cleaning results',
          promptTemplate: 'House cleaning transformation, {room_type} {before_or_after} professional cleaning service, realistic interior photography, {cleaning_context}',
          defaultQuantity: 6,
          recommendedDimensions: [
            { width: 800, height: 600 },
            { width: 1024, height: 768 }
          ],
          priority: 'high',
          styleHints: ['realistic photography', 'clear transformation', 'professional results'],
          variations: ['kitchen', 'bathroom', 'living room', 'bedroom', 'office', 'entire home']
        }
      ]
    }

    // Add more business templates...
  };

  getTemplate(businessType: string): BusinessTemplate | null {
    return this.templates[businessType] || null;
  }

  getAllTemplates(): BusinessTemplate[] {
    return Object.values(this.templates);
  }

  getTemplatesByCategory(category: string): BusinessTemplate[] {
    return Object.values(this.templates).filter(template => template.category === category);
  }

  // Generate prompts using template
  generatePrompt(
    businessType: string,
    imageCategory: string,
    style?: string,
    variables?: Record<string, string>
  ): string | null {
    const template = this.getTemplate(businessType);
    if (!template) return null;

    const categoryTemplate = template.imageCategories.find(cat => cat.category === imageCategory);
    if (!categoryTemplate) return null;

    let prompt = categoryTemplate.promptTemplate;

    // Replace template variables
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
      });
    }

    // Add style modifiers if specified
    if (style) {
      const stylePreset = template.stylePresets.find(preset => preset.name.toLowerCase().includes(style.toLowerCase()));
      if (stylePreset) {
        prompt += ', ' + stylePreset.promptModifiers.join(', ');
      }
    }

    // Add common elements
    prompt += ', ' + template.commonPromptElements.join(', ');

    return prompt;
  }

  // Get negative prompts for a business type and style
  getNegativePrompts(businessType: string, style?: string): string[] {
    const template = this.getTemplate(businessType);
    if (!template) return [];

    let negativePrompts = [...template.negativePrompts];

    if (style) {
      const stylePreset = template.stylePresets.find(preset => preset.name.toLowerCase().includes(style.toLowerCase()));
      if (stylePreset) {
        negativePrompts = negativePrompts.concat(stylePreset.negativePrompts);
      }
    }

    return negativePrompts;
  }

  // Get recommended model for business type and image category
  getRecommendedModel(businessType: string, imageCategory: string): string {
    const template = this.getTemplate(businessType);
    if (!template) return 'sdxl';

    // const categoryTemplate = template.imageCategories.find(cat => cat.category === imageCategory);
    
    // For before-after, prefer image-to-image models
    if (imageCategory === 'before-after' && template.beforeAfterSupport) {
      return 'instruct-pix2pix';
    }

    // For high-quality portraits (team photos), prefer photorealistic models
    if (imageCategory === 'team') {
      return template.preferredModels.includes('flux-dev') ? 'flux-dev' : 'realvis-xl';
    }

    // Return first preferred model or default
    return template.preferredModels[0] || 'sdxl';
  }

  // Create template variations for prompt diversity
  createVariations(
    businessType: string,
    imageCategory: string,
    count: number = 3
  ): string[] {
    const template = this.getTemplate(businessType);
    if (!template) return [];

    const categoryTemplate = template.imageCategories.find(cat => cat.category === imageCategory);
    if (!categoryTemplate || !categoryTemplate.variations) return [];

    const variations: string[] = [];
    const basePrompt = categoryTemplate.promptTemplate;

    // Create variations using the defined variation options
    for (let i = 0; i < Math.min(count, categoryTemplate.variations.length); i++) {
      const variation = categoryTemplate.variations[i];
      const variationPrompt = basePrompt.replace(/\{[^}]+\}/g, variation);
      variations.push(variationPrompt + ', ' + template.commonPromptElements.join(', '));
    }

    return variations;
  }
}

export default BusinessTemplateManager;