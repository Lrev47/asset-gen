'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Image, Eye, Settings } from 'lucide-react'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface SingleImageLayoutProps {
  field: FieldWithFullDetails
}

export default function SingleImageLayout({ field }: SingleImageLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
            <Image className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">Single Image Field</p>
          </div>
        </div>
        
        {field.description && (
          <p className="text-muted-foreground">{field.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Preview Area */}
        <Card className="h-full">
          <CardContent className="p-8 h-full flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-muted/50 rounded-lg flex items-center justify-center mx-auto">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Single Image Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Field Type: <span className="font-medium">{field.type}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Custom single image interface coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Area */}
        <Card className="h-full">
          <CardContent className="p-8 h-full">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Image Controls</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Preview Options</p>
                      <p className="text-sm text-muted-foreground">View and preview single image</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Image Settings</p>
                      <p className="text-sm text-muted-foreground">Configure dimensions and style</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  This is a specialized view for single image fields.<br/>
                  Advanced features will be added here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}