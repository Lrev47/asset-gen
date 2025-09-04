"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaError = exports.AdapterError = exports.ValidationError = exports.ModelError = void 0;
// ==================== ERROR HANDLING ====================
class ModelError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ModelError';
    }
}
exports.ModelError = ModelError;
class ValidationError extends ModelError {
    constructor(message, errors) {
        super(message, 'VALIDATION_ERROR', { errors });
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class AdapterError extends ModelError {
    constructor(message, provider, statusCode) {
        super(message, 'ADAPTER_ERROR', { provider, statusCode });
        this.provider = provider;
        this.statusCode = statusCode;
    }
}
exports.AdapterError = AdapterError;
class SchemaError extends ModelError {
    constructor(message, modelSlug) {
        super(message, 'SCHEMA_ERROR', { modelSlug });
        this.modelSlug = modelSlug;
    }
}
exports.SchemaError = SchemaError;
