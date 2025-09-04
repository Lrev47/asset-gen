"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = void 0;
const types_1 = require("../types");
const zod_1 = require("zod");
class SchemaManager {
    constructor() {
        this.schemaCache = new Map();
        this.zodCache = new Map();
    }
    // ==================== SCHEMA FETCHING ====================
    async fetchSchema(replicateId, version = 'latest') {
        try {
            const cacheKey = `${replicateId}:${version}`;
            // Check cache first
            if (this.schemaCache.has(cacheKey)) {
                return this.schemaCache.get(cacheKey);
            }
            // Fetch from Replicate API
            const apiToken = process.env.REPLICATE_API_TOKEN;
            if (!apiToken) {
                throw new types_1.SchemaError('REPLICATE_API_TOKEN not configured', replicateId);
            }
            // Get model version info which includes schema
            const response = await fetch(`https://api.replicate.com/v1/models/${replicateId}`, {
                headers: {
                    'Authorization': `Token ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new types_1.SchemaError(`Failed to fetch model info: ${response.statusText}`, replicateId);
            }
            const modelInfo = await response.json();
            // Get the latest version if version is 'latest'
            let versionId = version;
            if (version === 'latest' && modelInfo.latest_version) {
                versionId = modelInfo.latest_version.id;
            }
            // Fetch specific version schema
            const versionResponse = await fetch(`https://api.replicate.com/v1/models/${replicateId}/versions/${versionId}`, {
                headers: {
                    'Authorization': `Token ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!versionResponse.ok) {
                throw new types_1.SchemaError(`Failed to fetch version schema: ${versionResponse.statusText}`, replicateId);
            }
            const versionInfo = await versionResponse.json();
            // Extract input schema from OpenAPI spec
            const inputSchema = this.parseOpenAPISchema(versionInfo.openapi_schema);
            // Cache the result
            this.schemaCache.set(cacheKey, inputSchema);
            return inputSchema;
        }
        catch (error) {
            console.error(`Error fetching schema for ${replicateId}:`, error);
            if (error instanceof types_1.SchemaError) {
                throw error;
            }
            throw new types_1.SchemaError(`Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`, replicateId);
        }
    }
    // ==================== SCHEMA PARSING ====================
    parseOpenAPISchema(openApiSchema) {
        try {
            const inputProperties = openApiSchema?.components?.schemas?.Input?.properties;
            if (!inputProperties) {
                throw new Error('No input schema found in OpenAPI spec');
            }
            const schema = {};
            const requiredFields = openApiSchema?.components?.schemas?.Input?.required || [];
            for (const [fieldName, fieldSpec] of Object.entries(inputProperties)) {
                const spec = fieldSpec;
                schema[fieldName] = {
                    type: this.mapOpenAPIType(spec),
                    required: requiredFields.includes(fieldName),
                    description: spec.description || '',
                    default: spec.default
                };
                // Handle specific field types
                if (spec.enum) {
                    schema[fieldName].type = 'enum';
                    schema[fieldName].options = spec.enum;
                }
                if (spec.format === 'uri' || spec.format === 'data-url') {
                    schema[fieldName].type = 'file';
                    if (fieldName.toLowerCase().includes('audio')) {
                        schema[fieldName].accept = 'audio/*';
                    }
                    else if (fieldName.toLowerCase().includes('image')) {
                        schema[fieldName].accept = 'image/*';
                    }
                    else if (fieldName.toLowerCase().includes('video')) {
                        schema[fieldName].accept = 'video/*';
                    }
                }
                // Handle numeric constraints
                if (spec.minimum !== undefined) {
                    schema[fieldName].min = spec.minimum;
                }
                if (spec.maximum !== undefined) {
                    schema[fieldName].max = spec.maximum;
                }
                // Handle string patterns
                if (spec.pattern) {
                    schema[fieldName].validation = {
                        pattern: spec.pattern,
                        message: `Must match pattern: ${spec.pattern}`
                    };
                }
            }
            return schema;
        }
        catch (error) {
            console.error('Error parsing OpenAPI schema:', error);
            throw new Error(`Failed to parse OpenAPI schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    mapOpenAPIType(spec) {
        if (spec.enum)
            return 'enum';
        if (spec.format === 'uri' || spec.format === 'data-url')
            return 'file';
        switch (spec.type) {
            case 'string': return 'string';
            case 'number': return 'number';
            case 'integer': return 'integer';
            case 'boolean': return 'boolean';
            case 'array': return 'array';
            default: return 'string';
        }
    }
    // ==================== VALIDATION ====================
    validateInput(schema, input) {
        try {
            const errors = [];
            const sanitizedInput = {};
            // Create Zod schema if not cached
            const zodSchema = this.getZodSchema(schema);
            // Validate with Zod
            const result = zodSchema.safeParse(input);
            if (result.success) {
                return {
                    valid: true,
                    errors: [],
                    sanitizedInput: result.data
                };
            }
            else {
                // Convert Zod errors to our format
                result.error.errors.forEach(error => {
                    errors.push({
                        field: error.path.join('.'),
                        message: error.message,
                        value: error.code === 'invalid_type' && error.path[0] ? input[error.path[0]] : undefined
                    });
                });
                return {
                    valid: false,
                    errors
                };
            }
        }
        catch (error) {
            console.error('Error validating input:', error);
            return {
                valid: false,
                errors: [{
                        field: 'schema',
                        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }]
            };
        }
    }
    // ==================== ZOD SCHEMA GENERATION ====================
    getZodSchema(schema) {
        const cacheKey = JSON.stringify(schema);
        if (this.zodCache.has(cacheKey)) {
            return this.zodCache.get(cacheKey);
        }
        const zodFields = {};
        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            let zodField = this.createZodField(fieldSchema);
            // Handle optional fields
            if (!fieldSchema.required || fieldSchema.optional) {
                zodField = zodField.optional();
            }
            // Handle default values
            if (fieldSchema.default !== undefined) {
                zodField = zodField.default(fieldSchema.default);
            }
            zodFields[fieldName] = zodField;
        }
        const zodSchema = zod_1.z.object(zodFields);
        this.zodCache.set(cacheKey, zodSchema);
        return zodSchema;
    }
    createZodField(fieldSchema) {
        switch (fieldSchema.type) {
            case 'string':
                let stringSchema = zod_1.z.string();
                if (fieldSchema.validation?.pattern) {
                    stringSchema = stringSchema.regex(new RegExp(fieldSchema.validation.pattern), fieldSchema.validation.message);
                }
                return stringSchema;
            case 'number':
                let numberSchema = zod_1.z.number();
                if (fieldSchema.min !== undefined) {
                    numberSchema = numberSchema.min(fieldSchema.min);
                }
                if (fieldSchema.max !== undefined) {
                    numberSchema = numberSchema.max(fieldSchema.max);
                }
                return numberSchema;
            case 'integer':
                let intSchema = zod_1.z.number().int();
                if (fieldSchema.min !== undefined) {
                    intSchema = intSchema.min(fieldSchema.min);
                }
                if (fieldSchema.max !== undefined) {
                    intSchema = intSchema.max(fieldSchema.max);
                }
                return intSchema;
            case 'boolean':
                return zod_1.z.boolean();
            case 'enum':
                if (!fieldSchema.options || fieldSchema.options.length === 0) {
                    return zod_1.z.string();
                }
                return zod_1.z.enum(fieldSchema.options);
            case 'file':
                // For files, we expect either a URL string or a File object
                return zod_1.z.union([
                    zod_1.z.string().url(), // URL to existing file
                    zod_1.z.string().startsWith('data:'), // Data URL
                    zod_1.z.instanceof(File) // File object (in browser)
                ]);
            case 'array':
                return zod_1.z.array(zod_1.z.any());
            default:
                return zod_1.z.any();
        }
    }
    // ==================== UTILITY METHODS ====================
    getFieldDescription(schema, fieldName) {
        const field = schema[fieldName];
        if (!field)
            return '';
        let description = field.description || '';
        // Add constraints to description
        const constraints = [];
        if (field.required) {
            constraints.push('Required');
        }
        if (field.min !== undefined || field.max !== undefined) {
            if (field.min !== undefined && field.max !== undefined) {
                constraints.push(`Range: ${field.min}-${field.max}`);
            }
            else if (field.min !== undefined) {
                constraints.push(`Min: ${field.min}`);
            }
            else if (field.max !== undefined) {
                constraints.push(`Max: ${field.max}`);
            }
        }
        if (field.options && field.options.length > 0) {
            constraints.push(`Options: ${field.options.join(', ')}`);
        }
        if (field.default !== undefined) {
            constraints.push(`Default: ${field.default}`);
        }
        if (constraints.length > 0) {
            description += ` (${constraints.join(', ')})`;
        }
        return description;
    }
    getRequiredFields(schema) {
        return Object.entries(schema)
            .filter(([, field]) => field.required)
            .map(([name]) => name);
    }
    getOptionalFields(schema) {
        return Object.entries(schema)
            .filter(([, field]) => !field.required)
            .map(([name]) => name);
    }
    // ==================== CACHE MANAGEMENT ====================
    clearCache() {
        this.schemaCache.clear();
        this.zodCache.clear();
    }
    getCacheStats() {
        return {
            schemaCache: this.schemaCache.size,
            zodCache: this.zodCache.size
        };
    }
    // ==================== SCHEMA TRANSFORMATION ====================
    transformInputForProvider(schema, input) {
        const transformed = {};
        for (const [key, value] of Object.entries(input)) {
            const fieldSchema = schema[key];
            if (!fieldSchema) {
                // Pass through unknown fields (might be provider-specific)
                transformed[key] = value;
                continue;
            }
            // Handle type transformations
            switch (fieldSchema.type) {
                case 'integer':
                    transformed[key] = typeof value === 'string' ? parseInt(value, 10) : value;
                    break;
                case 'number':
                    transformed[key] = typeof value === 'string' ? parseFloat(value) : value;
                    break;
                case 'boolean':
                    transformed[key] = typeof value === 'string' ?
                        value.toLowerCase() === 'true' : Boolean(value);
                    break;
                default:
                    transformed[key] = value;
            }
        }
        return transformed;
    }
}
exports.SchemaManager = SchemaManager;
