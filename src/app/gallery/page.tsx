'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Image as ImageIcon, 
  Download, 
  Search, 
  Calendar, 
  Filter,
  Grid3X3,
  List,
  Eye,
  Trash2
} from 'lucide-react'

interface GeneratedImage {
  id: string
  name: string
  prompt: string
  url: string
  modelName: string
  createdAt: string
  cost?: number
  dimensions: string
}

// Mock data for now - replace with actual API calls
const mockImages: GeneratedImage[] = [
  {
    id: '1',
    name: 'Mountain Landscape',
    prompt: 'A serene mountain landscape at sunset with golden light',
    url: 'https://picsum.photos/400/400?random=1',
    modelName: 'FLUX.1 [dev]',
    createdAt: '2024-01-20T10:30:00Z',
    cost: 0.055,
    dimensions: '1024x1024'
  },
  {
    id: '2',
    name: 'City Night Scene',
    prompt: 'Cyberpunk city at night with neon lights and rain',
    url: 'https://picsum.photos/400/400?random=2',
    modelName: 'FLUX.1 [dev]',
    createdAt: '2024-01-19T15:45:00Z',
    cost: 0.055,
    dimensions: '1024x1024'
  },
  {
    id: '3',
    name: 'Portrait Study',
    prompt: 'Professional headshot of a business woman, studio lighting',
    url: 'https://picsum.photos/400/400?random=3',
    modelName: 'FLUX.1 [dev]',
    createdAt: '2024-01-18T09:15:00Z',
    cost: 0.055,
    dimensions: '1024x1024'
  }
]

export default function GalleryPage() {
  const [images, setImages] = useState<GeneratedImage[]>(mockImages)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [filterModel, setFilterModel] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and sort images
  const filteredImages = images
    .filter(image => 
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(image => filterModel === 'all' || image.modelName === filterModel)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${fileName}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const deleteImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const uniqueModels = [...new Set(images.map(img => img.modelName))]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-16 z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-blue-500" />
                Gallery
              </h1>
              <p className="text-muted-foreground">Browse your generated images</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'name') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No images found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterModel !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start generating images to see them here'
              }
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredImages.map((image) => (
                  <Card key={image.id} className="group hover:shadow-md transition-shadow">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => downloadImage(image.url, image.name)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => deleteImage(image.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1 truncate">{image.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {image.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline">{image.modelName}</Badge>
                        <span>{formatDate(image.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredImages.map((image) => (
                  <Card key={image.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-lg">{image.name}</h3>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => downloadImage(image.url, image.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => deleteImage(image.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3">{image.prompt}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline">{image.modelName}</Badge>
                            <span className="text-muted-foreground">{image.dimensions}</span>
                            {image.cost && (
                              <span className="text-muted-foreground">${image.cost.toFixed(4)}</span>
                            )}
                            <span className="text-muted-foreground">{formatDate(image.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}