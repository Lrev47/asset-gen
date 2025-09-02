import { NextRequest, NextResponse } from 'next/server'
import { modelRegistry } from '@/lib/models/registry/ModelRegistry'
import type { ModelFilter } from '@/lib/models/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse query parameters
    const filter: ModelFilter = {}
    
    const type = searchParams.get('type')
    if (type) filter.type = type as any
    
    const provider = searchParams.get('provider')
    if (provider) filter.provider = provider as any
    
    const status = searchParams.get('status')
    if (status) filter.status = status as any
    
    const search = searchParams.get('search')
    if (search) filter.search = search
    
    const capabilities = searchParams.get('capabilities')?.split(',').filter(Boolean)
    if (capabilities && capabilities.length > 0) filter.capabilities = capabilities

    const models = await modelRegistry.getAllModels(filter)
    
    return NextResponse.json({
      success: true,
      data: models,
      count: models.length
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch models' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'slug', 'provider', 'type']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    const model = await modelRegistry.registerModel(body)
    
    return NextResponse.json({
      success: true,
      data: model
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create model' 
      },
      { status: 500 }
    )
  }
}