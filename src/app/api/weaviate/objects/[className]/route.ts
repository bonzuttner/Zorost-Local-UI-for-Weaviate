// Weaviate objects endpoint
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getWeaviateObjects, createWeaviateObject } from '@/lib/weaviate';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getWeaviateObjects(className, limit, offset);
    
    const objects = result.objects || [];
    const totalItems = result.totalResults || objects.length;
    const pageSize = limit;
    const currentPage = Math.floor(offset / pageSize) + 1;
    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      objects,
      pagination: {
        currentPage,
        totalPages,
        pageSize,
        totalItems,
      },
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch objects', objects: [] },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await context.params;
    const body = await request.json();
    const { properties, id } = body;

    if (!properties) {
      return NextResponse.json(
        { error: 'Properties are required' },
        { status: 400 }
      );
    }

    const result = await createWeaviateObject(className, properties, id);
    
    return NextResponse.json({
      success: true,
      id: result,
    });
  } catch (error) {
    console.error('Error creating object:', error);
    return NextResponse.json(
      { error: 'Failed to create object' },
      { status: 500 }
    );
  }
}

