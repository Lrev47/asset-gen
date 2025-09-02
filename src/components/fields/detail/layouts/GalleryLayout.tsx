'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Images, Grid, Plus, Settings } from 'lucide-react'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface GalleryLayoutProps {
  field: FieldWithFullDetails
}

export default function GalleryLayout({ field }: GalleryLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 rounded-lg flex items-center justify-center">
            <Images className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">Gallery Field</p>
          </div>
        </div>
        
        {field.description && (
          <p className="text-muted-foreground">{field.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Card className="h-full">
          <CardContent className="p-8 h-full">
            <div className="h-full flex flex-col">
              {/* Gallery Grid Area */}
              <div className="flex-1 border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-muted/50 rounded-lg flex items-center justify-center">
                    <Grid className="h-12 w-12 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-2">Gallery Collection</h3>
                    <p className="text-muted-foreground mb-1">
                      Field Type: <span className="font-medium">{field.type}</span>
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      This specialized gallery interface will allow you to manage multiple images 
                      with grid layouts, batch operations, and organization tools.
                    </p>
                  </div>

                  {/* Mock Gallery Grid */}
                  <div className="grid grid-cols-4 gap-4 max-w-md">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center"
                      >
                        {i === 7 ? (
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Images className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gallery Controls */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Grid className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Grid Layout</p>
                      <p className="text-sm text-muted-foreground">Organize in grid format</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Batch Upload</p>
                      <p className="text-sm text-muted-foreground">Add multiple images</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Gallery Settings</p>
                      <p className="text-sm text-muted-foreground">Configure layout options</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Custom gallery interface coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}