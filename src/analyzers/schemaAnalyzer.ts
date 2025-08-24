import fs from 'fs';
import path from 'path';

export interface DataModel {
  name: string;
  fields: ModelField[];
  imageFields: string[];
  category: string;
}

export interface ModelField {
  name: string;
  type: string;
  isArray: boolean;
  isOptional: boolean;
  description?: string;
}

export interface SchemaImageRequirement {
  modelName: string;
  fieldName: string;
  imageType: 'single' | 'gallery' | 'before-after' | 'profile';
  expectedCount: number;
  suggestedDimensions: { width: number; height: number };
  context: string;
}

export class SchemaAnalyzer {
  private imageFieldPatterns = [
    'image', 'photo', 'picture', 'avatar', 'thumbnail', 'banner', 
    'gallery', 'photos', 'images', 'portfolio', 'showcase'
  ];

  private beforeAfterPatterns = [
    'before', 'after', 'transformation', 'result', 'outcome'
  ];

  async analyzeSchema(contentOrPath: string): Promise<{ 
    models: DataModel[]; 
    imageRequirements: SchemaImageRequirement[] 
  }> {
    let schemaContent: string;

    // Check if it's content or file path
    if (contentOrPath.includes('model ') || contentOrPath.includes('generator ') || !contentOrPath.includes('/')) {
      // It's content
      schemaContent = contentOrPath;
    } else {
      // It's a file path
      const schemaPath = path.join(contentOrPath, 'prisma', 'schema.prisma');
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }

      schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    }

    const models = this.parseModels(schemaContent);
    const imageRequirements = this.generateImageRequirements(models);

    return { models, imageRequirements };
  }

  private parseModels(schemaContent: string): DataModel[] {
    const models: DataModel[] = [];
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
    
    let match;
    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      
      const fields = this.parseFields(modelBody);
      const imageFields = this.identifyImageFields(fields);
      const category = this.categorizeModel(modelName, fields);

      models.push({
        name: modelName,
        fields,
        imageFields,
        category
      });
    }

    return models;
  }

  private parseFields(modelBody: string): ModelField[] {
    const fields: ModelField[] = [];
    const fieldRegex = /(\w+)\s+([\w\[\]?]+)(?:\s+([^\n]*))?/g;
    
    let match;
    while ((match = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = match[1];
      const fieldType = match[2];
      const attributes = match[3] || '';
      
      // Skip Prisma directives and relations
      if (fieldName.startsWith('@@') || fieldName.startsWith('@')) {
        continue;
      }

      const isArray = fieldType.includes('[]');
      const isOptional = fieldType.includes('?');
      const cleanType = fieldType.replace('[]', '').replace('?', '');
      
      // Extract comment description
      const descriptionMatch = attributes.match(/\/\/\s*(.+)/);
      const description = descriptionMatch ? descriptionMatch[1].trim() : undefined;

      fields.push({
        name: fieldName,
        type: cleanType,
        isArray,
        isOptional,
        description
      });
    }

    return fields;
  }

  private identifyImageFields(fields: ModelField[]): string[] {
    const imageFields: string[] = [];

    for (const field of fields) {
      const fieldNameLower = field.name.toLowerCase();
      
      // Check if field name contains image-related keywords
      const isImageField = this.imageFieldPatterns.some(pattern => 
        fieldNameLower.includes(pattern)
      );

      // Check if it's a String type that could hold URLs/paths
      if (isImageField && (field.type === 'String' || field.isArray)) {
        imageFields.push(field.name);
      }

      // Check description for image-related context
      if (field.description && field.type === 'String') {
        const descLower = field.description.toLowerCase();
        if (this.imageFieldPatterns.some(pattern => descLower.includes(pattern))) {
          imageFields.push(field.name);
        }
      }
    }

    return imageFields;
  }

  private categorizeModel(modelName: string, fields: ModelField[]): string {
    const modelNameLower = modelName.toLowerCase();
    
    const categories = {
      'user-profile': ['user', 'profile', 'customer', 'member', 'account'],
      'product': ['product', 'item', 'menu', 'service', 'package'],
      'gallery': ['gallery', 'photo', 'image', 'portfolio', 'showcase'],
      'team': ['staff', 'team', 'employee', 'member', 'therapist', 'stylist'],
      'location': ['location', 'store', 'branch', 'facility', 'venue'],
      'booking': ['booking', 'appointment', 'reservation', 'order'],
      'review': ['review', 'testimonial', 'feedback', 'rating'],
      'vehicle': ['vehicle', 'car', 'auto'],
      'before-after': ['beforeafter', 'transformation', 'result']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => modelNameLower.includes(keyword))) {
        return category;
      }
    }

    // Check field names for additional context
    const fieldNames = fields.map(f => f.name.toLowerCase()).join(' ');
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => fieldNames.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private generateImageRequirements(models: DataModel[]): SchemaImageRequirement[] {
    const requirements: SchemaImageRequirement[] = [];

    for (const model of models) {
      for (const imageField of model.imageFields) {
        const requirement = this.createImageRequirement(model, imageField);
        if (requirement) {
          requirements.push(requirement);
        }
      }
    }

    return requirements;
  }

  private createImageRequirement(
    model: DataModel, 
    fieldName: string
  ): SchemaImageRequirement | null {
    const field = model.fields.find(f => f.name === fieldName);
    if (!field) return null;

    const fieldNameLower = fieldName.toLowerCase();
    const modelNameLower = model.name.toLowerCase();

    // Determine image type
    let imageType: 'single' | 'gallery' | 'before-after' | 'profile' = 'single';
    let expectedCount = 1;
    let suggestedDimensions = { width: 800, height: 600 };

    // Profile/Avatar images
    if (fieldNameLower.includes('avatar') || fieldNameLower.includes('profile')) {
      imageType = 'profile';
      suggestedDimensions = { width: 400, height: 400 };
      expectedCount = 1;
    }
    // Gallery/Portfolio images
    else if (field.isArray || fieldNameLower.includes('gallery') || fieldNameLower.includes('photos')) {
      imageType = 'gallery';
      suggestedDimensions = { width: 800, height: 800 };
      expectedCount = this.getExpectedGalleryCount(model.category);
    }
    // Before/After images
    else if (this.beforeAfterPatterns.some(pattern => fieldNameLower.includes(pattern))) {
      imageType = 'before-after';
      suggestedDimensions = { width: 800, height: 600 };
      expectedCount = 2; // Before and after pair
    }
    // Hero/Banner images
    else if (fieldNameLower.includes('hero') || fieldNameLower.includes('banner')) {
      suggestedDimensions = { width: 1920, height: 1080 };
      expectedCount = 1;
    }
    // Product/Service images
    else if (model.category === 'product' || modelNameLower.includes('service')) {
      suggestedDimensions = { width: 600, height: 400 };
      expectedCount = 1;
    }

    // Adjust dimensions based on model category
    suggestedDimensions = this.adjustDimensionsForCategory(model.category, suggestedDimensions);

    return {
      modelName: model.name,
      fieldName,
      imageType,
      expectedCount,
      suggestedDimensions,
      context: this.generateContext(model, fieldName, field.description)
    };
  }

  private getExpectedGalleryCount(category: string): number {
    const galleryCounts: Record<string, number> = {
      'gallery': 8,
      'product': 5,
      'team': 4,
      'location': 3,
      'before-after': 6,
      'user-profile': 1,
      'vehicle': 4
    };

    return galleryCounts[category] || 5;
  }

  private adjustDimensionsForCategory(
    category: string, 
    baseDimensions: { width: number; height: number }
  ): { width: number; height: number } {
    const adjustments: Record<string, { width: number; height: number }> = {
      'user-profile': { width: 400, height: 400 }, // Square for profiles
      'team': { width: 300, height: 400 }, // Portrait for team members
      'product': { width: 600, height: 400 }, // 3:2 for products
      'location': { width: 1200, height: 800 }, // Landscape for locations
      'vehicle': { width: 800, height: 600 }, // 4:3 for vehicles
      'gallery': { width: 800, height: 800 } // Square for gallery
    };

    return adjustments[category] || baseDimensions;
  }

  private generateContext(model: DataModel, fieldName: string, description?: string): string {
    const contexts: string[] = [];
    
    // Add model context
    contexts.push(`${model.name} model`);
    
    // Add field context
    contexts.push(`${fieldName} field`);
    
    // Add category context
    if (model.category !== 'general') {
      contexts.push(`${model.category} category`);
    }
    
    // Add description if available
    if (description) {
      contexts.push(description);
    }

    // Add business-specific context
    const businessContext = this.getBusinessContextForModel(model);
    if (businessContext) {
      contexts.push(businessContext);
    }

    return contexts.join(' - ');
  }

  private getBusinessContextForModel(model: DataModel): string | null {
    const modelNameLower = model.name.toLowerCase();
    
    const businessContexts: Record<string, string> = {
      'vehicle': 'automotive business context',
      'service': 'service-based business context',
      'product': 'product showcase context',
      'menu': 'food and beverage context',
      'appointment': 'appointment-based service context',
      'treatment': 'healthcare/wellness context',
      'package': 'service package context',
      'portfolio': 'creative/professional showcase context',
      'gallery': 'visual showcase context'
    };

    for (const [keyword, context] of Object.entries(businessContexts)) {
      if (modelNameLower.includes(keyword)) {
        return context;
      }
    }

    return null;
  }

  // Utility method to get all unique image categories from models
  getImageCategories(models: DataModel[]): string[] {
    const categories = new Set<string>();
    
    for (const model of models) {
      if (model.imageFields.length > 0) {
        categories.add(model.category);
      }
    }

    return Array.from(categories);
  }

  // Method to estimate total images needed
  estimateImageCount(requirements: SchemaImageRequirement[]): number {
    return requirements.reduce((total, req) => total + req.expectedCount, 0);
  }
}

export default SchemaAnalyzer;