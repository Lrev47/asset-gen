'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  DollarSign, 
  Clock, 
  Zap, 
  Image, 
  MessageSquare, 
  Video, 
  Mic,
  ExternalLink,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp
} from 'lucide-react'

import type { 
  ExtendedAiModel, 
  ModelFilter, 
  ModelType,
  ModelWithStats 
} from '../types'
import { getAvailableModels, getModelCapabilities } from '@/app/actions/models'

interface ModelSelectorProps {
  selectedModel?: string
  onModelSelect: (model: ExtendedAiModel) => void
  filter?: ModelFilter
  onFilterChange?: (filter: ModelFilter) => void
  showPricing?: boolean
  showDescription?: boolean
  showStats?: boolean
  viewMode?: 'grid' | 'list'
  className?: string
}

const MODEL_TYPE_ICONS = {
  image: Image,
  text: MessageSquare,
  video: Video,
  audio: Mic
} as const

const MODEL_TYPE_COLORS = {
  image: 'bg-blue-100 text-blue-800',
  text: 'bg-green-100 text-green-800', 
  video: 'bg-purple-100 text-purple-800',
  audio: 'bg-orange-100 text-orange-800'
} as const

export default function ModelSelector({
  selectedModel,
  onModelSelect,
  filter = {},
  onFilterChange,
  showPricing = true,
  showDescription = true,
  showStats = false,
  viewMode = 'grid',
  className = ''
}: ModelSelectorProps) {
  const [models, setModels] = useState<ExtendedAiModel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [capabilities, setCapabilities] = useState<Record<string, string[]>>({})
  const [currentFilter, setCurrentFilter] = useState<ModelFilter>(filter)

  // Load models and capabilities
  useEffect(() => {
    loadModels()
    loadCapabilities()
  }, [currentFilter])

  const loadModels = async () => {
    try {
      setLoading(true)
      const filterQuery: any = { ...currentFilter }
      
      const effectiveSearch = searchQuery || currentFilter.search
      if (effectiveSearch) {
        filterQuery.search = effectiveSearch
      }
      
      const result = await getAvailableModels(filterQuery)
      
      if (result.success && result.data) {
        setModels(result.data)
      } else {
        console.error('Error loading models:', result.error)
        setModels([])
      }
    } catch (error) {
      console.error('Error loading models:', error)
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const loadCapabilities = async () => {
    try {
      const result = await getModelCapabilities()
      if (result.success && result.data) {
        setCapabilities(result.data)
      }
    } catch (error) {
      console.error('Error loading capabilities:', error)
    }
  }

  // Handle filter changes
  const updateFilter = (updates: Partial<ModelFilter>) => {
    const newFilter = { ...currentFilter, ...updates }
    setCurrentFilter(newFilter)
    onFilterChange?.(newFilter)
  }

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== currentFilter.search) {
        updateFilter({ search: searchQuery })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Model card component
  const ModelCard = ({ model }: { model: ExtendedAiModel }) => {
    const TypeIcon = MODEL_TYPE_ICONS[model.type as keyof typeof MODEL_TYPE_ICONS] || Zap
    const isSelected = selectedModel === model.slug

    const handleSelect = () => {
      onModelSelect(model)
    }

    const handleViewReplicate = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (model.config?.replicateUrl) {
        window.open(model.config.replicateUrl, '_blank')
      }
    }

    if (viewMode === 'list') {
      return (
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            isSelected ? 'ring-2 ring-primary border-primary' : ''
          }`}
          onClick={handleSelect}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className={`p-2 rounded-lg ${MODEL_TYPE_COLORS[model.type as keyof typeof MODEL_TYPE_COLORS]}`}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{model.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {model.provider} • {model.type}
                  </p>
                </div>

                {showStats && (model as ModelWithStats).usageCount && (
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{(model as ModelWithStats).usageCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>{((model as ModelWithStats).successRate || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {showPricing && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>${model.costPerUse?.toFixed(4) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round((model.avgLatency || 0) / 1000)}s</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {model.provider}
                </Badge>
                
                {model.config?.replicateUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewReplicate}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Grid view
    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
          isSelected ? 'ring-2 ring-primary border-primary' : ''
        }`}
        onClick={handleSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-lg ${MODEL_TYPE_COLORS[model.type as keyof typeof MODEL_TYPE_COLORS]}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs">
                {model.provider}
              </Badge>
              
              {model.config?.replicateUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewReplicate}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div>
            <CardTitle className="text-base line-clamp-2">{model.name}</CardTitle>
            <CardDescription className="text-xs">
              {model.provider} • {model.type}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {showDescription && model.config?.inputSchema?.prompt?.description && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {model.config.inputSchema.prompt.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {(model.capabilities?.features || []).slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature.replace(/_/g, ' ')}
              </Badge>
            ))}
            {(model.capabilities?.features?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs">
                +{(model.capabilities?.features?.length || 0) - 3} more
              </Badge>
            )}
          </div>

          {showPricing && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span>${model.costPerUse?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>~{Math.round((model.avgLatency || 0) / 1000)}s</span>
              </div>
            </div>
          )}

          {showStats && (model as ModelWithStats).usageCount && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>{(model as ModelWithStats).usageCount} uses</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{((model as ModelWithStats).successRate || 0).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select
            value={currentFilter.type || 'all'}
            onValueChange={(value) => {
              const filter: any = {}
              if (value !== 'all') {
                filter.type = value as ModelType
              }
              updateFilter(filter)
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentFilter.status || 'all'}
            onValueChange={(value) => updateFilter({ status: value === 'all' ? undefined : value as any })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${models.length} model${models.length !== 1 ? 's' : ''} available`}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {}}
            className="h-8 w-8 p-0"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {}}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Models Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-full bg-gray-200 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  <div className="h-3 w-12 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <Filter className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium mb-2">No models found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setCurrentFilter({})
                onFilterChange?.({})
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }>
          {models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  )
}