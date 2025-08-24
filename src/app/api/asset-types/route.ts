import { NextRequest, NextResponse } from 'next/server';
import AssetTypeManager from '@/services/assetTypeManager';

const assetTypeManager = AssetTypeManager.getInstance();

export async function GET(_request: NextRequest) {
  try {
    const assetTypes = await assetTypeManager.getAllAssetTypes();
    
    return NextResponse.json({
      success: true,
      message: `Found ${assetTypes.length} asset types`,
      data: { assetTypes }
    });

  } catch (error) {
    console.error('Error fetching asset types:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch asset types'
    }, { status: 500 });
  }
}