import type { ModelType } from '../types'

// Model data structure from Replicate API
export interface ReplicateModel {
  url: string
  owner: string
  name: string
  description: string
  visibility: 'public' | 'private'
  github_url?: string
  paper_url?: string
  license_url?: string
  run_count: number
  cover_image_url?: string
  default_example?: any
  latest_version?: {
    id: string
    openapi_schema?: any
  }
}

/**
 * Detect model type from Replicate model data
 * Uses a combination of model name, input schema analysis and description parsing
 */
export function detectModelType(model: ReplicateModel): ModelType {
  const description = model.description?.toLowerCase() || ''
  const modelName = model.name.toLowerCase()
  const owner = model.owner.toLowerCase()
  const inputSchema = model.latest_version?.openapi_schema?.components?.schemas?.Input?.properties
  
  // First check for well-known model patterns by name and owner
  const knownModelType = detectFromKnownModels(modelName, owner, description)
  if (knownModelType) return knownModelType
  
  if (!inputSchema) {
    // Fallback to description-based detection when schema is not available
    return detectTypeFromDescription(description, modelName)
  }
  
  const inputKeys = Object.keys(inputSchema)
  
  // Enhanced schema pattern detection
  // Audio models
  if (inputKeys.includes('audio') || inputKeys.includes('speech') || inputKeys.includes('wav') || inputKeys.includes('mp3')) return 'audio'
  
  // Video models  
  if (inputKeys.includes('num_frames') || inputKeys.includes('fps') || inputKeys.includes('init_video') || 
      inputKeys.includes('video') || inputKeys.includes('frames') || inputKeys.includes('duration')) return 'video'
  
  // Text models
  if (inputKeys.includes('max_tokens') || inputKeys.includes('max_new_tokens') || inputKeys.includes('system_prompt') ||
      inputKeys.includes('temperature') || inputKeys.includes('top_p') || inputKeys.includes('messages')) return 'text'
  
  // Image generation models
  if ((inputKeys.includes('width') && inputKeys.includes('height')) || 
      (inputKeys.includes('prompt') && (inputKeys.includes('seed') || inputKeys.includes('guidance_scale')))) return 'image'
  
  // Utility models - image processing without generation
  if (inputKeys.includes('image') && !inputKeys.includes('prompt') && !inputKeys.includes('width')) {
    return 'utility'
  }
  
  // Enhanced fallback detection
  return detectTypeFromDescription(description, modelName)
}

/**
 * Detect model type from well-known model names and owners
 */
function detectFromKnownModels(modelName: string, owner: string, description: string): ModelType | null {
  // Image generation models
  if (modelName.includes('flux') || modelName.includes('stable-diffusion') || modelName.includes('sdxl') ||
      modelName.includes('dalle') || modelName.includes('midjourney') || modelName.includes('playground') ||
      (owner === 'black-forest-labs') || (owner === 'stability-ai' && modelName.includes('sd'))) {
    return 'image'
  }
  
  // Video generation models  
  if (modelName.includes('video') || modelName.includes('zeroscope') || modelName.includes('animatediff') ||
      modelName.includes('svd') || modelName.includes('runway') || modelName.includes('gen-2') ||
      modelName.includes('pika') || modelName.includes('mochi') || owner === 'tencent') {
    return 'video'
  }
  
  // Audio models
  if (modelName.includes('whisper') || modelName.includes('bark') || modelName.includes('musicgen') ||
      modelName.includes('tts') || modelName.includes('speech') || owner === 'openai' && modelName.includes('whisper')) {
    return 'audio'
  }
  
  // Text/Language models
  if (modelName.includes('llama') || modelName.includes('gpt') || modelName.includes('claude') ||
      modelName.includes('chat') || modelName.includes('instruct') || modelName.includes('gemma') ||
      modelName.includes('phi') || modelName.includes('qwen') || modelName.includes('mistral') ||
      (owner === 'meta' && modelName.includes('llama'))) {
    return 'text'
  }
  
  // Utility models
  if (modelName.includes('upscale') || modelName.includes('rembg') || modelName.includes('background') ||
      modelName.includes('detect') || modelName.includes('segment') || modelName.includes('caption') ||
      modelName.includes('clip') || modelName.includes('yolo') || modelName.includes('sam')) {
    return 'utility'
  }
  
  return null
}

/**
 * Detect type from description text when schema is unavailable
 */
function detectTypeFromDescription(description: string, modelName?: string): ModelType {
  // Use model name as additional context
  const combinedText = `${description} ${modelName || ''}`.toLowerCase()
  
  // Image generation keywords (prioritize specific ones)
  if (combinedText.includes('stable diffusion') || combinedText.includes('flux') || combinedText.includes('dalle') ||
      combinedText.includes('text-to-image') || combinedText.includes('img2img') || combinedText.includes('inpainting') ||
      description.includes('generate') && (description.includes('image') || description.includes('art'))) {
    return 'image'
  }
  
  // Video generation keywords (prioritize specific ones)
  if (combinedText.includes('text-to-video') || combinedText.includes('video generation') || combinedText.includes('animatediff') ||
      combinedText.includes('zeroscope') || combinedText.includes('runway') || combinedText.includes('video diffusion') ||
      description.includes('generate') && (description.includes('video') || description.includes('motion'))) {
    return 'video'
  }
  
  // Audio processing keywords (prioritize specific ones)
  if (combinedText.includes('whisper') || combinedText.includes('text-to-speech') || combinedText.includes('speech-to-text') ||
      combinedText.includes('transcription') || combinedText.includes('musicgen') || combinedText.includes('bark') ||
      description.includes('generate') && (description.includes('audio') || description.includes('music'))) {
    return 'audio'
  }
  
  // Text processing keywords (prioritize language models)
  if (combinedText.includes('language model') || combinedText.includes('chat') || combinedText.includes('instruct') ||
      combinedText.includes('conversation') || combinedText.includes('reasoning') || combinedText.includes('llama') ||
      description.includes('generate') && (description.includes('text') || description.includes('response'))) {
    return 'text'
  }
  
  // General category fallback
  if (description.includes('image') || description.includes('photo') || description.includes('visual') || 
      description.includes('picture') || description.includes('drawing') || description.includes('art')) {
    return 'image'
  }
  
  if (description.includes('video') || description.includes('motion') || description.includes('animation') || 
      description.includes('movie') || description.includes('clip') || description.includes('frames')) {
    return 'video'
  }
  
  if (description.includes('audio') || description.includes('speech') || description.includes('sound') || 
      description.includes('voice') || description.includes('music') || description.includes('transcribe')) {
    return 'audio'
  }
  
  if (description.includes('text') || description.includes('language') || description.includes('llm') || 
      description.includes('gpt') || description.includes('translation') || description.includes('writing')) {
    return 'text'
  }
  
  // Utility/processing keywords (catch-all for tools)
  if (description.includes('detect') || description.includes('classify') || description.includes('extract') || 
      description.includes('analyze') || description.includes('process') || description.includes('convert') ||
      description.includes('upscale') || description.includes('enhance') || description.includes('remove') ||
      description.includes('segment') || description.includes('caption') || description.includes('tag') ||
      description.includes('recognition') || description.includes('prediction') || description.includes('filter')) {
    return 'utility'
  }
  
  // Default to utility for unknown types
  return 'utility'
}

/**
 * Get confidence score for detected type (0-1)
 * Higher scores indicate more reliable type detection
 */
export function getTypeDetectionConfidence(model: ReplicateModel, detectedType: ModelType): number {
  const description = model.description?.toLowerCase() || ''
  const inputSchema = model.latest_version?.openapi_schema?.components?.schemas?.Input?.properties
  
  let confidence = 0.5 // Base confidence
  
  // Schema-based detection is more reliable
  if (inputSchema) {
    const inputKeys = Object.keys(inputSchema)
    
    // Strong schema indicators
    if (detectedType === 'audio' && (inputKeys.includes('audio') || inputKeys.includes('speech'))) confidence += 0.4
    if (detectedType === 'video' && (inputKeys.includes('num_frames') || inputKeys.includes('fps'))) confidence += 0.4
    if (detectedType === 'text' && (inputKeys.includes('max_tokens') || inputKeys.includes('system_prompt'))) confidence += 0.4
    if (detectedType === 'image' && inputKeys.includes('width') && inputKeys.includes('height')) confidence += 0.4
  }
  
  // Description-based confirmation
  const typeKeywords = {
    image: ['image', 'photo', 'visual', 'picture', 'drawing', 'art'],
    video: ['video', 'motion', 'animation', 'movie', 'clip', 'frames'],
    audio: ['audio', 'speech', 'sound', 'voice', 'music', 'transcribe'],
    text: ['text', 'language', 'chat', 'llm', 'gpt', 'translation'],
    utility: ['detect', 'classify', 'extract', 'analyze', 'process', 'convert', 'upscale', 'enhance', 'remove']
  }
  
  const keywords = typeKeywords[detectedType] || []
  const matchingKeywords = keywords.filter(keyword => description.includes(keyword)).length
  
  if (matchingKeywords > 0) {
    confidence += Math.min(matchingKeywords * 0.1, 0.3)
  }
  
  // Run count can indicate popularity/reliability
  if (model.run_count > 1000) confidence += 0.05
  if (model.run_count > 10000) confidence += 0.05
  
  return Math.min(confidence, 1.0)
}

/**
 * Get suggested category tags based on detected type and description
 */
export function getSuggestedTags(model: ReplicateModel, detectedType: ModelType): string[] {
  const description = model.description?.toLowerCase() || ''
  const tags: string[] = []
  
  // Add type-specific tags
  switch (detectedType) {
    case 'image':
      if (description.includes('flux')) tags.push('flux')
      if (description.includes('stable diffusion') || description.includes('sd')) tags.push('stable-diffusion')
      if (description.includes('realistic')) tags.push('realistic')
      if (description.includes('anime')) tags.push('anime')
      if (description.includes('art')) tags.push('artistic')
      break
    
    case 'video':
      if (description.includes('anime')) tags.push('anime')
      if (description.includes('realistic')) tags.push('realistic')
      if (description.includes('motion')) tags.push('motion')
      break
    
    case 'audio':
      if (description.includes('whisper')) tags.push('whisper')
      if (description.includes('transcribe')) tags.push('transcription')
      if (description.includes('translate')) tags.push('translation')
      if (description.includes('music')) tags.push('music')
      break
    
    case 'text':
      if (description.includes('llama')) tags.push('llama')
      if (description.includes('gpt')) tags.push('gpt')
      if (description.includes('chat')) tags.push('chat')
      if (description.includes('instruct')) tags.push('instruction-following')
      break
    
    case 'utility':
      if (description.includes('upscale')) tags.push('upscaling')
      if (description.includes('background')) tags.push('background-removal')
      if (description.includes('detect')) tags.push('detection')
      if (description.includes('segment')) tags.push('segmentation')
      if (description.includes('caption')) tags.push('captioning')
      break
  }
  
  // Add general capability tags
  if (description.includes('fast')) tags.push('fast')
  if (description.includes('high quality') || description.includes('hq')) tags.push('high-quality')
  if (description.includes('free')) tags.push('free')
  if (description.includes('commercial')) tags.push('commercial')
  
  return tags
}