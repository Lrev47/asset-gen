'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileText, Type, Palette, Layout, Settings } from 'lucide-react'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface ContentBlockLayoutProps {
  field: FieldWithFullDetails
}

export default function ContentBlockLayout({ field }: ContentBlockLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/20 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">Content Block Field</p>
          </div>
        </div>
        
        {field.description && (
          <p className="text-muted-foreground">{field.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Content Preview */}
        <Card className="h-full">
          <CardContent className="p-8 h-full">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4">Content Preview</h3>
              
              <div className="flex-1 border-2 border-dashed border-muted-foreground/20 rounded-lg p-6">
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-muted/50 rounded-lg flex items-center justify-center">
                    <Layout className="h-10 w-10 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium">Content Block</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Field Type: <span className="font-medium">{field.type}</span>
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Specialized interface for creating content blocks with text, images, 
                      and layout combinations.
                    </p>
                  </div>

                  {/* Mock Content Layout */}
                  <div className="w-full max-w-sm space-y-3">
                    <div className="h-4 bg-muted/40 rounded w-3/4 mx-auto"></div>
                    <div className="h-20 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-muted/40 rounded"></div>
                      <div className="h-2 bg-muted/40 rounded w-5/6"></div>
                      <div className="h-2 bg-muted/40 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tools */}
        <Card className="h-full">
          <CardContent className="p-8 h-full">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Content Tools</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Type className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Typography</p>
                      <p className="text-sm text-muted-foreground">Fonts, sizes, and styling</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Color Schemes</p>
                      <p className="text-sm text-muted-foreground">Brand color management</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Layout className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Layout Options</p>
                      <p className="text-sm text-muted-foreground">Text and image arrangements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Content Settings</p>
                      <p className="text-sm text-muted-foreground">Spacing and alignment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  This is a specialized view for content fields.<br/>
                  Rich content editing tools will be added here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}