'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Wand2, Save, RefreshCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import LoadingSpinner from '@/components/ui/loading-spinner'
import type { Project } from '@prisma/client'

interface AIFieldGenerationProps {
  project: Project
}

interface GeneratedField {
  id: string
  name: string
  type: string
  description: string
  requirements: string
  position: number
  selected: boolean
}

export default function AIFieldGeneration({ project }: AIFieldGenerationProps) {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'generating' | 'review'>('input')
  const [loading, setLoading] = useState(false)
  const [generatedFields, setGeneratedFields] = useState<GeneratedField[]>([])
  
  const [formData, setFormData] = useState({
    projectDescription: project.description || '',
    specificNeeds: '',
    targetAudience: '',
    style: ''
  })

  const handleGenerate = async () => {
    setLoading(true)
    setStep('generating')

    try {
      // TODO: Implement AI field generation API call
      console.log('Generating fields with AI:', formData)
      
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock generated fields
      const mockFields: GeneratedField[] = [
        {
          id: '1',
          name: 'Hero Banner',
          type: 'hero',
          description: 'Main promotional banner for the homepage featuring key messaging',
          requirements: '1920x1080 pixels, high-impact visuals, clear call-to-action',
          position: 1,
          selected: true
        },
        {
          id: '2',
          name: 'Product Gallery',
          type: 'gallery',
          description: 'Showcase of main products or services in grid format',
          requirements: '500x500 pixels per item, consistent lighting and background',
          position: 2,
          selected: true
        },
        {
          id: '3',
          name: 'About Us Section',
          type: 'content',
          description: 'Team photos and company story visuals',
          requirements: 'Professional headshots, office environment shots',
          position: 3,
          selected: true
        },
        {
          id: '4',
          name: 'Social Media Assets',
          type: 'social',
          description: 'Consistent branding for social platforms',
          requirements: 'Multiple formats (Instagram, Facebook, Twitter), brand colors',
          position: 4,
          selected: false
        }
      ]
      
      setGeneratedFields(mockFields)
      setStep('review')
    } catch (error) {
      console.error('Error generating fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFieldSelection = (fieldId: string) => {
    setGeneratedFields(prev => 
      prev.map(field => 
        field.id === fieldId 
          ? { ...field, selected: !field.selected }
          : field
      )
    )
  }

  const handleCreateSelected = async () => {
    setLoading(true)
    const selectedFields = generatedFields.filter(field => field.selected)
    
    try {
      // TODO: Implement bulk field creation API call
      console.log('Creating selected fields:', selectedFields)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect back to project
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = generatedFields.filter(field => field.selected).length

  if (step === 'input') {
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
              <h1 className="text-3xl font-bold">Generate Fields with AI</h1>
              <p className="text-muted-foreground">Let AI suggest the perfect fields for {project.name}</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                value={formData.projectDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                placeholder="Describe your project, its purpose, and goals..."
                rows={4}
              />
            </div>

            {/* Specific Needs */}
            <div className="space-y-2">
              <Label htmlFor="specificNeeds">Specific Content Needs</Label>
              <Textarea
                id="specificNeeds"
                value={formData.specificNeeds}
                onChange={(e) => setFormData(prev => ({ ...prev, specificNeeds: e.target.value }))}
                placeholder="What type of content do you need? (e.g., product photos, team headshots, marketing banners...)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="e.g., Young professionals, families, businesses"
                />
              </div>

              {/* Style Preferences */}
              <div className="space-y-2">
                <Label htmlFor="style">Style Preferences</Label>
                <Input
                  id="style"
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                  placeholder="e.g., Modern, minimalist, bold, professional"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button 
                onClick={handleGenerate}
                disabled={!formData.projectDescription.trim()}
                size="lg"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Fields with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'generating') {
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
              <h1 className="text-3xl font-bold">Generate Fields with AI</h1>
              <p className="text-muted-foreground">AI is analyzing your project and creating field suggestions</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner size="lg" />
            <div className="text-center mt-6 space-y-2">
              <h3 className="text-lg font-medium">Generating Fields...</h3>
              <p className="text-muted-foreground">
                AI is analyzing your project requirements and creating tailored field suggestions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Review step
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
            <h1 className="text-3xl font-bold">Review Generated Fields</h1>
            <p className="text-muted-foreground">
              AI generated {generatedFields.length} field suggestions for {project.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerate}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button 
            onClick={handleCreateSelected}
            disabled={selectedCount === 0 || loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create {selectedCount} Selected
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="py-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected for creation
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Fields */}
      <div className="space-y-4">
        {generatedFields.map((field, index) => (
          <Card 
            key={field.id} 
            className={`cursor-pointer transition-all ${
              field.selected 
                ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10' 
                : 'hover:shadow-md'
            }`}
            onClick={() => toggleFieldSelection(field.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    field.selected 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300'
                  }`}>
                    {field.selected && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{field.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{field.type}</Badge>
                      <span className="text-sm text-muted-foreground">Position {field.position}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">{field.description}</p>
              {field.requirements && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <h4 className="font-medium text-sm mb-2">Requirements:</h4>
                    <p className="text-sm text-muted-foreground">{field.requirements}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}