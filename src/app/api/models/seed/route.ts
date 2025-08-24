import { NextRequest, NextResponse } from 'next/server';
import ModelManager from '@/services/modelManager';

const modelManager = ModelManager.getInstance();

export async function POST(_request: NextRequest) {
  try {
    await modelManager.seedDefaultModels();
    const models = await modelManager.getAllModels();
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${models.length} default AI models`,
      data: { models }
    });

  } catch (error) {
    console.error('Error seeding models:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to seed default models'
    }, { status: 500 });
  }
}