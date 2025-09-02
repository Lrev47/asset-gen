'use client'

import { FileText, Plus, Search, Star, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface PromptsWorkspaceProps {
  field: FieldWithFullDetails
}

export default function PromptsWorkspace({ field }: PromptsWorkspaceProps) {
  // Get unique prompts used in generations
  const usedPrompts = field.generations
    .filter(g => g.prompt)
    .map(g => g.prompt!)
    .filter((prompt, index, self) => 
      index === self.findIndex(p => p.id === prompt.id)
    )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Prompts</h2>
            <p className="text-muted-foreground">
              Manage and create prompts for {field.name}
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Prompt
          </Button>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {usedPrompts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No prompts yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first prompt to start generating consistent, high-quality content.
              </p>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Prompt
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {usedPrompts.map((prompt) => (
              <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{prompt.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{prompt.mediaType}</Badge>
                        <Badge variant="outline">v{prompt.version}</Badge>
                        {prompt.isTemplate && (
                          <Badge variant="secondary">Template</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
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
                  {prompt.description && (
                    <p className="text-muted-foreground mb-4">{prompt.description}</p>
                  )}
                  
                  {/* Prompt Content Preview */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="font-mono text-sm">
                      {typeof prompt.content === 'string' 
                        ? prompt.content 
                        : JSON.stringify(prompt.content).substring(0, 200) + '...'
                      }
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        Used {field.generations.filter(g => g.promptId === prompt.id).length} times
                      </span>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          {prompt.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {prompt.tags.length > 3 && (
                            <span className="text-xs">+{prompt.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Use Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}