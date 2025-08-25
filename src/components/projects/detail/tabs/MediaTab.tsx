'use client'

import React, { useState } from 'react'
import { Upload, Filter, Grid, List, Download, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { formatRelativeTime } from '@/lib/utils'
import type { ProjectWithFullDetails } from '@/app/actions/project-detail'
import type { Field, Media } from '@prisma/client'

interface MediaTabProps {
  project: ProjectWithFullDetails
  media: Media[]
  fields: Field[]
}

export default function MediaTab({ project, media, fields }: MediaTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterField, setFilterField] = useState<string>('all')

  const filteredMedia = filterField === 'all' 
    ? media 
    : media.filter(m => m.fieldId === filterField)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Media Assets</h2>
          <p className="text-sm text-muted-foreground">
            {filteredMedia.length} of {media.length} assets
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Field Filter */}
          <Select value={filterField} onValueChange={setFilterField}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All fields" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fields</SelectItem>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-2"
            >
              <Grid className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 px-2"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>

          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {filteredMedia.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((mediaItem) => (
              <Card key={mediaItem.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted/30 relative overflow-hidden">
                  <img
                    src={mediaItem.url}
                    alt={mediaItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg></div>';
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Button variant="secondary" size="sm" className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h4 className="text-sm font-medium truncate">{mediaItem.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-xs">
                      {mediaItem.format}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(mediaItem.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map((mediaItem) => (
              <Card key={mediaItem.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted/30 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={mediaItem.url}
                        alt={mediaItem.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg></div>';
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{mediaItem.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {mediaItem.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {mediaItem.format}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(mediaItem.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No media assets</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Upload images, videos, and other media files for this project.
              <br />
              Media can be organized by field for better management.
            </p>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}