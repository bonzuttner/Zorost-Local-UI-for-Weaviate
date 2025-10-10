// Weaviate search endpoint
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { searchWeaviate } from '@/lib/weaviate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { className, query, limit } = body;

    if (!className || !query) {
      return NextResponse.json(
        { error: 'Class name and query are required' },
        { status: 400 }
      );
    }

    const result = await searchWeaviate(className, query, limit || 10);
    
    const data = result.data?.Get?.[className] || [];
    
    return NextResponse.json({
      results: data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', results: [] },
      { status: 500 }
    );
  }
}

