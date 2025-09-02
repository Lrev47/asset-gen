'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Image, Video, Music, Package, Share2, Wrench, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

export type WorkspaceMode = 'generate' | 'gallery' | 'prompts' | 'analytics' | 'settings'

interface FieldDetailLayoutProps {
  field: FieldWithFullDetails
}

// Function to get icon for field type
function getFieldIcon(type: string) {
  switch (type) {
    case 'hero':
    case 'banner':
    case 'logo':
    case 'profile':
    case 'thumbnail':
    case 'background':
      return Image
    
    case 'gallery':
      return Image
    
    case 'product':
      return Package
    
    case 'social':
      return Share2
    
    case 'video':
      return Video
      
    case 'audio':
      return Music
    
    case 'content':
      return FileText
    
    default:
      return Wrench
  }
}

// Function to get color theme for field type
function getFieldTheme(type: string) {
  switch (type) {
    case 'hero':
    case 'banner':
    case 'logo':
    case 'profile':
    case 'thumbnail':
    case 'background':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
    
    case 'gallery':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400'
    
    case 'product':
      return 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
    
    case 'social':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-950/20 dark:text-pink-400'
      
    case 'video':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
      
    case 'audio':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400'
    
    case 'content':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
    
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400'
  }
}

export default function FieldDetailLayout({ field }: FieldDetailLayoutProps) {
  const Icon = getFieldIcon(field.type)
  const themeColor = getFieldTheme(field.type)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/projects/${field.projectId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${themeColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{field.name}</h1>
              <p className="text-muted-foreground">
                Field in <Link href={`/projects/${field.projectId}`} className="hover:underline">
                  {field.project.name}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Field Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Field Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={themeColor}>
                      {field.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Position {field.position}
                    </span>
                  </div>
                  {field.description && (
                    <p className="text-muted-foreground">{field.description}</p>
                  )}
                </div>

                {field.requirements && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {JSON.stringify(field.requirements, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Field Detail Implementation</h3>
                  <p className="text-muted-foreground">
                    The detailed field interface is being redesigned.<br/>
                    Coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Media Items</span>
                  <span className="font-medium">{field._count.media}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Generations</span>
                  <span className="font-medium">{field._count.generations}</span>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created</span>
                  <span className="ml-auto">
                    {new Date(field.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated</span>
                  <span className="ml-auto">
                    {new Date(field.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Project Type</span>
                  <span className="ml-auto capitalize">{field.project.type}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}