#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client'
import { syncModelCoverImages } from '../lib/models/utils/coverImageSync'

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
      await prisma.userModel.updateMany({
        where: { modelSlug: oldSlug },
        data: { modelSlug: newSlug }
      })
      
      console.log(`✅ Updated "${oldSlug}" → "${newSlug}"`)
    } catch (error) {
      console.error(`❌ Error updating "${oldSlug}":`, error instanceof Error ? error.message : error)
    }
  }
}

async function syncAllModelImages() {
  console.log('🖼️  Syncing cover images from Replicate API...')
  
  try {
    // Get all Replicate models
    const replicateModels = await prisma.aiModel.findMany({
      where: { 
        provider: 'replicate',
        slug: { in: Object.values(modelSlugMapping) }
      },
      select: { slug: true, coverImageUrl: true }
    })
    
    if (replicateModels.length === 0) {
      console.log('⚠️  No Replicate models found to sync')
      return
    }
    
    console.log(`📋 Found ${replicateModels.length} Replicate models to sync`)
    
    // Sync cover images
    const modelSlugs = replicateModels.map(m => m.slug)
    const result = await syncModelCoverImages(modelSlugs)
    
    console.log(`✅ Sync completed:`)
    console.log(`   • Updated: ${result.updated} models`)
    console.log(`   • Errors: ${result.errors.length}`)
    
    if (result.errors.length > 0) {
      console.log('❌ Errors encountered:')
      result.errors.forEach(error => console.log(`   • ${error}`))
    }
    
  } catch (error) {
    console.error('❌ Failed to sync cover images:', error instanceof Error ? error.message : error)
  }
}

async function main() {
  console.log('🚀 Starting model cover image sync process...')
  
  try {
    // Step 1: Update model slugs
    await updateModelSlugs()
    
    // Step 2: Sync cover images
    await syncAllModelImages()
    
    // Step 3: Verify results
    console.log('\n📊 Verification:')
    const modelsWithImages = await prisma.aiModel.count({
      where: { 
        provider: 'replicate',
        coverImageUrl: { not: null }
      }
    })
    console.log(`✅ ${modelsWithImages} Replicate models now have cover images`)
    
    const userModelsWithImages = await prisma.userModel.count({
      where: { coverImageUrl: { not: null } }
    })
    console.log(`✅ ${userModelsWithImages} user models now have cover images`)
    
    console.log('\n🎉 Model cover image sync completed successfully!')
    
  } catch (error) {
    console.error('❌ Script failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })
}

export { main as syncModelImages }