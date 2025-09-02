import { NextRequest, NextResponse } from 'next/server'
import { createModelGeneration } from '@/app/actions/models'
import type { GenerationRequest } from '@/lib/models/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['modelSlug', 'input', 'userId']
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

    // Create the generation request
    const generationRequest: GenerationRequest = {
      modelSlug: body.modelSlug,
      input: body.input,
      userId: body.userId,
      projectId: body.projectId,
      fieldId: body.fieldId,
      webhookUrl: body.webhookUrl,
      stream: body.stream || false
    }

    const result = await createModelGeneration(generationRequest)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating prediction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create prediction' 
      },
      { status: 500 }
    )
  }
}