'use server'

import prisma from '@/lib/db/prisma'
import type { Field, Media, Generation, AiModel, Prompt } from '@prisma/client'

export type FieldWithFullDetails = Field & {
  project: {
    id: string
    name: string
    slug: string
    type: string
  }
  media: (Media & {
    generation?: (Generation & {
      model: AiModel
      prompt?: Prompt
    }) | null
  })[]
  generations: (Generation & {
    model: AiModel
    prompt?: Prompt | null
    media?: Media | null
  })[]
  _count: {
    media: number
    generations: number
  }
}

export async function getFieldWithFullDetails(fieldId: string): Promise<{
  field: FieldWithFullDetails | null
  error?: string
}> {
  try {
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        },
        media: {
          include: {
            generation: {
              include: {
                model: true,
                prompt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        generations: {
          include: {
            model: true,
            prompt: true,
            media: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            media: true,
            generations: true
          }
        }
      }
    })

    if (!field) {
      return { field: null, error: 'Field not found' }
    }

    return { field: field as FieldWithFullDetails }
  } catch (error) {
    console.error('Error fetching field details:', error)
    return { field: null, error: 'Failed to fetch field details' }
  }
}

export async function updateFieldRequirements(
  fieldId: string,
  requirements: any
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.field.update({
      where: { id: fieldId },
      data: {
        requirements,
        updatedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating field requirements:', error)
    return { success: false, error: 'Failed to update requirements' }
  }
}

export async function getAvailableModels(): Promise<{
  models: AiModel[]
  error?: string
}> {
  try {
    const models = await prisma.aiModel.findMany({
      orderBy: [
        { provider: 'asc' },
        { name: 'asc' }
      ]
    })

    return { models }
  } catch (error) {
    console.error('Error fetching AI models:', error)
    return { models: [], error: 'Failed to fetch AI models' }
  }
}