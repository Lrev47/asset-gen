import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TagDefinition {
  name: string;
  displayName: string;
  category: string;
  subcategory?: string;
  description?: string;
  aliases: string[];
  weight: number;
  conflictsWith: string[];
}

export class TagLibrary {
  private static instance: TagLibrary;

  static getInstance(): TagLibrary {
    if (!TagLibrary.instance) {
      TagLibrary.instance = new TagLibrary();
    }
    return TagLibrary.instance;
  }

  async initialize() {
    await this.seedTagLibrary();
  }

  async seedTagLibrary() {
    const tagDefinitions: TagDefinition[] = [
      // === AESTHETICS ===
      // Style Categories
      {
        name: 'minimalist',
        displayName: 'Minimalist',
        category: 'Aesthetics',
        subcategory: 'Style',
        description: 'Clean, simple design with lots of white space',
        aliases: ['minimal', 'clean', 'simple'],
        weight: 1.2,
        conflictsWith: ['maximalist', 'cluttered', 'busy']
      },
      {
        name: 'modern',
        displayName: 'Modern',
        category: 'Aesthetics',
        subcategory: 'Style',
        description: 'Contemporary design with current trends',
        aliases: ['contemporary', 'current', 'trendy'],
        weight: 1.0,
        conflictsWith: ['vintage', 'retro', 'classic']
      },
      {
        name: 'vintage',
        displayName: 'Vintage',
        category: 'Aesthetics',
        subcategory: 'Style',
        description: 'Retro styling from past decades',
        aliases: ['retro', 'classic', 'nostalgic', 'old-fashioned'],
        weight: 1.3,
        conflictsWith: ['modern', 'futuristic', 'contemporary']
      },
      {
        name: 'futuristic',
        displayName: 'Futuristic',
        category: 'Aesthetics',
        subcategory: 'Style',
        description: 'Forward-looking, sci-fi inspired design',
        aliases: ['sci-fi', 'cyberpunk', 'tech-forward', 'space-age'],
        weight: 1.4,
        conflictsWith: ['vintage', 'rustic', 'traditional']
      },
      {
        name: 'luxury',
        displayName: 'Luxury',
        category: 'Aesthetics',
        subcategory: 'Style',
        description: 'High-end, premium, sophisticated appearance',
        aliases: ['premium', 'high-end', 'sophisticated', 'upscale'],
        weight: 1.3,
        conflictsWith: ['budget', 'cheap', 'basic']
      },
      {
        name: 'rustic',
        displayName: 'Rustic',
        category: 'Aesthetics',
        subcategory: 'Style',
        description: 'Natural, earthy, handcrafted appearance',
        aliases: ['natural', 'earthy', 'organic', 'handcrafted'],
        weight: 1.2,
        conflictsWith: ['futuristic', 'high-tech', 'digital']
      },

      // === COMPOSITION ===
      {
        name: 'rule-of-thirds',
        displayName: 'Rule of Thirds',
        category: 'Composition',
        subcategory: 'Layout',
        description: 'Subject positioned on third lines for balance',
        aliases: ['thirds', 'balanced-composition'],
        weight: 1.1,
        conflictsWith: ['centered-composition']
      },
      {
        name: 'centered-composition',
        displayName: 'Centered',
        category: 'Composition',
        subcategory: 'Layout',
        description: 'Subject placed in center of frame',
        aliases: ['centered', 'center-focused', 'symmetrical'],
        weight: 1.0,
        conflictsWith: ['rule-of-thirds', 'off-center']
      },
      {
        name: 'leading-lines',
        displayName: 'Leading Lines',
        category: 'Composition',
        subcategory: 'Layout',
        description: 'Lines that guide the eye to the subject',
        aliases: ['guide-lines', 'directional-lines'],
        weight: 1.2,
        conflictsWith: []
      },
      {
        name: 'framing',
        displayName: 'Natural Framing',
        category: 'Composition',
        subcategory: 'Layout',
        description: 'Using elements to frame the main subject',
        aliases: ['frame-composition', 'bordered'],
        weight: 1.1,
        conflictsWith: []
      },
      {
        name: 'negative-space',
        displayName: 'Negative Space',
        category: 'Composition',
        subcategory: 'Layout',
        description: 'Effective use of empty space around subject',
        aliases: ['white-space', 'empty-space', 'breathing-room'],
        weight: 1.2,
        conflictsWith: ['cluttered', 'busy', 'fill-frame']
      },

      // === LIGHTING ===
      {
        name: 'natural-light',
        displayName: 'Natural Light',
        category: 'Lighting',
        subcategory: 'Source',
        description: 'Sunlight or ambient outdoor lighting',
        aliases: ['sunlight', 'daylight', 'outdoor-lighting'],
        weight: 1.1,
        conflictsWith: ['studio-lighting', 'artificial-light']
      },
      {
        name: 'studio-lighting',
        displayName: 'Studio Lighting',
        category: 'Lighting',
        subcategory: 'Source',
        description: 'Controlled professional lighting setup',
        aliases: ['professional-lighting', 'controlled-lighting'],
        weight: 1.2,
        conflictsWith: ['natural-light']
      },
      {
        name: 'golden-hour',
        displayName: 'Golden Hour',
        category: 'Lighting',
        subcategory: 'Quality',
        description: 'Warm, soft light during sunrise/sunset',
        aliases: ['magic-hour', 'warm-light', 'sunset-lighting'],
        weight: 1.3,
        conflictsWith: ['harsh-light', 'cool-light']
      },
      {
        name: 'soft-light',
        displayName: 'Soft Lighting',
        category: 'Lighting',
        subcategory: 'Quality',
        description: 'Diffused, even lighting without harsh shadows',
        aliases: ['diffused', 'gentle-light', 'even-lighting'],
        weight: 1.1,
        conflictsWith: ['hard-light', 'dramatic-lighting']
      },
      {
        name: 'dramatic-lighting',
        displayName: 'Dramatic Lighting',
        category: 'Lighting',
        subcategory: 'Quality',
        description: 'High contrast lighting with strong shadows',
        aliases: ['hard-light', 'contrast-lighting', 'moody-lighting'],
        weight: 1.4,
        conflictsWith: ['soft-light', 'even-lighting']
      },
      {
        name: 'backlighting',
        displayName: 'Backlighting',
        category: 'Lighting',
        subcategory: 'Direction',
        description: 'Light source behind the subject',
        aliases: ['backlit', 'rim-lighting', 'silhouette-lighting'],
        weight: 1.3,
        conflictsWith: ['front-lighting']
      },

      // === CAMERA ANGLES ===
      {
        name: 'eye-level',
        displayName: 'Eye Level',
        category: 'Camera Angle',
        subcategory: 'Height',
        description: 'Camera at same height as subject',
        aliases: ['straight-on', 'horizontal'],
        weight: 1.0,
        conflictsWith: ['birds-eye', 'worms-eye', 'low-angle', 'high-angle']
      },
      {
        name: 'birds-eye',
        displayName: "Bird's Eye View",
        category: 'Camera Angle',
        subcategory: 'Height',
        description: 'Overhead view looking down',
        aliases: ['overhead', 'top-down', 'aerial-view'],
        weight: 1.3,
        conflictsWith: ['worms-eye', 'eye-level']
      },
      {
        name: 'worms-eye',
        displayName: "Worm's Eye View",
        category: 'Camera Angle',
        subcategory: 'Height',
        description: 'Low angle looking up at subject',
        aliases: ['low-angle', 'ground-level', 'upward-angle'],
        weight: 1.3,
        conflictsWith: ['birds-eye', 'eye-level']
      },
      {
        name: 'close-up',
        displayName: 'Close-up',
        category: 'Camera Angle',
        subcategory: 'Distance',
        description: 'Very close to subject, showing details',
        aliases: ['macro', 'detail-shot', 'intimate'],
        weight: 1.2,
        conflictsWith: ['wide-shot', 'distant']
      },
      {
        name: 'wide-shot',
        displayName: 'Wide Shot',
        category: 'Camera Angle',
        subcategory: 'Distance',
        description: 'Distant view showing environment',
        aliases: ['wide-angle', 'establishing-shot', 'environmental'],
        weight: 1.1,
        conflictsWith: ['close-up', 'macro']
      },

      // === COLORS & MOOD ===
      {
        name: 'warm-tones',
        displayName: 'Warm Tones',
        category: 'Color',
        subcategory: 'Temperature',
        description: 'Reds, oranges, yellows, warm colors',
        aliases: ['warm-colors', 'warm-palette', 'cozy-colors'],
        weight: 1.2,
        conflictsWith: ['cool-tones', 'cold-colors']
      },
      {
        name: 'cool-tones',
        displayName: 'Cool Tones',
        category: 'Color',
        subcategory: 'Temperature',
        description: 'Blues, greens, purples, cool colors',
        aliases: ['cool-colors', 'cold-colors', 'cool-palette'],
        weight: 1.2,
        conflictsWith: ['warm-tones', 'warm-colors']
      },
      {
        name: 'monochrome',
        displayName: 'Monochrome',
        category: 'Color',
        subcategory: 'Saturation',
        description: 'Single color or black and white',
        aliases: ['black-and-white', 'grayscale', 'single-color'],
        weight: 1.3,
        conflictsWith: ['vibrant', 'colorful', 'rainbow']
      },
      {
        name: 'vibrant',
        displayName: 'Vibrant',
        category: 'Color',
        subcategory: 'Saturation',
        description: 'Bright, saturated, vivid colors',
        aliases: ['bright', 'saturated', 'vivid', 'colorful'],
        weight: 1.2,
        conflictsWith: ['muted', 'desaturated', 'monochrome']
      },
      {
        name: 'muted',
        displayName: 'Muted Colors',
        category: 'Color',
        subcategory: 'Saturation',
        description: 'Soft, desaturated, subtle colors',
        aliases: ['desaturated', 'subtle', 'soft-colors', 'pastel'],
        weight: 1.1,
        conflictsWith: ['vibrant', 'saturated', 'bright']
      },

      // === TECHNICAL ===
      {
        name: 'high-detail',
        displayName: 'High Detail',
        category: 'Technical',
        subcategory: 'Quality',
        description: 'Extremely detailed and sharp image',
        aliases: ['ultra-detailed', 'sharp', 'crisp', 'high-resolution'],
        weight: 1.2,
        conflictsWith: ['blurry', 'soft-focus']
      },
      {
        name: 'shallow-dof',
        displayName: 'Shallow Depth of Field',
        category: 'Technical',
        subcategory: 'Focus',
        description: 'Blurred background with sharp subject',
        aliases: ['bokeh', 'background-blur', 'selective-focus'],
        weight: 1.3,
        conflictsWith: ['deep-focus', 'everything-in-focus']
      },
      {
        name: 'deep-focus',
        displayName: 'Deep Focus',
        category: 'Technical',
        subcategory: 'Focus',
        description: 'Everything in frame is in sharp focus',
        aliases: ['everything-in-focus', 'sharp-throughout'],
        weight: 1.1,
        conflictsWith: ['shallow-dof', 'bokeh']
      },

      // === STYLES ===
      {
        name: 'photorealistic',
        displayName: 'Photorealistic',
        category: 'Style',
        subcategory: 'Realism',
        description: 'Looks like a real photograph',
        aliases: ['realistic', 'photo-like', 'lifelike'],
        weight: 1.2,
        conflictsWith: ['illustrated', 'cartoon', 'abstract']
      },
      {
        name: 'illustrated',
        displayName: 'Illustrated',
        category: 'Style',
        subcategory: 'Artistic',
        description: 'Hand-drawn or digital illustration style',
        aliases: ['illustration', 'drawn', 'artistic'],
        weight: 1.2,
        conflictsWith: ['photorealistic', 'photo-like']
      },
      {
        name: 'watercolor',
        displayName: 'Watercolor',
        category: 'Style',
        subcategory: 'Artistic',
        description: 'Soft, flowing watercolor painting style',
        aliases: ['watercolor-painting', 'soft-painting'],
        weight: 1.4,
        conflictsWith: ['photorealistic', 'digital-art']
      },
      {
        name: 'oil-painting',
        displayName: 'Oil Painting',
        category: 'Style',
        subcategory: 'Artistic',
        description: 'Traditional oil painting technique',
        aliases: ['painted', 'classical-painting'],
        weight: 1.4,
        conflictsWith: ['photorealistic', 'digital-art']
      },
      {
        name: 'digital-art',
        displayName: 'Digital Art',
        category: 'Style',
        subcategory: 'Artistic',
        description: 'Computer-generated artistic style',
        aliases: ['cgi', 'digital-painting', 'computer-art'],
        weight: 1.2,
        conflictsWith: ['traditional-media', 'hand-drawn']
      },

      // === MOOD & ATMOSPHERE ===
      {
        name: 'professional',
        displayName: 'Professional',
        category: 'Mood',
        subcategory: 'Tone',
        description: 'Business-appropriate, formal atmosphere',
        aliases: ['business', 'corporate', 'formal'],
        weight: 1.0,
        conflictsWith: ['casual', 'playful', 'relaxed']
      },
      {
        name: 'friendly',
        displayName: 'Friendly',
        category: 'Mood',
        subcategory: 'Tone',
        description: 'Approachable, welcoming atmosphere',
        aliases: ['welcoming', 'approachable', 'warm'],
        weight: 1.1,
        conflictsWith: ['intimidating', 'cold', 'harsh']
      },
      {
        name: 'energetic',
        displayName: 'Energetic',
        category: 'Mood',
        subcategory: 'Energy',
        description: 'Dynamic, active, high-energy feeling',
        aliases: ['dynamic', 'active', 'vibrant', 'lively'],
        weight: 1.2,
        conflictsWith: ['calm', 'peaceful', 'static']
      },
      {
        name: 'calm',
        displayName: 'Calm',
        category: 'Mood',
        subcategory: 'Energy',
        description: 'Peaceful, relaxed, serene atmosphere',
        aliases: ['peaceful', 'serene', 'relaxed', 'tranquil'],
        weight: 1.1,
        conflictsWith: ['energetic', 'dynamic', 'chaotic']
      },
      {
        name: 'inspiring',
        displayName: 'Inspiring',
        category: 'Mood',
        subcategory: 'Emotion',
        description: 'Motivational, uplifting feeling',
        aliases: ['motivational', 'uplifting', 'aspirational'],
        weight: 1.3,
        conflictsWith: ['depressing', 'negative']
      },

      // === SPECIFIC SUBJECTS ===
      {
        name: 'portrait',
        displayName: 'Portrait',
        category: 'Subject',
        subcategory: 'People',
        description: 'Focus on person or people',
        aliases: ['headshot', 'person', 'human'],
        weight: 1.2,
        conflictsWith: ['landscape', 'abstract']
      },
      {
        name: 'landscape',
        displayName: 'Landscape',
        category: 'Subject',
        subcategory: 'Environment',
        description: 'Natural or urban environments',
        aliases: ['scenery', 'environment', 'outdoor'],
        weight: 1.1,
        conflictsWith: ['portrait', 'close-up']
      },
      {
        name: 'product-focus',
        displayName: 'Product Focused',
        category: 'Subject',
        subcategory: 'Objects',
        description: 'Product as main subject',
        aliases: ['product-shot', 'object-focus', 'item-showcase'],
        weight: 1.2,
        conflictsWith: ['portrait', 'landscape']
      },

      // === BACKGROUNDS ===
      {
        name: 'white-background',
        displayName: 'White Background',
        category: 'Background',
        subcategory: 'Color',
        description: 'Clean white background',
        aliases: ['clean-background', 'studio-background'],
        weight: 1.3,
        conflictsWith: ['dark-background', 'colorful-background']
      },
      {
        name: 'transparent-background',
        displayName: 'Transparent Background',
        category: 'Background',
        subcategory: 'Style',
        description: 'No background, subject isolated',
        aliases: ['isolated', 'cutout', 'no-background'],
        weight: 1.4,
        conflictsWith: ['environmental-background', 'busy-background']
      },
      {
        name: 'blurred-background',
        displayName: 'Blurred Background',
        category: 'Background',
        subcategory: 'Style',
        description: 'Out-of-focus background for subject emphasis',
        aliases: ['bokeh-background', 'shallow-depth'],
        weight: 1.2,
        conflictsWith: ['sharp-background', 'detailed-background']
      },

      // === ADVANCED COMPOSITION ===
      {
        name: 'symmetrical',
        displayName: 'Symmetrical',
        category: 'Composition',
        subcategory: 'Balance',
        description: 'Balanced, mirrored composition',
        aliases: ['balanced', 'mirrored', 'even'],
        weight: 1.1,
        conflictsWith: ['asymmetrical', 'unbalanced']
      },
      {
        name: 'dynamic-angle',
        displayName: 'Dynamic Angle',
        category: 'Composition',
        subcategory: 'Angle',
        description: 'Unusual or tilted camera angle',
        aliases: ['tilted', 'dutch-angle', 'unusual-angle'],
        weight: 1.3,
        conflictsWith: ['straight-angle', 'traditional-angle']
      },

      // === LIGHTING ADVANCED ===
      {
        name: 'rim-lighting',
        displayName: 'Rim Lighting',
        category: 'Lighting',
        subcategory: 'Technique',
        description: 'Light around edges of subject',
        aliases: ['edge-lighting', 'outline-lighting'],
        weight: 1.4,
        conflictsWith: ['flat-lighting']
      },
      {
        name: 'chiaroscuro',
        displayName: 'Chiaroscuro',
        category: 'Lighting',
        subcategory: 'Technique',
        description: 'Strong contrast between light and dark',
        aliases: ['light-dark-contrast', 'dramatic-shadows'],
        weight: 1.5,
        conflictsWith: ['even-lighting', 'flat-lighting']
      },

      // === TECHNICAL QUALITY ===
      {
        name: 'ultra-sharp',
        displayName: 'Ultra Sharp',
        category: 'Technical',
        subcategory: 'Sharpness',
        description: 'Extremely crisp and detailed',
        aliases: ['razor-sharp', 'crystal-clear', 'pin-sharp'],
        weight: 1.3,
        conflictsWith: ['soft-focus', 'dreamy']
      },
      {
        name: 'hdr',
        displayName: 'HDR',
        category: 'Technical',
        subcategory: 'Processing',
        description: 'High dynamic range processing',
        aliases: ['high-dynamic-range', 'enhanced-contrast'],
        weight: 1.2,
        conflictsWith: ['flat', 'low-contrast']
      },

      // === SUBJECT-SPECIFIC ===
      {
        name: 'business-casual',
        displayName: 'Business Casual',
        category: 'Subject',
        subcategory: 'Attire',
        description: 'Professional but relaxed clothing',
        aliases: ['smart-casual', 'office-appropriate'],
        weight: 1.1,
        conflictsWith: ['formal-wear', 'casual-wear']
      },
      {
        name: 'smiling',
        displayName: 'Smiling',
        category: 'Subject',
        subcategory: 'Expression',
        description: 'Happy, positive facial expression',
        aliases: ['happy', 'positive', 'cheerful'],
        weight: 1.1,
        conflictsWith: ['serious', 'frowning']
      },
      {
        name: 'serious',
        displayName: 'Serious',
        category: 'Subject',
        subcategory: 'Expression',
        description: 'Professional, focused expression',
        aliases: ['focused', 'determined', 'confident'],
        weight: 1.0,
        conflictsWith: ['smiling', 'playful']
      },

      // === ENVIRONMENT ===
      {
        name: 'office-environment',
        displayName: 'Office Environment',
        category: 'Environment',
        subcategory: 'Location',
        description: 'Professional office or workplace setting',
        aliases: ['workplace', 'business-setting', 'corporate-environment'],
        weight: 1.1,
        conflictsWith: ['outdoor', 'home-setting']
      },
      {
        name: 'outdoor-setting',
        displayName: 'Outdoor',
        category: 'Environment',
        subcategory: 'Location',
        description: 'Natural outdoor environment',
        aliases: ['outside', 'nature', 'outdoor-environment'],
        weight: 1.1,
        conflictsWith: ['indoor', 'studio-setting']
      },
      {
        name: 'studio-setting',
        displayName: 'Studio Setting',
        category: 'Environment',
        subcategory: 'Location',
        description: 'Controlled studio environment',
        aliases: ['studio-environment', 'controlled-setting'],
        weight: 1.2,
        conflictsWith: ['outdoor-setting', 'natural-environment']
      }
    ];

    for (const tagData of tagDefinitions) {
      await prisma.tag.upsert({
        where: { name: tagData.name },
        update: {
          displayName: tagData.displayName,
          category: tagData.category,
          subcategory: tagData.subcategory,
          description: tagData.description,
          aliases: JSON.stringify(tagData.aliases),
          weight: tagData.weight,
          conflictsWith: JSON.stringify(tagData.conflictsWith)
        },
        create: {
          name: tagData.name,
          displayName: tagData.displayName,
          category: tagData.category,
          subcategory: tagData.subcategory,
          description: tagData.description,
          aliases: JSON.stringify(tagData.aliases),
          weight: tagData.weight,
          conflictsWith: JSON.stringify(tagData.conflictsWith)
        }
      });
    }
  }

  async getTagsByCategory(category: string) {
    return await prisma.tag.findMany({
      where: { 
        category,
        isActive: true 
      },
      orderBy: [
        { subcategory: 'asc' },
        { displayName: 'asc' }
      ]
    });
  }

  async getTagsBySubcategory(category: string, subcategory: string) {
    return await prisma.tag.findMany({
      where: { 
        category,
        subcategory,
        isActive: true 
      },
      orderBy: { displayName: 'asc' }
    });
  }

  async getAllCategories() {
    const result = await prisma.tag.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    return result.map(item => ({
      category: item.category,
      count: item._count.category
    }));
  }

  async getSubcategories(category: string) {
    const result = await prisma.tag.groupBy({
      by: ['subcategory'],
      where: { 
        category,
        isActive: true,
        subcategory: { not: null }
      },
      _count: {
        subcategory: true
      },
      orderBy: {
        subcategory: 'asc'
      }
    });

    return result.map(item => ({
      subcategory: item.subcategory,
      count: item._count.subcategory
    }));
  }

  async searchTags(query: string) {
    return await prisma.tag.findMany({
      where: {
        OR: [
          { displayName: { contains: query } },
          { name: { contains: query } },
          { description: { contains: query } },
          { aliases: { contains: query } }
        ],
        isActive: true
      },
      orderBy: { usageCount: 'desc' }
    });
  }

  async getConflictingTags(tagIds: string[]) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } }
    });

    const conflicts: string[] = [];
    for (const tag of tags) {
      const conflictsWith = JSON.parse(tag.conflictsWith || '[]');
      conflicts.push(...conflictsWith);
    }

    return await prisma.tag.findMany({
      where: { 
        name: { in: conflicts },
        isActive: true 
      }
    });
  }

  async getPopularTags(limit: number = 20) {
    return await prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: limit
    });
  }

  async incrementTagUsage(tagId: string) {
    await prisma.tag.update({
      where: { id: tagId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
  }

  async createCustomTag(tagData: Omit<TagDefinition, 'aliases' | 'conflictsWith'> & { aliases?: string[]; conflictsWith?: string[] }) {
    return await prisma.tag.create({
      data: {
        name: tagData.name,
        displayName: tagData.displayName,
        category: tagData.category,
        subcategory: tagData.subcategory,
        description: tagData.description,
        aliases: JSON.stringify(tagData.aliases || []),
        weight: tagData.weight,
        conflictsWith: JSON.stringify(tagData.conflictsWith || [])
      }
    });
  }

  async getTagsForAssetType(assetTypeId: string) {
    return await prisma.tag.findMany({
      where: {
        assetTypes: {
          some: {
            assetTypeId,
            isDefault: true
          }
        },
        isActive: true
      },
      orderBy: { weight: 'desc' }
    });
  }

  async validateTagCombination(tagIds: string[]) {
    const conflicts = await this.getConflictingTags(tagIds);
    const conflictingTagIds = conflicts.map(tag => tag.id);
    
    const hasConflicts = tagIds.some(id => conflictingTagIds.includes(id));
    
    return {
      valid: !hasConflicts,
      conflicts: hasConflicts ? conflicts : [],
      suggestions: hasConflicts ? await this.getSuggestedAlternatives(tagIds) : []
    };
  }

  private async getSuggestedAlternatives(tagIds: string[]) {
    // Find alternative tags that don't conflict
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } }
    });

    const alternatives = [];
    for (const tag of tags) {
      const similarTags = await prisma.tag.findMany({
        where: {
          category: tag.category,
          subcategory: tag.subcategory,
          id: { not: tag.id },
          isActive: true
        },
        take: 3,
        orderBy: { usageCount: 'desc' }
      });
      
      alternatives.push(...similarTags);
    }

    return alternatives;
  }
}

export default TagLibrary;