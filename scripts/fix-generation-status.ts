#!/usr/bin/env tsx

/**
 * Migration script to fix pending generation statuses
 * 
 * This script finds all generations with "pending" status and updates them
 * with the correct status from Replicate API.
 * 
 * Run with: npx tsx scripts/fix-generation-status.ts
 */

import prisma from '../src/lib/db/prisma'
import { createReplicateAdapter } from '../src/lib/models/adapters/ReplicateAdapter'

interface PendingGeneration {
  id: string
  output: any
  createdAt: Date
  model: {
    name: string
    slug: string
  }
}

async function fixGenerationStatus() {
  console.log('🔍 Finding pending generations...')
  
  // Find all generations with pending status
  const pendingGenerations = await prisma.generation.findMany({
    where: {
      status: 'pending'
    },
    include: {
      model: {
        select: {
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as PendingGeneration[]

  console.log(`📋 Found ${pendingGenerations.length} pending generations`)

  if (pendingGenerations.length === 0) {
    console.log('✅ No pending generations to fix')
    return
  }

  const adapter = createReplicateAdapter()
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const generation of pendingGenerations) {
    try {
      // Check if generation has a prediction ID
      const output = generation.output as any
      const predictionId = output?.predictionId

      if (!predictionId) {
        console.log(`⏭️  Skipping ${generation.id} (${generation.model.name}) - no prediction ID`)
        skipped++
        continue
      }

      console.log(`🔄 Checking status for ${generation.id} - prediction ${predictionId.slice(0, 8)}...`)

      // Get status from Replicate
      const statusResult = await adapter.getStatus(predictionId)
      
      // Map Replicate status to our database status
      let dbStatus: string = statusResult.status
      switch (statusResult.status) {
        case 'starting':
        case 'processing':
          dbStatus = 'processing'
          break
        case 'succeeded':
          dbStatus = 'completed'
          break
        case 'failed':
        case 'canceled':
          dbStatus = 'failed'
          break
      }

      // Update the generation if status has changed
      if (dbStatus !== 'pending') {
        const updateData: any = {
          status: dbStatus
        }

        // Add output and completion time for completed/failed generations
        if (statusResult.output) {
          updateData.output = {
            ...output,
            result: statusResult.output,
            lastUpdated: new Date().toISOString()
          }
        }

        if (statusResult.error) {
          updateData.output = {
            ...output,
            error: statusResult.error,
            lastUpdated: new Date().toISOString()
          }
        }

        if (statusResult.metrics?.total_time) {
          updateData.duration = Math.round(statusResult.metrics.total_time * 1000)
        }

        if (dbStatus === 'completed' || dbStatus === 'failed') {
          updateData.completedAt = new Date()
        }

        await prisma.generation.update({
          where: { id: generation.id },
          data: updateData
        })

        console.log(`✅ Updated ${generation.id} to ${dbStatus}`)
        updated++
      } else {
        console.log(`⏸️  ${generation.id} is still pending on Replicate`)
        skipped++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing ${generation.id}:`, error instanceof Error ? error.message : 'Unknown error')
      errors++
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📋 Total processed: ${pendingGenerations.length}`)

  if (updated > 0) {
    console.log('\n🎉 Generation statuses have been fixed!')
    console.log('   You can now refresh the Recent Generations tab to see the updates.')
  }
}

async function main() {
  try {
    console.log('🚀 Starting generation status migration...\n')
    await fixGenerationStatus()
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
if (require.main === module) {
  main()
}

export { fixGenerationStatus }