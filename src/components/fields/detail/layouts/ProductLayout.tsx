'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Package, Camera, Tag, Settings, ShoppingBag } from 'lucide-react'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface ProductLayoutProps {
  field: FieldWithFullDetails
}

export default function ProductLayout({ field }: ProductLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">Product Field</p>
          </div>
        </div>
        
        {field.description && (
          <p className="text-muted-foreground">{field.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Product Images */}
        <Card className="xl:col-span-2 h-full">
          <CardContent className="p-8 h-full">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4">Product Images</h3>
              
              <div className="flex-1 border-2 border-dashed border-muted-foreground/20 rounded-lg p-6">
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-muted/50 rounded-lg flex items-center justify-center">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium">Product Photography</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Field Type: <span className="font-medium">{field.type}</span>
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Specialized interface for product photography with multiple angles, 
                      lighting options, and e-commerce optimization.
                    </p>
                  </div>

                  {/* Mock Product Views */}
                  <div className="flex gap-4 mt-6">
                    {['Front', 'Side', 'Back', 'Detail'].map((view) => (
                      <div
                        key={view}
                        className="w-16 h-16 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center"
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">{view}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details & Controls */}
        <Card className="h-full">
          <CardContent className="p-8 h-full">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Product Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Photo Angles</p>
                      <p className="text-sm text-muted-foreground">Multiple product views</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Product Tags</p>
                      <p className="text-sm text-muted-foreground">Categorization & SEO</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">E-commerce Ready</p>
                      <p className="text-sm text-muted-foreground">Optimized for sales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Product Options</p>
                      <p className="text-sm text-muted-foreground">Variants & specifications</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  This is a specialized view for product fields.<br/>
                  E-commerce features will be added here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}