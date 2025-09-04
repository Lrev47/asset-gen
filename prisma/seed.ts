import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDefaultUser() {
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

// AI Models with complete configuration data (core 4 models)
const initialModels = [
  {
    name: "FLUX.1 [dev]",
    slug: "black-forest-labs/flux-dev",
    provider: "replicate",
    type: "image",
    costPerUse: 0.055,
    capabilities: {
      operations: ["text-to-image"],
      mediaTypes: ["image"],
      features: ["aspect_ratio", "seed_control", "quality_settings"],
      streaming: false,
      batch: true,
      webhook: true
    },
    config: {
      replicateId: "black-forest-labs/flux-dev",
      version: "6e4a938f85952bdabcc15aa329178c4d681c52bf25a0342403287dc26944661d",
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
      outputType: "image_url"
    },
    parameters: {
      aspect_ratio: "1:1",
      guidance: 3.5,
      num_inference_steps: 28,
      output_format: "webp",
      output_quality: 80,
      num_outputs: 1
    },
    limits: {
      maxResolution: "1440x1440",
      maxOutputs: 4,
      timeoutSeconds: 600
    }
  },
  {
    name: "Meta Llama 3.1 8B Instruct",
    slug: "meta/meta-llama-3.1-8b-instruct",
    provider: "replicate",
    type: "text",
    costPerUse: 0.0003,
    capabilities: {
      operations: ["text-generation", "chat", "completion"],
      mediaTypes: ["text"],
      features: ["temperature_control", "system_prompts", "streaming"],
      streaming: true,
      batch: false,
      webhook: true
    },
    config: {
      replicateId: "meta/meta-llama-3.1-8b-instruct",
      version: "5292a05c5ad89d9f26a2e0b7b18b782962a02f8bae8b43f32dedd41b0a10ccbc",
      replicateUrl: "https://replicate.com/meta/meta-llama-3.1-8b-instruct",
      inputSchema: {
        prompt: { 
          type: "string", 
          required: true, 
          description: "Text prompt for generation" 
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
        seed: { 
          type: "integer", 
          optional: true,
          description: "Random seed for reproducible results"
        }
      },
      outputType: "text_stream"
    },
    parameters: {
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 128000,
      timeoutSeconds: 300
    }
  },
  {
    name: "Zeroscope v2 XL",
    slug: "anotherjesse/zeroscope-v2-xl",
    provider: "replicate",
    type: "video",
    costPerUse: 0.12,
    capabilities: {
      operations: ["text-to-video"],
      mediaTypes: ["video"],
      features: ["fps_control", "resolution_control", "seed_control"],
      streaming: false,
      batch: false,
      webhook: true
    },
    config: {
      replicateId: "anotherjesse/zeroscope-v2-xl",
      version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
      replicateUrl: "https://replicate.com/anotherjesse/zeroscope-v2-xl",
      inputSchema: {
        prompt: { 
          type: "string", 
          required: true, 
          description: "Text description of the video to generate" 
        },
        width: { 
          type: "integer", 
          min: 256, 
          max: 1024, 
          default: 1024,
          description: "Width of the output video"
        },
        height: { 
          type: "integer", 
          min: 256, 
          max: 576, 
          default: 576,
          description: "Height of the output video"
        },
        fps: { 
          type: "integer", 
          min: 8, 
          max: 24, 
          default: 24,
          description: "Frames per second"
        },
        num_frames: { 
          type: "integer", 
          min: 8, 
          max: 24, 
          default: 24,
          description: "Number of frames to generate"
        },
        seed: { 
          type: "integer", 
          optional: true,
          description: "Random seed for reproducible results"
        }
      },
      outputType: "video_url"
    },
    parameters: {
      width: 1024,
      height: 576,
      fps: 24,
      num_frames: 24
    },
    limits: {
      maxDuration: 3,
      maxFrames: 24,
      timeoutSeconds: 600
    }
  },
  {
    name: "Incredibly Fast Whisper",
    slug: "vaibhavs10/incredibly-fast-whisper",
    provider: "replicate",
    type: "audio",
    costPerUse: 0.0002,
    capabilities: {
      operations: ["speech-to-text", "transcription"],
      mediaTypes: ["audio"],
      features: ["language_detection", "timestamp_control", "batch_processing"],
      streaming: false,
      batch: true,
      webhook: true
    },
    config: {
      replicateId: "vaibhavs10/incredibly-fast-whisper",
      version: "3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c6",
      replicateUrl: "https://replicate.com/vaibhavs10/incredibly-fast-whisper",
      inputSchema: {
        audio: { 
          type: "file", 
          required: true, 
          accept: "audio/*",
          description: "Audio file to transcribe" 
        },
        task: { 
          type: "enum", 
          options: ["transcribe", "translate"], 
          default: "transcribe",
          description: "Task to perform: transcribe or translate to English"
        },
        language: { 
          type: "enum", 
          options: ["auto", "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"], 
          default: "auto",
          description: "Language of the audio (auto-detect or specify)"
        },
        timestamp: { 
          type: "enum", 
          options: ["chunk", "word"], 
          default: "chunk",
          description: "Timestamp granularity"
        },
        batch_size: { 
          type: "integer", 
          min: 1, 
          max: 64, 
          default: 24,
          description: "Batch size for processing"
        }
      },
      outputType: "transcript"
    },
    parameters: {
      task: "transcribe",
      batch_size: 24,
      timestamp: "chunk"
    },
    limits: {
      maxFileSize: "25MB",
      maxDuration: 3600,
      timeoutSeconds: 600
    }
  }
]

async function main() {
  console.log('🌱 Starting database seeding...')
  
  // Create default user first
  await createDefaultUser()

  // Seed/update initial models with complete Json data
  for (const modelData of initialModels) {
    try {
      const model = await prisma.aiModel.upsert({
        where: { slug: modelData.slug },
        create: modelData,
        update: modelData
      })

      console.log(`✅ Upserted model: ${model.name} (${model.slug})`)
    } catch (error) {
      console.error(`❌ Error upserting model ${modelData.name}:`, error)
    }
  }

  console.log('🌱 Database seeded successfully')

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