import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function createDefaultUser() {
  // Create a default user if it doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: { id: 'user-1' }
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: 'user-1',
        email: 'default@mediaforge.com',
        name: 'Default User',
        preferences: {}
      }
    })
    console.log('✅ Created default user')
  } else {
    console.log('ℹ️ Default user already exists')
  }
}

// AI Models are now managed through the registry system - no longer seeded
/*
const initialModels = [
  {
    // 1. FLUX.1 [dev] - Image Generation
    name: "FLUX.1 [dev]",
    slug: "flux-dev",
    provider: "replicate",
    type: "image",
    deploymentType: "api",
    capabilities: {
      operations: ["text-to-image"],
      supportedFormats: ["webp", "png", "jpg"],
      maxResolution: "1440x1440",
      features: ["aspect_ratio", "seed_control", "quality_settings"],
      mediaTypes: ["image"],
      streaming: false,
      batch: true,
      webhook: true
    },
    config: {
      replicateId: "black-forest-labs/flux-dev",
      version: "7360df13418a31f5b4a9cc48e8e2ea345d77b60e1a4674b8edaecc9111a7d77f",
      replicateUrl: "https://replicate.com/black-forest-labs/flux-dev",
      inputSchema: {
        prompt: { 
          type: "string", 
          required: true, 
          description: "Text description of the image to generate" 
        },
        aspect_ratio: { 
          type: "enum", 
          options: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2"], 
          default: "1:1",
          description: "Aspect ratio for generated image"
        },
        num_outputs: { 
          type: "integer", 
          min: 1, 
          max: 4, 
          default: 1,
          description: "Number of images to generate"
        },
        guidance: { 
          type: "number", 
          min: 1, 
          max: 10, 
          default: 3.5,
          description: "Guidance scale for generation"
        },
        num_inference_steps: { 
          type: "integer", 
          min: 1, 
          max: 50, 
          default: 28,
          description: "Number of denoising steps"
        },
        output_format: { 
          type: "enum", 
          options: ["webp", "png", "jpg"], 
          default: "webp",
          description: "Output image format"
        },
        output_quality: { 
          type: "integer", 
          min: 1, 
          max: 100, 
          default: 80,
          description: "Output image quality (1-100)"
        },
        seed: { 
          type: "integer", 
          optional: true,
          description: "Random seed for reproducible results"
        }
      },
      outputType: "image_urls",
      supportedFormats: ["webp", "png", "jpg"]
    },
    parameters: {
      guidance: 3.5,
      num_inference_steps: 28,
      output_format: "webp",
      output_quality: 80,
      aspect_ratio: "1:1",
      num_outputs: 1
    },
    limits: {
      maxResolution: "1440x1440",
      maxBatchSize: 4,
      timeoutSeconds: 300
    },
    costPerUse: 0.030,
    avgLatency: 8000,
    status: "active"
  },
  {
    // 2. Meta Llama 3.1 8B - Text Generation
    name: "Meta Llama 3.1 8B Instruct",
    slug: "llama-3-1-8b",
    provider: "replicate",
    type: "text",
    deploymentType: "api",
    capabilities: {
      operations: ["text-generation", "chat", "completion"],
      maxTokens: 8192,
      features: ["streaming", "system_prompt", "temperature_control"],
      mediaTypes: ["text"],
      streaming: true,
      batch: false,
      webhook: true
    },
    config: {
      replicateId: "meta/meta-llama-3.1-8b-instruct",
      version: "latest",
      replicateUrl: "https://replicate.com/meta/meta-llama-3.1-8b-instruct",
      inputSchema: {
        prompt: { 
          type: "string", 
          required: true,
          description: "Input text prompt for generation"
        },
        system_prompt: { 
          type: "string", 
          optional: true,
          description: "System message to guide the assistant's behavior"
        },
        max_tokens: { 
          type: "integer", 
          min: 1, 
          max: 8192, 
          default: 1024,
          description: "Maximum number of tokens to generate"
        },
        temperature: { 
          type: "number", 
          min: 0, 
          max: 2, 
          default: 0.7,
          description: "Controls randomness in generation"
        },
        top_p: { 
          type: "number", 
          min: 0, 
          max: 1, 
          default: 0.9,
          description: "Nucleus sampling parameter"
        },
        min_tokens: { 
          type: "integer", 
          min: 0, 
          default: 0,
          description: "Minimum number of tokens to generate"
        },
        stop_sequences: { 
          type: "string", 
          optional: true,
          description: "Comma-separated list of sequences where generation should stop"
        },
        seed: { 
          type: "integer", 
          optional: true,
          description: "Random seed for reproducible results"
        }
      },
      outputType: "text_stream",
      streaming: true
    },
    parameters: {
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
      min_tokens: 0
    },
    limits: {
      maxTokens: 8192,
      timeoutSeconds: 600
    },
    costPerUse: 0.00065, // per 1K tokens
    avgLatency: 2000,
    status: "active"
  },
  {
    // 3. Zeroscope v2 XL - Video Generation
    name: "Zeroscope v2 XL",
    slug: "zeroscope-v2-xl",
    provider: "replicate",
    type: "video",
    deploymentType: "api",
    capabilities: {
      operations: ["text-to-video"],
      outputFormat: "mp4",
      maxDuration: 3,
      maxResolution: "1024x576",
      features: ["fps_control", "num_frames", "seed_control"],
      mediaTypes: ["video"],
      streaming: false,
      batch: false,
      webhook: true
    },
    config: {
      replicateId: "anotherjesse/zeroscope-v2-xl",
      version: "71996d331e8ede8ef7bd76eba9fae076d31792e4ddf4ad057779b443d6aea62f",
      replicateUrl: "https://replicate.com/anotherjesse/zeroscope-v2-xl",
      inputSchema: {
        prompt: { 
          type: "string", 
          required: true,
          description: "Text description of the video to generate"
        },
        negative_prompt: { 
          type: "string", 
          optional: true,
          description: "Text describing what you don't want in the video"
        },
        num_frames: { 
          type: "integer", 
          min: 1, 
          max: 72, 
          default: 24,
          description: "Number of frames to generate"
        },
        fps: { 
          type: "integer", 
          min: 1, 
          max: 30, 
          default: 8,
          description: "Frames per second for the video"
        },
        width: { 
          type: "integer", 
          default: 1024,
          description: "Width of the generated video"
        },
        height: { 
          type: "integer", 
          default: 576,
          description: "Height of the generated video"
        },
        guidance_scale: { 
          type: "number", 
          min: 1, 
          max: 20, 
          default: 7.5,
          description: "Guidance scale for video generation"
        },
        num_inference_steps: { 
          type: "integer", 
          min: 1, 
          max: 100, 
          default: 50,
          description: "Number of denoising steps"
        },
        seed: { 
          type: "integer", 
          optional: true,
          description: "Random seed for reproducible results"
        }
      },
      outputType: "video_url",
      supportedFormats: ["mp4"]
    },
    parameters: {
      num_frames: 24,
      fps: 8,
      width: 1024,
      height: 576,
      guidance_scale: 7.5,
      num_inference_steps: 50
    },
    limits: {
      maxFrames: 72,
      maxResolution: "1024x576",
      maxDuration: 9, // seconds (72 frames / 8 fps)
      timeoutSeconds: 1800
    },
    costPerUse: 0.032,
    avgLatency: 120000,
    status: "active"
  },
  {
    // 4. Whisper Large v3 - Audio Transcription
    name: "Incredibly Fast Whisper",
    slug: "whisper-v3",
    provider: "replicate",
    type: "audio",
    deploymentType: "api",
    capabilities: {
      operations: ["speech-to-text", "translation"],
      supportedLanguages: ["100+ languages"],
      features: ["timestamps", "language_detection", "batch_processing"],
      mediaTypes: ["audio"],
      streaming: false,
      batch: true,
      webhook: true
    },
    config: {
      replicateId: "vaibhavs10/incredibly-fast-whisper",
      version: "3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
      replicateUrl: "https://replicate.com/vaibhavs10/incredibly-fast-whisper",
      inputSchema: {
        audio: { 
          type: "file", 
          required: true, 
          accept: "audio/*",
          description: "Audio file to transcribe or translate"
        },
        task: { 
          type: "enum", 
          options: ["transcribe", "translate"], 
          default: "transcribe",
          description: "Whether to transcribe or translate the audio"
        },
        language: { 
          type: "string", 
          optional: true, 
          default: "None",
          description: "Language of the audio (auto-detect if not specified)"
        },
        timestamp: { 
          type: "enum", 
          options: ["chunk", "word"], 
          optional: true,
          description: "Return timestamps at word or chunk level"
        },
        batch_size: { 
          type: "integer", 
          min: 1, 
          max: 64, 
          default: 24,
          description: "Batch size for processing"
        },
        diarize: { 
          type: "boolean", 
          default: false,
          description: "Enable speaker diarization (identify different speakers)"
        }
      },
      outputType: "transcript",
      supportedFormats: ["mp3", "wav", "m4a", "flac", "ogg"]
    },
    parameters: {
      task: "transcribe",
      batch_size: 24,
      timestamp: "chunk",
      diarize: false
    },
    limits: {
      maxFileSize: "25MB",
      maxDuration: 3600, // 1 hour
      timeoutSeconds: 600
    },
    costPerUse: 0.0002, // per second of audio
    avgLatency: 5000,
    status: "active"
  },
  {
    // 5. GPT-4o Transcribe - Speech-to-Text Utility
    name: "GPT-4o Transcribe",
    slug: "gpt-4o-transcribe",
    provider: "replicate",
    type: "utility",
    deploymentType: "api",
    capabilities: {
      operations: ["speech-to-text", "transcription", "audio-analysis"],
      supportedFormats: ["mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "wav", "webm"],
      maxFileSize: "25MB",
      features: ["language_detection", "temperature_control", "prompt_guidance"],
      mediaTypes: ["audio"],
      streaming: false,
      batch: false,
      webhook: true
    },
    config: {
      replicateId: "openai/gpt-4o-transcribe",
      version: "latest",
      replicateUrl: "https://replicate.com/openai/gpt-4o-transcribe",
      inputSchema: {
        audio_file: { 
          type: "file", 
          required: true, 
          accept: "audio/*",
          description: "The audio file to transcribe. Supported formats: mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm" 
        },
        language: { 
          type: "string", 
          optional: true, 
          description: "The language of the input audio. Supplying the input language in ISO-639-1 format will improve accuracy and latency"
        },
        prompt: { 
          type: "string", 
          optional: true,
          description: "An optional text to guide the model's style or continue a previous audio segment"
        },
        temperature: { 
          type: "number", 
          min: 0, 
          max: 1, 
          optional: true,
          default: 0,
          description: "Sampling temperature between 0 and 1"
        }
      },
      outputType: "transcript_array",
      supportedFormats: ["mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "wav", "webm"]
    },
    parameters: {
      temperature: 0
    },
    limits: {
      maxFileSize: "25MB",
      contextWindow: 16000,
      maxOutputTokens: 2000,
      timeoutSeconds: 300
    },
    costPerUse: 0.0002, // per second of audio
    avgLatency: 3000,
    status: "active"
  },
  {
    // 6. Remove Background - Image Processing Utility
    name: "Remove Background",
    slug: "remove-bg",
    provider: "replicate",
    type: "utility",
    deploymentType: "api",
    capabilities: {
      operations: ["background-removal", "image-processing", "image-editing"],
      supportedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFileSize: "10MB",
      features: ["automatic_detection", "transparent_output"],
      mediaTypes: ["image"],
      streaming: false,
      batch: true,
      webhook: true
    },
    config: {
      replicateId: "lucataco/remove-bg",
      version: "latest",
      replicateUrl: "https://replicate.com/lucataco/remove-bg",
      inputSchema: {
        image: { 
          type: "file", 
          required: true, 
          accept: "image/*",
          description: "Remove background from this image" 
        }
      },
      outputType: "image_url",
      supportedFormats: ["png"] // Output is always PNG with transparency
    },
    parameters: {},
    limits: {
      maxFileSize: "10MB",
      maxResolution: "4096x4096",
      timeoutSeconds: 120
    },
    costPerUse: 0.01,
    avgLatency: 8000,
    status: "active"
  },
  {
    // 7. Image Upscaler - Image Enhancement Utility
    name: "Image Upscaler",
    slug: "image-upscaler",
    provider: "replicate",
    type: "utility",
    deploymentType: "api",
    capabilities: {
      operations: ["image-upscaling", "image-enhancement", "image-processing"],
      supportedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFileSize: "10MB",
      features: ["2x_upscale", "4x_upscale", "quality_control"],
      mediaTypes: ["image"],
      streaming: false,
      batch: true,
      webhook: true
    },
    config: {
      replicateId: "google/upscaler",
      version: "latest",
      replicateUrl: "https://replicate.com/google/upscaler",
      inputSchema: {
        image: { 
          type: "file", 
          required: true, 
          accept: "image/*",
          description: "Image to upscale" 
        },
        upscale_factor: { 
          type: "enum", 
          options: ["x2", "x4"], 
          optional: true,
          default: "x2",
          description: "Factor by which to upscale the image"
        },
        compression_quality: { 
          type: "integer", 
          min: 1, 
          max: 100, 
          optional: true,
          default: 80,
          description: "Compression quality for output (1-100)"
        }
      },
      outputType: "image_url",
      supportedFormats: ["jpg", "jpeg", "png", "webp"]
    },
    parameters: {
      upscale_factor: "x2",
      compression_quality: 80
    },
    limits: {
      maxFileSize: "10MB",
      maxResolution: "4096x4096",
      timeoutSeconds: 180
    },
    costPerUse: 0.02,
    avgLatency: 12000,
    status: "active"
  }
]
*/

async function main() {
  console.log('🌱 Starting database seeding...')
  
  // Create default user first
  await createDefaultUser()

  console.log('🌱 Database seeded successfully')

  // AI Models are now managed through the registry system
  // Users can add models from Replicate API directly through the UI
  
  // // Seed initial models - COMMENTED OUT
  // for (const modelData of initialModels) {
  //   try {
  //     const existingModel = await prisma.aiModel.findUnique({
  //       where: { slug: modelData.slug }
  //     })

  //     if (existingModel) {
  //       console.log(`⏩ Model ${modelData.name} already exists, skipping...`)
  //       continue
  //     }

  //     const model = await prisma.aiModel.create({
  //       data: {
  //         ...modelData,
  //         credentials: Prisma.JsonNull, // Will be set via environment variables
  //         lastChecked: null
  //       }
  //     })

  //     console.log(`✅ Created model: ${model.name} (${model.slug})`)
  //   } catch (error) {
  //     console.error(`❌ Error creating model ${modelData.name}:`, error)
  //   }
  // }

  // Display summary
  const modelCount = await prisma.aiModel.count()
  console.log(`\n🎉 Seeding complete! Total AI models: ${modelCount}`)

  // Display models by type
  const modelsByType = await prisma.aiModel.groupBy({
    by: ['type'],
    _count: {
      id: true
    }
  })

  console.log('\n📊 Models by type:')
  modelsByType.forEach(({ type, _count }) => {
    console.log(`  ${type}: ${_count.id}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })