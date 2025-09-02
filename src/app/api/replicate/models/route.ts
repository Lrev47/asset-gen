import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSize = searchParams.get('page_size') || '100' // Increase default to max
    const cursor = searchParams.get('cursor')
    const owner = searchParams.get('owner')
    
    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    // Build query parameters
    const queryParams = new URLSearchParams()
    queryParams.set('page_size', Math.min(parseInt(pageSize), 100).toString()) // Cap at Replicate's max
    if (cursor) queryParams.set('cursor', cursor)
    if (owner) queryParams.set('owner', owner)

    const url = `https://api.replicate.com/v1/models?${queryParams.toString()}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Replicate API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Replicate API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching models from Replicate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}