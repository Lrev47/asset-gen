import { NextRequest, NextResponse } from 'next/server'
import { cancelGeneration } from '@/app/actions/models'
import { createReplicateAdapter } from '@/lib/models/adapters/ReplicateAdapter'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log(`API Route: Getting status for prediction ${id.slice(0, 8)}`)
    
    // Get status directly from Replicate adapter to bypass Server Action caching
    const adapter = createReplicateAdapter()
    const result = await adapter.getStatus(id)
    
    // Transform to match the expected GenerationStatus format
    const status = {
      predictionId: result.id,
      status: result.status,
      output: result.output,
      error: result.error,
      metrics: result.metrics ? {
        startTime: result.started_at,
        endTime: result.completed_at,
        duration: result.metrics.total_time || result.metrics.predict_time
      } : undefined
    }

    console.log(`API Route: Prediction ${id.slice(0, 8)} status:`, {
      status: result.status,
      hasOutput: !!result.output,
      hasError: !!result.error
    })

    return NextResponse.json(
      { success: true, data: status },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error(`API Route: Error getting prediction status:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get prediction status' 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await cancelGeneration(id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Prediction cancelled successfully'
    })
  } catch (error) {
    console.error(`Error cancelling prediction:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel prediction' 
      },
      { status: 500 }
    )
  }
}