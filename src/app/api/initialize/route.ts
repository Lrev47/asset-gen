import { NextRequest, NextResponse } from 'next/server';
import ServiceInitializer from '@/services/initialization';

// POST - Initialize all system services
export async function POST(_request: NextRequest) {
  try {
    await ServiceInitializer.initialize();
    
    return NextResponse.json({
      success: true,
      message: 'System services initialized successfully'
    });

  } catch (error) {
    console.error('Initialization error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to initialize system services'
    }, { status: 500 });
  }
}

// GET - Check initialization status
export async function GET(_request: NextRequest) {
  try {
    const isInitialized = ServiceInitializer.isInitialized();
    
    return NextResponse.json({
      success: true,
      data: {
        initialized: isInitialized
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}