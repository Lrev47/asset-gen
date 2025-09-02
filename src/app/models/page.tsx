'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Database, 
  Plus,
  Search,
  ExternalLink,
  Settings,
  Trash2,
  Image,
  Type,
  Video,
  Music,
  Wrench,
  BookOpen,
  Sparkles
} from 'lucide-react'

import type { ModelType } from '@/lib/models/types'
import { getUserModels, removeUserModel, updateModelLastUsed } from '@/app/actions/userModels'

// User's selected model data structure
interface UserModel {
  id: string
  modelSlug: string // e.g., "black-forest-labs/flux-1.1-pro" 
  modelName: string
  modelType: ModelType
  addedAt: Date
  lastUsedAt?: Date | null
  settings?: any
}

export default function ModelsPage() {
  const [userModels, setUserModels] = useState<UserModel[]>([])
  const [selectedType, setSelectedType] = useState<ModelType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserModels()
  }, [])

  const loadUserModels = async () => {
    try {
      setLoading(true)
      
      const result = await getUserModels()
      if (result.success && result.data) {
        setUserModels(result.data)
      } else {
        console.error('Failed to load user models:', result.error)
        setUserModels([])
      }
    } catch (error) {
      console.error('Error loading user models:', error)
      setUserModels([])
    } finally {
      setLoading(false)
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

  // Filter models based on search and type
  const filteredModels = userModels.filter(model => {
    const matchesSearch = searchQuery === '' || 
      model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.modelSlug.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === 'all' || model.modelType === selectedType
    
    return matchesSearch && matchesType
  })

  const handleRemoveModel = async (modelId: string) => {
    try {
      const result = await removeUserModel(modelId)
      if (result.success) {
        // Reload the models list
        loadUserModels()
      } else {
        console.error('Failed to remove model:', result.error)
      }
    } catch (error) {
      console.error('Error removing model:', error)
    }
  }


  // Empty state when user has no models
  if (!loading && userModels.length === 0) {
    return (
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Models</h1>
            <p className="text-muted-foreground">
              Your personal collection of AI models
            </p>
          </div>
          <Button asChild>
            <Link href="/models/registry">
              <Plus className="h-4 w-4 mr-2" />
              Browse Registry
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center max-w-md">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-4">No models added yet</h2>
            <p className="text-muted-foreground mb-6">
              Build your personal AI toolkit by adding models from our registry. 
              Choose from image generators, text models, video creators, and more.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/models/registry">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Model Registry
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/models" target="_blank">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Learn About Models
                </Link>
              </Button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Image className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold mb-2">Image Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Create stunning visuals with FLUX, DALL-E, and more
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Type className="h-8 w-8 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold mb-2">Text Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by Llama, GPT, and other language models
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Wrench className="h-8 w-8 mx-auto mb-3 text-gray-500" />
                <h3 className="font-semibold mb-2">Utility Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Background removal, upscaling, and processing
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Main page with user's models
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Models</h1>
          <p className="text-muted-foreground">
            {userModels.length} model{userModels.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/models/registry">
              <Plus className="h-4 w-4 mr-2" />
              Add Models
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as ModelType | 'all')}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="utility">Utility</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => {
          const Icon = getTypeIcon(model.modelType)
          return (
            <div key={model.id} className="relative">
              <Link href={`/models/${model.modelSlug}`}>
                <Card className="flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-lg group-hover:text-red-600 transition-colors">
                            {model.modelName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{model.modelSlug}</p>
                        </div>
                      </div>
                      <Badge className={getTypeColor(model.modelType)}>
                        {model.modelType}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span>Added {new Date(model.addedAt).toLocaleDateString()}</span>
                      {model.lastUsedAt && (
                        <span>Last used {new Date(model.lastUsedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {/* Remove button positioned absolutely */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveModel(model.id)
                }}
                className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* No results state */}
      {filteredModels.length === 0 && userModels.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No models match your search</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setSelectedType('all')
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}