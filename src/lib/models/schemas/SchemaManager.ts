import type {
  InputSchema,
  SchemaField,
  ValidationResult,
  ValidationError as ValidationErrorType,
  PredictionInput
} from '../types'
import { SchemaError } from '../types'
import { z } from 'zod'

export class SchemaManager {
  private schemaCache: Map<string, InputSchema> = new Map()
  private zodCache: Map<string, z.ZodSchema> = new Map()

  // ==================== SCHEMA FETCHING ====================

  async fetchSchema(replicateId: string, version: string = 'latest'): Promise<InputSchema> {
    try {
      const cacheKey = `${replicateId}:${version}`
      
      // Check cache first
      if (this.schemaCache.has(cacheKey)) {
        return this.schemaCache.get(cacheKey)!
      }

      // Fetch from Replicate API
      const apiToken = process.env.REPLICATE_API_TOKEN
      if (!apiToken) {
        throw new SchemaError('REPLICATE_API_TOKEN not configured', replicateId)
      }

      // Get model version info which includes schema
      const response = await fetch(
        `https://api.replicate.com/v1/models/${replicateId}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new SchemaError(
          `Failed to fetch model info: ${response.statusText}`, 
          replicateId
        )
      }

      const modelInfo = await response.json()
      
      // Get the latest version if version is 'latest'
      let versionId = version
      if (version === 'latest' && modelInfo.latest_version) {
        versionId = modelInfo.latest_version.id
      }

      // Fetch specific version schema
      const versionResponse = await fetch(
        `https://api.replicate.com/v1/models/${replicateId}/versions/${versionId}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!versionResponse.ok) {
        throw new SchemaError(
          `Failed to fetch version schema: ${versionResponse.statusText}`,
          replicateId
        )
      }

      const versionInfo = await versionResponse.json()
      
      // Extract input schema from OpenAPI spec
      const inputSchema = this.parseOpenAPISchema(versionInfo.openapi_schema)
      
      // Cache the result
      this.schemaCache.set(cacheKey, inputSchema)
      
      return inputSchema
    } catch (error) {
      console.error(`Error fetching schema for ${replicateId}:`, error)
      if (error instanceof SchemaError) {
        throw error
      }
      throw new SchemaError(
        `Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        replicateId
      )
    }
  }

  // ==================== SCHEMA PARSING ====================

  private parseOpenAPISchema(openApiSchema: any): InputSchema {
    try {
      const inputProperties = openApiSchema?.components?.schemas?.Input?.properties
      
      if (!inputProperties) {
        throw new Error('No input schema found in OpenAPI spec')
      }

      const schema: InputSchema = {}
      const requiredFields = openApiSchema?.components?.schemas?.Input?.required || []

      for (const [fieldName, fieldSpec] of Object.entries(inputProperties)) {
        const spec = fieldSpec as any
        
        schema[fieldName] = {
          type: this.mapOpenAPIType(spec),
          required: requiredFields.includes(fieldName),
          description: spec.description || '',
          default: spec.default
        }

        // Handle specific field types
        if (spec.enum) {
          schema[fieldName].type = 'enum'
          schema[fieldName].options = spec.enum
        }

        if (spec.format === 'uri' || spec.format === 'data-url') {
          schema[fieldName].type = 'file'
          if (fieldName.toLowerCase().includes('audio')) {
            schema[fieldName].accept = 'audio/*'
          } else if (fieldName.toLowerCase().includes('image')) {
            schema[fieldName].accept = 'image/*'
          } else if (fieldName.toLowerCase().includes('video')) {
            schema[fieldName].accept = 'video/*'
          }
        }

        // Handle numeric constraints
        if (spec.minimum !== undefined) {
          schema[fieldName].min = spec.minimum
        }
        if (spec.maximum !== undefined) {
          schema[fieldName].max = spec.maximum
        }

        // Handle string patterns
        if (spec.pattern) {
          schema[fieldName].validation = {
            pattern: spec.pattern,
            message: `Must match pattern: ${spec.pattern}`
          }
        }
      }

      return schema
    } catch (error) {
      console.error('Error parsing OpenAPI schema:', error)
      throw new Error(`Failed to parse OpenAPI schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private mapOpenAPIType(spec: any): SchemaField['type'] {
    if (spec.enum) return 'enum'
    if (spec.format === 'uri' || spec.format === 'data-url') return 'file'
    
    switch (spec.type) {
      case 'string': return 'string'
      case 'number': return 'number'
      case 'integer': return 'integer'
      case 'boolean': return 'boolean'
      case 'array': return 'array'
      default: return 'string'
    }
  }

  // ==================== VALIDATION ====================

  validateInput(schema: InputSchema, input: PredictionInput): ValidationResult {
    try {
      const errors: ValidationErrorType[] = []
      const sanitizedInput: PredictionInput = {}

      // Create Zod schema if not cached
      const zodSchema = this.getZodSchema(schema)
      
      // Validate with Zod
      const result = zodSchema.safeParse(input)
      
      if (result.success) {
        return {
          valid: true,
          errors: [],
          sanitizedInput: result.data
        }
      } else {
        // Convert Zod errors to our format
        result.error.errors.forEach(error => {
          errors.push({
            field: error.path.join('.'),
            message: error.message,
            value: error.code === 'invalid_type' && error.path[0] ? input[error.path[0]] : undefined
          } as ValidationErrorType)
        })

        return {
          valid: false,
          errors
        }
      }
    } catch (error) {
      console.error('Error validating input:', error)
      return {
        valid: false,
        errors: [{
          field: 'schema',
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }] as ValidationErrorType[]
      }
    }
  }

  // ==================== ZOD SCHEMA GENERATION ====================

  private getZodSchema(schema: InputSchema): z.ZodSchema {
    const cacheKey = JSON.stringify(schema)
    
    if (this.zodCache.has(cacheKey)) {
      return this.zodCache.get(cacheKey)!
    }

    const zodFields: Record<string, z.ZodSchema> = {}

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      let zodField = this.createZodField(fieldSchema)
      
      // Handle optional fields
      if (!fieldSchema.required || fieldSchema.optional) {
        zodField = zodField.optional()
      }

      // Handle default values
      if (fieldSchema.default !== undefined) {
        zodField = zodField.default(fieldSchema.default)
      }

      zodFields[fieldName] = zodField
    }

    const zodSchema = z.object(zodFields)
    this.zodCache.set(cacheKey, zodSchema)
    
    return zodSchema
  }

  private createZodField(fieldSchema: SchemaField): z.ZodSchema {
    switch (fieldSchema.type) {
      case 'string':
        let stringSchema = z.string()
        
        if (fieldSchema.validation?.pattern) {
          stringSchema = stringSchema.regex(
            new RegExp(fieldSchema.validation.pattern),
            fieldSchema.validation.message
          )
        }
        
        return stringSchema

      case 'number':
        let numberSchema = z.number()
        
        if (fieldSchema.min !== undefined) {
          numberSchema = numberSchema.min(fieldSchema.min)
        }
        if (fieldSchema.max !== undefined) {
          numberSchema = numberSchema.max(fieldSchema.max)
        }
        
        return numberSchema

      case 'integer':
        let intSchema = z.number().int()
        
        if (fieldSchema.min !== undefined) {
          intSchema = intSchema.min(fieldSchema.min)
        }
        if (fieldSchema.max !== undefined) {
          intSchema = intSchema.max(fieldSchema.max)
        }
        
        return intSchema

      case 'boolean':
        return z.boolean()

      case 'enum':
        if (!fieldSchema.options || fieldSchema.options.length === 0) {
          return z.string()
        }
        return z.enum(fieldSchema.options as [string, ...string[]])

      case 'file':
        // For files, we expect either a URL string or a File object
        return z.union([
          z.string().url(), // URL to existing file
          z.string().startsWith('data:'), // Data URL
          z.instanceof(File) // File object (in browser)
        ])

      case 'array':
        return z.array(z.any())

      default:
        return z.any()
    }
  }

  // ==================== UTILITY METHODS ====================

  getFieldDescription(schema: InputSchema, fieldName: string): string {
    const field = schema[fieldName]
    if (!field) return ''
    
    let description = field.description || ''
    
    // Add constraints to description
    const constraints: string[] = []
    
    if (field.required) {
      constraints.push('Required')
    }
    
    if (field.min !== undefined || field.max !== undefined) {
      if (field.min !== undefined && field.max !== undefined) {
        constraints.push(`Range: ${field.min}-${field.max}`)
      } else if (field.min !== undefined) {
        constraints.push(`Min: ${field.min}`)
      } else if (field.max !== undefined) {
        constraints.push(`Max: ${field.max}`)
      }
    }
    
    if (field.options && field.options.length > 0) {
      constraints.push(`Options: ${field.options.join(', ')}`)
    }
    
    if (field.default !== undefined) {
      constraints.push(`Default: ${field.default}`)
    }
    
    if (constraints.length > 0) {
      description += ` (${constraints.join(', ')})`
    }
    
    return description
  }

  getRequiredFields(schema: InputSchema): string[] {
    return Object.entries(schema)
      .filter(([, field]) => field.required)
      .map(([name]) => name)
  }

  getOptionalFields(schema: InputSchema): string[] {
    return Object.entries(schema)
      .filter(([, field]) => !field.required)
      .map(([name]) => name)
  }

  // ==================== CACHE MANAGEMENT ====================

  clearCache(): void {
    this.schemaCache.clear()
    this.zodCache.clear()
  }

  getCacheStats(): { schemaCache: number, zodCache: number } {
    return {
      schemaCache: this.schemaCache.size,
      zodCache: this.zodCache.size
    }
  }

  // ==================== SCHEMA TRANSFORMATION ====================

  transformInputForProvider(schema: InputSchema, input: PredictionInput): PredictionInput {
    const transformed: PredictionInput = {}

    for (const [key, value] of Object.entries(input)) {
      const fieldSchema = schema[key]
      
      if (!fieldSchema) {
        // Pass through unknown fields (might be provider-specific)
        transformed[key] = value
        continue
      }

      // Handle type transformations
      switch (fieldSchema.type) {
        case 'integer':
          transformed[key] = typeof value === 'string' ? parseInt(value, 10) : value
          break
          
        case 'number':
          transformed[key] = typeof value === 'string' ? parseFloat(value) : value
          break
          
        case 'boolean':
          transformed[key] = typeof value === 'string' ? 
            value.toLowerCase() === 'true' : Boolean(value)
          break
          
        default:
          transformed[key] = value
      }
    }

    return transformed
  }
}