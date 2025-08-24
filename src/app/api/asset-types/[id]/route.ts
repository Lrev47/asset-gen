import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const assetType = await prisma.assetType.update({
      where: { id },
      data: {
        displayName: body.displayName,
        category: body.category,
        description: body.description,
        specifications: body.specifications,
        modelPreferences: body.modelPreferences
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset type updated successfully',
      data: { assetType }
    });

  } catch (error) {
    console.error('Error updating asset type:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update asset type'
    }, { status: 500 });
  }
}