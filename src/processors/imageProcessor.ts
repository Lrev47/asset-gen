import sharp, { Sharp } from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GeneratedImage } from '@/generators/openai/dalle';
import { ReplicateImage } from '@/generators/replicate/models';

export interface ProcessingOptions {
  outputDir: string;
  formats: ImageFormat[];
  sizes: ImageSize[];
  quality: number; // 1-100
  watermark?: WatermarkOptions;
  optimization: OptimizationLevel;
  preserveOriginal: boolean;
  generateThumbnails: boolean;
}

export interface ImageFormat {
  extension: 'webp' | 'jpeg' | 'png' | 'avif';
  quality?: number;
  progressive?: boolean;
  optimizeForWeb?: boolean;
}

export interface ImageSize {
  name: string;
  width?: number;
  height?: number;
  fit: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface WatermarkOptions {
  text?: string;
  image?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
  fontSize?: number;
  color?: string;
}

export type OptimizationLevel = 'none' | 'basic' | 'aggressive';

export interface ProcessedImage {
  originalUrl: string;
  originalFilename: string;
  variants: ImageVariant[];
  metadata: ProcessingMetadata;
  processingTime: number;
  totalSize: number; // Combined size of all variants in bytes
}

export interface ImageVariant {
  filename: string;
  path: string;
  format: string;
  width: number;
  height: number;
  size: number; // File size in bytes
  url?: string; // If served via CDN
}

export interface ProcessingMetadata {
  originalDimensions: { width: number; height: number };
  generatedAt: Date;
  processedAt: Date;
  generator: string; // 'dalle' | 'replicate'
  model: string;
  prompt: string;
  category: string;
  businessType: string;
  tags: string[];
}

export class ImageProcessor {
  private processingQueue: ProcessingTask[] = [];
  private isProcessing = false;
  private maxConcurrent = 3;
  private currentTasks = 0;

  // Standard size presets
  private standardSizes: Record<string, ImageSize[]> = {
    'web-standard': [
      { name: 'thumbnail', width: 150, height: 150, fit: 'cover' },
      { name: 'small', width: 400, height: 300, fit: 'contain', withoutEnlargement: true },
      { name: 'medium', width: 800, height: 600, fit: 'contain', withoutEnlargement: true },
      { name: 'large', width: 1200, height: 900, fit: 'contain', withoutEnlargement: true },
      { name: 'xl', width: 1920, height: 1440, fit: 'contain', withoutEnlargement: true }
    ],
    'social-media': [
      { name: 'instagram-square', width: 1080, height: 1080, fit: 'cover' },
      { name: 'instagram-story', width: 1080, height: 1920, fit: 'cover' },
      { name: 'facebook-cover', width: 1200, height: 630, fit: 'cover' },
      { name: 'twitter-header', width: 1500, height: 500, fit: 'cover' },
      { name: 'linkedin-banner', width: 1584, height: 396, fit: 'cover' }
    ],
    'print-ready': [
      { name: 'print-small', width: 2400, height: 1800, fit: 'contain' },
      { name: 'print-medium', width: 3600, height: 2700, fit: 'contain' },
      { name: 'print-large', width: 4800, height: 3600, fit: 'contain' }
    ]
  };

  // Standard format presets
  private standardFormats: Record<string, ImageFormat[]> = {
    'web-optimized': [
      { extension: 'webp', quality: 85, optimizeForWeb: true },
      { extension: 'jpeg', quality: 90, progressive: true, optimizeForWeb: true }
    ],
    'high-quality': [
      { extension: 'png', optimizeForWeb: false },
      { extension: 'webp', quality: 95, optimizeForWeb: true },
      { extension: 'jpeg', quality: 95, progressive: true }
    ],
    'maximum-compression': [
      { extension: 'avif', quality: 80 },
      { extension: 'webp', quality: 75, optimizeForWeb: true },
      { extension: 'jpeg', quality: 80, progressive: true }
    ]
  };

  async processImages(
    images: (GeneratedImage | ReplicateImage)[],
    options: ProcessingOptions,
    metadata: Partial<ProcessingMetadata> = {}
  ): Promise<ProcessedImage[]> {
    const tasks: ProcessingTask[] = images.map(image => ({
      image,
      options,
      metadata: {
        generatedAt: new Date(),
        processedAt: new Date(),
        generator: this.detectGenerator(image),
        model: image.metadata?.model || 'unknown',
        prompt: image.metadata?.prompt || '',
        category: metadata.category || 'general',
        businessType: metadata.businessType || 'general',
        tags: metadata.tags || [],
        originalDimensions: image.dimensions
      }
    }));

    return await this.processBatch(tasks);
  }

  private async processBatch(tasks: ProcessingTask[]): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const chunks = this.chunkArray(tasks, this.maxConcurrent);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(task => this.processSingleImage(task))
      );
      results.push(...chunkResults.filter(result => result !== null) as ProcessedImage[]);
    }

    return results;
  }

  private async processSingleImage(task: ProcessingTask): Promise<ProcessedImage | null> {
    const startTime = Date.now();
    const { image, options, metadata } = task;

    try {
      // Download image
      const imageBuffer = await this.downloadImage(image.url);
      
      // Create output directory
      await this.ensureDirectory(options.outputDir);

      // Process variants
      const variants: ImageVariant[] = [];
      let totalSize = 0;

      // Create Sharp instance
      const sharpImage = sharp(imageBuffer);
      const imageMetadata = await sharpImage.metadata();

      // Preserve original if requested
      if (options.preserveOriginal) {
        const originalVariant = await this.saveOriginal(sharpImage, image, options.outputDir);
        variants.push(originalVariant);
        totalSize += originalVariant.size;
      }

      // Generate all size/format combinations
      for (const size of options.sizes) {
        for (const format of options.formats) {
          const variant = await this.processVariant(
            sharpImage.clone(),
            image,
            size,
            format,
            options
          );
          
          if (variant) {
            variants.push(variant);
            totalSize += variant.size;
          }
        }
      }

      // Generate thumbnails if requested
      if (options.generateThumbnails && !variants.some(v => v.filename.includes('thumbnail'))) {
        const thumbnailVariant = await this.generateThumbnail(sharpImage.clone(), image, options);
        if (thumbnailVariant) {
          variants.push(thumbnailVariant);
          totalSize += thumbnailVariant.size;
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: image.url,
        originalFilename: image.filename,
        variants,
        metadata: {
          ...metadata,
          originalDimensions: { 
            width: imageMetadata.width || image.dimensions.width, 
            height: imageMetadata.height || image.dimensions.height 
          }
        },
        processingTime,
        totalSize
      };

    } catch (error) {
      console.error(`Error processing image ${image.filename}:`, error);
      return null;
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 seconds
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });

    return Buffer.from(response.data);
  }

  private async processVariant(
    sharpInstance: Sharp,
    originalImage: GeneratedImage | ReplicateImage,
    size: ImageSize,
    format: ImageFormat,
    options: ProcessingOptions
  ): Promise<ImageVariant | null> {
    try {
      // Apply size transformations
      if (size.width || size.height) {
        sharpInstance = sharpInstance.resize(size.width, size.height, {
          fit: size.fit,
          withoutEnlargement: size.withoutEnlargement
        });
      }

      // Apply watermark if specified
      if (options.watermark) {
        sharpInstance = await this.applyWatermark(sharpInstance, options.watermark);
      }

      // Apply format-specific options
      switch (format.extension) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: format.quality || options.quality,
            progressive: format.progressive || false,
            optimiseScans: format.optimizeForWeb || false
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: format.quality || options.quality,
            effort: format.optimizeForWeb ? 6 : 4
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            compressionLevel: format.optimizeForWeb ? 9 : 6,
            progressive: format.progressive || false
          });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({
            quality: format.quality || options.quality,
            effort: format.optimizeForWeb ? 9 : 6
          });
          break;
      }

      // Apply optimization
      if (options.optimization === 'aggressive') {
        sharpInstance = this.applyAggressiveOptimization(sharpInstance, format);
      } else if (options.optimization === 'basic') {
        sharpInstance = this.applyBasicOptimization(sharpInstance, format);
      }

      // Generate filename
      const filename = this.generateVariantFilename(
        originalImage.filename,
        size.name,
        format.extension
      );

      const outputPath = path.join(options.outputDir, filename);
      
      // Process and save
      const buffer = await sharpInstance.toBuffer();
      await fs.promises.writeFile(outputPath, buffer);

      // Get final dimensions
      const processedMetadata = await sharp(buffer).metadata();

      return {
        filename,
        path: outputPath,
        format: format.extension,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
        size: buffer.length
      };

    } catch (error) {
      console.error(`Error processing variant ${size.name}-${format.extension}:`, error);
      return null;
    }
  }

  private async applyWatermark(sharpInstance: Sharp, watermark: WatermarkOptions): Promise<Sharp> {
    if (watermark.text) {
      // Text watermark
      const svg = this.createTextWatermarkSVG(watermark);
      const watermarkBuffer = Buffer.from(svg);
      
      return sharpInstance.composite([{
        input: watermarkBuffer,
        gravity: this.getGravity(watermark.position),
        blend: 'over'
      }]);
    } else if (watermark.image) {
      // Image watermark
      const watermarkImage = sharp(watermark.image)
        .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
        .png();
      
      return sharpInstance.composite([{
        input: await watermarkImage.toBuffer(),
        gravity: this.getGravity(watermark.position),
        blend: 'over'
      }]);
    }
    
    return sharpInstance;
  }

  private createTextWatermarkSVG(watermark: WatermarkOptions): string {
    const fontSize = watermark.fontSize || 48;
    const color = watermark.color || 'rgba(255,255,255,0.7)';
    const text = watermark.text || '';

    return `
      <svg width="300" height="100">
        <text x="50%" y="50%" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              fill="${color}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              opacity="${watermark.opacity}">
          ${text}
        </text>
      </svg>
    `;
  }

  private getGravity(position: WatermarkOptions['position']): string {
    const gravityMap: Record<WatermarkOptions['position'], string> = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      'center': 'center'
    };
    
    return gravityMap[position];
  }

  private applyBasicOptimization(sharpInstance: Sharp, format: ImageFormat): Sharp {
    // Basic optimization settings
    switch (format.extension) {
      case 'jpeg':
        return sharpInstance.jpeg({ mozjpeg: true });
      case 'webp':
        return sharpInstance.webp({ nearLossless: true });
      case 'png':
        return sharpInstance.png({ palette: true });
      default:
        return sharpInstance;
    }
  }

  private applyAggressiveOptimization(sharpInstance: Sharp, format: ImageFormat): Sharp {
    // Aggressive optimization settings
    switch (format.extension) {
      case 'jpeg':
        return sharpInstance
          .jpeg({ 
            mozjpeg: true, 
            trellisQuantisation: true, 
            quantisationTable: 3 
          });
      case 'webp':
        return sharpInstance.webp({ effort: 6, smartSubsample: true });
      case 'png':
        return sharpInstance.png({ 
          palette: true, 
          colors: 256, 
          compressionLevel: 9 
        });
      default:
        return sharpInstance;
    }
  }

  private async saveOriginal(
    sharpInstance: Sharp,
    image: GeneratedImage | ReplicateImage,
    outputDir: string
  ): Promise<ImageVariant> {
    const buffer = await sharpInstance.toBuffer();
    const originalPath = path.join(outputDir, `original_${image.filename}`);
    
    await fs.promises.writeFile(originalPath, buffer);
    
    const metadata = await sharp(buffer).metadata();
    
    return {
      filename: `original_${image.filename}`,
      path: originalPath,
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: buffer.length
    };
  }

  private async generateThumbnail(
    sharpInstance: Sharp,
    image: GeneratedImage | ReplicateImage,
    options: ProcessingOptions
  ): Promise<ImageVariant | null> {
    try {
      const thumbnailBuffer = await sharpInstance
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = this.generateVariantFilename(image.filename, 'thumbnail', 'webp');
      const thumbnailPath = path.join(options.outputDir, filename);
      
      await fs.promises.writeFile(thumbnailPath, thumbnailBuffer);

      return {
        filename,
        path: thumbnailPath,
        format: 'webp',
        width: 200,
        height: 200,
        size: thumbnailBuffer.length
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  private generateVariantFilename(
    originalFilename: string,
    sizeName: string,
    extension: string
  ): string {
    const baseName = path.parse(originalFilename).name;
    return `${baseName}_${sizeName}.${extension}`;
  }

  private detectGenerator(image: GeneratedImage | ReplicateImage): string {
    if ('revisedPrompt' in image) {
      return 'dalle';
    }
    return 'replicate';
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Utility methods for getting standard presets
  getStandardSizes(preset: string): ImageSize[] {
    return this.standardSizes[preset] || this.standardSizes['web-standard'];
  }

  getStandardFormats(preset: string): ImageFormat[] {
    return this.standardFormats[preset] || this.standardFormats['web-optimized'];
  }

  // Method to estimate processing time and storage requirements
  estimateProcessing(
    imageCount: number,
    sizes: number,
    formats: number
  ): { estimatedTime: number; estimatedStorage: number } {
    const variantsPerImage = sizes * formats;
    const avgProcessingTimePerVariant = 500; // 500ms per variant
    const avgSizePerVariant = 200 * 1024; // 200KB per variant

    const estimatedTime = imageCount * variantsPerImage * avgProcessingTimePerVariant;
    const estimatedStorage = imageCount * variantsPerImage * avgSizePerVariant;

    return {
      estimatedTime: Math.round(estimatedTime / 1000), // Convert to seconds
      estimatedStorage: Math.round(estimatedStorage / (1024 * 1024)) // Convert to MB
    };
  }
}

interface ProcessingTask {
  image: GeneratedImage | ReplicateImage;
  options: ProcessingOptions;
  metadata: ProcessingMetadata;
}

export default ImageProcessor;