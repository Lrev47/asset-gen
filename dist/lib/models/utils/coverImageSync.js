'use server';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncModelCoverImages = syncModelCoverImages;
exports.syncSingleModelCoverImage = syncSingleModelCoverImage;
exports.getModelCoverImage = getModelCoverImage;
const ReplicateAdapter_1 = require("../adapters/ReplicateAdapter");
const prisma_1 = __importDefault(require("@/lib/db/prisma"));
/**
 * Sync cover image URLs for AiModels from Replicate API
 */
async function syncModelCoverImages(modelSlugs) {
    const errors = [];
    let updated = 0;
    try {
        // Get models to sync
        const where = modelSlugs ? { slug: { in: modelSlugs } } : { provider: 'replicate' };
        const models = await prisma_1.default.aiModel.findMany({
            where,
            select: { id: true, slug: true, coverImageUrl: true }
        });
        if (models.length === 0) {
            return { success: true, updated: 0, errors: [] };
        }
        // Create Replicate adapter
        const adapter = (0, ReplicateAdapter_1.createReplicateAdapter)();
        // Update cover images for each model
        for (const model of models) {
            try {
                // Skip if we already have a cover image (unless forcing refresh)
                if (model.coverImageUrl && !modelSlugs) {
                    continue;
                }
                // Fetch model data from Replicate
                const replicateModel = await adapter.getModelInfo(model.slug);
                if (replicateModel.cover_image_url && replicateModel.cover_image_url !== model.coverImageUrl) {
                    // Update the AiModel with cover image URL
                    await prisma_1.default.aiModel.update({
                        where: { id: model.id },
                        data: { coverImageUrl: replicateModel.cover_image_url }
                    });
                    // Also update all UserModels that reference this model
                    await prisma_1.default.userModel.updateMany({
                        where: { modelSlug: model.slug },
                        data: { coverImageUrl: replicateModel.cover_image_url }
                    });
                    updated++;
                    console.log(`Updated cover image for model: ${model.slug}`);
                }
            }
            catch (error) {
                const errorMsg = `Failed to sync ${model.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                console.error(errorMsg);
            }
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return { success: true, updated, errors };
    }
    catch (error) {
        const errorMsg = `Sync operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        return { success: false, updated, errors };
    }
}
/**
 * Sync cover image for a single model
 */
async function syncSingleModelCoverImage(modelSlug) {
    try {
        const result = await syncModelCoverImages([modelSlug]);
        const returnValue = {
            success: result.success,
            updated: result.updated > 0
        };
        if (result.errors[0]) {
            returnValue.error = result.errors[0];
        }
        return returnValue;
    }
    catch (error) {
        const returnValue = {
            success: false,
            updated: false
        };
        returnValue.error = error instanceof Error ? error.message : 'Unknown error';
        return returnValue;
    }
}
/**
 * Get cover image URL for a model, fetching from Replicate if not cached
 */
async function getModelCoverImage(modelSlug) {
    try {
        // First check if we have it cached
        const model = await prisma_1.default.aiModel.findUnique({
            where: { slug: modelSlug },
            select: { coverImageUrl: true }
        });
        if (model?.coverImageUrl) {
            return model.coverImageUrl;
        }
        // If not cached, fetch from Replicate and cache it
        const syncResult = await syncSingleModelCoverImage(modelSlug);
        if (syncResult.success && syncResult.updated) {
            // Fetch the updated model
            const updatedModel = await prisma_1.default.aiModel.findUnique({
                where: { slug: modelSlug },
                select: { coverImageUrl: true }
            });
            return updatedModel?.coverImageUrl || null;
        }
        return null;
    }
    catch (error) {
        console.error(`Error getting cover image for ${modelSlug}:`, error);
        return null;
    }
}
