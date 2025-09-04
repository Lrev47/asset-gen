'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Download, Image as ImageIcon, Settings, Brain } from 'lucide-react'
import { getModelsByType } from '@/app/actions/models'
import { generateImageWithReplicate, pollPredictionStatus } from '@/app/actions/image-generation'
import { generatePromptVariations } from '@/app/actions/prompt-variations'
import DynamicModelForm from '@/lib/models/ui/DynamicModelForm'
import type { ExtendedAiModel, PredictionInput } from '@/lib/models/types'

interface PromptImagePair {
  id: string
  prompt: string
  imageUrl?: string | undefined
  isGenerating?: boolean | undefined
  error?: string | undefined
  predictionId?: string | undefined
}

export default function ImageGeneratorPage() {
  // Model state
  const [availableModels, setAvailableModels] = useState<ExtendedAiModel[]>([])
  const [selectedModel, setSelectedModel] = useState<ExtendedAiModel | null>(null)
  const [modelLoading, setModelLoading] = useState(true)

  // Generation state
  const [generationMode, setGenerationMode] = useState<'single' | 'multi'>('single')
  const [promptImagePairs, setPromptImagePairs] = useState<PromptImagePair[]>([
    { id: '1', prompt: '' }
  ])
  const [modelConfig, setModelConfig] = useState<PredictionInput>({})

  // Load image models on component mount
  useEffect(() => {
    loadImageModels()
  }, [])

  const loadImageModels = async () => {
    try {
      setModelLoading(true)
      const result = await getModelsByType('image')
      if (result.success && result.data) {
        setAvailableModels(result.data)
        // Auto-select first model if available
        if (result.data.length > 0) {
          setSelectedModel(result.data[0] || null)
        }
      }
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setModelLoading(false)
    }
  }

  const handleModelSelect = (modelSlug: string) => {
    const model = availableModels.find(m => m.slug === modelSlug)
    if (model) {
      setSelectedModel(model)
      setModelConfig({}) // Reset config when model changes
    }
  }

  const handleModelConfigSubmit = async (values: PredictionInput) => {
    setModelConfig(values)
  }

  const generateSingleImage = async (pairId: string) => {
    const pair = promptImagePairs.find(p => p.id === pairId)
    if (!pair || !pair.prompt.trim()) {
      return
    }
    
    await generateImage(pairId, pair.prompt, modelConfig)
  }

  const generateImage = async (pairId: string, prompt: string, config: PredictionInput) => {
    if (!selectedModel) {
      console.error('No model selected')
      return
    }

    // Update pair to show generating state
    setPromptImagePairs(prev => 
      prev.map(pair => 
        pair.id === pairId 
          ? { ...pair, isGenerating: true, error: undefined, imageUrl: undefined }
          : pair
      )
    )

    try {
      console.log('Generating image with:', { prompt, config, model: selectedModel.slug })
      
      // Start generation with Replicate
      const result = await generateImageWithReplicate(selectedModel.slug, prompt, config)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to start generation')
      }

      const { predictionId } = result.data

      // Update pair with prediction ID
      setPromptImagePairs(prev => 
        prev.map(pair => 
          pair.id === pairId 
            ? { ...pair, predictionId }
            : pair
        )
      )

      // Start polling for completion
      await pollForCompletion(pairId, predictionId)

    } catch (error) {
      console.error('Generation error:', error)
      setPromptImagePairs(prev => 
        prev.map(pair => 
          pair.id === pairId 
            ? { 
                ...pair, 
                isGenerating: false, 
                error: error instanceof Error ? error.message : 'Generation failed' 
              }
            : pair
        )
      )
    }
  }

  const pollForCompletion = async (pairId: string, predictionId: string) => {
    const maxAttempts = 120 // 3 minutes (120 * 1.5 seconds)
    let attempts = 0

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setPromptImagePairs(prev => 
          prev.map(pair => 
            pair.id === pairId 
              ? { ...pair, isGenerating: false, error: 'Generation timed out' }
              : pair
          )
        )
        return
      }

      attempts++

      try {
        const result = await pollPredictionStatus(predictionId)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to poll status')
        }

        const { status, output, error } = result.data!

        if (status === 'succeeded') {
          // Extract image URL from output
          let imageUrl: string | undefined

          if (output) {
            if (Array.isArray(output)) {
              imageUrl = output[0]
            } else if (typeof output === 'string') {
              imageUrl = output
            }
          }

          setPromptImagePairs(prev => 
            prev.map(pair => 
              pair.id === pairId 
                ? { ...pair, isGenerating: false, imageUrl, error: undefined }
                : pair
            )
          )
        } else if (status === 'failed' || status === 'canceled') {
          setPromptImagePairs(prev => 
            prev.map(pair => 
              pair.id === pairId 
                ? { ...pair, isGenerating: false, error: error || 'Generation failed' }
                : pair
            )
          )
        } else {
          // Still processing, continue polling
          setTimeout(poll, 1500) // Poll every 1.5 seconds
        }
      } catch (error) {
        console.error('Polling error:', error)
        setPromptImagePairs(prev => 
          prev.map(pair => 
            pair.id === pairId 
              ? { 
                  ...pair, 
                  isGenerating: false, 
                  error: error instanceof Error ? error.message : 'Polling failed' 
                }
              : pair
          )
        )
      }
    }

    // Start polling
    poll()
  }

  const addPromptImagePair = () => {
    const newId = Date.now().toString()
    setPromptImagePairs(prev => [...prev, { id: newId, prompt: '' }])
  }

  const removePromptImagePair = (id: string) => {
    if (promptImagePairs.length > 1) {
      setPromptImagePairs(prev => prev.filter(pair => pair.id !== id))
    }
  }

  const updatePrompt = (id: string, prompt: string) => {
    setPromptImagePairs(prev => 
      prev.map(pair => 
        pair.id === id ? { ...pair, prompt } : pair
      )
    )
  }

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (modelLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading image models...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold">Image Generator</h1>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Model:</span>
                <Select value={selectedModel?.slug || ''} onValueChange={handleModelSelect}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Choose model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.slug} value={model.slug}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mode:</span>
                <Select value={generationMode} onValueChange={(value: 'single' | 'multi') => setGenerationMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="multi">Multi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Space for future header actions */}
            <div></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 min-h-[calc(100vh-16rem)]">
          {/* Left Column - Model Parameters */}
          <div className="col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)] overflow-y-auto">
                {/* Dynamic Model Form */}
                {selectedModel && selectedModel.config?.inputSchema ? (
                  <DynamicModelForm
                    model={selectedModel}
                    onSubmit={handleModelConfigSubmit}
                    showCostEstimate={false}
                    showDescription={false}
                    className="space-y-4"
                  />
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select a model above to configure parameters
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Prompt/Image Pairs */}
          <div className="col-span-8">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      {generationMode === 'single' ? 'Image Generation' : 'Multi-Image Generation'}
                    </CardTitle>
                    <CardDescription>
                      {generationMode === 'single' 
                        ? 'Generate a single image from your prompt'
                        : 'Generate multiple images with different prompts'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-20rem)]">
                <div className="space-y-6">
                  {promptImagePairs.map((pair, index) => (
                    <PromptImagePairComponent
                      key={pair.id}
                      pair={pair}
                      index={index}
                      canDelete={promptImagePairs.length > 1}
                      onPromptChange={(prompt) => updatePrompt(pair.id, prompt)}
                      onDelete={() => removePromptImagePair(pair.id)}
                      onDownload={() => pair.imageUrl && downloadImage(pair.imageUrl)}
                      onGenerate={() => generateSingleImage(pair.id)}
                    />
                  ))}
                  
                  {generationMode === 'multi' && (
                    <div className="mt-6">
                      <Button 
                        onClick={addPromptImagePair} 
                        variant="outline"
                        className="w-full border-dashed border-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Prompt
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PromptImagePairProps {
  pair: PromptImagePair
  index: number
  canDelete: boolean
  onPromptChange: (prompt: string) => void
  onDelete: () => void
  onDownload: () => void
  onGenerate: () => void
}

function PromptImagePairComponent({ 
  pair, 
  index, 
  canDelete, 
  onPromptChange, 
  onDelete, 
  onDownload,
  onGenerate
}: PromptImagePairProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Prompt {index + 1}</h3>
        {canDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Prompt</label>
          <div className="aspect-square">
            <textarea
              value={pair.prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full h-full px-3 py-2 text-sm bg-gray-900 text-white border border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
            />
          </div>
          <Button 
            onClick={onGenerate}
            disabled={!pair.prompt.trim() || pair.isGenerating}
            size="sm"
            className="w-full"
          >
            {pair.isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
        
        {/* Image Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Generated Image</label>
            {pair.imageUrl && (
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="aspect-square bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
            {pair.isGenerating ? (
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Generating...</p>
              </div>
            ) : pair.imageUrl ? (
              <img 
                src={pair.imageUrl} 
                alt={`Generated: ${pair.prompt.slice(0, 50)}...`}
                className="w-full h-full object-cover"
              />
            ) : pair.error ? (
              <div className="text-center text-red-500">
                <p className="text-xs">{pair.error}</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No image generated</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}