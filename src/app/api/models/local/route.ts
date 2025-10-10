// API route to fetch locally installed LLM models
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    let models: any[] = [];

    try {
      // Try Ollama first (most common)
      if (endpoint.includes('ollama') || endpoint.includes('11434')) {
        const ollamaResponse = await fetch(`${endpoint.replace('/api/generate', '')}/api/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          models = data.models?.map((model: any) => ({
            id: model.name,
            name: model.name,
            description: model.details?.family || 'Local model',
            context_length: model.details?.parameter_size,
            size: model.size,
            modified_at: model.modified_at,
          })) || [];
        }
      }
      // Try LM Studio
      else if (endpoint.includes('lm-studio') || endpoint.includes('1234')) {
        const lmStudioResponse = await fetch(`${endpoint.replace('/v1/chat/completions', '')}/v1/models`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (lmStudioResponse.ok) {
          const data = await lmStudioResponse.json();
          models = data.data?.map((model: any) => ({
            id: model.id,
            name: model.id,
            description: model.object || 'LM Studio model',
            context_length: model.context_length,
          })) || [];
        }
      }
      // Try generic OpenAI-compatible endpoint
      else {
        const genericResponse = await fetch(`${endpoint.replace('/v1/chat/completions', '')}/v1/models`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (genericResponse.ok) {
          const data = await genericResponse.json();
          models = data.data?.map((model: any) => ({
            id: model.id,
            name: model.id,
            description: model.object || 'Local model',
            context_length: model.context_length,
          })) || [];
        }
      }

      return NextResponse.json({ models });
    } catch (fetchError) {
      console.error('Error fetching local models:', fetchError);
      
      // Return empty array if connection fails
      return NextResponse.json({ 
        models: [],
        error: 'Could not connect to local LLM service. Make sure your local LLM is running.',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in local models API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local models', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
