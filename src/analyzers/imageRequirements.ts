import PRDAnalyzer, { BusinessContext, ImageRequirement } from './prdAnalyzer';
import SchemaAnalyzer, { DataModel, SchemaImageRequirement } from './schemaAnalyzer';

export interface CombinedImageRequirement extends ImageRequirement {
  modelSource?: string; // Which model this requirement came from
  fieldSource?: string; // Which field this requirement came from
  merged: boolean; // Whether this requirement was merged from multiple sources
}

export interface ProjectAnalysis {
  projectName: string;
  projectPath: string;
  businessContext: BusinessContext;
  dataModels: DataModel[];
  imageRequirements: CombinedImageRequirement[];
  estimatedImageCount: number;
  estimatedCost: number;
}

export class ImageRequirementsAnalyzer {
  private prdAnalyzer: PRDAnalyzer;
  private schemaAnalyzer: SchemaAnalyzer;

  // Cost estimation (approximate)
  private readonly costPerImage = {
    'dalle3': 0.04, // DALL-E 3 standard quality
    'dalle3-hd': 0.08, // DALL-E 3 HD quality
    'sdxl': 0.002, // Replicate SDXL
    'flux': 0.003 // Replicate Flux
  };

  constructor() {
    this.prdAnalyzer = new PRDAnalyzer();
    this.schemaAnalyzer = new SchemaAnalyzer();
  }

  async analyzeProject(projectPathOrData: string | {
    name: string;
    businessType: string;
    prdContent: string;
    schemaContent: string;
  }): Promise<ProjectAnalysis> {
    let prdResult: { context: BusinessContext; requirements: ImageRequirement[] };
    let schemaResult: { models: DataModel[]; imageRequirements: SchemaImageRequirement[] };
    let projectName: string;
    let projectPath: string;

    if (typeof projectPathOrData === 'string') {
      // File-based analysis
      prdResult = await this.prdAnalyzer.analyzePRD(projectPathOrData);
      schemaResult = await this.schemaAnalyzer.analyzeSchema(projectPathOrData);
      projectName = projectPathOrData.split('/').pop() || 'Unknown Project';
      projectPath = projectPathOrData;
    } else {
      // Content-based analysis
      const data = projectPathOrData;
      prdResult = await this.prdAnalyzer.analyzePRD(data.prdContent, data.name);
      schemaResult = await this.schemaAnalyzer.analyzeSchema(data.schemaContent);
      projectName = data.name;
      projectPath = 'manual-input';
      
      // Override business type from manual input
      prdResult.context.businessType = data.businessType;
    }
    
    // Combine and merge requirements
    const combinedRequirements = this.combineRequirements(
      prdResult.requirements, 
      schemaResult.imageRequirements,
      prdResult.context
    );

    const estimatedImageCount = combinedRequirements.reduce((total, req) => total + req.quantity, 0);
    const estimatedCost = this.estimateCost(combinedRequirements);

    return {
      projectName,
      projectPath,
      businessContext: prdResult.context,
      dataModels: schemaResult.models,
      imageRequirements: combinedRequirements,
      estimatedImageCount,
      estimatedCost
    };
  }

  private combineRequirements(
    prdRequirements: ImageRequirement[],
    schemaRequirements: SchemaImageRequirement[],
    businessContext: BusinessContext
  ): CombinedImageRequirement[] {
    const combined: CombinedImageRequirement[] = [];
    
    // Start with PRD requirements (these are more strategic)
    const prdCombined: CombinedImageRequirement[] = prdRequirements.map(req => ({
      ...req,
      merged: false
    }));

    // Process schema requirements and merge or add
    for (const schemaReq of schemaRequirements) {
      const mappedRequirement = this.mapSchemaToImageRequirement(schemaReq, businessContext);
      
      // Try to find a matching PRD requirement to merge with
      const existingReq = prdCombined.find(req => 
        req.category === mappedRequirement.category &&
        this.areDimensionsSimilar(req.dimensions, mappedRequirement.dimensions)
      );

      if (existingReq) {
        // Merge with existing requirement
        existingReq.quantity = Math.max(existingReq.quantity, mappedRequirement.quantity);
        existingReq.context += ` | ${mappedRequirement.context}`;
        existingReq.modelSource = schemaReq.modelName;
        existingReq.fieldSource = schemaReq.fieldName;
        existingReq.merged = true;
      } else {
        // Add as new requirement
        combined.push({
          ...mappedRequirement,
          modelSource: schemaReq.modelName,
          fieldSource: schemaReq.fieldName,
          merged: false
        });
      }
    }

    // Combine PRD and unique schema requirements
    combined.unshift(...prdCombined);

    // Sort by priority
    return this.sortByPriority(combined);
  }

  private mapSchemaToImageRequirement(
    schemaReq: SchemaImageRequirement, 
    businessContext: BusinessContext
  ): CombinedImageRequirement {
    const categoryMap: Record<string, CombinedImageRequirement['category']> = {
      'single': this.getCategoryFromContext(schemaReq.context),
      'gallery': 'gallery',
      'before-after': 'before-after',
      'profile': 'team'
    };

    const category = categoryMap[schemaReq.imageType] || 'gallery';
    
    return {
      category,
      quantity: schemaReq.expectedCount,
      dimensions: schemaReq.suggestedDimensions,
      aspectRatio: this.calculateAspectRatio(schemaReq.suggestedDimensions),
      style: businessContext.brandTone,
      subject: this.generateSubject(schemaReq, businessContext),
      context: schemaReq.context,
      priority: this.determinePriority(category, schemaReq.modelName),
      merged: false
    };
  }

  private getCategoryFromContext(context: string): CombinedImageRequirement['category'] {
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('product') || contextLower.includes('service')) return 'service';
    if (contextLower.includes('team') || contextLower.includes('staff')) return 'team';
    if (contextLower.includes('location') || contextLower.includes('facility')) return 'location';
    if (contextLower.includes('equipment')) return 'equipment';
    if (contextLower.includes('hero') || contextLower.includes('banner')) return 'hero';
    
    return 'gallery';
  }

  private calculateAspectRatio(dimensions: { width: number; height: number }): CombinedImageRequirement['aspectRatio'] {
    const ratio = dimensions.width / dimensions.height;
    
    if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
    if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 3/2) < 0.1) return '3:2';
    if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
    
    return '16:9'; // Default
  }

  private generateSubject(schemaReq: SchemaImageRequirement, businessContext: BusinessContext): string {
    const subjects: string[] = [];
    
    subjects.push(businessContext.businessType);
    
    if (schemaReq.modelName.toLowerCase().includes('service')) {
      subjects.push('service showcase');
    } else if (schemaReq.modelName.toLowerCase().includes('product')) {
      subjects.push('product display');
    } else if (schemaReq.modelName.toLowerCase().includes('team')) {
      subjects.push('team member');
    } else if (schemaReq.modelName.toLowerCase().includes('gallery')) {
      subjects.push('work showcase');
    }

    return subjects.join(' - ');
  }

  private determinePriority(
    category: CombinedImageRequirement['category'], 
    modelName: string
  ): CombinedImageRequirement['priority'] {
    // High priority categories
    if (['hero', 'service', 'before-after'].includes(category)) {
      return 'high';
    }
    
    // Important models get medium priority
    if (['User', 'Service', 'Product', 'Gallery'].some(important => 
      modelName.toLowerCase().includes(important.toLowerCase())
    )) {
      return 'medium';
    }
    
    return 'low';
  }

  private areDimensionsSimilar(
    dim1: { width: number; height: number }, 
    dim2: { width: number; height: number }
  ): boolean {
    const ratio1 = dim1.width / dim1.height;
    const ratio2 = dim2.width / dim2.height;
    return Math.abs(ratio1 - ratio2) < 0.2; // Allow 20% difference in aspect ratio
  }

  private sortByPriority(requirements: CombinedImageRequirement[]): CombinedImageRequirement[] {
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    
    return requirements.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by quantity (more images = higher priority)
      return b.quantity - a.quantity;
    });
  }

  private estimateCost(requirements: CombinedImageRequirement[]): number {
    let totalCost = 0;
    
    for (const req of requirements) {
      // Use different models based on requirements
      let costPerImage = this.costPerImage['sdxl']; // Default to cheaper option
      
      if (req.category === 'hero' || req.priority === 'high') {
        costPerImage = this.costPerImage['dalle3-hd']; // Use high-quality for important images
      } else if (req.category === 'before-after') {
        costPerImage = this.costPerImage['flux']; // Use Flux for transformations
      }
      
      totalCost += req.quantity * costPerImage;
    }
    
    return Math.round(totalCost * 100) / 100; // Round to cents
  }

  // Utility methods for the UI
  getRequirementsByCategory(requirements: CombinedImageRequirement[]): Record<string, CombinedImageRequirement[]> {
    const grouped: Record<string, CombinedImageRequirement[]> = {};
    
    for (const req of requirements) {
      if (!grouped[req.category]) {
        grouped[req.category] = [];
      }
      grouped[req.category].push(req);
    }
    
    return grouped;
  }

  getTotalImageCount(requirements: CombinedImageRequirement[]): number {
    return requirements.reduce((total, req) => total + req.quantity, 0);
  }

  getRequirementsByPriority(requirements: CombinedImageRequirement[]): Record<string, CombinedImageRequirement[]> {
    const grouped: Record<string, CombinedImageRequirement[]> = {
      high: [],
      medium: [],
      low: []
    };
    
    for (const req of requirements) {
      grouped[req.priority].push(req);
    }
    
    return grouped;
  }

  // Generate a summary for the UI
  generateSummary(analysis: ProjectAnalysis): string {
    const totalImages = analysis.estimatedImageCount;
    const categories = Object.keys(this.getRequirementsByCategory(analysis.imageRequirements));
    const highPriority = analysis.imageRequirements.filter(req => req.priority === 'high').length;
    
    return `${analysis.businessContext.businessType} project needs ${totalImages} images across ${categories.length} categories (${highPriority} high priority). Estimated cost: $${analysis.estimatedCost}.`;
  }
}

export default ImageRequirementsAnalyzer;