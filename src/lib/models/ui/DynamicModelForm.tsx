'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, DollarSign, Clock, Info } from 'lucide-react'

import type {
  ExtendedAiModel,
  SchemaField,
  InputSchema,
  PredictionInput,
  ValidationResult,
  CostEstimate
} from '../types'
import { estimateGenerationCost, validateModelInput } from '@/app/actions/models'

interface DynamicModelFormProps {
  model: ExtendedAiModel
  initialValues?: Record<string, any>
  onSubmit: (values: PredictionInput) => Promise<void>
  onValidate?: (values: PredictionInput) => Promise<ValidationResult>
  loading?: boolean
  disabled?: boolean
  showCostEstimate?: boolean
  showDescription?: boolean
  className?: string
}

interface FormFieldProps {
  name: string
  schema: SchemaField
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
}

// ==================== FIELD COMPONENTS ====================

function FormField({ name, schema, value, onChange, error, disabled }: FormFieldProps) {
  const fieldId = `field-${name}`
  const isRequired = schema.required && !schema.optional

  const renderField = () => {
    switch (schema.type) {
      case 'string':
        if (schema.options && schema.options.length > 0) {
          // Render as select for enum-like strings
          return (
            <Select
              value={value || schema.default || ''}
              onValueChange={onChange}
              {...(disabled && { disabled: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={schema.placeholder || `Select ${name}...`} />
              </SelectTrigger>
              <SelectContent>
                {schema.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        
        // Long text fields
        if (name.toLowerCase().includes('prompt') || 
            name.toLowerCase().includes('description') ||
            schema.description?.toLowerCase().includes('description')) {
          return (
            <Textarea
              id={fieldId}
              value={value || schema.default || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={schema.placeholder || schema.description}
              disabled={disabled}
              rows={3}
            />
          )
        }
        
        // Regular text input
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || schema.default || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={schema.placeholder || schema.description}
            disabled={disabled}
          />
        )

      case 'number':
      case 'integer':
        // Use slider for bounded numeric inputs
        if (schema.min !== undefined && schema.max !== undefined) {
          const numValue = Number(value ?? schema.default ?? schema.min)
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {schema.min}
                </span>
                <span className="font-medium">{numValue}</span>
                <span className="text-sm text-muted-foreground">
                  {schema.max}
                </span>
              </div>
              <Slider
                value={[numValue]}
                onValueChange={(values) => onChange(values[0])}
                min={schema.min}
                max={schema.max}
                step={schema.type === 'integer' ? 1 : 0.1}
                {...(disabled && { disabled: true })}
                className="w-full"
              />
            </div>
          )
        }
        
        // Regular number input
        const isSeedField = name.toLowerCase() === 'seed'
        
        if (isSeedField) {
          return (
            <div className="flex gap-2">
              <Input
                id={fieldId}
                type="number"
                value={value ?? schema.default ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onChange(val === '' ? undefined : Number(val))
                }}
                min={schema.min}
                max={schema.max}
                step={schema.type === 'integer' ? 1 : 'any'}
                placeholder={schema.placeholder || "Random seed"}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))}
                disabled={disabled}
                className="px-3"
                title="Generate random seed"
              >
                🎲
              </Button>
            </div>
          )
        }
        
        return (
          <Input
            id={fieldId}
            type="number"
            value={value ?? schema.default ?? ''}
            onChange={(e) => {
              const val = e.target.value
              onChange(val === '' ? undefined : Number(val))
            }}
            min={schema.min}
            max={schema.max}
            step={schema.type === 'integer' ? 1 : 'any'}
            placeholder={schema.placeholder}
            disabled={disabled}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              checked={value ?? schema.default ?? false}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <Label htmlFor={fieldId} className="text-sm">
              {schema.description || name}
            </Label>
          </div>
        )

      case 'enum':
        if (!schema.options || schema.options.length === 0) {
          return (
            <Input
              id={fieldId}
              type="text"
              value={value || schema.default || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={schema.placeholder}
              disabled={disabled}
            />
          )
        }

        return (
          <Select
            value={value || schema.default || ''}
            onValueChange={onChange}
            {...(disabled && { disabled: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder={schema.placeholder || `Select ${name}...`} />
            </SelectTrigger>
            <SelectContent>
              {schema.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              id={fieldId}
              type="file"
              accept={schema.accept}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onChange(file)
                }
              }}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              {schema.accept ? `Accepts: ${schema.accept}` : 'Any file type'}
            </p>
          </div>
        )

      case 'array':
        return (
          <Textarea
            id={fieldId}
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => {
              const arrayValue = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
              onChange(arrayValue)
            }}
            placeholder="Enter comma-separated values..."
            disabled={disabled}
            rows={2}
          />
        )

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || schema.default || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={schema.placeholder}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {schema.description && schema.type !== 'boolean' && (
        <p className="text-xs text-muted-foreground">{schema.description}</p>
      )}
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

export default function DynamicModelForm({
  model,
  initialValues = {},
  onSubmit,
  onValidate,
  loading = false,
  disabled = false,
  showCostEstimate = true,
  showDescription = true,
  className = ''
}: DynamicModelFormProps) {
  const schema = model.config?.inputSchema || {}
  const requiredFields = Object.entries(schema)
    .filter(([, field]) => field.required && !field.optional)
    .map(([name]) => name)

  // Memoize default values to prevent unnecessary recalculations
  const defaultValues = useMemo(() => {
    const defaults: Record<string, any> = {}
    
    Object.entries(schema).forEach(([fieldName, fieldSchema]) => {
      if (fieldSchema.default !== undefined) {
        defaults[fieldName] = fieldSchema.default
      } else if (fieldSchema.required && !fieldSchema.optional) {
        // Set empty required fields
        switch (fieldSchema.type) {
          case 'boolean':
            defaults[fieldName] = false
            break
          case 'number':
          case 'integer':
            defaults[fieldName] = fieldSchema.min || 0
            break
          case 'array':
            defaults[fieldName] = []
            break
          default:
            defaults[fieldName] = ''
        }
      } else if (fieldName.toLowerCase() === 'seed' && (fieldSchema.type === 'integer' || fieldSchema.type === 'number')) {
        // Auto-generate random seed for seed fields
        defaults[fieldName] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
      }
    })

    return { ...defaults, ...initialValues }
  }, [schema, JSON.stringify(initialValues)]) // Use JSON.stringify to prevent reference issues

  const [formValues, setFormValues] = useState<Record<string, any>>(defaultValues)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [estimatingCost, setEstimatingCost] = useState(false)

  // Only update form values when defaultValues actually change
  useEffect(() => {
    setFormValues(defaultValues)
  }, [JSON.stringify(defaultValues)])

  // Estimate cost when form values change
  useEffect(() => {
    if (!showCostEstimate) return
    
    const timer = setTimeout(async () => {
      try {
        setEstimatingCost(true)
        const result = await estimateGenerationCost(model.slug, formValues)
        if (result.success && result.data) {
          setCostEstimate(result.data)
        }
      } catch (error) {
        console.error('Error estimating cost:', error)
      } finally {
        setEstimatingCost(false)
      }
    }, 500) // Debounce cost estimation

    return () => clearTimeout(timer)
  }, [formValues, model.slug, showCostEstimate])

  // Update form value
  const updateFormValue = (fieldName: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = async (): Promise<boolean> => {
    try {
      let validation: ValidationResult

      if (onValidate) {
        validation = await onValidate(formValues)
      } else {
        const result = await validateModelInput(model.slug, formValues)
        if (!result.success) {
          throw new Error(result.error)
        }
        validation = result.data!
      }

      if (!validation.valid) {
        const errors: Record<string, string> = {}
        validation.errors.forEach(error => {
          errors[error.field] = error.message
        })
        setValidationErrors(errors)
        return false
      }

      setValidationErrors({})
      return true
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = await validateForm()
    if (!isValid) return
    
    try {
      await onSubmit(formValues)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Group fields by importance/type
  const requiredFieldsEntries = Object.entries(schema).filter(([, field]) => field.required && !field.optional)
  const optionalFieldsEntries = Object.entries(schema).filter(([, field]) => !field.required || field.optional)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Model Information */}
      {showDescription && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{model.name}</CardTitle>
                <CardDescription className="mt-1">
                  {model.type} generation • {model.provider}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Badge variant="secondary">
                  {model.provider}
                </Badge>
                {model.capabilities?.streaming && (
                  <Badge variant="outline">Streaming</Badge>
                )}
                {model.capabilities?.batch && (
                  <Badge variant="outline">Batch</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${model.costPerUse?.toFixed(4) || 'N/A'} per use</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>~{Math.round((model.avgLatency || 0) / 1000)}s average</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Estimate */}
      {showCostEstimate && costEstimate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Cost Estimate</span>
              {estimatingCost && (
                <div className="h-3 w-3 border border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold mb-2">
              ${costEstimate.totalCost.toFixed(4)} {costEstimate.currency}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {costEstimate.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.item}</span>
                  <span>${item.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields */}
        {requiredFieldsEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Required Parameters</CardTitle>
              <CardDescription>
                These fields are required for generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredFieldsEntries.map(([fieldName, fieldSchema]) => (
                <FormField
                  key={fieldName}
                  name={fieldName}
                  schema={fieldSchema}
                  value={formValues[fieldName]}
                  onChange={(value) => updateFormValue(fieldName, value)}
                  {...(validationErrors[fieldName] && { error: validationErrors[fieldName] })}
                  disabled={disabled}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Generate Button - Moved closer to required fields */}
        <Card>
          <CardContent className="pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || disabled}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate with ${model.name}`
              )}
            </Button>
            
            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </span>
                </div>
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>• {field}: {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optional Fields */}
        {optionalFieldsEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Optional Parameters</CardTitle>
              <CardDescription>
                Customize these settings to fine-tune your generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optionalFieldsEntries.map(([fieldName, fieldSchema]) => (
                <FormField
                  key={fieldName}
                  name={fieldName}
                  schema={fieldSchema}
                  value={formValues[fieldName]}
                  onChange={(value) => updateFormValue(fieldName, value)}
                  {...(validationErrors[fieldName] && { error: validationErrors[fieldName] })}
                  disabled={disabled}
                />
              ))}
            </CardContent>
          </Card>
        )}

      </form>
    </div>
  )
}