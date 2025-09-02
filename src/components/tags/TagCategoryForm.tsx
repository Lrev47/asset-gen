'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createTagCategory, updateTagCategory } from '@/app/actions/tags'
import type { TagCategory } from '@prisma/client'

interface TagCategoryFormProps {
  initialData?: TagCategory
  mode: 'create' | 'edit'
}

const mediaTypeOptions = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'text', label: 'Text' },
  { value: 'document', label: 'Document' }
]

export default function TagCategoryForm({ initialData, mode }: TagCategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form state
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [mediaTypes, setMediaTypes] = useState<string[]>(initialData?.mediaTypes || [])
  const [position, setPosition] = useState(initialData?.position?.toString() || '0')

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (mode === 'create') {
      // Auto-generate slug only for new categories
      const autoSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setSlug(autoSlug)
    }
  }

  const handleMediaTypeChange = (mediaType: string, checked: boolean) => {
    if (checked) {
      setMediaTypes(prev => [...prev, mediaType])
    } else {
      setMediaTypes(prev => prev.filter(type => type !== mediaType))
    }
  }

  const removeMediaType = (mediaType: string) => {
    setMediaTypes(prev => prev.filter(type => type !== mediaType))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    if (mediaTypes.length === 0) {
      newErrors.mediaTypes = 'At least one media type must be selected'
    }

    const positionNum = parseInt(position)
    if (isNaN(positionNum) || positionNum < 0) {
      newErrors.position = 'Position must be a non-negative number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const categoryData = {
        name: name.trim(),
        slug: slug.trim(),
        ...(description.trim() && { description: description.trim() }),
        mediaTypes,
        position: parseInt(position)
      }

      let result
      if (mode === 'create') {
        result = await createTagCategory(categoryData)
      } else {
        result = await updateTagCategory(initialData!.id, categoryData)
      }

      if (result.error) {
        if (result.error.includes('slug already exists')) {
          setErrors({ slug: 'This slug is already taken' })
        } else {
          setErrors({ general: result.error })
        }
      } else {
        router.push('/tags')
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} category:`, error)
      setErrors({ general: `Failed to ${mode === 'create' ? 'create' : 'update'} category` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/tags')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tags
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {mode === 'create' ? 'Create Tag Category' : 'Edit Tag Category'}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'create' 
                  ? 'Create a new category to organize your prompt enhancement tags'
                  : 'Update the details of this tag category'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {errors.general && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Composition, Lighting, Color Palette"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., composition, lighting, color-palette"
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && <p className="text-red-600 text-sm">{errors.slug}</p>}
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only. Used in URLs.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this category of tags is for..."
                  rows={3}
                />
              </div>

              {/* Media Types */}
              <div className="space-y-4">
                <div>
                  <Label>Applicable Media Types *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which media types this category applies to
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`media-${option.value}`}
                        checked={mediaTypes.includes(option.value)}
                        onCheckedChange={(checked) => 
                          handleMediaTypeChange(option.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`media-${option.value}`}
                        className="text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Selected media types */}
                {mediaTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mediaTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="flex items-center gap-1">
                        {mediaTypeOptions.find(opt => opt.value === type)?.label || type}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-600" 
                          onClick={() => removeMediaType(type)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                {errors.mediaTypes && <p className="text-red-600 text-sm">{errors.mediaTypes}</p>}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Display Position</Label>
                <Input
                  id="position"
                  type="number"
                  min="0"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="0"
                  className={`max-w-32 ${errors.position ? 'border-red-500' : ''}`}
                />
                {errors.position && <p className="text-red-600 text-sm">{errors.position}</p>}
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first. Use 0 for default ordering.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      {mode === 'create' ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {mode === 'create' ? 'Create Category' : 'Update Category'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}