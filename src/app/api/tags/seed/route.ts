import { NextRequest, NextResponse } from 'next/server';
import TagLibrary from '@/services/tagLibrary';
import { PrismaClient } from '@prisma/client';

const tagLibrary = TagLibrary.getInstance();
const prisma = new PrismaClient();

export async function POST(_request: NextRequest) {
  try {
    await tagLibrary.seedTagLibrary();
    const tags = await prisma.tag.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${tags.length} default tags`,
      data: { tags }
    });

  } catch (error) {
    console.error('Error seeding tags:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to seed default tags'
    }, { status: 500 });
  }
}