'use client'

import React, { useState } from 'react'
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Image,
  Video,
  FileText,
  Layout,
  Users,
  Palette,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { createField, createFieldFromTemplate, getFieldTemplates, type FieldTemplate } from '@/app/actions/fields'

interface AddFieldWizardProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onFieldCreated: () => void
}

interface FieldType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  examples: string[]
  defaultRequirements: any
}

const fieldTypes: FieldType[] = [
  {
    id: 'hero',
    name: 'Hero Banner',
    description: 'Main banner images for homepage or landing pages',
    icon: <Layout className="h-5 w-5" />,
    examples: ['Homepage banner', 'Landing page header', 'Product showcase'],
    defaultRequirements: {
      dimensions: { width: 1920, height: 1080 },
      quantity: 1,
      format: 'jpg',
      style: 'professional, high-impact, modern'
    }
  },
  {
    id: 'gallery',
    name: 'Product Gallery',
    description: 'Collection of product or portfolio images',
    icon: <Image className="h-5 w-5" />,
    examples: ['Product showcase', 'Portfolio gallery', 'Image grid'],
    defaultRequirements: {
      dimensions: { width: 800, height: 800 },
      quantity: 6,
      format: 'png',
      style: 'clean, professional, consistent lighting'
    }
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Background images for customer testimonials',
    icon: <Users className="h-5 w-5" />,
    examples: ['Customer photos', 'Testimonial backgrounds', 'Review cards'],
    defaultRequirements: {
      dimensions: { width: 600, height: 400 },
      quantity: 3,
      format: 'jpg',
      style: 'warm, trustworthy, subtle background'
    }
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Images optimized for social media platforms',
    icon: <Palette className="h-5 w-5" />,
    examples: ['Instagram posts', 'Facebook covers', 'Twitter headers'],
    defaultRequirements: {
      dimensions: { width: 1080, height: 1080 },
      quantity: 5,
      format: 'png',
      style: 'engaging, colorful, brand-consistent'
    }
  },
  {
    id: 'blog',
    name: 'Blog Content',
    description: 'Featured images for blog posts and articles',
    icon: <FileText className="h-5 w-5" />,
    examples: ['Article headers', 'Blog thumbnails', 'Content illustrations'],
    defaultRequirements: {
      dimensions: { width: 1200, height: 630 },
      quantity: 3,
      format: 'jpg',
      style: 'informative, clean, relevant to content'
    }
  },
  {
    id: 'video',
    name: 'Video Thumbnails',
    description: 'Thumbnail images for video content',
    icon: <Video className="h-5 w-5" />,
    examples: ['YouTube thumbnails', 'Video previews', 'Course covers'],
    defaultRequirements: {
      dimensions: { width: 1280, height: 720 },
      quantity: 4,
      format: 'jpg',
      style: 'eye-catching, high contrast, clear text'
    }
  }
]

export default function AddFieldWizard({
  isOpen,
  onClose,
  projectId,
  onFieldCreated
}: AddFieldWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string>('')
  const [fieldName, setFieldName] = useState('')
  const [fieldDescription, setFieldDescription] = useState('')
  const [requirements, setRequirements] = useState<any>({})
  const [priority, setPriority] = useState(1)
  const [deadline, setDeadline] = useState('')
  const [templates, setTemplates] = useState<FieldTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)

  const maxSteps = 4

  const handleNext = () => {
    if (step < maxSteps) {
      setStep(step + 1)
      
      // Load templates when reaching step 3
      if (step === 2) {
        loadTemplates()
      }
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const loadTemplates = async () => {
    const result = await getFieldTemplates()
    if (!result.error) {
      setTemplates(result.templates.filter(t => t.type === selectedType))
    }
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const fieldType = fieldTypes.find(t => t.id === typeId)
    if (fieldType) {
      setFieldName(fieldType.name)
      setFieldDescription(fieldType.description)
      setRequirements(fieldType.defaultRequirements)
    }
  }

  const handleCreateField = async () => {
    setIsCreating(true)
    try {
      let result
      
      if (selectedTemplate) {
        // Create from template
        result = await createFieldFromTemplate(projectId, selectedTemplate, {
          name: fieldName,
          description: fieldDescription,
          requirements
        })
      } else {
        // Create custom field
        result = await createField({
          projectId,
          name: fieldName,
          type: selectedType,
          description: fieldDescription,
          requirements,
          priority,
          ...(deadline && { deadline: new Date(deadline) })
        })
      }

      if (result.field && !result.error) {
        onFieldCreated()
        handleClose()
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setSelectedType('')
    setFieldName('')
    setFieldDescription('')
    setRequirements({})
    setPriority(1)
    setDeadline('')
    setSelectedTemplate('')
    onClose()
  }

  const currentFieldType = fieldTypes.find(t => t.id === selectedType)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Add New Field</DialogTitle>
              <DialogDescription>
                Define content requirements for your project
              </DialogDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {step} of {maxSteps}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / maxSteps) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Field Type Selection */}
          {step === 1 && (
            <div className="space-y-4 p-1">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Field Type</h3>
                <p className="text-sm text-muted-foreground">
                  Select the type of content you want to generate
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fieldTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedType === type.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{type.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {type.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {type.examples.slice(0, 2).map((example, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {selectedType === type.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Configuration */}
          {step === 2 && currentFieldType && (
            <div className="space-y-6 p-1">
              <div>
                <h3 className="text-lg font-semibold mb-2">Configure Field</h3>
                <p className="text-sm text-muted-foreground">
                  Set up basic information and requirements
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fieldName">Field Name</Label>
                  <Input
                    id="fieldName"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="Enter field name"
                  />
                </div>

                <div>
                  <Label htmlFor="fieldDescription">Description</Label>
                  <textarea
                    id="fieldDescription"
                    value={fieldDescription}
                    onChange={(e) => setFieldDescription(e.target.value)}
                    placeholder="Describe the content requirements"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={requirements.dimensions?.width || ''}
                      onChange={(e) => setRequirements({
                        ...requirements,
                        dimensions: {
                          ...requirements.dimensions,
                          width: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={requirements.dimensions?.height || ''}
                      onChange={(e) => setRequirements({
                        ...requirements,
                        dimensions: {
                          ...requirements.dimensions,
                          height: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={requirements.quantity || ''}
                      onChange={(e) => setRequirements({
                        ...requirements,
                        quantity: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select 
                      value={requirements.format || ''} 
                      onValueChange={(value) => setRequirements({
                        ...requirements,
                        format: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                        <SelectItem value="svg">SVG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="style">Style Description</Label>
                  <Input
                    id="style"
                    value={requirements.style || ''}
                    onChange={(e) => setRequirements({
                      ...requirements,
                      style: e.target.value
                    })}
                    placeholder="Describe the desired style"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Templates (Optional) */}
          {step === 3 && (
            <div className="space-y-4 p-1">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Template</h3>
                <p className="text-sm text-muted-foreground">
                  Use a pre-configured template or continue with custom settings
                </p>
              </div>

              <div className="space-y-3">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !selectedTemplate ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTemplate('')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Custom Configuration</h4>
                        <p className="text-sm text-muted-foreground">
                          Use your custom settings from the previous step
                        </p>
                      </div>
                      {!selectedTemplate && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                          <div className="flex space-x-2 mt-2 text-xs text-muted-foreground">
                            <span>{template.requirements?.dimensions?.width}x{template.requirements?.dimensions?.height}</span>
                            <span>•</span>
                            <span>{template.requirements?.quantity} items</span>
                            <span>•</span>
                            <span>{template.requirements?.format?.toUpperCase()}</span>
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Priority & Deadline */}
          {step === 4 && (
            <div className="space-y-6 p-1">
              <div>
                <h3 className="text-lg font-semibold mb-2">Final Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Set priority and deadline for generation scheduling
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select 
                    value={priority.toString()} 
                    onValueChange={(value) => setPriority(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low Priority</SelectItem>
                      <SelectItem value="2">Medium Priority</SelectItem>
                      <SelectItem value="3">High Priority</SelectItem>
                      <SelectItem value="4">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                {/* Summary */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Field Name:</span>
                      <span>{fieldName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{currentFieldType?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span>{requirements.dimensions?.width}x{requirements.dimensions?.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{requirements.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant={priority > 2 ? 'destructive' : 'outline'}>
                        {priority === 1 ? 'Low' : priority === 2 ? 'Medium' : priority === 3 ? 'High' : 'Urgent'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            
            {step < maxSteps ? (
              <Button 
                onClick={handleNext}
                disabled={!selectedType && step === 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleCreateField}
                disabled={isCreating || !fieldName}
              >
                {isCreating ? 'Creating...' : 'Create Field'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}