// Chat API endpoint for RAG queries
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { generativeSearch } from '@/lib/weaviate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, className, limit, prompt } = body;

    if (!query || !className) {
      return NextResponse.json(
        { error: 'Query and class name are required' },
        { status: 400 }
      );
    }

    const defaultPrompt = prompt || `Answer the following question based on the provided context: ${query}`;
    
    const result = await generativeSearch(
      className,
      query,
      defaultPrompt,
      limit || 5
    );
    
    const data = result.data?.Get?.[className] || [];
    const answer = data[0]?._additional?.generate?.singleResult || 'No answer generated';
    
    return NextResponse.json({
      answer,
      sources: data,
      metadata: {
        model: 'generative-openai',
        responseTime: 0,
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

