"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicateAdapter = void 0;
exports.createReplicateAdapter = createReplicateAdapter;
const replicate_1 = __importDefault(require("replicate"));
const types_1 = require("../types");
const SchemaManager_1 = require("../schemas/SchemaManager");
class ReplicateAdapter {
    constructor(config) {
        this.config = config;
        this.provider = 'replicate';
        if (!config.apiToken) {
            throw new types_1.AdapterError('Replicate API token is required', 'replicate');
        }
        this.replicate = new replicate_1.default({
            auth: config.apiToken,
            baseUrl: config.baseUrl || 'https://api.replicate.com/v1'
        });
        // Fix Next.js App Router caching issue - ensure fresh data on each poll
        this.replicate.fetch = (url, options) => {
            return fetch(url, { ...options, cache: 'no-store' });
        };
        this.schemaManager = new SchemaManager_1.SchemaManager();
    }
    // ==================== CORE METHODS ====================
    async run(model, input) {
        try {
            // Validate input first
            const validation = this.validateInput(model, input);
            if (!validation.valid) {
                throw new types_1.AdapterError(`Invalid input: ${validation.errors.map(e => e.message).join(', ')}`, 'replicate', 400);
            }
            // Transform input for Replicate API
            const transformedInput = this.schemaManager.transformInputForProvider(model.config?.inputSchema || {}, validation.sanitizedInput || input);
            // Create prediction
            const createOptions = {
                version: model.config?.version,
                input: transformedInput
            };
            if (model.config?.webhookEvents && process.env.REPLICATE_WEBHOOK_URL) {
                createOptions.webhook = {
                    url: process.env.REPLICATE_WEBHOOK_URL,
                    events: model.config.webhookEvents
                };
            }
            const prediction = await this.replicate.predictions.create(createOptions);
            return this.transformPredictionResult(prediction);
        }
        catch (error) {
            console.error(`Error running model ${model.slug}:`, error);
            if (error instanceof types_1.AdapterError) {
                throw error;
            }
            // Handle Replicate API errors
            if (error instanceof Error && 'response' in error) {
                const response = error.response;
                throw new types_1.AdapterError(`Replicate API error: ${error.message}`, 'replicate', response?.status);
            }
            throw new types_1.AdapterError(`Failed to run prediction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    async getStatus(predictionId) {
        try {
            const prediction = await this.replicate.predictions.get(predictionId);
            console.log(`Prediction ${predictionId} status:`, {
                status: prediction.status,
                hasOutput: !!prediction.output,
                hasError: !!prediction.error,
                timestamps: {
                    created: prediction.created_at,
                    started: prediction.started_at,
                    completed: prediction.completed_at
                }
            });
            return this.transformPredictionResult(prediction);
        }
        catch (error) {
            console.error(`Error getting prediction status ${predictionId}:`, error);
            throw new types_1.AdapterError(`Failed to get prediction status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    async waitForCompletion(predictionId, options) {
        try {
            console.log(`Starting wait for completion: ${predictionId}`);
            // Get the initial prediction object
            let prediction = await this.replicate.predictions.get(predictionId);
            // Use Replicate's built-in wait method with configurable interval
            prediction = await this.replicate.wait(prediction, {
                interval: options?.interval || 1500 // Default 1.5 seconds
            });
            console.log(`Prediction ${predictionId} completed with status:`, prediction.status);
            return this.transformPredictionResult(prediction);
        }
        catch (error) {
            console.error(`Error waiting for prediction completion ${predictionId}:`, error);
            throw new types_1.AdapterError(`Failed to wait for prediction completion: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    async cancel(predictionId) {
        try {
            await this.replicate.predictions.cancel(predictionId);
            return true;
        }
        catch (error) {
            console.error(`Error canceling prediction ${predictionId}:`, error);
            return false;
        }
    }
    // ==================== SCHEMA METHODS ====================
    async fetchSchema(modelId, version) {
        return this.schemaManager.fetchSchema(modelId, version);
    }
    validateInput(model, input) {
        return this.schemaManager.validateInput(model.config?.inputSchema || {}, input);
    }
    // ==================== STREAMING SUPPORT ====================
    async *createStream(predictionId) {
        try {
            const prediction = await this.replicate.predictions.get(predictionId);
            if (!prediction.urls?.stream) {
                throw new types_1.AdapterError('No stream URL available for this prediction', 'replicate');
            }
            // Create EventSource for server-sent events
            const streamUrl = prediction.urls.stream;
            // Note: In a Node.js environment, we'd need to use a different SSE client
            // This is a simplified version that would work in browser environments
            let eventSource;
            if (typeof window !== 'undefined') {
                // Browser environment
                eventSource = new EventSource(streamUrl);
            }
            else {
                // Node.js environment - would need additional SSE client library
                throw new types_1.AdapterError('Streaming not supported in server environment', 'replicate');
            }
            try {
                while (true) {
                    await new Promise((resolve, reject) => {
                        eventSource.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                resolve({
                                    event: 'data',
                                    data: data,
                                    id: event.lastEventId
                                });
                            }
                            catch (error) {
                                reject(new Error('Failed to parse stream data'));
                            }
                        };
                        eventSource.onerror = (error) => {
                            reject(new types_1.AdapterError('Stream error', 'replicate'));
                        };
                        eventSource.onopen = () => {
                            console.log('Stream opened');
                        };
                    });
                }
            }
            finally {
                eventSource?.close();
            }
        }
        catch (error) {
            console.error(`Error creating stream for prediction ${predictionId}:`, error);
            throw new types_1.AdapterError(`Failed to create stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    // ==================== BATCH OPERATIONS ====================
    async runBatch(model, inputs) {
        try {
            // Validate all inputs first
            const validatedInputs = [];
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                if (!input)
                    continue;
                const validation = this.validateInput(model, input);
                if (!validation.valid) {
                    throw new types_1.AdapterError(`Invalid input at index ${i}: ${validation.errors.map(e => e.message).join(', ')}`, 'replicate', 400);
                }
                validatedInputs.push(validation.sanitizedInput || input);
            }
            // Create all predictions concurrently
            const predictions = await Promise.all(validatedInputs.map(input => this.run(model, input)));
            return predictions;
        }
        catch (error) {
            console.error('Error running batch predictions:', error);
            if (error instanceof types_1.AdapterError) {
                throw error;
            }
            throw new types_1.AdapterError(`Batch prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    // ==================== WEBHOOK HANDLING ====================
    validateWebhook(signature, body) {
        try {
            const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;
            if (!webhookSecret) {
                console.warn('REPLICATE_WEBHOOK_SECRET not configured, skipping webhook validation');
                return true; // Allow if secret not configured (development mode)
            }
            // Replicate uses HMAC-SHA256 for webhook signatures
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('hex');
            const receivedSignature = signature.replace('sha256=', '');
            return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(receivedSignature, 'hex'));
        }
        catch (error) {
            console.error('Error validating webhook:', error);
            return false;
        }
    }
    // ==================== UTILITY METHODS ====================
    transformPredictionResult(prediction) {
        const result = {
            id: prediction.id,
            status: prediction.status,
            input: prediction.input,
            output: prediction.output,
            error: prediction.error,
            logs: prediction.logs,
            created_at: prediction.created_at,
            started_at: prediction.started_at,
            completed_at: prediction.completed_at
        };
        if (prediction.metrics) {
            result.metrics = {
                predict_time: prediction.metrics.predict_time,
                total_time: prediction.metrics.total_time
            };
        }
        if (prediction.urls) {
            result.urls = {
                stream: prediction.urls.stream,
                get: prediction.urls.get,
                cancel: prediction.urls.cancel
            };
        }
        return result;
    }
    // ==================== MODEL DISCOVERY ====================
    async discoverModels(owner) {
        try {
            let url = '/models';
            if (owner) {
                url += `?owner=${owner}`;
            }
            const response = await fetch(`${this.replicate.baseUrl}${url}`, {
                headers: {
                    'Authorization': `Token ${this.config.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.results || [];
        }
        catch (error) {
            console.error('Error discovering models:', error);
            throw new types_1.AdapterError(`Failed to discover models: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    async getModelInfo(modelId) {
        try {
            const response = await fetch(`${this.replicate.baseUrl}/models/${modelId}`, {
                headers: {
                    'Authorization': `Token ${this.config.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch model info: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`Error getting model info for ${modelId}:`, error);
            throw new types_1.AdapterError(`Failed to get model info: ${error instanceof Error ? error.message : 'Unknown error'}`, 'replicate');
        }
    }
    // ==================== COST ESTIMATION ====================
    async estimateCost(model, input) {
        try {
            // For Replicate, cost is usually per prediction or per unit (token, second, etc.)
            let baseCost = model.costPerUse || 0;
            // Adjust cost based on input parameters
            if (model.type === 'text' && input.max_tokens) {
                // Text models often charge per token
                const tokensRequested = input.max_tokens;
                const costPerToken = baseCost / 1000; // Assuming baseCost is per 1K tokens
                baseCost = (tokensRequested / 1000) * costPerToken;
            }
            else if (model.type === 'image' && input.num_outputs) {
                // Image models charge per image
                const numImages = input.num_outputs;
                baseCost = baseCost * numImages;
            }
            else if (model.type === 'video' && input.num_frames) {
                // Video models might charge based on frames/duration
                const numFrames = input.num_frames;
                const baseFrames = 24; // Assume base cost is for 24 frames
                baseCost = baseCost * (numFrames / baseFrames);
            }
            return Math.round(baseCost * 100000) / 100000; // Round to 5 decimal places
        }
        catch (error) {
            console.error('Error estimating cost:', error);
            return model.costPerUse || 0;
        }
    }
    // ==================== HEALTH CHECK ====================
    async healthCheck() {
        try {
            // Simple health check by listing models
            const response = await fetch(`${this.replicate.baseUrl}/models?page_size=1`, {
                headers: {
                    'Authorization': `Token ${this.config.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        }
        catch (error) {
            console.error('Replicate adapter health check failed:', error);
            return false;
        }
    }
}
exports.ReplicateAdapter = ReplicateAdapter;
// Factory function to create adapter with environment variables
function createReplicateAdapter(overrides = {}) {
    const config = {
        apiToken: process.env.REPLICATE_API_TOKEN || ''
    };
    if (process.env.REPLICATE_BASE_URL) {
        config.baseUrl = process.env.REPLICATE_BASE_URL;
    }
    if (process.env.REPLICATE_TIMEOUT) {
        config.timeout = parseInt(process.env.REPLICATE_TIMEOUT);
    }
    if (process.env.REPLICATE_RETRIES) {
        config.retries = parseInt(process.env.REPLICATE_RETRIES);
    }
    return new ReplicateAdapter({ ...config, ...overrides });
}
