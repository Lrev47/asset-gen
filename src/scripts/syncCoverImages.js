const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
const REPLICATE_BASE_URL = 'https://api.replicate.com/v1'

if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable is not set')
  process.exit(1)
}

async function fetchModelFromReplicate(modelSlug) {
  try {
    console.log(`🔍 Fetching model info for: ${modelSlug}`)
    
    const response = await fetch(`${REPLICATE_BASE_URL}/models/${modelSlug}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const modelData = await response.json()
    return modelData
    
  } catch (error) {
    console.error(`❌ Error fetching ${modelSlug}:`, error.message)
    return null
  }
}

async function syncCoverImagesForAllModels() {
  console.log('🖼️  Syncing cover images from Replicate API...')
  
  try {
    // Get all Replicate models
    const replicateModels = await prisma.aiModel.findMany({
      where: { provider: 'replicate' },
      select: { id: true, slug: true, name: true, coverImageUrl: true }
    })
    
    if (replicateModels.length === 0) {
      console.log('⚠️  No Replicate models found to sync')
      return
    }
    
    console.log(`📋 Found ${replicateModels.length} Replicate models to sync`)
    
    let updated = 0
    const errors = []
    
    for (const model of replicateModels) {
      try {
        // Skip if we already have a cover image (optional - remove this if you want to refresh)
        // if (model.coverImageUrl) {
        //   console.log(`⏭️  Skipping ${model.slug} - already has cover image`)
        //   continue
        // }
        
        // Fetch model data from Replicate
        const replicateData = await fetchModelFromReplicate(model.slug)
        
        if (replicateData && replicateData.cover_image_url) {
          // Update the AiModel with cover image URL
          await prisma.aiModel.update({
            where: { id: model.id },
            data: { coverImageUrl: replicateData.cover_image_url }
          })
          
          // Also update all UserModels that reference this model
          const userModelUpdates = await prisma.userModel.updateMany({
            where: { modelSlug: model.slug },
            data: { coverImageUrl: replicateData.cover_image_url }
          })
          
          console.log(`✅ Updated cover image for ${model.slug} (${userModelUpdates.count} user models updated)`)
          updated++
          
        } else if (replicateData) {
          console.log(`⚠️  No cover image available for ${model.slug}`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        const errorMsg = `Failed to sync ${model.slug}: ${error.message}`
        errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }
    
    console.log(`\n📊 Sync Results:`)
    console.log(`   • Updated: ${updated} models`)
    console.log(`   • Errors: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('❌ Errors encountered:')
      errors.forEach(error => console.log(`   • ${error}`))
    }
    
  } catch (error) {
    console.error('❌ Failed to sync cover images:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting cover image sync process...')
  
  try {
    await syncCoverImagesForAllModels()
    
    // Verify results
    console.log('\n📊 Final Verification:')
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
    
    // Show examples
    const exampleModels = await prisma.aiModel.findMany({
      where: { 
        provider: 'replicate',
        coverImageUrl: { not: null }
      },
      select: { slug: true, coverImageUrl: true },
      take: 3
    })
    
    if (exampleModels.length > 0) {
      console.log('\n🖼️  Sample cover image URLs:')
      exampleModels.forEach(model => {
        console.log(`   • ${model.slug}: ${model.coverImageUrl?.substring(0, 80)}...`)
      })
    }
    
    console.log('\n🎉 Cover image sync completed successfully!')
    
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