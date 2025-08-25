'use client'

import React, { useState } from 'react'
import { Plus, MessageSquare, Edit, Trash2, Eye, Play, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { Field, Prompt, AiModel } from '@prisma/client'

interface PromptsTabProps {
  project: ProjectWithFullDetails
}

export default function PromptsTab({ project }: PromptsTabProps) {
  const [filterField, setFilterField] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Mock prompts data - in real app this would come from server
  const mockPrompts = [
    {
      id: '1',
      content: 'Create a hero banner for an e-commerce website featuring modern design elements, vibrant colors, and call-to-action buttons. The image should convey trust and professionalism.',
      status: 'completed',
      fieldId: project.fields[0]?.id,
      aiModelId: 'dall-e-3',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2', 
      content: 'Generate a product gallery image showcasing multiple items with clean white background and professional lighting. Focus on clarity and visual appeal.',
      status: 'pending',
      fieldId: project.fields[1]?.id,
      aiModelId: 'stable-diffusion',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const filteredPrompts = mockPrompts.filter(prompt => {
    const fieldMatch = filterField === 'all' || prompt.fieldId === filterField
    const statusMatch = filterStatus === 'all' || prompt.status === filterStatus
    return fieldMatch && statusMatch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getFieldName = (fieldId: string | null | undefined) => {
    if (!fieldId) return 'No Field'
    return project.fields.find(f => f.id === fieldId)?.name || 'Unknown Field'
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">AI Prompts</h2>
          <p className="text-sm text-muted-foreground">
            {filteredPrompts.length} of {mockPrompts.length} prompts
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
              {project.fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Prompt
          </Button>
        </div>
      </div>

      {/* Prompts List */}
      {filteredPrompts.length > 0 ? (
        <div className="space-y-4">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg mt-1">
                      <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(prompt.status)}
                        <Badge variant={getStatusVariant(prompt.status) as any}>
                          {prompt.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getFieldName(prompt.fieldId)}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(prompt.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {prompt.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Model: <span className="font-medium">{prompt.aiModelId}</span>
                  </div>
                  {prompt.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      View Results
                    </Button>
                  )}
                  {prompt.status === 'pending' && (
                    <Button variant="outline" size="sm">
                      <Clock className="h-3 w-3 mr-1" />
                      In Queue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No prompts yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first AI prompt to start generating content.
              <br />
              Prompts define what the AI should create for each field.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Prompt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}