import { NextRequest, NextResponse } from 'next/server'
import { modelRegistry } from '@/lib/models/registry/ModelRegistry'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Check if model exists
    const existingModel = await modelRegistry.getModel(slug)
    if (!existingModel) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      )
    }

    // Check if model supports schema sync
    if (existingModel.provider !== 'replicate') {
      return NextResponse.json(
        { success: false, error: 'Schema sync only supported for Replicate models' },
        { status: 400 }
      )
    }

    if (!existingModel.config?.replicateId) {
      return NextResponse.json(
        { success: false, error: 'Model missing Replicate ID' },
        { status: 400 }
      )
    }

    // Sync the schema
    const updatedModel = await modelRegistry.syncModelSchema(slug)
    
    return NextResponse.json({
      success: true,
      data: updatedModel,
      message: 'Schema synced successfully'
    })
  } catch (error) {
    console.error(`Error syncing model schema:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync model schema' 
      },
      { status: 500 }
    )
  }
}