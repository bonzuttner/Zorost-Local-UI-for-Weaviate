// Weaviate class operations endpoint
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { deleteWeaviateClass, getWeaviateSchema } from '@/lib/weaviate';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await context.params;
    const body = await request.json();
    const { description } = body;

    // Get the current schema to find the class
    const schema = await getWeaviateSchema();
    const classDef = schema.classes?.find((cls: any) => cls.class === className);

    if (!classDef) {
      return NextResponse.json(
        { error: `Class ${className} not found` },
        { status: 404 }
      );
    }

    // Note: Weaviate doesn't support updating class descriptions directly
    // This is a limitation of Weaviate - class metadata cannot be modified after creation
    // We'll return a message explaining this limitation
    
    return NextResponse.json({
      success: true,
      message: `Class ${className} description update requested. Note: Weaviate doesn't support updating class metadata after creation.`,
      warning: 'Class descriptions cannot be modified after creation in Weaviate'
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await context.params;

    await deleteWeaviateClass(className);
    
    return NextResponse.json({
      success: true,
      message: `Class ${className} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}

