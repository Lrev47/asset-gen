const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mapping of current simplified slugs to proper Replicate model IDs
const modelSlugMapping = {
  'flux-dev': 'black-forest-labs/flux-dev',
  'llama-3-8b': 'meta/meta-llama-3-8b-instruct', 
  'zeroscope-v2-xl': 'anotherjesse/zeroscope-v2-xl',
  'whisper-v3': 'vaibhavs10/incredibly-fast-whisper'
}

async function updateModelSlugs() {
  console.log('🔄 Updating AiModel slugs to match Replicate format...')
  
  for (const [oldSlug, newSlug] of Object.entries(modelSlugMapping)) {
    try {
      // Check if the old slug exists
      const existingModel = await prisma.aiModel.findUnique({
        where: { slug: oldSlug }
      })
      
      if (!existingModel) {
        console.log(`⚠️  Model with slug "${oldSlug}" not found, skipping...`)
        continue
      }
      
      // Update the AiModel slug
      await prisma.aiModel.update({
        where: { slug: oldSlug },
        data: { slug: newSlug }
      })
      
      // Update any UserModel references
      const userModelUpdates = await prisma.userModel.updateMany({
        where: { modelSlug: oldSlug },
        data: { modelSlug: newSlug }
      })
      
      console.log(`✅ Updated "${oldSlug}" → "${newSlug}" (${userModelUpdates.count} user models updated)`)
    } catch (error) {
      console.error(`❌ Error updating "${oldSlug}":`, error.message)
    }
  }
}

async function main() {
  console.log('🚀 Starting model slug update...')
  
  try {
    await updateModelSlugs()
    
    // Verify results
    console.log('\n📊 Verification:')
    const replicateModels = await prisma.aiModel.findMany({
      where: { provider: 'replicate' },
      select: { slug: true, name: true }
    })
    
    console.log('Current Replicate models:')
    replicateModels.forEach(model => {
      console.log(`  • ${model.slug} (${model.name})`)
    })
    
    console.log('\n🎉 Model slug update completed!')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})