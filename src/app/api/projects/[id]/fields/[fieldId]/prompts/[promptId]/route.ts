import { NextRequest, NextResponse } from 'next/server';
import { PromptManager } from '@/services/promptManager';

// GET - Get specific prompt details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    const promptManager = PromptManager.getInstance();
    const prompt = await promptManager.getPrompt(promptId);

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt retrieved successfully',
      data: { prompt }
    });

  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch prompt'
    }, { status: 500 });
  }
}

// PUT - Update prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const body = await request.json();

    const promptManager = PromptManager.getInstance();
    
    // Check if prompt exists
    const existingPrompt = await promptManager.getPrompt(promptId);
    if (!existingPrompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    // Update prompt
    const updates = {
      name: body.name,
      content: body.content,
      negativePrompt: body.negativePrompt,
      modelId: body.modelId,
      tagIds: body.tagIds,
      settings: body.settings
    };

    const prompt = await promptManager.updatePrompt(promptId, updates);

    return NextResponse.json({
      success: true,
      message: 'Prompt updated successfully',
      data: { prompt }
    });

  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update prompt'
    }, { status: 500 });
  }
}

// DELETE - Delete prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string; promptId: string }> }
) {
  try {
    const { promptId } = await params;

    const promptManager = PromptManager.getInstance();
    
    // Check if prompt exists
    const existingPrompt = await promptManager.getPrompt(promptId);
    if (!existingPrompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    await promptManager.deletePrompt(promptId);

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to delete prompt'
    }, { status: 500 });
  }
}