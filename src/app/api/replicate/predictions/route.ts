import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export async function POST(request: NextRequest) {
  try {
    const { version, input } = await request.json()

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

    // Create prediction
    const prediction = await replicate.predictions.create({
      version,
      input,
    })

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error creating prediction:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create prediction' 
      },
      { status: 500 }
    )
  }
}