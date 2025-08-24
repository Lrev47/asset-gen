import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AssetSpecifications {
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
    label: string; // "Mobile", "Desktop", "Square"
  }[];
  formats: string[]; // ["png", "webp", "jpg"]
  quality: {
    min: number;
    recommended: number;
    max: number;
  };
  responsive: boolean;
  retina: boolean; // Whether to generate @2x versions
  compression: 'none' | 'light' | 'moderate' | 'aggressive';
  seoOptimized: boolean;
}

export interface AssetTypeDefinition {
  name: string;
  displayName: string;
  category: string;
  description: string;
  specifications: AssetSpecifications;
  defaultTags: string[]; // Tag names that should be auto-applied
  modelPreferences: string[]; // Ordered list of preferred model names
  examples: string[];
  useCases: string[];
}

export class AssetTypeManager {
  private static instance: AssetTypeManager;

  static getInstance(): AssetTypeManager {
    if (!AssetTypeManager.instance) {
      AssetTypeManager.instance = new AssetTypeManager();
    }
    return AssetTypeManager.instance;
  }

  async initialize() {
    await this.seedDefaultAssetTypes();
  }

  async seedDefaultAssetTypes() {
    const assetTypes: AssetTypeDefinition[] = [
      // Header & Navigation Assets
      {
        name: 'hero-banner',
        displayName: 'Hero Banner',
        category: 'Headers',
        description: 'Large banner images for homepage headers and landing pages',
        specifications: {
          dimensions: [
            { width: 1920, height: 1080, aspectRatio: '16:9', label: 'Desktop Full' },
            { width: 1536, height: 864, aspectRatio: '16:9', label: 'Desktop Standard' },
            { width: 1200, height: 675, aspectRatio: '16:9', label: 'Desktop Compact' },
            { width: 768, height: 432, aspectRatio: '16:9', label: 'Tablet' },
            { width: 375, height: 667, aspectRatio: '9:16', label: 'Mobile Portrait' }
          ],
          formats: ['webp', 'jpg', 'png'],
          quality: { min: 80, recommended: 90, max: 95 },
          responsive: true,
          retina: true,
          compression: 'moderate',
          seoOptimized: true
        },
        defaultTags: ['high-quality', 'professional', 'banner-composition', 'wide-shot'],
        modelPreferences: ['dall-e-3', 'flux-dev', 'stable-diffusion-xl'],
        examples: [
          'Company team working in modern office',
          'Product showcase with clean background',
          'Service demonstration in action',
          'Brand lifestyle photography'
        ],
        useCases: ['Homepage headers', 'Landing page banners', 'Section dividers', 'Call-to-action backgrounds']
      },
      {
        name: 'logo-placeholder',
        displayName: 'Logo Placeholder',
        category: 'Branding',
        description: 'Logo-style graphics and brand symbols',
        specifications: {
          dimensions: [
            { width: 512, height: 512, aspectRatio: '1:1', label: 'Square' },
            { width: 400, height: 200, aspectRatio: '2:1', label: 'Horizontal' },
            { width: 200, height: 400, aspectRatio: '1:2', label: 'Vertical' },
            { width: 256, height: 256, aspectRatio: '1:1', label: 'Favicon Size' }
          ],
          formats: ['png', 'svg', 'webp'],
          quality: { min: 95, recommended: 100, max: 100 },
          responsive: false,
          retina: true,
          compression: 'none',
          seoOptimized: true
        },
        defaultTags: ['clean', 'minimalist', 'vector-style', 'transparent-background'],
        modelPreferences: ['dall-e-3', 'flux-dev'],
        examples: [
          'Simple geometric logo design',
          'Text-based company logo',
          'Icon-style brand symbol',
          'Monogram or lettermark'
        ],
        useCases: ['Company logos', 'App icons', 'Favicons', 'Brand symbols']
      },

      // User Content Assets
      {
        name: 'profile-picture',
        displayName: 'Profile Picture',
        category: 'User Content',
        description: 'Professional headshots and profile images',
        specifications: {
          dimensions: [
            { width: 512, height: 512, aspectRatio: '1:1', label: 'Standard' },
            { width: 256, height: 256, aspectRatio: '1:1', label: 'Thumbnail' },
            { width: 128, height: 128, aspectRatio: '1:1', label: 'Small' },
            { width: 1024, height: 1024, aspectRatio: '1:1', label: 'High-Res' }
          ],
          formats: ['webp', 'jpg', 'png'],
          quality: { min: 85, recommended: 90, max: 95 },
          responsive: true,
          retina: true,
          compression: 'light',
          seoOptimized: false
        },
        defaultTags: ['portrait', 'professional', 'headshot', 'studio-lighting', 'eye-level'],
        modelPreferences: ['realvis-xl', 'stable-diffusion-xl', 'dall-e-3'],
        examples: [
          'Professional business headshot',
          'Casual team member photo',
          'Creative professional portrait',
          'Customer testimonial photo'
        ],
        useCases: ['Team pages', 'About sections', 'User avatars', 'Testimonials']
      },
      {
        name: 'gallery-image',
        displayName: 'Gallery Image',
        category: 'Content',
        description: 'Portfolio and gallery showcase images',
        specifications: {
          dimensions: [
            { width: 800, height: 600, aspectRatio: '4:3', label: 'Gallery Standard' },
            { width: 1024, height: 768, aspectRatio: '4:3', label: 'Gallery Large' },
            { width: 600, height: 800, aspectRatio: '3:4', label: 'Portrait Gallery' },
            { width: 1200, height: 800, aspectRatio: '3:2', label: 'Wide Gallery' }
          ],
          formats: ['webp', 'jpg'],
          quality: { min: 80, recommended: 85, max: 90 },
          responsive: true,
          retina: false,
          compression: 'moderate',
          seoOptimized: true
        },
        defaultTags: ['gallery', 'showcase', 'portfolio', 'artistic'],
        modelPreferences: ['flux-dev', 'stable-diffusion-xl', 'realvis-xl'],
        examples: [
          'Product photography',
          'Service demonstration',
          'Work samples',
          'Project showcase'
        ],
        useCases: ['Portfolio galleries', 'Product catalogs', 'Service showcases', 'Work examples']
      },

      // Product & Commerce Assets
      {
        name: 'product-shot',
        displayName: 'Product Photography',
        category: 'Products',
        description: 'Professional product photos for e-commerce and catalogs',
        specifications: {
          dimensions: [
            { width: 1000, height: 1000, aspectRatio: '1:1', label: 'Square Product' },
            { width: 1200, height: 900, aspectRatio: '4:3', label: 'Standard Product' },
            { width: 800, height: 1200, aspectRatio: '2:3', label: 'Tall Product' },
            { width: 1500, height: 1000, aspectRatio: '3:2', label: 'Lifestyle Product' }
          ],
          formats: ['webp', 'jpg', 'png'],
          quality: { min: 90, recommended: 95, max: 100 },
          responsive: true,
          retina: true,
          compression: 'light',
          seoOptimized: true
        },
        defaultTags: ['product-photography', 'clean-background', 'studio-lighting', 'high-detail'],
        modelPreferences: ['realvis-xl', 'stable-diffusion-xl', 'flux-dev'],
        examples: [
          'White background product shot',
          'Lifestyle product in use',
          'Product with props/context',
          'Multiple angle product view'
        ],
        useCases: ['E-commerce listings', 'Product catalogs', 'Marketing materials', 'Social media']
      },

      // UI & Interface Assets
      {
        name: 'ui-illustration',
        displayName: 'UI Illustration',
        category: 'UI Elements',
        description: 'Illustrations for user interfaces and empty states',
        specifications: {
          dimensions: [
            { width: 400, height: 300, aspectRatio: '4:3', label: 'UI Standard' },
            { width: 600, height: 400, aspectRatio: '3:2', label: 'UI Large' },
            { width: 300, height: 300, aspectRatio: '1:1', label: 'UI Square' },
            { width: 800, height: 200, aspectRatio: '4:1', label: 'UI Banner' }
          ],
          formats: ['png', 'webp', 'svg'],
          quality: { min: 90, recommended: 95, max: 100 },
          responsive: true,
          retina: true,
          compression: 'light',
          seoOptimized: false
        },
        defaultTags: ['illustration', 'ui-design', 'clean', 'modern', 'flat-design'],
        modelPreferences: ['dall-e-3', 'flux-dev'],
        examples: [
          'Empty state illustration',
          'Onboarding step graphic',
          'Feature explanation visual',
          'Error page illustration'
        ],
        useCases: ['Empty states', 'Onboarding flows', 'Feature explanations', 'Error pages']
      },
      {
        name: 'icon-set',
        displayName: 'Icon Set',
        category: 'UI Elements',
        description: 'Icons for navigation, features, and actions',
        specifications: {
          dimensions: [
            { width: 24, height: 24, aspectRatio: '1:1', label: 'Small Icon' },
            { width: 32, height: 32, aspectRatio: '1:1', label: 'Medium Icon' },
            { width: 48, height: 48, aspectRatio: '1:1', label: 'Large Icon' },
            { width: 64, height: 64, aspectRatio: '1:1', label: 'XL Icon' }
          ],
          formats: ['svg', 'png'],
          quality: { min: 100, recommended: 100, max: 100 },
          responsive: false,
          retina: true,
          compression: 'none',
          seoOptimized: false
        },
        defaultTags: ['icon', 'simple', 'clean', 'monochrome', 'transparent-background'],
        modelPreferences: ['dall-e-3'],
        examples: [
          'Navigation icons',
          'Social media icons',
          'Feature icons',
          'Action button icons'
        ],
        useCases: ['Navigation menus', 'Feature lists', 'Social links', 'Call-to-action buttons']
      },

      // Background & Texture Assets
      {
        name: 'background-pattern',
        displayName: 'Background Pattern',
        category: 'Backgrounds',
        description: 'Patterns and textures for website backgrounds',
        specifications: {
          dimensions: [
            { width: 512, height: 512, aspectRatio: '1:1', label: 'Tile Pattern' },
            { width: 1920, height: 1080, aspectRatio: '16:9', label: 'Full Background' },
            { width: 256, height: 256, aspectRatio: '1:1', label: 'Small Tile' },
            { width: 1024, height: 1024, aspectRatio: '1:1', label: 'Large Tile' }
          ],
          formats: ['png', 'jpg', 'webp'],
          quality: { min: 70, recommended: 80, max: 90 },
          responsive: true,
          retina: false,
          compression: 'moderate',
          seoOptimized: false
        },
        defaultTags: ['pattern', 'seamless', 'subtle', 'texture'],
        modelPreferences: ['flux-dev', 'stable-diffusion-xl'],
        examples: [
          'Subtle geometric patterns',
          'Organic textures',
          'Abstract shapes',
          'Gradient backgrounds'
        ],
        useCases: ['Page backgrounds', 'Section dividers', 'Card textures', 'Overlay patterns']
      },

      // Social & Marketing Assets
      {
        name: 'social-media-post',
        displayName: 'Social Media Post',
        category: 'Marketing',
        description: 'Images optimized for social media platforms',
        specifications: {
          dimensions: [
            { width: 1080, height: 1080, aspectRatio: '1:1', label: 'Instagram Square' },
            { width: 1080, height: 1350, aspectRatio: '4:5', label: 'Instagram Portrait' },
            { width: 1200, height: 630, aspectRatio: '1.91:1', label: 'Facebook/Twitter' },
            { width: 1080, height: 1920, aspectRatio: '9:16', label: 'Stories/Reels' }
          ],
          formats: ['jpg', 'png', 'webp'],
          quality: { min: 85, recommended: 90, max: 95 },
          responsive: false,
          retina: false,
          compression: 'light',
          seoOptimized: true
        },
        defaultTags: ['social-media', 'engaging', 'vibrant', 'modern'],
        modelPreferences: ['dall-e-3', 'flux-dev', 'stable-diffusion-xl'],
        examples: [
          'Product announcement',
          'Company milestone',
          'Behind-the-scenes',
          'Event promotion'
        ],
        useCases: ['Social media posts', 'Ad campaigns', 'Content marketing', 'Brand awareness']
      },

      // Content & Editorial Assets
      {
        name: 'blog-featured-image',
        displayName: 'Blog Featured Image',
        category: 'Content',
        description: 'Featured images for blog posts and articles',
        specifications: {
          dimensions: [
            { width: 1200, height: 630, aspectRatio: '1.91:1', label: 'Blog Standard' },
            { width: 800, height: 400, aspectRatio: '2:1', label: 'Blog Compact' },
            { width: 1000, height: 500, aspectRatio: '2:1', label: 'Blog Medium' }
          ],
          formats: ['webp', 'jpg'],
          quality: { min: 80, recommended: 85, max: 90 },
          responsive: true,
          retina: false,
          compression: 'moderate',
          seoOptimized: true
        },
        defaultTags: ['editorial', 'concept', 'illustrative', 'engaging'],
        modelPreferences: ['dall-e-3', 'flux-dev'],
        examples: [
          'Conceptual topic illustration',
          'Abstract representation',
          'Related imagery',
          'Metaphorical visual'
        ],
        useCases: ['Blog headers', 'Article previews', 'Newsletter images', 'Content thumbnails']
      },

      // Testimonial & People Assets
      {
        name: 'testimonial-photo',
        displayName: 'Testimonial Photo',
        category: 'User Content',
        description: 'Customer and client photos for testimonials',
        specifications: {
          dimensions: [
            { width: 400, height: 400, aspectRatio: '1:1', label: 'Square Testimonial' },
            { width: 300, height: 400, aspectRatio: '3:4', label: 'Portrait Testimonial' },
            { width: 150, height: 150, aspectRatio: '1:1', label: 'Small Avatar' }
          ],
          formats: ['webp', 'jpg'],
          quality: { min: 85, recommended: 90, max: 95 },
          responsive: true,
          retina: true,
          compression: 'light',
          seoOptimized: false
        },
        defaultTags: ['portrait', 'professional', 'trustworthy', 'approachable', 'headshot'],
        modelPreferences: ['realvis-xl', 'stable-diffusion-xl'],
        examples: [
          'Happy customer portrait',
          'Professional client photo',
          'Satisfied user image',
          'Team member photo'
        ],
        useCases: ['Customer testimonials', 'Client reviews', 'Case study photos', 'About page']
      },

      // Service & Process Assets
      {
        name: 'process-step',
        displayName: 'Process Step Visual',
        category: 'Explanatory',
        description: 'Images showing steps in a process or workflow',
        specifications: {
          dimensions: [
            { width: 600, height: 400, aspectRatio: '3:2', label: 'Process Standard' },
            { width: 800, height: 600, aspectRatio: '4:3', label: 'Process Large' },
            { width: 400, height: 400, aspectRatio: '1:1', label: 'Process Square' }
          ],
          formats: ['webp', 'png', 'jpg'],
          quality: { min: 80, recommended: 85, max: 90 },
          responsive: true,
          retina: false,
          compression: 'moderate',
          seoOptimized: true
        },
        defaultTags: ['process', 'step-by-step', 'clear', 'instructional'],
        modelPreferences: ['dall-e-3', 'flux-dev'],
        examples: [
          'Service delivery steps',
          'Product usage guide',
          'Workflow illustration',
          'Tutorial visual'
        ],
        useCases: ['How-it-works sections', 'Service process', 'Tutorial steps', 'Workflow guides']
      },

      // Before/After Assets
      {
        name: 'before-after-set',
        displayName: 'Before/After Set',
        category: 'Transformation',
        description: 'Before and after comparison images',
        specifications: {
          dimensions: [
            { width: 800, height: 600, aspectRatio: '4:3', label: 'Standard Comparison' },
            { width: 1000, height: 750, aspectRatio: '4:3', label: 'Large Comparison' },
            { width: 600, height: 600, aspectRatio: '1:1', label: 'Square Comparison' }
          ],
          formats: ['webp', 'jpg'],
          quality: { min: 85, recommended: 90, max: 95 },
          responsive: true,
          retina: true,
          compression: 'light',
          seoOptimized: true
        },
        defaultTags: ['before-after', 'transformation', 'comparison', 'results'],
        modelPreferences: ['realvis-xl', 'stable-diffusion-xl', 'instruct-pix2pix'],
        examples: [
          'Service transformation',
          'Product improvement',
          'Space makeover',
          'Skill development'
        ],
        useCases: ['Service results', 'Product comparisons', 'Case studies', 'Success stories']
      }
    ];

    for (const assetTypeData of assetTypes) {
      await prisma.assetType.upsert({
        where: { name: assetTypeData.name },
        update: {
          displayName: assetTypeData.displayName,
          category: assetTypeData.category,
          description: assetTypeData.description,
          specifications: JSON.stringify(assetTypeData.specifications),
          modelPreferences: JSON.stringify(assetTypeData.modelPreferences)
        },
        create: {
          name: assetTypeData.name,
          displayName: assetTypeData.displayName,
          category: assetTypeData.category,
          description: assetTypeData.description,
          specifications: JSON.stringify(assetTypeData.specifications),
          modelPreferences: JSON.stringify(assetTypeData.modelPreferences)
        }
      });
    }
  }

  async getAllAssetTypes() {
    return await prisma.assetType.findMany({
      include: {
        defaultTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' }
      ]
    });
  }

  async getAssetTypesByCategory(category: string) {
    return await prisma.assetType.findMany({
      where: { category },
      include: {
        defaultTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { displayName: 'asc' }
    });
  }

  async getAssetType(assetTypeId: string) {
    return await prisma.assetType.findUnique({
      where: { id: assetTypeId },
      include: {
        defaultTags: {
          include: {
            tag: true
          }
        }
      }
    });
  }

  async getRecommendedDimensions(assetTypeName: string) {
    const assetType = await prisma.assetType.findUnique({
      where: { name: assetTypeName }
    });

    if (!assetType) return null;

    const specs = JSON.parse(assetType.specifications as string) as AssetSpecifications;
    return specs.dimensions;
  }

  async getModelPreferences(assetTypeId: string) {
    const assetType = await this.getAssetType(assetTypeId);
    if (!assetType) return [];

    const preferences = JSON.parse(assetType.modelPreferences || '[]');
    return preferences;
  }

  async createCustomAssetType(assetTypeData: AssetTypeDefinition) {
    return await prisma.assetType.create({
      data: {
        name: assetTypeData.name,
        displayName: assetTypeData.displayName,
        category: assetTypeData.category,
        description: assetTypeData.description,
        specifications: JSON.stringify(assetTypeData.specifications),
        modelPreferences: JSON.stringify(assetTypeData.modelPreferences)
      }
    });
  }

  getCategories() {
    return [
      'Headers',
      'Branding', 
      'User Content',
      'Content',
      'Products',
      'UI Elements',
      'Backgrounds',
      'Marketing',
      'Explanatory',
      'Transformation'
    ];
  }
}

export default AssetTypeManager;