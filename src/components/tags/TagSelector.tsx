'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getTagCategories, buildPromptWithTags } from '@/app/actions/tags'
import type { TagCategoryWithTags, Tag } from '@/app/actions/tags'

interface TagSelectorProps {
  mediaType: 'image' | 'video' | 'audio' | 'text' | 'document'
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  className?: string
}

export default function TagSelector({
  mediaType,
  selectedTags,
  onTagsChange,
  className
}: TagSelectorProps) {
  const [categories, setCategories] = useState<TagCategoryWithTags[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Load categories when component mounts or media type changes
  useEffect(() => {
    loadCategories()
  }, [mediaType])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const { categories: fetchedCategories } = await getTagCategories(mediaType)
      setCategories(fetchedCategories)
      
      // Auto-expand categories that have selected tags
      const newExpanded = new Set<string>()
      fetchedCategories.forEach(category => {
        if (category.tags.some(tag => selectedTags.some(selected => selected.id === tag.id))) {
          newExpanded.add(category.id)
        }
      })
      setExpandedCategories(newExpanded)
    } catch (error) {
      console.error('Error loading tag categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(selected => selected.id === tag.id)
    
    if (isSelected) {
      // Remove tag
      onTagsChange(selectedTags.filter(selected => selected.id !== tag.id))
    } else {
      // Add tag
      onTagsChange([...selectedTags, tag])
    }
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId))
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Loading tags...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Prompt Enhancement Tags</CardTitle>
          {selectedTags.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllTags}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="secondary" 
                className="text-xs flex items-center gap-1"
              >
                {tag.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-600" 
                  onClick={() => removeTag(tag.id)}
                />
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2 max-h-60 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No tags available for {mediaType} generation.
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-2 text-left hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center space-x-2">
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {category.tags.filter(tag => selectedTags.some(selected => selected.id === tag.id)).length}
                  /{category.tags.length}
                </div>
              </button>
              
              {expandedCategories.has(category.id) && (
                <div className="px-3 pb-2 space-y-1">
                  {category.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {category.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-1">
                    {category.tags.map(tag => {
                      const isSelected = selectedTags.some(selected => selected.id === tag.id)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "text-left px-2 py-1 rounded text-xs transition-colors",
                            isSelected 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-muted/50"
                          )}
                          title={tag.description || `Adds "${tag.value}" to prompt`}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}