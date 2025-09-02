import { NextRequest, NextResponse } from 'next/server'
import { createReplicateAdapter } from '@/lib/models/adapters/ReplicateAdapter'
import { updateGenerationStatus, createMediaFromGeneration } from '@/app/actions/generation'
import { updateGenerationFromPrediction } from '@/app/actions/models'
import type { WebhookPayload } from '@/lib/models/types'

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('webhook-signature') || ''

    // Verify webhook signature
    const adapter = createReplicateAdapter()
    const isValid = adapter.validateWebhook(signature, body)
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the webhook payload
    let payload: WebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.error('Error parsing webhook payload:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    console.log(`Received webhook for prediction ${payload.id} with status ${payload.status}`)

    // Handle different prediction statuses
    switch (payload.status) {
      case 'starting':
        await handlePredictionStarting(payload)
        break
        
      case 'processing':
        await handlePredictionProcessing(payload)
        break
        
      case 'succeeded':
        await handlePredictionSucceeded(payload)
        break
        
      case 'failed':
        await handlePredictionFailed(payload)
        break
        
      case 'canceled':
        await handlePredictionCanceled(payload)
        break
        
      default:
        console.log(`Unhandled prediction status: ${payload.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePredictionStarting(payload: WebhookPayload) {
  try {
    await updateGenerationFromPrediction(
      payload.id,
      'starting',
      undefined,
      undefined,
      payload.metrics
    )
    console.log(`Prediction ${payload.id} started`)
  } catch (error) {
    console.error('Error handling prediction starting:', error)
  }
}

async function handlePredictionProcessing(payload: WebhookPayload) {
  try {
    await updateGenerationFromPrediction(
      payload.id,
      'processing',
      payload.logs ? { logs: payload.logs } : undefined,
      undefined,
      payload.metrics
    )
    console.log(`Prediction ${payload.id} processing...`)
  } catch (error) {
    console.error('Error handling prediction processing:', error)
  }
}

async function handlePredictionSucceeded(payload: WebhookPayload) {
  try {
    // Update generation status with output
    await updateGenerationFromPrediction(
      payload.id,
      'succeeded',
      payload.output,
      undefined,
      payload.metrics
    )

    // Create media records from the output
    if (payload.output && typeof payload.output === 'object') {
      await createMediaFromOutput(payload)
    }

    console.log(`Prediction ${payload.id} completed successfully`)
  } catch (error) {
    console.error('Error handling prediction success:', error)
  }
}

async function handlePredictionFailed(payload: WebhookPayload) {
  try {
    await updateGenerationFromPrediction(
      payload.id,
      'failed',
      undefined,
      payload.error || 'Prediction failed',
      payload.metrics
    )
    console.log(`Prediction ${payload.id} failed: ${payload.error}`)
  } catch (error) {
    console.error('Error handling prediction failure:', error)
  }
}

async function handlePredictionCanceled(payload: WebhookPayload) {
  try {
    await updateGenerationFromPrediction(
      payload.id,
      'canceled',
      undefined,
      'Prediction was canceled',
      payload.metrics
    )
    console.log(`Prediction ${payload.id} was canceled`)
  } catch (error) {
    console.error('Error handling prediction cancellation:', error)
  }
}

async function createMediaFromOutput(payload: WebhookPayload) {
  try {
    const output = payload.output
    
    // Handle different output formats
    if (Array.isArray(output)) {
      // Multiple URLs (e.g., multiple images)
      for (let i = 0; i < output.length; i++) {
        const url = output[i]
        if (typeof url === 'string' && isValidUrl(url)) {
          await createMediaRecord(payload, url, i)
        }
      }
    } else if (typeof output === 'string' && isValidUrl(output)) {
      // Single URL
      await createMediaRecord(payload, output, 0)
    } else if (typeof output === 'object' && output !== null) {
      // Object with URL property
      if ('url' in output && typeof output.url === 'string' && isValidUrl(output.url)) {
        await createMediaRecord(payload, output.url, 0)
      }
      // Handle other object formats as needed
    }
  } catch (error) {
    console.error('Error creating media from output:', error)
  }
}

async function createMediaRecord(payload: WebhookPayload, url: string, index: number) {
  try {
    // Determine media type from URL or input
    const mediaType = determineMediaType(url, payload.input)
    const format = getFileExtension(url) || 'unknown'
    
    // Generate media name
    const baseName = `Generated ${mediaType}`
    const name = index > 0 ? `${baseName} ${index + 1}` : baseName
    
    // This would need to be adapted based on your existing generation system
    // For now, just log the media creation
    console.log(`Would create media record: ${name} (${mediaType}) - ${url}`)
    
    // TODO: Integrate with existing createMediaFromGeneration function
    // await createMediaFromGeneration({
    //   generationId: findGenerationByPredictionId(payload.id),
    //   promptId: findPromptByGenerationId(generationId),
    //   name,
    //   type: mediaType,
    //   format,
    //   url,
    //   userId: getUserFromGeneration(generationId),
    //   metadata: {
    //     predictionId: payload.id,
    //     replicateOutput: payload.output,
    //     index
    //   }
    // })
  } catch (error) {
    console.error('Error creating media record:', error)
  }
}

function calculateCost(payload: WebhookPayload): number | undefined {
  // Calculate cost based on metrics if available
  if (payload.metrics?.predict_time) {
    // This is a simplified cost calculation
    // Real implementation would depend on the specific model's pricing
    return 0.001 // Default minimal cost
  }
  return undefined
}

function determineMediaType(url: string, input: any): string {
  const extension = getFileExtension(url)
  
  if (extension) {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      return 'image'
    }
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
      return 'video'
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
      return 'audio'
    }
  }
  
  // Fallback to input analysis
  if (input && typeof input === 'object') {
    if ('prompt' in input) {
      return 'image' // Most common case for text-to-image
    }
  }
  
  return 'unknown'
}

function getFileExtension(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const lastDot = pathname.lastIndexOf('.')
    
    if (lastDot === -1 || lastDot === pathname.length - 1) {
      return null
    }
    
    return pathname.slice(lastDot + 1).toLowerCase()
  } catch {
    return null
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}