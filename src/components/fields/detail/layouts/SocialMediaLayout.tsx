'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Share2, Instagram, Facebook, Twitter, Linkedin, Settings } from 'lucide-react'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface SocialMediaLayoutProps {
  field: FieldWithFullDetails
}

export default function SocialMediaLayout({ field }: SocialMediaLayoutProps) {
  const platforms = [
    { name: 'Instagram', icon: Instagram, size: '1080x1080', color: 'text-pink-500' },
    { name: 'Facebook', icon: Facebook, size: '1200x630', color: 'text-blue-600' },
    { name: 'Twitter', icon: Twitter, size: '1024x512', color: 'text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, size: '1200x627', color: 'text-blue-700' },
  ]

  return (
    <div className="h-full flex flex-col bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-pink-100 dark:bg-pink-950/20 rounded-lg flex items-center justify-center">
            <Share2 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">Social Media Field</p>
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
              {/* Platform Overview */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Platform Assets</h3>
                <div className="text-center mb-6">
                  <p className="text-muted-foreground mb-1">
                    Field Type: <span className="font-medium">{field.type}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Specialized interface for creating social media content across multiple platforms
                  </p>
                </div>
              </div>

              {/* Platform Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {platforms.map((platform) => {
                    const Icon = platform.icon
                    return (
                      <Card key={platform.name} className="border-2 border-dashed border-muted-foreground/20">
                        <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center">
                            <Icon className={`h-8 w-8 ${platform.color}`} />
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-lg">{platform.name}</h4>
                            <p className="text-sm text-muted-foreground">{platform.size}</p>
                          </div>

                          {/* Mock Preview */}
                          <div className="w-24 h-24 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                            <Icon className={`h-6 w-6 ${platform.color}`} />
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Optimized for {platform.name}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Social Media Controls */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Multi-Platform</p>
                      <p className="text-sm text-muted-foreground">Generate for all platforms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Instagram className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Format Optimization</p>
                      <p className="text-sm text-muted-foreground">Auto-size for each platform</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Brand Consistency</p>
                      <p className="text-sm text-muted-foreground">Unified visual identity</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Custom social media tools coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}