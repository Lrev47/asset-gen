'use client'

import { useState } from 'react'
import { 
  Play, 
  Settings2, 
  Brain, 
  Wand2,
  RefreshCw,
  Sparkles,
  Tags
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import TagSelector from '@/components/tags/TagSelector'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'
import type { Tag } from '@/app/actions/tags'

interface GenerationWorkspaceProps {
  field: FieldWithFullDetails
}

export default function GenerationWorkspace({ field }: GenerationWorkspaceProps) {
  const [selectedModel, setSelectedModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [batchSize, setBatchSize] = useState([1])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      // Import the generation helpers
      const { createGenerationWithPrompt } = await import('@/app/actions/generation')
      const { buildPromptWithTags, associateTagsWithPrompt } = await import('@/app/actions/tags')
      
      // Build enhanced prompt with selected tags
      const enhancedPrompt = await buildPromptWithTags(prompt, selectedTags)
      
      // Create the generation with enhanced prompt
      const { generation, prompt: savedPrompt, error } = await createGenerationWithPrompt({
        promptText: enhancedPrompt,
        modelId: selectedModel,
        userId: 'user-demo', // TODO: Get actual user ID from session
        projectId: field.projectId,
        fieldId: field.id,
        type: 'single',
        batchSize: batchSize[0] || 1,
        parameters: {
          fieldRequirements: field.requirements,
          fieldName: field.name,
          fieldType: field.type,
          selectedTags: selectedTags.map(tag => ({ id: tag.id, name: tag.name, value: tag.value })),
          timestamp: new Date().toISOString()
        }
      })

      if (error || !generation || !savedPrompt) {
        console.error('Failed to create generation:', error)
        // TODO: Show error toast to user
      } else {
        console.log(`Created generation ${generation.id} with saved prompt ${savedPrompt.id}`)
        
        // Associate selected tags with the prompt
        if (selectedTags.length > 0) {
          await associateTagsWithPrompt(savedPrompt.id, selectedTags.map(tag => tag.id))
        }
        
        // Clear the form
        setPrompt('')
        setSelectedModel('')
        setSelectedTags([])
        setBatchSize([1])
        
        // TODO: Show success toast and redirect to generation status
        // TODO: In a real app, this would trigger the actual AI generation process
        console.log('Generation created successfully. Prompt and tags saved:', {
          generationId: generation.id,
          promptId: savedPrompt.id,
          promptContent: savedPrompt.content,
          enhancedPrompt,
          selectedTags: selectedTags.map(tag => tag.name)
        })
      }
    } catch (error) {
      console.error('Error starting generation:', error)
      // TODO: Show error toast to user
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main Generation Interface */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-purple-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Generate New Content</h2>
              <p className="text-muted-foreground text-lg mt-2">
                Create AI-powered assets for <span className="font-medium">{field.name}</span>
              </p>
            </div>
          </div>

          {/* Generation Form */}
          <div className="grid gap-6">
            {/* Model Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <CardTitle>AI Model</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an AI model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dalle-3">DALL-E 3</SelectItem>
                    <SelectItem value="midjourney">Midjourney</SelectItem>
                    <SelectItem value="stable-diffusion">Stable Diffusion XL</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedModel && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="outline">High Quality</Badge>
                    <span>•</span>
                    <span>~$0.04 per image</span>
                    <span>•</span>
                    <span>~30-60s generation time</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="h-5 w-5 text-purple-500" />
                    <CardTitle>Prompt</CardTitle>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Enhance with AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe what you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                
                {/* Requirements Preview */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <Label className="text-xs font-medium text-muted-foreground">
                    FIELD REQUIREMENTS WILL BE AUTOMATICALLY INCLUDED:
                  </Label>
                  <div className="mt-2 text-sm">
                    {field.requirements && (
                      <div className="space-y-1">
                        {(field.requirements as any).dimensions && (
                          <div>• Dimensions: {(field.requirements as any).dimensions.width}×{(field.requirements as any).dimensions.height}</div>
                        )}
                        {(field.requirements as any).format && (
                          <div>• Format: {(field.requirements as any).format.toUpperCase()}</div>
                        )}
                        {(field.requirements as any).style && (
                          <div>• Style: {(field.requirements as any).style}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tag Selector */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Tags className="h-5 w-5 text-purple-500" />
                  <CardTitle>Enhance Your Prompt</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <TagSelector
                  mediaType="image" // TODO: Determine from field type or model
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                />
                
                {selectedTags.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs font-medium text-muted-foreground">
                      ENHANCED PROMPT PREVIEW:
                    </Label>
                    <div className="mt-2 text-sm font-mono">
                      {prompt && (
                        <>
                          <span>{prompt}</span>
                          {selectedTags.length > 0 && (
                            <span className="text-purple-600">
                              , {selectedTags.map(tag => tag.value).join(', ')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generation Parameters */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings2 className="h-5 w-5 text-orange-500" />
                  <CardTitle>Generation Parameters</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Batch Size: {batchSize[0] || 1} {(batchSize[0] || 1) === 1 ? 'image' : 'images'}</Label>
                  <Slider
                    value={batchSize}
                    onValueChange={setBatchSize}
                    max={4}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 image</span>
                    <span>4 images</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated Cost:</span>
                    <span className="font-medium">${((batchSize[0] || 1) * 0.04).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Estimated Time:</span>
                    <span className="font-medium">{(batchSize[0] || 1) * 45}s - {(batchSize[0] || 1) * 60}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className="px-12 py-6 text-lg"
                onClick={handleGenerate}
                disabled={!selectedModel || !prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-3" />
                    Start Generation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Queue (if any active generations) */}
      {field.generations.filter(g => g.status === 'pending' || g.status === 'processing').length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Generation Queue</h3>
              <Badge variant="secondary">
                {field.generations.filter(g => g.status === 'pending' || g.status === 'processing').length} active
              </Badge>
            </div>
            <div className="space-y-2">
              {field.generations
                .filter(g => g.status === 'pending' || g.status === 'processing')
                .slice(0, 3)
                .map((generation) => (
                  <div key={generation.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <div>
                        <div className="font-medium text-sm">{generation.model.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {generation.status === 'processing' ? 'Processing...' : 'In queue'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {generation.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}