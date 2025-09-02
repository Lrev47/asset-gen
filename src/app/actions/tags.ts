'use server'

import prisma from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import type { Tag, TagCategory } from '@prisma/client'

// Re-export Tag type for use in components
export type { Tag }

// Extended types for working with tags
export type TagWithCategory = Tag & {
  category: TagCategory
}

export type TagCategoryWithTags = TagCategory & {
  tags: Tag[]
}

// Interface for creating tag categories
export interface CreateTagCategoryInput {
  name: string
  slug: string
  mediaTypes: string[]
  description?: string
  position?: number
}

// Interface for creating tags
export interface CreateTagInput {
  name: string
  slug: string
  value: string
  description?: string
  mediaTypes: string[]
  categoryId: string
  position?: number
}

/**
 * Get all tag categories with their tags
 * Optionally filter by media type
 */
export async function getTagCategories(mediaType?: string): Promise<{
  categories: TagCategoryWithTags[]
  error?: string
}> {
  try {
    const whereClause = mediaType ? {
      mediaTypes: { has: mediaType }
    } : {}

    const categories = await prisma.tagCategory.findMany({
      where: whereClause,
      include: {
        tags: {
          where: mediaType ? {
            mediaTypes: { has: mediaType }
          } : {},
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    })

    return { categories: categories as TagCategoryWithTags[] }
  } catch (error) {
    console.error('Error fetching tag categories:', error)
    return { categories: [], error: 'Failed to fetch tag categories' }
  }
}

/**
 * Get tags for a specific category
 */
export async function getTagsByCategory(categoryId: string, mediaType?: string): Promise<{
  tags: Tag[]
  error?: string
}> {
  try {
    const whereClause: any = { categoryId }
    
    if (mediaType) {
      whereClause.mediaTypes = { has: mediaType }
    }

    const tags = await prisma.tag.findMany({
      where: whereClause,
      orderBy: { position: 'asc' }
    })

    return { tags }
  } catch (error) {
    console.error('Error fetching tags by category:', error)
    return { tags: [], error: 'Failed to fetch tags' }
  }
}

/**
 * Create a new tag category
 */
export async function createTagCategory(input: CreateTagCategoryInput): Promise<{
  category: TagCategory | null
  error?: string
}> {
  try {
    // Check if slug already exists
    const existing = await prisma.tagCategory.findUnique({
      where: { slug: input.slug }
    })

    if (existing) {
      return { category: null, error: 'A category with this slug already exists' }
    }

    const category = await prisma.tagCategory.create({
      data: {
        name: input.name,
        slug: input.slug,
        mediaTypes: input.mediaTypes,
        description: input.description || null,
        position: input.position || 0
      }
    })

    revalidatePath('/tags')
    return { category }
  } catch (error) {
    console.error('Error creating tag category:', error)
    return { category: null, error: 'Failed to create category' }
  }
}

/**
 * Create a new tag
 */
export async function createTag(input: CreateTagInput): Promise<{
  tag: Tag | null
  error?: string
}> {
  try {
    // Check if slug already exists
    const existing = await prisma.tag.findUnique({
      where: { slug: input.slug }
    })

    if (existing) {
      return { tag: null, error: 'A tag with this slug already exists' }
    }

    const tag = await prisma.tag.create({
      data: {
        name: input.name,
        slug: input.slug,
        value: input.value,
        description: input.description || null,
        mediaTypes: input.mediaTypes,
        categoryId: input.categoryId,
        position: input.position || 0
      }
    })

    revalidatePath('/tags')
    return { tag }
  } catch (error) {
    console.error('Error creating tag:', error)
    return { tag: null, error: 'Failed to create tag' }
  }
}

/**
 * Update a tag category
 */
export async function updateTagCategory(
  id: string, 
  input: Partial<CreateTagCategoryInput>
): Promise<{
  category: TagCategory | null
  error?: string
}> {
  try {
    const category = await prisma.tagCategory.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date()
      }
    })

    revalidatePath('/tags')
    return { category }
  } catch (error) {
    console.error('Error updating tag category:', error)
    return { category: null, error: 'Failed to update category' }
  }
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string, 
  input: Partial<CreateTagInput>
): Promise<{
  tag: Tag | null
  error?: string
}> {
  try {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date()
      }
    })

    revalidatePath('/tags')
    return { tag }
  } catch (error) {
    console.error('Error updating tag:', error)
    return { tag: null, error: 'Failed to update tag' }
  }
}

/**
 * Delete a tag category (and all its tags)
 */
export async function deleteTagCategory(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.tagCategory.delete({
      where: { id }
    })

    revalidatePath('/tags')
    return { success: true }
  } catch (error) {
    console.error('Error deleting tag category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.tag.delete({
      where: { id }
    })

    revalidatePath('/tags')
    return { success: true }
  } catch (error) {
    console.error('Error deleting tag:', error)
    return { success: false, error: 'Failed to delete tag' }
  }
}

/**
 * Get tags by IDs (for use in generation)
 */
export async function getTagsByIds(tagIds: string[]): Promise<{
  tags: Tag[]
  error?: string
}> {
  try {
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
      include: { category: true }
    })

    return { tags }
  } catch (error) {
    console.error('Error fetching tags by IDs:', error)
    return { tags: [], error: 'Failed to fetch tags' }
  }
}

/**
 * Build prompt from base text and selected tags
 */
export async function buildPromptWithTags(basePrompt: string, tags: Tag[]): Promise<string> {
  if (!tags.length) return basePrompt

  const tagValues = tags.map(tag => tag.value).join(', ')
  return `${basePrompt}, ${tagValues}`
}

/**
 * Associate tags with media
 */
export async function associateTagsWithMedia(
  mediaId: string, 
  tagIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // First remove existing associations
    await prisma.mediaTag.deleteMany({
      where: { mediaId }
    })

    // Create new associations
    if (tagIds.length > 0) {
      await prisma.mediaTag.createMany({
        data: tagIds.map(tagId => ({
          mediaId,
          tagId
        }))
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error associating tags with media:', error)
    return { success: false, error: 'Failed to associate tags' }
  }
}

/**
 * Associate tags with prompt
 */
export async function associateTagsWithPrompt(
  promptId: string, 
  tagIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // First remove existing associations
    await prisma.promptTag.deleteMany({
      where: { promptId }
    })

    // Create new associations
    if (tagIds.length > 0) {
      await prisma.promptTag.createMany({
        data: tagIds.map(tagId => ({
          promptId,
          tagId
        }))
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error associating tags with prompt:', error)
    return { success: false, error: 'Failed to associate tags' }
  }
}

/**
 * Search tags by query
 */
export async function searchTags(
  query: string, 
  mediaType?: string,
  categoryId?: string
): Promise<{
  tags: Tag[]
  error?: string
}> {
  try {
    if (!query.trim()) {
      return { tags: [] }
    }

    const whereClause: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { value: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (mediaType) {
      whereClause.mediaTypes = { has: mediaType }
    }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: [
        { position: 'asc' },
        { name: 'asc' }
      ],
      take: 50 // Limit results
    })

    return { tags }
  } catch (error) {
    console.error('Error searching tags:', error)
    return { tags: [], error: 'Failed to search tags' }
  }
}

/**
 * Get tag usage statistics
 */
export async function getTagUsageStats(tagId: string): Promise<{
  stats: {
    usageCount: number
    successCount: number
    failureCount: number
    successRate: number
    lastUsed?: Date
    mediaBreakdown: Record<string, number>
  } | null
  error?: string
}> {
  try {
    // Get usage from prompts that used this tag
    const promptTags = await prisma.promptTag.findMany({
      where: { tagId },
      include: {
        prompt: {
          include: {
            generations: true,
            media: true
          }
        }
      }
    })

    let usageCount = 0
    let successCount = 0
    let failureCount = 0
    let lastUsed: Date | undefined
    const mediaBreakdown: Record<string, number> = {}

    promptTags.forEach(promptTag => {
      const { prompt } = promptTag
      usageCount++
      
      // Track last used date
      if (!lastUsed || prompt.updatedAt > lastUsed) {
        lastUsed = prompt.updatedAt
      }

      // Count successes and failures based on generations
      prompt.generations.forEach(generation => {
        if (generation.status === 'completed') {
          successCount++
        } else if (generation.status === 'failed') {
          failureCount++
        }
      })

      // Track media type breakdown
      prompt.media.forEach(media => {
        mediaBreakdown[media.type] = (mediaBreakdown[media.type] || 0) + 1
      })
    })

    const successRate = usageCount > 0 ? (successCount / usageCount) * 100 : 0

    const stats = {
      usageCount,
      successCount,
      failureCount,
      successRate,
      ...(lastUsed && { lastUsed }),
      mediaBreakdown
    }

    return { stats }
  } catch (error) {
    console.error('Error getting tag usage stats:', error)
    return { stats: null, error: 'Failed to get tag statistics' }
  }
}

/**
 * Bulk export tags as JSON
 */
export async function exportTags(categoryIds?: string[]): Promise<{
  data: any | null
  error?: string
}> {
  try {
    const whereClause = categoryIds && categoryIds.length > 0 
      ? { id: { in: categoryIds } }
      : {}

    const categories = await prisma.tagCategory.findMany({
      where: whereClause,
      include: {
        tags: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      categories: categories.map(category => ({
        name: category.name,
        slug: category.slug,
        description: category.description,
        mediaTypes: category.mediaTypes,
        position: category.position,
        tags: category.tags.map(tag => ({
          name: tag.name,
          slug: tag.slug,
          value: tag.value,
          description: tag.description,
          mediaTypes: tag.mediaTypes,
          position: tag.position
        }))
      }))
    }

    return { data: exportData }
  } catch (error) {
    console.error('Error exporting tags:', error)
    return { data: null, error: 'Failed to export tags' }
  }
}

/**
 * Bulk import tags from JSON
 */
export async function importTags(data: any): Promise<{
  success: boolean
  imported: {
    categories: number
    tags: number
  }
  errors: string[]
}> {
  const errors: string[] = []
  let importedCategories = 0
  let importedTags = 0

  try {
    if (!data.categories || !Array.isArray(data.categories)) {
      return { 
        success: false, 
        imported: { categories: 0, tags: 0 }, 
        errors: ['Invalid import format: categories array is required'] 
      }
    }

    for (const categoryData of data.categories) {
      try {
        // Check if category already exists
        const existingCategory = await prisma.tagCategory.findUnique({
          where: { slug: categoryData.slug }
        })

        let category
        if (existingCategory) {
          // Update existing category
          category = await prisma.tagCategory.update({
            where: { id: existingCategory.id },
            data: {
              name: categoryData.name,
              description: categoryData.description || null,
              mediaTypes: categoryData.mediaTypes,
              position: categoryData.position || 0
            }
          })
        } else {
          // Create new category
          category = await prisma.tagCategory.create({
            data: {
              name: categoryData.name,
              slug: categoryData.slug,
              description: categoryData.description || null,
              mediaTypes: categoryData.mediaTypes,
              position: categoryData.position || 0
            }
          })
          importedCategories++
        }

        // Import tags for this category
        if (categoryData.tags && Array.isArray(categoryData.tags)) {
          for (const tagData of categoryData.tags) {
            try {
              const existingTag = await prisma.tag.findUnique({
                where: { slug: tagData.slug }
              })

              if (existingTag) {
                // Update existing tag
                await prisma.tag.update({
                  where: { id: existingTag.id },
                  data: {
                    name: tagData.name,
                    value: tagData.value,
                    description: tagData.description || null,
                    mediaTypes: tagData.mediaTypes,
                    position: tagData.position || 0,
                    categoryId: category.id
                  }
                })
              } else {
                // Create new tag
                await prisma.tag.create({
                  data: {
                    name: tagData.name,
                    slug: tagData.slug,
                    value: tagData.value,
                    description: tagData.description || null,
                    mediaTypes: tagData.mediaTypes,
                    categoryId: category.id,
                    position: tagData.position || 0
                  }
                })
                importedTags++
              }
            } catch (error) {
              errors.push(`Failed to import tag "${tagData.name}": ${error}`)
            }
          }
        }
      } catch (error) {
        errors.push(`Failed to import category "${categoryData.name}": ${error}`)
      }
    }

    revalidatePath('/tags')
    
    return {
      success: true,
      imported: {
        categories: importedCategories,
        tags: importedTags
      },
      errors
    }
  } catch (error) {
    console.error('Error importing tags:', error)
    return {
      success: false,
      imported: { categories: 0, tags: 0 },
      errors: [`Import failed: ${error}`]
    }
  }
}

/**
 * Reorder tags within a category
 */
export async function reorderTags(
  categoryId: string, 
  tagIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Update positions for all tags
    for (let i = 0; i < tagIds.length; i++) {
      const tagId = tagIds[i]
      if (!tagId) continue
      
      // First verify the tag belongs to the category
      const tag = await prisma.tag.findFirst({
        where: { 
          id: tagId,
          categoryId
        }
      })
      
      if (tag) {
        await prisma.tag.update({
          where: { id: tagId },
          data: { position: i }
        })
      }
    }

    revalidatePath('/tags')
    return { success: true }
  } catch (error) {
    console.error('Error reordering tags:', error)
    return { success: false, error: 'Failed to reorder tags' }
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(categoryIds: string[]): Promise<{
  success: boolean
  error?: string
}> {
  try {
    for (let i = 0; i < categoryIds.length; i++) {
      const categoryId = categoryIds[i]
      if (!categoryId) continue
      
      await prisma.tagCategory.update({
        where: { id: categoryId },
        data: { position: i }
      })
    }

    revalidatePath('/tags')
    return { success: true }
  } catch (error) {
    console.error('Error reordering categories:', error)
    return { success: false, error: 'Failed to reorder categories' }
  }
}

/**
 * Duplicate a tag to another category
 */
export async function duplicateTag(
  tagId: string, 
  targetCategoryId: string,
  newName?: string
): Promise<{
  tag: Tag | null
  error?: string
}> {
  try {
    const originalTag = await prisma.tag.findUnique({
      where: { id: tagId }
    })

    if (!originalTag) {
      return { tag: null, error: 'Tag not found' }
    }

    const targetCategory = await prisma.tagCategory.findUnique({
      where: { id: targetCategoryId }
    })

    if (!targetCategory) {
      return { tag: null, error: 'Target category not found' }
    }

    // Generate new slug if name is changed
    const name = newName || `${originalTag.name} (Copy)`
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    // Ensure unique slug
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.tag.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const duplicatedTag = await prisma.tag.create({
      data: {
        name,
        slug: uniqueSlug,
        value: originalTag.value,
        description: originalTag.description,
        mediaTypes: originalTag.mediaTypes,
        categoryId: targetCategoryId,
        position: 0
      }
    })

    revalidatePath('/tags')
    return { tag: duplicatedTag }
  } catch (error) {
    console.error('Error duplicating tag:', error)
    return { tag: null, error: 'Failed to duplicate tag' }
  }
}