'use client'

import { useState, useMemo } from 'react'
import { Wand2, Copy, RefreshCw, Play, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buildPromptWithTags } from '@/app/actions/tags'
import type { TagCategoryWithTags, Tag } from '@/app/actions/tags'

interface TagPreviewProps {
  categories: TagCategoryWithTags[]
  className?: string
}

const presetPrompts = [
  {
    id: 'portrait',
    name: 'Portrait Photography',
    text: 'A professional headshot portrait of a person',
    mediaType: 'image'
  },
  {
    id: 'landscape',
    name: 'Landscape Photo',
    text: 'A beautiful landscape scene with mountains and trees',
    mediaType: 'image'
  },
  {
    id: 'product',
    name: 'Product Shot',
    text: 'A clean product photography shot on white background',
    mediaType: 'image'
  },
  {
    id: 'video-intro',
    name: 'Video Intro',
    text: 'An engaging video intro for a tech company presentation',
    mediaType: 'video'
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    text: '',
    mediaType: 'image'
  }
]

export default function TagPreview({ categories, className }: TagPreviewProps) {
  const [basePrompt, setBasePrompt] = useState(presetPrompts[0]?.text || '')
  const [selectedPreset, setSelectedPreset] = useState('portrait')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [mediaType, setMediaType] = useState<string>('image')

  // Get available tags for selected media type
  const availableTags = useMemo(() => {
    return categories.flatMap(category => 
      category.tags.filter(tag => tag.mediaTypes.includes(mediaType))
    )
  }, [categories, mediaType])

  // Get suggested tags based on the prompt content
  const suggestedTags = useMemo(() => {
    if (!basePrompt.trim()) return []
    
    const promptLower = basePrompt.toLowerCase()
    const suggestions: Tag[] = []
    
    // Simple keyword matching for suggestions
    availableTags.forEach(tag => {
      const tagKeywords = [
        tag.name.toLowerCase(),
        tag.value.toLowerCase(),
        ...(tag.description?.toLowerCase().split(' ') || [])
      ]
      
      const hasMatch = tagKeywords.some(keyword => 
        promptLower.includes(keyword) || keyword.includes(promptLower.split(' ')[0] || '')
      )
      
      if (hasMatch && !selectedTags.find(selected => selected.id === tag.id)) {
        suggestions.push(tag)
      }
    })
    
    return suggestions.slice(0, 6) // Limit to 6 suggestions
  }, [basePrompt, availableTags, selectedTags])

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = presetPrompts.find(p => p.id === presetId)
    if (preset) {
      setBasePrompt(preset.text)
      setMediaType(preset.mediaType)
      // Clear selected tags when changing presets
      setSelectedTags([])
    }
  }

  const handleEnhancePrompt = async () => {
    if (!basePrompt.trim()) return

    setIsEnhancing(true)
    try {
      const enhanced = await buildPromptWithTags(basePrompt, selectedTags)
      setEnhancedPrompt(enhanced)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      setEnhancedPrompt(basePrompt) // Fallback to original
    } finally {
      setIsEnhancing(false)
    }
  }

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.id === tag.id)
      if (exists) {
        return prev.filter(t => t.id !== tag.id)
      } else {
        return [...prev, tag]
      }
    })
  }

  const addSuggestedTag = (tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const clearTags = () => {
    setSelectedTags([])
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Auto-enhance when tags change
  useMemo(() => {
    if (basePrompt.trim()) {
      handleEnhancePrompt()
    }
  }, [selectedTags, basePrompt])

  const getTagsByCategory = () => {
    const tagsByCategory = new Map<string, { category: any, tags: Tag[] }>()
    
    selectedTags.forEach(tag => {
      const category = categories.find(cat => 
        cat.tags.some(catTag => catTag.id === tag.id)
      )
      
      if (category) {
        if (!tagsByCategory.has(category.id)) {
          tagsByCategory.set(category.id, { category, tags: [] })
        }
        tagsByCategory.get(category.id)!.tags.push(tag)
      }
    })
    
    return Array.from(tagsByCategory.values())
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            Prompt Enhancement Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {mediaType}
            </Badge>
            {selectedTags.length > 0 && (
              <Badge variant="secondary">
                {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preset Selection */}
        <div className="space-y-2">
          <Label htmlFor="preset">Choose a preset or create custom</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presetPrompts.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{preset.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs capitalize">
                      {preset.mediaType}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Prompt */}
        <div className="space-y-2">
          <Label htmlFor="base-prompt">Base Prompt</Label>
          <Textarea
            id="base-prompt"
            placeholder="Enter your base prompt here..."
            value={basePrompt}
            onChange={(e) => setBasePrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Selected Tags</Label>
              <Button variant="ghost" size="sm" onClick={clearTags}>
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3">
              {getTagsByCategory().map(({ category, tags }) => (
                <div key={category.id}>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {category.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag.name}
                        <button className="ml-1 hover:text-red-600">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Tags */}
        {suggestedTags.length > 0 && (
          <div className="space-y-2">
            <Label>Suggested Tags</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => addSuggestedTag(tag)}
                >
                  + {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Prompt Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Enhanced Prompt Preview</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(enhancedPrompt || basePrompt)}
                disabled={!enhancedPrompt && !basePrompt}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEnhancePrompt}
                disabled={!basePrompt.trim() || isEnhancing}
              >
                {isEnhancing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed min-h-[120px]">
              {enhancedPrompt || basePrompt ? (
                <div className="space-y-2">
                  <div className="text-sm leading-relaxed">
                    <span className="text-foreground">{basePrompt}</span>
                    {selectedTags.length > 0 && enhancedPrompt !== basePrompt && (
                      <span className="text-purple-600 font-medium">
                        {enhancedPrompt.slice(basePrompt.length)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      {(enhancedPrompt || basePrompt).length} characters
                    </span>
                    <span>
                      {selectedTags.length} enhancement{selectedTags.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Your enhanced prompt will appear here as you add tags...
                </div>
              )}
            </div>

            {!basePrompt.trim() && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Eye className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Enter a base prompt to see the preview
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {(enhancedPrompt || basePrompt) && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button
              size="sm"
              onClick={() => copyToClipboard(enhancedPrompt || basePrompt)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Enhanced Prompt
            </Button>
            
            <Badge variant="outline" className="text-xs">
              Ready for {mediaType} generation
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}