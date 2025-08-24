import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PromptManager } from '@/services/promptManager';

const prisma = new PrismaClient();

// GET - Get all prompts for a field
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;

    // Check if field exists
    const field = await prisma.projectField.findUnique({
      where: { id: fieldId },
      include: { assetType: true, project: true }
    });

    if (!field) {
      return NextResponse.json({
        success: false,
        error: 'Field not found'
      }, { status: 404 });
    }

    // Get prompts using PromptManager
    const promptManager = PromptManager.getInstance();
    const prompts = await promptManager.getFieldPrompts(fieldId);

    return NextResponse.json({
      success: true,
      message: 'Prompts retrieved successfully',
      data: { prompts }
    });

  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch prompts'
    }, { status: 500 });
  }
}

// POST - Create new prompt for field
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;
    const body = await request.json();

    // Check if field exists
    const field = await prisma.projectField.findUnique({
      where: { id: fieldId }
    });

    if (!field) {
      return NextResponse.json({
        success: false,
        error: 'Field not found'
      }, { status: 404 });
    }

    // Validate required fields
    const { name, content, modelId, tagIds = [], settings = {} } = body;
    
    if (!name || !content || !modelId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, content, modelId'
      }, { status: 400 });
    }

    // Create prompt using PromptManager
    const promptManager = PromptManager.getInstance();
    const promptData = {
      fieldId,
      name,
      content,
      negativePrompt: body.negativePrompt,
      modelId,
      tagIds,
      settings
    };

    const prompt = await promptManager.createPrompt(promptData);

    return NextResponse.json({
      success: true,
      message: 'Prompt created successfully',
      data: { prompt }
    });

  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to create prompt'
    }, { status: 500 });
  }
}