// Weaviate object operations endpoint
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { updateWeaviateObject, deleteWeaviateObject } from '@/lib/weaviate';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ className: string; id: string }> }
) {
  try {
    const { className, id } = await context.params;
    const body = await request.json();
    const { properties } = body;

    if (!properties) {
      return NextResponse.json(
        { error: 'Properties are required' },
        { status: 400 }
      );
    }

    await updateWeaviateObject(className, id, properties);
    
    return NextResponse.json({
      success: true,
      message: 'Object updated successfully',
    });
  } catch (error) {
    console.error('Error updating object:', error);
    return NextResponse.json(
      { error: 'Failed to update object' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ className: string; id: string }> }
) {
  try {
    const { className, id } = await context.params;

    await deleteWeaviateObject(className, id);
    
    return NextResponse.json({
      success: true,
      message: 'Object deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json(
      { error: 'Failed to delete object' },
      { status: 500 }
    );
  }
}

