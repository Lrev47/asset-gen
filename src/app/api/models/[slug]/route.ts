import { NextRequest, NextResponse } from 'next/server'
import { modelRegistry } from '@/lib/models/registry/ModelRegistry'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const model = await modelRegistry.getModel(slug)
    
    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: model
    })
  } catch (error) {
    console.error(`Error fetching model:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch model' 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    
    const updatedModel = await modelRegistry.updateModel(slug, body)
    
    return NextResponse.json({
      success: true,
      data: updatedModel
    })
  } catch (error) {
    console.error(`Error updating model:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update model' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const deleted = await modelRegistry.deleteModel(slug)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete model' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully'
    })
  } catch (error) {
    console.error(`Error deleting model:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete model' 
      },
      { status: 500 }
    )
  }
}