'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Filter,
  Plus,
  ExternalLink,
  Loader2,
  Image,
  Type,
  Video,
  Music,
  Wrench,
  Database,
  TrendingUp,
  Star,
  Users,
  ArrowUpDown,
  Flame,
  TrendingDown,
  Check
} from 'lucide-react'
import type { ModelType } from '@/lib/models/types'
import { detectModelType, type ReplicateModel } from '@/lib/models/utils/typeDetection'
import { addUserModel, getUserModels } from '@/app/actions/userModels'
import { useToast } from '@/components/ui/use-toast'

// Extended interface for our usage
interface ExtendedReplicateModel extends ReplicateModel {
  detectedType?: ModelType
}


export default function ModelRegistryPage() {
  const { toast } = useToast()
  const [models, setModels] = useState<ExtendedReplicateModel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<ModelType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'all' | 'categorized'>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'alphabetical' | 'recent' | 'creator'>('popular')
  const [popularityFilter, setPopularityFilter] = useState<'all' | 'trending' | 'popular' | 'emerging'>('all')
  const [minRuns, setMinRuns] = useState<number>(0)
  const [userModelSlugs, setUserModelSlugs] = useState<Set<string>>(new Set())

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


  // Load user's model collection
  useEffect(() => {
    const fetchUserModels = async () => {
      try {
        const result = await getUserModels()
        if (result.success && result.data) {
          const slugs = new Set(result.data.map(model => model.modelSlug))
          setUserModelSlugs(slugs)
        }
      } catch (error) {
        console.error('Error loading user models:', error)
      }
    }

    fetchUserModels()
  }, [])

  // Auto-load all models on mount
  useEffect(() => {
    const fetchAllModels = async () => {
      setLoading(true)
      let allModels: ExtendedReplicateModel[] = []
      let currentCursor: string | null = null
      let hasMore = true
      
      try {
        while (hasMore) {
          const url: string = currentCursor 
            ? `/api/replicate/models?cursor=${currentCursor}`
            : '/api/replicate/models'
          
          const response = await fetch(url)
          if (!response.ok) throw new Error('Failed to fetch models')
          
          const data = await response.json()
          
          // Process and add models
          const modelsWithTypes = data.results.map((model: ReplicateModel) => ({
            ...model,
            detectedType: detectModelType(model)
          }))
          
          allModels = [...allModels, ...modelsWithTypes]
          
          // Update UI progressively so users can start browsing immediately
          setModels([...allModels])
          
          // Check for next page
          if (data.next) {
            try {
              const nextUrl = new URL(data.next)
              currentCursor = nextUrl.searchParams.get('cursor')
            } catch (error) {
              console.error('Error parsing cursor:', error)
              hasMore = false
            }
          } else {
            hasMore = false
          }
          
          // Small delay between requests to be gentle on the API
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 150))
          }
        }
      } catch (error) {
        console.error('Error loading all models:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllModels()
  }, [])

  // Filter and sort models based on all criteria
  const filteredAndSortedModels = models
    .filter(model => {
      const matchesSearch = searchTerm === '' || 
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.owner.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = selectedType === 'all' || model.detectedType === selectedType
      
      const matchesMinRuns = model.run_count >= minRuns
      
      const matchesPopularity = (() => {
        switch (popularityFilter) {
          case 'trending':
            return model.run_count >= 1000000 // 1M+ runs
          case 'popular':
            return model.run_count >= 100000 && model.run_count < 1000000 // 100K-1M runs
          case 'emerging':
            return model.run_count >= 10000 && model.run_count < 100000 // 10K-100K runs
          default:
            return true // 'all'
        }
      })()
      
      return matchesSearch && matchesType && matchesMinRuns && matchesPopularity
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.run_count - a.run_count
        case 'alphabetical':
          return a.name.localeCompare(b.name)
        case 'creator':
          return a.owner.localeCompare(b.owner)
        case 'recent':
          // Sort by URL as a proxy for recency (newer models tend to have higher IDs)
          return b.url.localeCompare(a.url)
        default:
          return 0
      }
    })

  // Group models by type for categorized view
  const modelsByType = {
    image: models.filter(m => m.detectedType === 'image'),
    text: models.filter(m => m.detectedType === 'text'), 
    video: models.filter(m => m.detectedType === 'video'),
    audio: models.filter(m => m.detectedType === 'audio'),
    utility: models.filter(m => m.detectedType === 'utility')
  }

  const getTypeCounts = () => ({
    image: modelsByType.image.length,
    text: modelsByType.text.length,
    video: modelsByType.video.length,
    audio: modelsByType.audio.length,
    utility: modelsByType.utility.length,
    total: models.length
  })

  const handleAddModel = async (model: ExtendedReplicateModel) => {
    try {
      const modelSlug = `${model.owner}/${model.name}`
      
      // Check if already in collection
      if (userModelSlugs.has(modelSlug)) {
        toast({
          title: "Model Already Added",
          description: `${model.name} is already in your collection.`,
          variant: "default",
        })
        return
      }
      
      // Ensure we have a valid model type, fallback to 'utility' if undefined
      const modelType = model.detectedType || 'utility'
      
      const result = await addUserModel({
        modelSlug: modelSlug,
        modelName: model.name,
        modelType: modelType
      })
      
      if (result.success) {
        // Update local state immediately
        setUserModelSlugs(prev => new Set(prev).add(modelSlug))
        toast({
          title: "Model Added",
          description: `${model.name} has been added to your collection.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Failed to Add Model",
          description: result.error || "Unable to add model to your collection.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding model:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Model Registry</h1>
          <p className="text-muted-foreground">
            Discover and add AI models from Replicate's catalog
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{getTypeCounts().total.toLocaleString()} models loaded</span>
            {loading && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading all models...
              </span>
            )}
            {!loading && (
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                All models loaded
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'categorized')}>
            <TabsList>
              <TabsTrigger value="all">All Models</TabsTrigger>
              <TabsTrigger value="categorized">By Category</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" asChild>
            <Link href="/models">
              View My Models
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
                  placeholder="Search models by name, description, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {viewMode === 'all' && (
              <div className="flex flex-col lg:flex-row gap-4">
                <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as ModelType | 'all')}>
                  <TabsList>
                    <TabsTrigger value="all">All ({getTypeCounts().total})</TabsTrigger>
                    <TabsTrigger value="image">Image ({getTypeCounts().image})</TabsTrigger>
                    <TabsTrigger value="text">Text ({getTypeCounts().text})</TabsTrigger>
                    <TabsTrigger value="video">Video ({getTypeCounts().video})</TabsTrigger>
                    <TabsTrigger value="audio">Audio ({getTypeCounts().audio})</TabsTrigger>
                    <TabsTrigger value="utility">Utility ({getTypeCounts().utility})</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Minimum Runs Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="minRuns" className="text-sm text-muted-foreground whitespace-nowrap">
                    Min runs:
                  </label>
                  <Input
                    id="minRuns"
                    type="number"
                    placeholder="0"
                    value={minRuns || ''}
                    onChange={(e) => setMinRuns(parseInt(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Results */}
      {viewMode === 'all' && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {filteredAndSortedModels.length} model{filteredAndSortedModels.length !== 1 ? 's' : ''} found
          </h2>
          
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="creator">By Creator</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Popularity Filter */}
            <div className="flex items-center gap-2">
              <Tabs value={popularityFilter} onValueChange={(value) => setPopularityFilter(value as typeof popularityFilter)}>
                <TabsList>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="trending" className="text-xs flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger value="emerging" className="text-xs flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Emerging
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading models...</span>
        </div>
      )}

      {/* Models Grid - All View */}
      {!loading && viewMode === 'all' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedModels.map((model) => {
              const Icon = getTypeIcon(model.detectedType!)
              return (
                <Card key={model.url} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">by {model.owner}</p>
                        </div>
                      </div>
                      <Badge className={getTypeColor(model.detectedType!)}>
                        {model.detectedType}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {model.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {model.run_count.toLocaleString()} runs
                      </div>
                      {model.github_url && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          GitHub
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        asChild
                      >
                        <Link href={model.url} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {userModelSlugs.has(`${model.owner}/${model.name}`) ? (
                        <Button 
                          size="sm"
                          variant="outline"
                          disabled
                          className="flex-1 text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Added
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleAddModel(model)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
        </>
      )}

      {/* Categorized View */}
      {!loading && viewMode === 'categorized' && (
        <div className="space-y-8">
          {(['image', 'text', 'video', 'audio', 'utility'] as const).map((type) => {
            const typeModels = modelsByType[type]
            const Icon = getTypeIcon(type)
            
            if (typeModels.length === 0) return null
            
            return (
              <div key={type} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold capitalize">{type} Models</h2>
                    <p className="text-muted-foreground">
                      {typeModels.length} model{typeModels.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeModels.slice(0, 6).map((model) => (
                    <Card key={model.url} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{model.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">by {model.owner}</p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 flex-1 flex flex-col">
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                          {model.description || 'No description available'}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {model.run_count.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link href={model.url} target="_blank">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          {userModelSlugs.has(`${model.owner}/${model.name}`) ? (
                            <Button 
                              size="sm"
                              variant="outline"
                              disabled
                              className="flex-1 text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Added
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleAddModel(model)}
                              className="flex-1"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {typeModels.length > 6 && (
                  <div className="text-center">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setViewMode('all')
                        setSelectedType(type)
                      }}
                    >
                      View all {typeModels.length} {type} models
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedModels.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No models found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setSelectedType('all')
              setPopularityFilter('all')
              setMinRuns(0)
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}