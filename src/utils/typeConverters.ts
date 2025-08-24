import { GeneratedImageData } from '@/types/api';
import { GeneratedImage } from '@/generators/openai/dalle';
import { ReplicateImage } from '@/generators/replicate/models';

/**
 * Determines if a GeneratedImageData should be treated as a GeneratedImage (from OpenAI/DALL-E)
 * based on the model name or other characteristics
 */
function isOpenAIImage(data: GeneratedImageData): boolean {
  return data.metadata.model.toLowerCase().includes('dall-e') || 
         data.metadata.model.toLowerCase().includes('openai');
}

/**
 * Converts GeneratedImageData to GeneratedImage (OpenAI/DALL-E format)
 */
function toGeneratedImage(data: GeneratedImageData): GeneratedImage {
  return {
    url: data.url,
    filename: data.filename,
    dimensions: data.dimensions,
    metadata: {
      model: data.metadata.model,
      prompt: data.metadata.prompt,
      style: data.metadata.style || 'natural',
      quality: data.metadata.quality || 'standard',
      timestamp: data.metadata.timestamp
    }
  };
}

/**
 * Converts GeneratedImageData to ReplicateImage format
 */
function toReplicateImage(data: GeneratedImageData): ReplicateImage {
  return {
    url: data.url,
    filename: data.filename,
    dimensions: data.dimensions,
    seed: data.metadata.seed,
    metadata: {
      model: data.metadata.model,
      prompt: data.metadata.prompt,
      negativePrompt: data.metadata.negativePrompt,
      parameters: {
        steps: data.metadata.steps,
        cfgScale: data.metadata.cfgScale,
        seed: data.metadata.seed,
        ...(data.metadata as Record<string, unknown>)
      },
      timestamp: data.metadata.timestamp
    }
  };
}

/**
 * Converts an array of GeneratedImageData to the appropriate original types
 * that imageProcessor expects: (GeneratedImage | ReplicateImage)[]
 */
export function convertToProcessorTypes(data: GeneratedImageData[]): (GeneratedImage | ReplicateImage)[] {
  return data.map(item => {
    if (isOpenAIImage(item)) {
      return toGeneratedImage(item);
    } else {
      return toReplicateImage(item);
    }
  });
}

/**
 * Type guard to check if an object is a GeneratedImage
 */
export function isGeneratedImage(obj: unknown): obj is GeneratedImage {
  const candidate = obj as GeneratedImage;
  return candidate && 
         typeof candidate.url === 'string' &&
         typeof candidate.filename === 'string' &&
         candidate.dimensions &&
         candidate.metadata &&
         typeof candidate.metadata.style === 'string';
}

/**
 * Type guard to check if an object is a ReplicateImage  
 */
export function isReplicateImage(obj: unknown): obj is ReplicateImage {
  const candidate = obj as ReplicateImage;
  return candidate && 
         typeof candidate.url === 'string' &&
         typeof candidate.filename === 'string' &&
         candidate.dimensions &&
         candidate.metadata &&
         candidate.metadata.parameters &&
         typeof candidate.metadata.parameters === 'object';
}