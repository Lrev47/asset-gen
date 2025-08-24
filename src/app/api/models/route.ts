import { NextRequest, NextResponse } from 'next/server';
import ModelManager from '@/services/modelManager';
import { PrismaClient } from '@prisma/client';

const modelManager = ModelManager.getInstance();
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let models;
    if (category) {
      models = await modelManager.getModelsByCategory(category);
    } else if (search) {
      models = await modelManager.searchModels(search);
    } else {
      models = await modelManager.getAllModels();
    }
    
    return NextResponse.json({
      success: true,
      message: `Found ${models.length} AI models`,
      data: { models }
    });

  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch models'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.displayName || !body.modelId || !body.provider) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, displayName, modelId, and provider are required'
      }, { status: 400 });
    }

    // Check if model with same name already exists
    const existingModel = await prisma.aIModel.findFirst({
      where: { name: body.name }
    });

    if (existingModel) {
      return NextResponse.json({
        success: false,
        error: 'A model with this name already exists'
      }, { status: 409 });
    }

    const model = await prisma.aIModel.create({
      data: {
        name: body.name,
        displayName: body.displayName,
        provider: body.provider,
        modelId: body.modelId,
        category: body.category || 'text-to-image',
        subcategory: body.subcategory || null,
        tags: body.tags || null,
        replicateUrl: body.replicateUrl || null,
        documentationUrl: body.documentationUrl || null,
        capabilities: body.capabilities || {},
        costPerImage: body.costPerImage || 0.01,
        speedRating: body.speedRating || 3,
        qualityRating: body.qualityRating || 3,
        maxDimensions: body.maxDimensions || {
          min: { width: 512, height: 512 },
          max: { width: 1024, height: 1024 },
          recommended: [{ width: 1024, height: 1024 }],
          aspectRatios: ['1:1']
        },
        supportedFormats: body.supportedFormats || '["png", "jpg"]',
        defaultSettings: body.defaultSettings || {},
        configurationSchema: body.configurationSchema || null,
        examples: body.examples || null,
        usageCount: 0,
        totalCost: 0,
        avgGenerationTime: null,
        isActive: true,
        isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
        isFeatured: body.isFeatured || false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Model created successfully',
      data: { model }
    });

  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to create model'
    }, { status: 500 });
  }
}