import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PromptManager, PromptGenerationOptions } from '@/services/promptManager';

const prisma = new PrismaClient();

// POST - Generate AI prompt suggestions for field
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { fieldId } = await params;
    const body = await request.json();

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

    // Extract options from request body
    const options: PromptGenerationOptions = {
      style: body.style || 'professional',
      mood: body.mood || 'bright',
      complexity: body.complexity || 'detailed',
      includeNegativePrompt: body.includeNegativePrompt ?? true,
      autoSelectTags: body.autoSelectTags ?? true
    };

    // Generate prompt using PromptManager
    const promptManager = PromptManager.getInstance();
    const generatedPrompt = await promptManager.generatePrompt(fieldId, options);

    return NextResponse.json({
      success: true,
      message: 'Prompt generated successfully',
      data: { 
        generatedPrompt,
        fieldName: field.name,
        assetType: field.assetType.displayName
      }
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to generate prompt'
    }, { status: 500 });
  }
}