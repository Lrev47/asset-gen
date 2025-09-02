import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

// Force dynamic rendering - no caching for polling
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for required environment variable
    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: apiToken,
    })

    // Get prediction status
    const prediction = await replicate.predictions.get(id)

    return NextResponse.json(prediction, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Error getting prediction status:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get prediction status' 
      },
      { status: 500 }
    )
  }
}