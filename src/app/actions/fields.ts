'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db/prisma'
import type { Field, Media, Generation, Prisma } from '@prisma/client'

// Types for field management data
export type FieldWithDetails = Field & {
  media: Media[]
  generations: Generation[]
  _count: {
    media: number
    generations: number
  }
}

export interface FieldTemplate {
  id: string
  name: string
  type: string
  description: string
  requirements: any
  settings: any
}

export interface BulkOperationResult {
  success: boolean
  completed: number
  failed: number
  errors: string[]
}

// Get all fields for a project with detailed information
export async function getProjectFields(projectId: string): Promise<{
  fields: FieldWithDetails[]
  error?: string
}> {
  try {
    const fields = await prisma.field.findMany({
      where: { projectId },
      include: {
        media: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: {
            media: true,
            generations: true
          }
        }
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return { fields: fields as FieldWithDetails[] }
  } catch (error) {
    console.error('Error fetching project fields:', error)
    return { 
      fields: [], 
      error: 'Failed to fetch fields' 
    }
  }
}

// Create a new field
export async function createField(data: {
  projectId: string
  name: string
  type: string
  description?: string
  requirements: any
  priority?: number
  deadline?: Date
}): Promise<{ field: Field | null; error?: string }> {
  try {
    // Get the next position
    const lastField = await prisma.field.findFirst({
      where: { projectId: data.projectId },
      orderBy: { position: 'desc' }
    })
    
    const nextPosition = (lastField?.position || 0) + 1

    const field = await prisma.field.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description || null,
        requirements: data.requirements,
        position: nextPosition,
        settings: {
          priority: data.priority || 1,
          deadline: data.deadline?.toISOString() || null
        },
        projectId: data.projectId
      }
    })

    revalidatePath(`/projects/${data.projectId}/fields`)
    revalidatePath(`/projects/${data.projectId}`)
    
    return { field }
  } catch (error) {
    console.error('Error creating field:', error)
    return { field: null, error: 'Failed to create field' }
  }
}

// Update an existing field
export async function updateField(
  fieldId: string, 
  data: Partial<{
    name: string
    type: string
    description: string
    requirements: any
    settings: any
  }>
): Promise<{ field: Field | null; error?: string }> {
  try {
    const field = await prisma.field.update({
      where: { id: fieldId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    // Revalidate related paths
    revalidatePath(`/projects/${field.projectId}/fields`)
    revalidatePath(`/projects/${field.projectId}`)
    
    return { field }
  } catch (error) {
    console.error('Error updating field:', error)
    return { field: null, error: 'Failed to update field' }
  }
}

// Delete a field and its associated data
export async function deleteField(fieldId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { projectId: true }
    })

    if (!field) {
      return { success: false, error: 'Field not found' }
    }

    // Delete field (cascading will handle media and generations)
    await prisma.field.delete({
      where: { id: fieldId }
    })

    revalidatePath(`/projects/${field.projectId}/fields`)
    revalidatePath(`/projects/${field.projectId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting field:', error)
    return { success: false, error: 'Failed to delete field' }
  }
}

// Duplicate a field with its configuration
export async function duplicateField(fieldId: string): Promise<{
  field: Field | null
  error?: string
}> {
  try {
    const originalField = await prisma.field.findUnique({
      where: { id: fieldId }
    })

    if (!originalField) {
      return { field: null, error: 'Field not found' }
    }

    // Get the next position
    const lastField = await prisma.field.findFirst({
      where: { projectId: originalField.projectId },
      orderBy: { position: 'desc' }
    })
    
    const nextPosition = (lastField?.position || 0) + 1

    const duplicatedField = await prisma.field.create({
      data: {
        name: `${originalField.name} (Copy)`,
        type: originalField.type,
        description: originalField.description,
        requirements: originalField.requirements as any,
        settings: originalField.settings as any,
        position: nextPosition,
        projectId: originalField.projectId
      }
    })

    revalidatePath(`/projects/${originalField.projectId}/fields`)
    revalidatePath(`/projects/${originalField.projectId}`)
    
    return { field: duplicatedField }
  } catch (error) {
    console.error('Error duplicating field:', error)
    return { field: null, error: 'Failed to duplicate field' }
  }
}

// Reorder fields (for drag-and-drop)
export async function reorderFields(
  projectId: string,
  fieldOrders: Array<{ id: string; position: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update positions in a transaction
    await prisma.$transaction(
      fieldOrders.map(({ id, position }) =>
        prisma.field.update({
          where: { id },
          data: { position }
        })
      )
    )

    revalidatePath(`/projects/${projectId}/fields`)
    revalidatePath(`/projects/${projectId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error reordering fields:', error)
    return { success: false, error: 'Failed to reorder fields' }
  }
}

// Bulk operations on multiple fields
export async function bulkDeleteFields(
  fieldIds: string[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    completed: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get project ID for revalidation
    const projectId = await prisma.field.findFirst({
      where: { id: { in: fieldIds } },
      select: { projectId: true }
    })

    const deletedCount = await prisma.field.deleteMany({
      where: { id: { in: fieldIds } }
    })

    result.completed = deletedCount.count
    result.failed = fieldIds.length - deletedCount.count

    if (projectId) {
      revalidatePath(`/projects/${projectId.projectId}/fields`)
      revalidatePath(`/projects/${projectId.projectId}`)
    }
    
    return result
  } catch (error) {
    console.error('Error in bulk delete:', error)
    return {
      success: false,
      completed: 0,
      failed: fieldIds.length,
      errors: ['Failed to delete fields']
    }
  }
}

// Bulk duplicate fields
export async function bulkDuplicateFields(
  fieldIds: string[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    completed: 0,
    failed: 0,
    errors: []
  }

  try {
    for (const fieldId of fieldIds) {
      const duplicateResult = await duplicateField(fieldId)
      if (duplicateResult.field) {
        result.completed++
      } else {
        result.failed++
        if (duplicateResult.error) {
          result.errors.push(duplicateResult.error)
        }
      }
    }
    
    return result
  } catch (error) {
    console.error('Error in bulk duplicate:', error)
    return {
      success: false,
      completed: 0,
      failed: fieldIds.length,
      errors: ['Failed to duplicate fields']
    }
  }
}

// Generate media for multiple fields
export async function bulkGenerateFields(
  fieldIds: string[],
  options?: {
    priority?: number
    batchSize?: number
    prompt?: string
    userId?: string
    modelId?: string
  }
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    completed: 0,
    failed: 0,
    errors: []
  }

  try {
    // Import generation helpers
    const { createGenerationWithPrompt } = await import('./generation')
    
    // Get fields with their requirements
    const fields = await prisma.field.findMany({
      where: { id: { in: fieldIds } },
      include: { project: true }
    })

    // Get default model if not provided
    let modelId = options?.modelId
    if (!modelId) {
      const defaultModel = await prisma.aiModel.findFirst({
        where: { type: 'image' },
        orderBy: { createdAt: 'desc' }
      })
      modelId = defaultModel?.id || 'default'
    }

    for (const field of fields) {
      try {
        // Generate prompt text based on field requirements and user input
        const requirements = field.requirements as any
        const promptText = options?.prompt || 
          `Generate ${requirements.style || 'professional'} ${field.type} image. ` +
          `Requirements: ${JSON.stringify(requirements)}. ` +
          `Context: ${field.description || field.name}`

        // Create generation with associated prompt
        const { generation, prompt, error } = await createGenerationWithPrompt({
          promptText,
          modelId,
          userId: options?.userId || 'system',
          projectId: field.projectId,
          fieldId: field.id,
          type: 'batch',
          batchSize: options?.batchSize || 1,
          parameters: {
            priority: options?.priority || 1,
            requirements: field.requirements,
            fieldName: field.name,
            fieldType: field.type
          }
        })

        if (error || !generation || !prompt) {
          result.failed++
          result.errors.push(`Failed for field ${field.name}: ${error || 'Unknown error'}`)
        } else {
          result.completed++
          
          // Log the successful creation
          console.log(`Created generation ${generation.id} with prompt ${prompt.id} for field ${field.name}`)
        }
      } catch (fieldError) {
        result.failed++
        result.errors.push(`Error processing field ${field.name}: ${fieldError}`)
      }
    }

    // Revalidate paths
    if (fields.length > 0) {
      revalidatePath(`/projects/${fields[0]?.projectId}/fields`)
      revalidatePath(`/projects/${fields[0]?.projectId}`)
    }
    
    result.success = result.failed === 0
    return result
  } catch (error) {
    console.error('Error in bulk generation:', error)
    return {
      success: false,
      completed: 0,
      failed: fieldIds.length,
      errors: ['Failed to start generation: ' + error]
    }
  }
}

// Get field templates (predefined configurations)
export async function getFieldTemplates(): Promise<{
  templates: FieldTemplate[]
  error?: string
}> {
  // For now, return static templates
  // In the future, these could be stored in database
  const templates: FieldTemplate[] = [
    {
      id: 'hero-banner',
      name: 'Hero Banner',
      type: 'hero',
      description: 'Main banner image for website homepage',
      requirements: {
        dimensions: { width: 1920, height: 1080 },
        quantity: 1,
        format: 'jpg',
        style: 'professional, modern, high-impact'
      },
      settings: {
        priority: 1,
        estimatedTime: 300
      }
    },
    {
      id: 'product-gallery',
      name: 'Product Gallery',
      type: 'gallery',
      description: 'Collection of product showcase images',
      requirements: {
        dimensions: { width: 800, height: 800 },
        quantity: 6,
        format: 'png',
        style: 'clean, professional, white background'
      },
      settings: {
        priority: 2,
        estimatedTime: 600
      }
    },
    {
      id: 'testimonial-cards',
      name: 'Testimonial Cards',
      type: 'testimonials',
      description: 'Customer testimonial background images',
      requirements: {
        dimensions: { width: 600, height: 400 },
        quantity: 3,
        format: 'jpg',
        style: 'warm, trustworthy, subtle background'
      },
      settings: {
        priority: 3,
        estimatedTime: 450
      }
    },
    {
      id: 'social-media',
      name: 'Social Media Pack',
      type: 'social',
      description: 'Social media post templates',
      requirements: {
        dimensions: { width: 1080, height: 1080 },
        quantity: 5,
        format: 'png',
        style: 'engaging, colorful, brand-consistent'
      },
      settings: {
        priority: 2,
        estimatedTime: 400
      }
    }
  ]

  return { templates }
}

// Create field from template
export async function createFieldFromTemplate(
  projectId: string,
  templateId: string,
  customizations?: {
    name?: string
    description?: string
    requirements?: any
  }
): Promise<{ field: Field | null; error?: string }> {
  try {
    const { templates } = await getFieldTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template) {
      return { field: null, error: 'Template not found' }
    }

    const fieldData = {
      projectId,
      name: customizations?.name || template.name,
      type: template.type,
      description: customizations?.description || template.description,
      requirements: customizations?.requirements || template.requirements,
      priority: template.settings?.priority
    }

    return await createField(fieldData)
  } catch (error) {
    console.error('Error creating field from template:', error)
    return { field: null, error: 'Failed to create field from template' }
  }
}