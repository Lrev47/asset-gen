const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConsistency() {
  console.log('🧪 Testing User Model Consistency...\n')
  
  // Test what the dashboard getUserModels would return
  console.log('=== DASHBOARD QUERY (getUserModels from dashboard.ts) ===')
  const userId = 'user-1'
  
  const dashboardTotal = await prisma.userModel.count({
    where: { userId }
  })
  
  const dashboardModels = await prisma.userModel.findMany({
    where: { userId },
    take: 8,
    orderBy: [
      { lastUsedAt: { sort: 'desc', nulls: 'last' } },
      { addedAt: 'desc' }
    ]
  })
  
  console.log(`Dashboard would show: ${dashboardModels.length} models (total: ${dashboardTotal})`)
  dashboardModels.forEach(model => {
    const lastUsed = model.lastUsedAt ? model.lastUsedAt.toISOString().split('T')[0] : 'Never'
    console.log(`  • ${model.modelName} (${model.modelType}) - Last used: ${lastUsed}`)
  })
  
  // Test what the models page getUserModels would return  
  console.log('\n=== MODELS PAGE QUERY (getUserModels from userModels.ts) ===')
  
  const modelsPageModels = await prisma.userModel.findMany({
    where: { userId: 'user-1' }, // Now uses 'user-1' after our fix
    orderBy: [
      { lastUsedAt: 'desc' },
      { addedAt: 'desc' }
    ]
  })
  
  console.log(`Models page would show: ${modelsPageModels.length} models`)
  modelsPageModels.forEach(model => {
    const lastUsed = model.lastUsedAt ? model.lastUsedAt.toISOString().split('T')[0] : 'Never'
    console.log(`  • ${model.modelName} (${model.modelType}) - Last used: ${lastUsed}`)
  })
  
  // Check consistency
  console.log('\n=== CONSISTENCY CHECK ===')
  const consistent = dashboardModels.length === modelsPageModels.length
  console.log(`✅ Model counts match: ${consistent}`)
  
  if (consistent && dashboardModels.length > 0) {
    console.log('✅ Both pages should show the same models with cover images')
  } else if (dashboardModels.length === 0) {
    console.log('✅ Both pages should show empty state with "Add Models" message')
  }
  
  await prisma.$disconnect()
}

testConsistency().catch(console.error)