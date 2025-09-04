const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addUserModelsForDemo() {
  console.log('👥 Adding user models for demonstration...')
  
  try {
    // Get the default user
    const defaultUser = await prisma.user.findUnique({
      where: { id: 'user-1' }
    })
    
    if (!defaultUser) {
      console.log('❌ Default user not found, creating one...')
      await prisma.user.create({
        data: {
          id: 'user-1',
          email: 'default@mediaforge.com',
          name: 'Default User',
          preferences: {}
        }
      })
      console.log('✅ Created default user')
    }
    
    // Get all AI models with cover images
    const aiModels = await prisma.aiModel.findMany({
      where: { 
        coverImageUrl: { not: null }
      },
      select: { slug: true, name: true, type: true, coverImageUrl: true }
    })
    
    if (aiModels.length === 0) {
      console.log('❌ No AI models with cover images found')
      return
    }
    
    console.log(`📋 Found ${aiModels.length} AI models with cover images`)
    
    let added = 0
    
    for (const aiModel of aiModels) {
      try {
        // Check if user model already exists
        const existingUserModel = await prisma.userModel.findUnique({
          where: {
            userId_modelSlug: {
              userId: 'user-1',
              modelSlug: aiModel.slug
            }
          }
        })
        
        if (existingUserModel) {
          console.log(`⏭️  UserModel for ${aiModel.slug} already exists`)
          continue
        }
        
        // Create user model
        await prisma.userModel.create({
          data: {
            userId: 'user-1',
            modelSlug: aiModel.slug,
            modelName: aiModel.name || aiModel.slug,
            modelType: aiModel.type,
            coverImageUrl: aiModel.coverImageUrl,
            addedAt: new Date(),
            lastUsedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random last used in past 30 days
          }
        })
        
        console.log(`✅ Added UserModel for ${aiModel.slug}`)
        added++
        
      } catch (error) {
        console.error(`❌ Error adding UserModel for ${aiModel.slug}:`, error.message)
      }
    }
    
    console.log(`\n📊 Results:`)
    console.log(`   • Added: ${added} user models`)
    
  } catch (error) {
    console.error('❌ Failed to add user models:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting user model setup...')
  
  try {
    await addUserModelsForDemo()
    
    // Verify results
    console.log('\n📊 Final Verification:')
    const userModelsWithImages = await prisma.userModel.count({
      where: { coverImageUrl: { not: null } }
    })
    console.log(`✅ ${userModelsWithImages} user models now have cover images`)
    
    const userModels = await prisma.userModel.findMany({
      where: { 
        userId: 'user-1',
        coverImageUrl: { not: null }
      },
      select: { modelSlug: true, modelName: true, modelType: true, coverImageUrl: true, lastUsedAt: true },
      orderBy: { addedAt: 'desc' }
    })
    
    if (userModels.length > 0) {
      console.log('\n📋 User models with cover images:')
      userModels.forEach(model => {
        const lastUsed = model.lastUsedAt ? model.lastUsedAt.toISOString().split('T')[0] : 'Never'
        console.log(`   • ${model.modelName} (${model.modelType}) - Last used: ${lastUsed}`)
        console.log(`     Image: ${model.coverImageUrl?.substring(0, 60)}...`)
      })
    }
    
    console.log('\n🎉 User model setup completed successfully!')
    
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