'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createField } from '@/app/actions/fields'
import type { Project } from '@prisma/client'

interface ManualFieldCreationProps {
  project: Project
}

const fieldTypes = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'banner', label: 'Banner' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'logo', label: 'Logo' },
  { value: 'profile', label: 'Profile Image' },
  { value: 'background', label: 'Background' },
  { value: 'content', label: 'Content Block' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'social', label: 'Social Media' },
  { value: 'custom', label: 'Custom' }
]

export default function ManualFieldCreation({ project }: ManualFieldCreationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    position: 1,
    requirements: ''
  })

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createField({
        projectId: project.id,
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        requirements: {
          position: formData.position,
          specificRequirements: formData.requirements.trim() || null
        }
      })

      if (result.field) {
        // Success - redirect back to project fields
        router.push(`/projects/${project.id}`)
      } else {
        // Handle error
        console.error('Error creating field:', result.error)
        alert(result.error || 'Failed to create field')
      }
    } catch (error) {
      console.error('Error creating field:', error)
      alert('Failed to create field. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.name.trim() && formData.type && formData.description.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Field Manually</h1>
            <p className="text-muted-foreground">Define a new content field for {project.name}</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Field Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Field Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Hero Banner, Product Gallery"
                  required
                />
              </div>

              {/* Field Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Field Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this field is for and how it will be used..."
                rows={4}
                required
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Display Position</Label>
              <Input
                id="position"
                type="number"
                min="1"
                value={formData.position}
                onChange={(e) => handleInputChange('position', parseInt(e.target.value) || 1)}
                placeholder="1"
                className="max-w-32"
              />
              <p className="text-sm text-muted-foreground">
                Order in which this field appears (1 = first)
              </p>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label htmlFor="requirements">Specific Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Any specific requirements, dimensions, style guidelines, etc..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Field
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}