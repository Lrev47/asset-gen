'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderPlus, Calendar, DollarSign, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { createProject, type ProjectMetadata } from '@/app/actions/projects'
import type { Project } from '@/lib/db/prisma'

const PROJECT_TYPES = [
  { value: 'website', label: 'Website' },
  { value: 'marketing', label: 'Marketing Campaign' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'brand', label: 'Brand Kit' },
  { value: 'social', label: 'Social Media' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'other', label: 'Other' }
] as const

const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
] as const

// Define proper form data interface
interface ProjectFormData {
  name: string
  description: string
  type: string
  status: string
  client: string
  deadline: string
  budget: string
}

export default function CreateProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    type: '',
    status: 'active',
    client: '',
    deadline: '',
    budget: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }
    
    if (!formData.type) {
      newErrors.type = 'Project type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const metadata: ProjectMetadata = {
        ...(formData.client && { client: formData.client }),
        ...(formData.deadline && { deadline: formData.deadline }),
        ...(formData.budget && { budget: formData.budget })
      }

      const projectData: {
        name: string
        description?: string
        type: string
        status: string
        userId: string
        metadata?: ProjectMetadata
      } = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        userId: 'user-1', // Mock user ID for now
      }

      if (formData.description) {
        projectData.description = formData.description
      }

      if (Object.keys(metadata).length > 0) {
        projectData.metadata = metadata
      }

      const result = await createProject(projectData)

      if (result.success && result.data) {
        toast({
          title: "Project Created",
          description: `${formData.name} has been created successfully`,
        })
        router.push(`/projects/${result.data.id}`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
              <p className="text-muted-foreground mt-1">
                Set up a new project to organize your media generation workflow
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderPlus className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Project Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project goals and requirements"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Additional information to help organize your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="client" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Client
                  </Label>
                  <Input
                    id="client"
                    placeholder="Client or company name"
                    value={formData.client}
                    onChange={(e) => handleChange('client', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget
                  </Label>
                  <Input
                    id="budget"
                    placeholder="Project budget"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/projects">
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}