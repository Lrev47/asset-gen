'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import MediaOutputDisplay from '@/components/media/creation/MediaOutputDisplay'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { 
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  Play,
  Loader2,
  Image,
  Type,
  Video,
  Music,
  Wrench,
  Database,
  Users,
  Star,
  GitBranch,
  Calendar,
  Zap
} from 'lucide-react'

import type { ModelType } from '@/lib/models/types'
import { detectModelType, type ReplicateModel } from '@/lib/models/utils/typeDetection'
import { addUserModel, removeUserModel, isModelInCollection, updateModelLastUsed } from '@/app/actions/userModels'

// Extended interface for display
interface ModelDetailData extends ReplicateModel {
  detectedType: ModelType
  inputSchema?: any
  outputSchema?: any
  inUserCollection?: boolean
  userModelId?: string | undefined
}

interface GenerationResult {
  predictionId: string
  status: string
  output?: any
  error?: string
}

export default function ModelDetailPage() {
  const params = useParams()
  const [model, setModel] = useState<ModelDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [collectionLoading, setCollectionLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [testPrompt, setTestPrompt] = useState('')

  // Get model slug from URL params (comes as array, need to join)
  const modelSlug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug

  useEffect(() => {
    if (modelSlug) {
      loadModelData()
    }
  }, [modelSlug])

  const loadModelData = async () => {
    try {
      setLoading(true)

      if (!modelSlug) {
        throw new Error('Model slug is required')
      }

      // Fetch model data from Replicate API and check if it's in user's collection
      const [modelResponse, collectionResponse] = await Promise.all([
        fetch(`/api/replicate/models/${modelSlug}`),
        isModelInCollection(modelSlug)
      ])

      if (!modelResponse.ok) {
        throw new Error('Failed to fetch model data')
      }

      const replicateModel: ReplicateModel = await modelResponse.json()
      const detectedType = detectModelType(replicateModel)

      const modelData: ModelDetailData = {
        ...replicateModel,
        detectedType,
        inputSchema: replicateModel.latest_version?.openapi_schema?.components?.schemas?.Input,
        outputSchema: replicateModel.latest_version?.openapi_schema?.components?.schemas?.Output,
        inUserCollection: collectionResponse.success ? collectionResponse.data?.inCollection ?? false : false,
        userModelId: collectionResponse.success ? collectionResponse.data?.modelId : undefined
      }

      setModel(modelData)
      setTestPrompt(getDefaultPrompt(detectedType))
    } catch (error) {
      console.error('Error loading model data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCollection = async () => {
    if (!model || !modelSlug) return

    try {
      setCollectionLoading(true)
      
      const result = await addUserModel({
        modelSlug: modelSlug,
        modelName: model.name,
        modelType: model.detectedType
      })

      if (result.success && result.data) {
        setModel(prev => prev ? { ...prev, inUserCollection: true, userModelId: result.data.id } : null)
      } else {
        console.error('Failed to add to collection:', result.error)
      }
    } catch (error) {
      console.error('Error adding to collection:', error)
    } finally {
      setCollectionLoading(false)
    }
  }

  const handleRemoveFromCollection = async () => {
    if (!model?.userModelId) return

    try {
      setCollectionLoading(true)
      
      const result = await removeUserModel(model.userModelId)

      if (result.success) {
        setModel(prev => prev ? { ...prev, inUserCollection: false, userModelId: undefined } : null)
      } else {
        console.error('Failed to remove from collection:', result.error)
      }
    } catch (error) {
      console.error('Error removing from collection:', error)
    } finally {
      setCollectionLoading(false)
    }
  }

  const handleSimpleGenerate = async () => {
    if (!model || !testPrompt.trim()) return

    try {
      setTesting(true)
      setGenerationResult({ predictionId: '', status: 'starting' })

      // Update last used if in collection
      if (model.inUserCollection && modelSlug) {
        await updateModelLastUsed(modelSlug)
      }

      // Create simple input object - most models accept a 'prompt' field
      const input = {
        prompt: testPrompt
      }

      // Create prediction via simplified Replicate API
      const response = await fetch('/api/replicate/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: model.latest_version?.id,
          input: input
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create prediction')
      }

      const prediction = await response.json()
      setGenerationResult({
        predictionId: prediction.id,
        status: prediction.status
      })

      // Poll for completion
      const pollResult = async () => {
        const statusResponse = await fetch(`/api/replicate/predictions/${prediction.id}`)
        if (statusResponse.ok) {
          const updated = await statusResponse.json()
          setGenerationResult({
            predictionId: updated.id,
            status: updated.status,
            output: updated.output,
            error: updated.error
          })

          if (updated.status === 'succeeded' || updated.status === 'failed') {
            setTesting(false)
          } else if (updated.status === 'processing' || updated.status === 'starting') {
            setTimeout(pollResult, 1000)
          }
        }
      }

      pollResult()
    } catch (error) {
      console.error('Error generating:', error)
      setGenerationResult({
        predictionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed'
      })
      setTesting(false)
    }
  }

  const handleGenerate = async (input: any) => {
    if (!model) return

    try {
      setTesting(true)
      setGenerationResult({ predictionId: '', status: 'starting' })

      // Update last used if in collection
      if (model.inUserCollection && modelSlug) {
        await updateModelLastUsed(modelSlug)
      }

      // Create prediction via Replicate API
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: model.latest_version?.id,
          input: input
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create prediction')
      }

      const prediction = await response.json()
      setGenerationResult({
        predictionId: prediction.id,
        status: prediction.status
      })

      // Poll for completion
      const pollResult = async () => {
        const statusResponse = await fetch(`/api/predictions/${prediction.id}`)
        if (statusResponse.ok) {
          const updated = await statusResponse.json()
          setGenerationResult({
            predictionId: updated.id,
            status: updated.status,
            output: updated.output,
            error: updated.error
          })

          if (updated.status === 'succeeded' || updated.status === 'failed') {
            setTesting(false)
          } else if (updated.status === 'processing' || updated.status === 'starting') {
            setTimeout(pollResult, 1000)
          }
        }
      }

      pollResult()
    } catch (error) {
      console.error('Error generating:', error)
      setGenerationResult({
        predictionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed'
      })
      setTesting(false)
    }
  }

  const getTypeIcon = (type: ModelType) => {
    switch (type) {
      case 'image': return Image
      case 'text': return Type
      case 'video': return Video
      case 'audio': return Music
      case 'utility': return Wrench
      default: return Database
    }
  }

  const getTypeColor = (type: ModelType) => {
    switch (type) {
      case 'image': return 'bg-blue-100 text-blue-800'
      case 'text': return 'bg-green-100 text-green-800'
      case 'video': return 'bg-purple-100 text-purple-800'
      case 'audio': return 'bg-orange-100 text-orange-800'
      case 'utility': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDefaultPrompt = (type: ModelType) => {
    switch (type) {
      case 'image': return 'A beautiful sunset over mountains with vibrant colors'
      case 'text': return 'Write a short poem about artificial intelligence'
      case 'video': return 'A smooth camera pan across a futuristic cityscape'
      case 'audio': return 'Create a relaxing ambient soundscape'
      case 'utility': return 'Process this input'
      default: return 'Enter your prompt here'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading model...</span>
        </div>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Model not found</h2>
          <p className="text-muted-foreground mb-4">
            The model "{modelSlug}" could not be found.
          </p>
          <Button asChild>
            <Link href="/models/registry">Browse Models</Link>
          </Button>
        </div>
      </div>
    )
  }

  const Icon = getTypeIcon(model.detectedType)

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/models/registry">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{model.name}</h1>
                <Badge className={getTypeColor(model.detectedType)}>
                  {model.detectedType}
                </Badge>
              </div>
              <p className="text-muted-foreground">by {model.owner}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {model.inUserCollection ? (
            <Button
              variant="outline"
              onClick={handleRemoveFromCollection}
              disabled={collectionLoading}
            >
              {collectionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </Button>
          ) : (
            <Button
              onClick={handleAddToCollection}
              disabled={collectionLoading}
            >
              {collectionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add to Collection
            </Button>
          )}

          <Button variant="outline" asChild>
            <Link href={model.url} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Replicate
            </Link>
          </Button>
        </div>
      </div>

      {/* Test Section - AT THE TOP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Model
          </CardTitle>
          <CardDescription>
            Try this model quickly with a simple prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Prompt and Generate */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Prompt</label>
                <Textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder={getDefaultPrompt(model.detectedType)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleSimpleGenerate}
                disabled={testing || !testPrompt.trim()}
                className="w-full"
              >
                {testing ? (
                  <>
                    <LoadingSpinner size="sm" className="w-4 h-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {/* Right side - Output */}
            <div className="border rounded-lg min-h-[300px] bg-muted/10">
              {testing ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <div>
                      <p className="text-lg font-medium">Generating...</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {generationResult?.status || 'starting'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : generationResult?.output ? (
                <MediaOutputDisplay
                  mediaType={model.detectedType === 'utility' ? 'text' : model.detectedType}
                  output={generationResult.output}
                  isFullscreen={false}
                />
              ) : generationResult?.error ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center text-red-500">
                    <p className="font-medium mb-2">Generation Failed</p>
                    <p className="text-sm">{generationResult.error}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center space-y-2">
                    <Icon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Your generated content will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {model.description || 'No description available.'}
              </p>

              {/* Links */}
              <div className="flex gap-4 mt-4">
                {model.github_url && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={model.github_url} target="_blank">
                      <GitBranch className="h-4 w-4 mr-1" />
                      GitHub
                    </Link>
                  </Button>
                )}
                {model.paper_url && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={model.paper_url} target="_blank">
                      Paper
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column - Stats & Metadata */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Model Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Runs</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{model.run_count.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latest Version</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {model.latest_version?.id.slice(0, 8)}...
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Model Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Provider:</span>
                <span className="ml-2 font-medium">Replicate</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium capitalize">{model.detectedType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Visibility:</span>
                <span className="ml-2 font-medium capitalize">{model.visibility}</span>
              </div>
              {model.latest_version && (
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2 font-mono text-xs">{model.latest_version.id}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}