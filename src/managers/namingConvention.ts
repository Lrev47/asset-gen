// import { CombinedImageRequirement, BusinessContext } from '@/analyzers/imageRequirements';

export interface NamingConfig {
  pattern: string;
  includeTimestamp: boolean;
  includeGenerator: boolean;
  includeIndex: boolean;
  includeDimensions: boolean;
  separator: string;
  maxLength: number;
  sanitizeSpecialChars: boolean;
  caseFormat: 'lowercase' | 'uppercase' | 'camelCase' | 'kebab-case' | 'snake_case';
}

export interface FileNamingContext {
  businessType: string;
  projectName: string;
  category: string;
  subcategory?: string;
  variant?: string;
  index?: number;
  generator: 'dalle' | 'replicate' | 'other';
  model: string;
  dimensions: { width: number; height: number };
  format: string;
  timestamp?: Date;
  beforeAfter?: 'before' | 'after';
  customTags?: string[];
}

export interface OrganizationStructure {
  baseDir: string;
  createBusinessFolders: boolean;
  createCategoryFolders: boolean;
  createDateFolders: boolean;
  createGeneratorFolders: boolean;
  folderStructure: string[]; // Array of folder levels
}

export class NamingConventionManager {
  private defaultConfig: NamingConfig = {
    pattern: '{businessType}_{category}_{variant}_{index}_{dimensions}',
    includeTimestamp: false,
    includeGenerator: false,
    includeIndex: true,
    includeDimensions: true,
    separator: '_',
    maxLength: 100,
    sanitizeSpecialChars: true,
    caseFormat: 'kebab-case'
  };

  private businessTypeAbbreviations: Record<string, string> = {
    'auto-detailing-shops': 'auto-detail',
    'house-cleaning-services': 'house-clean',
    'coffee-shops': 'coffee',
    'hair-salons': 'hair-salon',
    'real-estate-agencies': 'real-estate',
    'dental-practices': 'dental',
    'law-firms': 'legal',
    'marketing-agencies': 'marketing',
    'financial-advisory': 'finance',
    'hvac-contractor': 'hvac',
    'roofing-companies': 'roofing',
    'electrical-contractor': 'electric',
    'general-contractors': 'contractor',
    'pressure-washing': 'pressure-wash',
    'carpet-cleaning': 'carpet-clean',
    'landscaping-business': 'landscape',
    'flooring-companies': 'flooring',
    'plumbing-services': 'plumbing',
    'painting-contractors': 'painting',
    'handyman-services': 'handyman',
    'pest-control': 'pest-control',
    'window-cleaning': 'window-clean',
    'tree-removal': 'tree-service',
    'snow-removal': 'snow-removal',
    'moving-companies': 'moving',
    'catering-companies': 'catering',
    'food-trucks': 'food-truck',
    'pizza-shops': 'pizza',
    'small-bakeries': 'bakery',
    'photographers': 'photo',
    'dance-studios': 'dance',
    'martial-arts-dojos': 'martial-arts',
    'yoga-studios': 'yoga',
    'fitness-centers': 'fitness',
    'personal-trainers': 'trainer',
    'nail-salons': 'nails',
    'med-spas': 'med-spa',
    'tattoo-parlors': 'tattoo',
    'daycare-centers': 'daycare',
    'tutors': 'tutoring',
    'music-schools': 'music',
    'driving-schools': 'driving',
    'party-rental': 'party-rental',
    'locksmith-services': 'locksmith',
    'notary-services': 'notary',
    'insurance-agencies': 'insurance',
    'veterinary-clinics': 'vet'
  };

  private categoryAbbreviations: Record<string, string> = {
    'hero': 'hero',
    'service': 'service',
    'before-after': 'ba',
    'team': 'team',
    'gallery': 'gallery',
    'product': 'product',
    'location': 'location',
    'equipment': 'equipment'
  };

  generateFilename(
    context: FileNamingContext,
    config: Partial<NamingConfig> = {}
  ): string {
    const finalConfig = { ...this.defaultConfig, ...config };
    let filename = finalConfig.pattern;

    // Replace pattern variables
    const replacements = this.buildReplacements(context, finalConfig);
    
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{${key}}`, 'g');
      filename = filename.replace(regex, value);
    }

    // Remove any unreplaced variables
    filename = filename.replace(/{[^}]+}/g, '');

    // Clean up multiple separators
    const separator = finalConfig.separator;
    filename = filename.replace(new RegExp(`${separator}+`, 'g'), separator);

    // Remove leading/trailing separators
    filename = filename.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

    // Apply case formatting
    filename = this.applyCase(filename, finalConfig.caseFormat);

    // Sanitize special characters
    if (finalConfig.sanitizeSpecialChars) {
      filename = this.sanitizeFilename(filename, separator);
    }

    // Enforce max length
    if (filename.length > finalConfig.maxLength) {
      filename = this.truncateFilename(filename, finalConfig.maxLength, context.format);
    }

    // Add file extension
    return `${filename}.${context.format}`;
  }

  private buildReplacements(
    context: FileNamingContext,
    config: NamingConfig
  ): Record<string, string> {
    const replacements: Record<string, string> = {
      businessType: this.getBusinessTypeAbbreviation(context.businessType),
      projectName: this.sanitizeForFilename(context.projectName),
      category: this.categoryAbbreviations[context.category] || context.category,
      subcategory: context.subcategory || '',
      variant: context.variant || '',
      generator: context.generator,
      model: this.getModelAbbreviation(context.model),
      dimensions: this.formatDimensions(context.dimensions),
      format: context.format,
      beforeAfter: context.beforeAfter || ''
    };

    // Add index if requested
    if (config.includeIndex && context.index !== undefined) {
      replacements.index = String(context.index).padStart(2, '0');
    }

    // Add timestamp if requested
    if (config.includeTimestamp && context.timestamp) {
      replacements.timestamp = this.formatTimestamp(context.timestamp);
    }

    // Add custom tags
    if (context.customTags && context.customTags.length > 0) {
      replacements.tags = context.customTags.join('-');
    }

    // Filter out empty values
    return Object.fromEntries(
      Object.entries(replacements).filter(([_key, value]) => value !== '')
    );
  }

  private getBusinessTypeAbbreviation(businessType: string): string {
    const normalized = businessType.toLowerCase().replace(/\s+/g, '-');
    return this.businessTypeAbbreviations[normalized] || 
           normalized.replace(/[^a-z0-9-]/g, '').substring(0, 10);
  }

  private getModelAbbreviation(model: string): string {
    const abbreviations: Record<string, string> = {
      'dall-e-3': 'dalle3',
      'dall-e-2': 'dalle2',
      'stability-ai/sdxl': 'sdxl',
      'black-forest-labs/flux-dev': 'flux',
      'SG161222/RealVisXL': 'realvis',
      'timothybrooks/instruct-pix2pix': 'pix2pix'
    };

    return abbreviations[model] || model.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 8);
  }

  private formatDimensions(dimensions: { width: number; height: number }): string {
    return `${dimensions.width}x${dimensions.height}`;
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[-:T]/g, '').substring(0, 14);
  }

  private applyCase(text: string, caseFormat: NamingConfig['caseFormat']): string {
    switch (caseFormat) {
      case 'lowercase':
        return text.toLowerCase();
      case 'uppercase':
        return text.toUpperCase();
      case 'camelCase':
        return this.toCamelCase(text);
      case 'kebab-case':
        return this.toKebabCase(text);
      case 'snake_case':
        return this.toSnakeCase(text);
      default:
        return text;
    }
  }

  private toCamelCase(text: string): string {
    return text.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
  }

  private toKebabCase(text: string): string {
    return text.replace(/[_\s]+/g, '-').toLowerCase();
  }

  private toSnakeCase(text: string): string {
    return text.replace(/[-\s]+/g, '_').toLowerCase();
  }

  private sanitizeFilename(text: string, separator: string): string {
    // Remove or replace problematic characters
    return text
      .replace(/[<>:"/\\|?*]/g, '') // Remove illegal filename characters
      .replace(/\s+/g, separator) // Replace spaces with separator
      .replace(/[^\w.-]/g, separator) // Replace other special chars with separator
      .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove duplicate separators
  }

  private sanitizeForFilename(text: string): string {
    return text
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
  }

  private truncateFilename(filename: string, maxLength: number, extension: string): string {
    const extensionLength = extension.length + 1; // +1 for the dot
    const availableLength = maxLength - extensionLength;
    
    if (filename.length <= availableLength) {
      return filename;
    }

    return filename.substring(0, availableLength);
  }

  // Method to generate folder structure
  generateFolderStructure(
    context: FileNamingContext,
    structure: OrganizationStructure
  ): string {
    const folders: string[] = [structure.baseDir];

    for (const level of structure.folderStructure) {
      switch (level) {
        case 'business':
          if (structure.createBusinessFolders) {
            folders.push(this.sanitizeForFilename(context.businessType));
          }
          break;
        case 'category':
          if (structure.createCategoryFolders) {
            folders.push(context.category);
          }
          break;
        case 'date':
          if (structure.createDateFolders && context.timestamp) {
            const dateStr = context.timestamp.toISOString().split('T')[0];
            folders.push(dateStr);
          }
          break;
        case 'generator':
          if (structure.createGeneratorFolders) {
            folders.push(context.generator);
          }
          break;
      }
    }

    return folders.join('/');
  }

  // Method to create standardized naming for before/after pairs
  generateBeforeAfterPair(
    baseContext: FileNamingContext,
    config: Partial<NamingConfig> = {}
  ): { before: string; after: string } {
    const beforeContext = { ...baseContext, beforeAfter: 'before' as const };
    const afterContext = { ...baseContext, beforeAfter: 'after' as const };

    return {
      before: this.generateFilename(beforeContext, config),
      after: this.generateFilename(afterContext, config)
    };
  }

  // Method to generate batch filenames with sequential numbering
  generateBatchFilenames(
    baseContext: FileNamingContext,
    count: number,
    config: Partial<NamingConfig> = {}
  ): string[] {
    const filenames: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      const context = { ...baseContext, index: i };
      filenames.push(this.generateFilename(context, config));
    }

    return filenames;
  }

  // Method to generate variations of the same image
  generateVariationFilenames(
    baseContext: FileNamingContext,
    variations: string[],
    config: Partial<NamingConfig> = {}
  ): Record<string, string> {
    const filenames: Record<string, string> = {};
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      const context = { 
        ...baseContext, 
        variant: variation, 
        index: i + 1 
      };
      filenames[variation] = this.generateFilename(context, config);
    }

    return filenames;
  }

  // Utility method to validate filename
  validateFilename(filename: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check length
    if (filename.length > 255) {
      issues.push('Filename too long (max 255 characters)');
    }

    // Check for illegal characters
    const illegalChars = /[<>:"/\\|?*]/;
    if (illegalChars.test(filename)) {
      issues.push('Contains illegal characters');
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                          'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                          'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      issues.push('Uses reserved system name');
    }

    // Check for empty filename
    if (!filename.trim()) {
      issues.push('Filename cannot be empty');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Method to create metadata filename
  generateMetadataFilename(imageFilename: string): string {
    const baseName = imageFilename.split('.')[0];
    return `${baseName}.metadata.json`;
  }

  // Method to suggest improvements for filenames
  suggestImprovements(filename: string): string[] {
    const suggestions: string[] = [];

    if (filename.length > 50) {
      suggestions.push('Consider shortening filename for better readability');
    }

    if (!/\d/.test(filename)) {
      suggestions.push('Consider adding index number for better organization');
    }

    if (!/\d+x\d+/.test(filename)) {
      suggestions.push('Consider including dimensions in filename');
    }

    if (filename.includes(' ')) {
      suggestions.push('Replace spaces with hyphens or underscores');
    }

    return suggestions;
  }

  // Method to get default naming patterns for different use cases
  getDefaultPatterns(): Record<string, string> {
    return {
      'simple': '{businessType}_{category}_{index}',
      'detailed': '{businessType}_{category}_{variant}_{index}_{dimensions}',
      'timestamped': '{businessType}_{category}_{timestamp}_{index}',
      'generator-specific': '{generator}_{businessType}_{category}_{index}',
      'before-after': '{businessType}_{category}_{beforeAfter}_{index}_{dimensions}',
      'social-media': '{businessType}_{category}_{variant}_{dimensions}_social',
      'print-ready': '{businessType}_{category}_{dimensions}_print_{index}'
    };
  }

  // Method to create custom naming config for specific business types
  createBusinessSpecificConfig(businessType: string): Partial<NamingConfig> {
    const businessSpecificConfigs: Record<string, Partial<NamingConfig>> = {
      'auto-detailing': {
        pattern: '{businessType}_{category}_{beforeAfter}_{variant}_{index}_{dimensions}',
        includeIndex: true,
        separator: '_'
      },
      'coffee-shops': {
        pattern: '{businessType}_{category}_{variant}_{index}',
        includeTimestamp: false,
        caseFormat: 'kebab-case'
      },
      'hair-salons': {
        pattern: '{businessType}_{category}_{beforeAfter}_{index}_{dimensions}',
        includeIndex: true,
        separator: '_'
      },
      'photographers': {
        pattern: '{businessType}_{category}_{variant}_{timestamp}_{index}',
        includeTimestamp: true,
        separator: '_'
      }
    };

    const normalized = businessType.toLowerCase().replace(/\s+/g, '-');
    return businessSpecificConfigs[normalized] || {};
  }
}

export default NamingConventionManager;