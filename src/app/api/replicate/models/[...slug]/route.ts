import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest, 
  { params }: { params: { slug: string[] } }
) {
  try {
    // Join the slug array to form the full model slug (e.g., "black-forest-labs/flux-1.1-pro")
    const modelSlug = params.slug.join('/')
    
    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    const url = `https://api.replicate.com/v1/models/${modelSlug}`

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
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        )
      }
      
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
    console.error('Error fetching model from Replicate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    )
  }
}