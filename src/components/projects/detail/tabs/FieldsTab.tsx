'use client'

import React from 'react'
import Link from 'next/link'
import { Plus, FileText, Image, Edit, Trash2, Settings, ChevronDown, PenTool, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProjectWithFullDetails } from '@/app/actions/project-detail'
import type { Field, Media } from '@prisma/client'

interface FieldsTabProps {
  project: ProjectWithFullDetails
  fields: (Field & { 
    media: Media[]
    _count: { media: number; generations: number }
  })[]
}

export default function FieldsTab({ project, fields }: FieldsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header with Add Field Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Fields</h2>
          <p className="text-sm text-muted-foreground">
            Manage the content requirements for this project
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/projects/${project.id}/fields`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Fields
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/fields/new/manual`}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Create Manually
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/fields/new/ai`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Fields List */}
      {fields.length > 0 ? (
        <div className="space-y-4">
          {fields.map((field) => (
            <Card key={field.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Link href={`/projects/${project.id}/fields/${field.id}`}>
                        <CardTitle className="text-base hover:text-primary transition-colors cursor-pointer">
                          {field.name}
                        </CardTitle>
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Position {field.position}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {field.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {field.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Image className="h-3 w-3" />
                      <span>{field._count.media} media</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{field._count.generations} generations</span>
                    </div>
                  </div>
                  
                  {field.media.length > 0 && (
                    <div className="flex space-x-1">
                      {field.media.slice(0, 3).map((media) => (
                        <div
                          key={media.id}
                          className="w-6 h-6 rounded bg-muted/30 flex items-center justify-center overflow-hidden"
                          title={media.name}
                        >
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<svg class="h-2 w-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg>';
                              }
                            }}
                          />
                        </div>
                      ))}
                      {field.media.length > 3 && (
                        <div className="w-6 h-6 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                          +{field.media.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No fields yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Fields define the specific content requirements for your project.
              <br />
              Add your first field to get started.
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Field
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}/fields/new/manual`}>
                    <PenTool className="h-4 w-4 mr-2" />
                    Create Manually
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}/fields/new/ai`}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      )}
    </div>
  )
}