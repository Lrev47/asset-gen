'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTag, updateTag, getTagCategories } from '@/app/actions/tags'
import type { Tag, TagCategory } from '@prisma/client'

interface TagFormProps {
  initialData?: Tag & { category: TagCategory }
  categoryId?: string
  mode: 'create' | 'edit'
}

const mediaTypeOptions = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'text', label: 'Text' },
  { value: 'document', label: 'Document' }
]

export default function TagForm({ initialData, categoryId, mode }: TagFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [showPreview, setShowPreview] = useState(false)
  
  // Form state
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [value, setValue] = useState(initialData?.value || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryId || initialData?.categoryId || ''
  )
  const [mediaTypes, setMediaTypes] = useState<string[]>(initialData?.mediaTypes || [])
  const [position, setPosition] = useState(initialData?.position?.toString() || '0')

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { categories: fetchedCategories } = await getTagCategories()
      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (newName: string) => {
    setName(newName)
    if (mode === 'create') {
      // Auto-generate slug only for new tags
      const autoSlug = newName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setSlug(autoSlug)
    }

    // Auto-generate value if empty
    if (!value.trim() && mode === 'create') {
      setValue(newName.toLowerCase())
    }
  }

  const handleCategoryChange = (newCategoryId: string) => {
    setSelectedCategoryId(newCategoryId)
    
    // Auto-populate media types from selected category
    if (mode === 'create') {
      const selectedCategory = categories.find(cat => cat.id === newCategoryId)
      if (selectedCategory) {
        setMediaTypes(selectedCategory.mediaTypes)
      }
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

    if (!value.trim()) {
      newErrors.value = 'Prompt value is required'
    }

    if (!selectedCategoryId) {
      newErrors.category = 'Category is required'
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
      const tagData = {
        name: name.trim(),
        slug: slug.trim(),
        value: value.trim(),
        ...(description.trim() && { description: description.trim() }),
        mediaTypes,
        categoryId: selectedCategoryId,
        position: parseInt(position)
      }

      let result
      if (mode === 'create') {
        result = await createTag(tagData)
      } else {
        result = await updateTag(initialData!.id, tagData)
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
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} tag:`, error)
      setErrors({ general: `Failed to ${mode === 'create' ? 'create' : 'update'} tag` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/tags')
  }

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
                {mode === 'create' ? 'Create Tag' : 'Edit Tag'}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'create' 
                  ? 'Create a new tag to enhance prompts during generation'
                  : 'Update the details of this tag'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Error display */}
            {errors.general && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 mb-6">
                <CardContent className="pt-6">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Tag Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Tag Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Golden Hour, Rule of Thirds, Minimalist"
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
                      placeholder="e.g., golden-hour, rule-of-thirds, minimalist"
                      className={errors.slug ? 'border-red-500' : ''}
                    />
                    {errors.slug && <p className="text-red-600 text-sm">{errors.slug}</p>}
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and hyphens only. Used in URLs.
                    </p>
                  </div>

                  {/* Prompt Value */}
                  <div className="space-y-2">
                    <Label htmlFor="value">Prompt Value *</Label>
                    <Input
                      id="value"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="e.g., golden hour lighting, rule of thirds composition"
                      className={errors.value ? 'border-red-500' : ''}
                    />
                    {errors.value && <p className="text-red-600 text-sm">{errors.value}</p>}
                    <p className="text-xs text-muted-foreground">
                      This text will be appended to prompts when the tag is selected.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description of what this tag does..."
                      rows={2}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={selectedCategoryId} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{category.name}</span>
                              <div className="flex space-x-1 ml-2">
                                {category.mediaTypes.slice(0, 2).map(type => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                                {category.mediaTypes.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{category.mediaTypes.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-600 text-sm">{errors.category}</p>}
                    {selectedCategory && (
                      <p className="text-xs text-muted-foreground">
                        {selectedCategory.description}
                      </p>
                    )}
                  </div>

                  {/* Media Types */}
                  <div className="space-y-4">
                    <div>
                      <Label>Applicable Media Types *</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select which media types this tag applies to
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
                      Lower numbers appear first within the category.
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
                          {mode === 'create' ? 'Create Tag' : 'Update Tag'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Preview</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tag Preview */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    TAG APPEARANCE:
                  </Label>
                  <div className="mt-2">
                    {name ? (
                      <Badge variant="secondary">{name}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Preview Name
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Prompt Enhancement Preview */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    PROMPT ENHANCEMENT:
                  </Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                    <div>Base prompt text</div>
                    {value && (
                      <div className="text-purple-600 font-medium">
                        , {value}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Context */}
                {selectedCategory && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      CATEGORY:
                    </Label>
                    <div className="mt-2">
                      <Badge variant="outline">{selectedCategory.name}</Badge>
                    </div>
                    {selectedCategory.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedCategory.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Media Types */}
                {mediaTypes.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      MEDIA TYPES:
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mediaTypes.map(type => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {mediaTypeOptions.find(opt => opt.value === type)?.label || type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}