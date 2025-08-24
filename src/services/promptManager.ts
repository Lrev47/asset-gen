import { PrismaClient } from '@prisma/client';
import ModelManager from './modelManager';
import TagLibrary from './tagLibrary';
import ProjectFieldManager from './projectFieldManager';
import { FieldRequirements } from '@/types/api';

const prisma = new PrismaClient();

export interface PromptSettings {
  steps?: number;
  cfgScale?: number;
  seed?: number;
  sampler?: string;
  scheduler?: string;
  customParameters?: Record<string, unknown>;
}

export interface CreatePromptData {
  fieldId: string;
  name: string;
  content: string;
  negativePrompt?: string;
  modelId: string;
  tagIds: string[];
  settings: PromptSettings;
}

export interface PromptGenerationOptions {
  style?: 'photorealistic' | 'artistic' | 'professional' | 'creative';
  mood?: 'bright' | 'warm' | 'cool' | 'dramatic' | 'soft';
  complexity?: 'simple' | 'detailed' | 'complex';
  includeNegativePrompt?: boolean;
  autoSelectTags?: boolean;
}

export class PromptManager {
  private static instance: PromptManager;

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  async createPrompt(promptData: CreatePromptData) {
    // Validate field exists
    const fieldManager = ProjectFieldManager.getInstance();
    const field = await fieldManager.getField(promptData.fieldId);
    if (!field) {
      throw new Error('Field not found');
    }

    // Validate model exists
    const modelManager = ModelManager.getInstance();
    const model = await modelManager.getModel(promptData.modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // Validate tags exist
    const tagLibrary = TagLibrary.getInstance();
    for (const tagId of promptData.tagIds) {
      const tag = await prisma.tag.findUnique({ where: { id: tagId } });
      if (!tag) {
        throw new Error(`Tag ${tagId} not found`);
      }
    }

    // Check for tag conflicts
    const tagValidation = await tagLibrary.validateTagCombination(promptData.tagIds);
    if (!tagValidation.valid) {
      throw new Error(`Tag conflicts detected: ${tagValidation.conflicts.map(c => c.displayName).join(', ')}`);
    }

    // Get next version number
    const existingPrompts = await prisma.prompt.findMany({
      where: { fieldId: promptData.fieldId },
      orderBy: { version: 'desc' },
      take: 1
    });
    const nextVersion = existingPrompts.length > 0 ? existingPrompts[0].version + 1 : 1;

    // Calculate estimated cost
    const requirements = field.requirements as unknown as FieldRequirements;
    const estimatedCost = await modelManager.calculateCost(promptData.modelId, requirements.quantity * requirements.variations);

    // Create prompt
    const prompt = await prisma.prompt.create({
      data: {
        fieldId: promptData.fieldId,
        version: nextVersion,
        name: promptData.name,
        content: promptData.content,
        negativePrompt: promptData.negativePrompt,
        modelId: promptData.modelId,
        settings: JSON.stringify(promptData.settings),
        estimatedCost
      },
      include: {
        model: true,
        field: {
          include: {
            assetType: true
          }
        }
      }
    });

    // Add tags
    for (const tagId of promptData.tagIds) {
      await prisma.promptTag.create({
        data: {
          promptId: prompt.id,
          tagId,
          weight: 1.0 // Default weight, can be customized later
        }
      });

      // Increment tag usage
      await tagLibrary.incrementTagUsage(tagId);
    }

    return await this.getPrompt(prompt.id);
  }

  async generatePrompt(fieldId: string, options: PromptGenerationOptions = {}) {
    const fieldManager = ProjectFieldManager.getInstance();
    const field = await fieldManager.getField(fieldId);
    if (!field) {
      throw new Error('Field not found');
    }

    const assetType = field.assetType;
    const requirements = field.requirements as unknown as FieldRequirements;

    // Build base prompt from field information
    let basePrompt = this.buildBasePrompt(field.name, field.description, assetType.displayName);

    // Add style-specific elements
    if (options.style) {
      basePrompt += this.getStyleModifier(options.style);
    }

    if (options.mood) {
      basePrompt += this.getMoodModifier(options.mood);
    }

    if (options.complexity) {
      basePrompt += this.getComplexityModifier(options.complexity);
    }

    // Add technical quality based on priority
    basePrompt += this.getQualityModifier(requirements.priority);

    // Suggest model
    const modelManager = ModelManager.getInstance();
    const recommendedModel = await modelManager.recommendModelForAssetType(assetType.name);

    // Auto-select tags if requested
    let suggestedTags: string[] = [];
    if (options.autoSelectTags) {
      suggestedTags = await this.getSuggestedTags(assetType.id, options);
    }

    // Generate negative prompt if requested
    let negativePrompt = '';
    if (options.includeNegativePrompt) {
      negativePrompt = this.generateNegativePrompt(options);
    }

    return {
      content: basePrompt.trim(),
      negativePrompt,
      suggestedModelId: recommendedModel?.id,
      suggestedTags,
      estimatedTokens: this.estimateTokens(basePrompt),
      suggestions: {
        improvements: this.generateImprovementSuggestions(basePrompt, options),
        alternatives: this.generateAlternativePrompts(basePrompt, 3)
      }
    };
  }

  async getPrompt(promptId: string) {
    return await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        model: true,
        field: {
          include: {
            assetType: true,
            project: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: { createdAt: 'desc' }
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  }

  async getFieldPrompts(fieldId: string) {
    return await prisma.prompt.findMany({
      where: { fieldId },
      include: {
        model: true,
        tags: {
          include: {
            tag: true
          }
        },
        images: true
      },
      orderBy: { version: 'desc' }
    });
  }

  async updatePrompt(promptId: string, updates: Partial<CreatePromptData>) {
    const existingPrompt = await this.getPrompt(promptId);
    if (!existingPrompt) {
      throw new Error('Prompt not found');
    }

    // If content changed, create new version
    if (updates.content && updates.content !== existingPrompt.content) {
      return await this.createPromptVersion(promptId, updates);
    }

    // Otherwise, update existing prompt
    const updateData: Partial<CreatePromptData> = { ...updates };
    delete updateData.tagIds; // Handle tags separately

    // const updatedPrompt = await prisma.prompt.update({
    //   where: { id: promptId },
    //   data: updateData
    // });

    // Update tags if provided
    if (updates.tagIds) {
      // Remove existing tags
      await prisma.promptTag.deleteMany({
        where: { promptId }
      });

      // Add new tags
      for (const tagId of updates.tagIds) {
        await prisma.promptTag.create({
          data: {
            promptId,
            tagId,
            weight: 1.0
          }
        });
      }
    }

    return await this.getPrompt(promptId);
  }

  async createPromptVersion(originalPromptId: string, updates: Partial<CreatePromptData>) {
    const originalPrompt = await this.getPrompt(originalPromptId);
    if (!originalPrompt) {
      throw new Error('Original prompt not found');
    }

    const newPromptData: CreatePromptData = {
      fieldId: originalPrompt.fieldId,
      name: updates.name || `${originalPrompt.name} v${originalPrompt.version + 1}`,
      content: updates.content || originalPrompt.content,
      negativePrompt: updates.negativePrompt || originalPrompt.negativePrompt || undefined,
      modelId: updates.modelId || originalPrompt.modelId,
      tagIds: updates.tagIds || originalPrompt.tags.map(pt => pt.tagId),
      settings: updates.settings || (originalPrompt.settings as PromptSettings)
    };

    return await this.createPrompt(newPromptData);
  }

  async deletePrompt(promptId: string) {
    const prompt = await this.getPrompt(promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Check if prompt has generated images
    if (prompt.images.length > 0) {
      throw new Error('Cannot delete prompt with generated images. Archive it instead.');
    }

    await prisma.prompt.delete({
      where: { id: promptId }
    });
  }

  async duplicatePrompt(promptId: string, newName?: string) {
    const originalPrompt = await this.getPrompt(promptId);
    if (!originalPrompt) {
      throw new Error('Prompt not found');
    }

    const duplicateData: CreatePromptData = {
      fieldId: originalPrompt.fieldId,
      name: newName || `${originalPrompt.name} (Copy)`,
      content: originalPrompt.content,
      negativePrompt: originalPrompt.negativePrompt || undefined,
      modelId: originalPrompt.modelId,
      tagIds: originalPrompt.tags.map(pt => pt.tagId),
      settings: originalPrompt.settings as PromptSettings
    };

    return await this.createPrompt(duplicateData);
  }

  async optimizePrompt(promptId: string) {
    const prompt = await this.getPrompt(promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Analyze current prompt for optimization opportunities
    const analysis = this.analyzePrompt(prompt.content);
    const optimizedContent = this.applyOptimizations(prompt.content);

    // Suggest better tags
    // const tagLibrary = TagLibrary.getInstance();
    const currentTagIds = prompt.tags.map(pt => pt.tagId);
    const suggestedTags = await this.getSuggestedTags(prompt.field.assetTypeId, {
      style: 'professional',
      complexity: 'detailed'
    });

    return {
      originalContent: prompt.content,
      optimizedContent,
      improvements: analysis.improvements,
      suggestedTags: suggestedTags.filter(tagId => !currentTagIds.includes(tagId)),
      tokenReduction: this.estimateTokens(prompt.content) - this.estimateTokens(optimizedContent),
      qualityScore: this.calculateQualityScore(optimizedContent)
    };
  }

  private buildBasePrompt(fieldName: string, description: string, assetType: string): string {
    return `${assetType} for ${fieldName}: ${description}. `;
  }

  private getStyleModifier(style: string): string {
    const modifiers = {
      photorealistic: ' Photorealistic, highly detailed, professional photography.',
      artistic: ' Artistic composition, creative and visually striking.',
      professional: ' Professional quality, corporate standard, polished.',
      creative: ' Creative and innovative, unique perspective, artistic flair.'
    };
    return modifiers[style as keyof typeof modifiers] || '';
  }

  private getMoodModifier(mood: string): string {
    const modifiers = {
      bright: ' Bright, cheerful, optimistic atmosphere.',
      warm: ' Warm tones, cozy and inviting feeling.',
      cool: ' Cool tones, calm and professional.',
      dramatic: ' Dramatic lighting, high contrast, impactful.',
      soft: ' Soft lighting, gentle and approachable.'
    };
    return modifiers[mood as keyof typeof modifiers] || '';
  }

  private getComplexityModifier(complexity: string): string {
    const modifiers = {
      simple: ' Clean and simple composition, minimal elements.',
      detailed: ' Rich in detail, comprehensive elements.',
      complex: ' Complex composition, multiple elements, intricate details.'
    };
    return modifiers[complexity as keyof typeof modifiers] || '';
  }

  private getQualityModifier(priority: string): string {
    const qualityMap = {
      critical: ' Ultra high quality, 8K resolution, studio lighting, masterpiece.',
      high: ' High quality, professional photography, excellent lighting.',
      medium: ' Good quality, clear and well-composed.',
      low: ' Standard quality, clean image.'
    };
    return qualityMap[priority as keyof typeof qualityMap] || '';
  }

  private generateNegativePrompt(options: PromptGenerationOptions): string {
    let negative = 'low quality, blurry, distorted, ugly, bad anatomy, bad proportions';
    
    if (options.style === 'photorealistic') {
      negative += ', cartoon, anime, illustration, painting, drawing';
    }
    
    if (options.style === 'artistic') {
      negative += ', amateur, unprofessional, poor composition';
    }

    return negative;
  }

  private async getSuggestedTags(assetTypeId: string, options: PromptGenerationOptions): Promise<string[]> {
    const tagLibrary = TagLibrary.getInstance();
    
    // Get default tags for asset type
    const assetTypeTags = await tagLibrary.getTagsForAssetType(assetTypeId);
    const suggestedTagIds = assetTypeTags.map(tag => tag.id);

    // Add style-specific tags
    if (options.style) {
      const styleTags = await tagLibrary.getTagsBySubcategory('Style', 'Artistic');
      const styleTag = styleTags.find(tag => tag.name.includes(options.style || ''));
      if (styleTag) {
        suggestedTagIds.push(styleTag.id);
      }
    }

    // Add mood-specific tags
    if (options.mood) {
      const moodTags = await tagLibrary.getTagsByCategory('Mood');
      const moodTag = moodTags.find(tag => tag.name.includes(options.mood || ''));
      if (moodTag) {
        suggestedTagIds.push(moodTag.id);
      }
    }

    return [...new Set(suggestedTagIds)]; // Remove duplicates
  }

  private estimateTokens(prompt: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(prompt.length / 4);
  }

  private analyzePrompt(prompt: string) {
    const improvements = [];
    
    if (prompt.length < 50) {
      improvements.push('Prompt is too short. Consider adding more descriptive details.');
    }
    
    if (prompt.length > 500) {
      improvements.push('Prompt is very long. Consider condensing to key elements.');
    }
    
    if (!prompt.includes('quality') && !prompt.includes('professional')) {
      improvements.push('Consider adding quality descriptors like "high quality" or "professional".');
    }
    
    if (!prompt.match(/\b(lighting|light)\b/i)) {
      improvements.push('Consider specifying lighting conditions.');
    }
    
    return { improvements };
  }

  private applyOptimizations(prompt: string): string {
    let optimized = prompt;
    
    // Remove redundant words
    optimized = optimized.replace(/\b(very very|really really|extremely extremely)\b/gi, match => 
      match.split(' ')[0]
    );
    
    // Consolidate similar descriptors
    optimized = optimized.replace(/\b(high quality|excellent quality|superior quality)\b/gi, 'high quality');
    
    return optimized;
  }

  private calculateQualityScore(prompt: string): number {
    let score = 50; // Base score
    
    // Add points for quality indicators
    if (prompt.match(/\b(high quality|professional|detailed)\b/i)) score += 20;
    if (prompt.match(/\b(lighting|composition|style)\b/i)) score += 15;
    if (prompt.match(/\b(8K|4K|ultra|masterpiece)\b/i)) score += 10;
    
    // Subtract points for issues
    if (prompt.length < 30) score -= 20;
    if (prompt.length > 400) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateImprovementSuggestions(prompt: string, options: PromptGenerationOptions): string[] {
    const suggestions = [];
    
    if (!prompt.includes('composition')) {
      suggestions.push('Add composition guidelines like "rule of thirds" or "centered composition"');
    }
    
    if (!prompt.includes('background')) {
      suggestions.push('Specify background style or color');
    }
    
    if (options.style === 'photorealistic' && !prompt.includes('camera')) {
      suggestions.push('Consider adding camera or lens specifications');
    }
    
    return suggestions;
  }

  private generateAlternativePrompts(basePrompt: string, count: number): string[] {
    // This would use AI to generate alternatives
    // For now, return simple variations
    return [
      `${basePrompt} with dramatic lighting`,
      `${basePrompt} in minimalist style`,
      `${basePrompt} with soft, natural lighting`
    ].slice(0, count);
  }
}

export default PromptManager;