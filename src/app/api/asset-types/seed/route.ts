import { NextRequest, NextResponse } from 'next/server';
import AssetTypeManager from '@/services/assetTypeManager';

const assetTypeManager = AssetTypeManager.getInstance();

export async function POST(_request: NextRequest) {
  try {
    await assetTypeManager.seedDefaultAssetTypes();
    const assetTypes = await assetTypeManager.getAllAssetTypes();
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${assetTypes.length} default asset types`,
      data: { assetTypes }
    });

  } catch (error) {
    console.error('Error seeding asset types:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to seed default asset types'
    }, { status: 500 });
  }
}