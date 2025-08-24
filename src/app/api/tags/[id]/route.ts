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

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        displayName: body.displayName,
        category: body.category,
        subcategory: body.subcategory,
        description: body.description,
        weight: body.weight
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tag updated successfully',
      data: { tag }
    });

  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update tag'
    }, { status: 500 });
  }
}