// API endpoint to fetch available models from different LLM providers
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    let models: Array<{ id: string; name: string; description?: string; context_length?: number }> = [];

    switch (provider) {
      case 'openrouter':
        try {
          const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://github.com/zorost/Zorost-Local-UI-for-Weaviate',
              'X-Title': 'Weaviate Local App by Zorost Intelligence',
            },
          });

          if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
          }

          const data = await response.json();
          models = data.data?.map((model: any) => ({
            id: model.id,
            name: model.name || model.id,
            description: model.description,
            context_length: model.context_length,
            pricing: model.pricing,
          })) || [];
        } catch (error) {
          console.error('OpenRouter fetch error:', error);
          return NextResponse.json(
            { error: 'Failed to fetch OpenRouter models' },
            { status: 500 }
          );
        }
        break;

      case 'openai':
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const data = await response.json();
          
          // Filter for GPT models and sort by name
          models = data.data
            ?.filter((model: any) => 
              model.id.includes('gpt') || 
              model.id.includes('text-embedding') ||
              model.id.includes('davinci') ||
              model.id.includes('turbo')
            )
            .map((model: any) => ({
              id: model.id,
              name: model.id,
              description: `Created: ${new Date(model.created * 1000).toLocaleDateString()}`,
              owned_by: model.owned_by,
            }))
            .sort((a: any, b: any) => b.id.localeCompare(a.id)) || [];
        } catch (error) {
          console.error('OpenAI fetch error:', error);
          return NextResponse.json(
            { error: 'Failed to fetch OpenAI models' },
            { status: 500 }
          );
        }
        break;

      case 'cohere':
        // Cohere has predefined models
        models = [
          { id: 'command', name: 'Command', description: 'Flagship text generation model' },
          { id: 'command-light', name: 'Command Light', description: 'Faster, lighter version of Command' },
          { id: 'command-r', name: 'Command R', description: 'Retrieval-optimized model' },
          { id: 'command-r-plus', name: 'Command R+', description: 'Enhanced retrieval model' },
          { id: 'command-nightly', name: 'Command Nightly', description: 'Latest experimental features' },
        ];
        break;

      case 'huggingface':
        // Popular HuggingFace models - predefined list
        models = [
          { id: 'meta-llama/Llama-2-70b-chat-hf', name: 'Llama 2 70B Chat', description: 'Meta\'s Llama 2 70B chat model' },
          { id: 'meta-llama/Llama-2-13b-chat-hf', name: 'Llama 2 13B Chat', description: 'Meta\'s Llama 2 13B chat model' },
          { id: 'meta-llama/Llama-2-7b-chat-hf', name: 'Llama 2 7B Chat', description: 'Meta\'s Llama 2 7B chat model' },
          { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B Instruct', description: 'Mistral 7B instruction model' },
          { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'Mixture of Experts model' },
          { id: 'google/flan-t5-xxl', name: 'FLAN-T5 XXL', description: 'Google\'s FLAN-T5 XXL model' },
          { id: 'bigscience/bloom', name: 'BLOOM', description: 'BigScience multilingual model' },
        ];
        break;

      case 'localLLM':
        // Local LLM models - Ollama common models
        models = [
          { id: 'llama2', name: 'Llama 2', description: 'Meta\'s Llama 2 model' },
          { id: 'llama2:13b', name: 'Llama 2 13B', description: 'Llama 2 13B parameter model' },
          { id: 'llama2:70b', name: 'Llama 2 70B', description: 'Llama 2 70B parameter model' },
          { id: 'mistral', name: 'Mistral', description: 'Mistral 7B model' },
          { id: 'mixtral', name: 'Mixtral', description: 'Mixtral 8x7B model' },
          { id: 'codellama', name: 'Code Llama', description: 'Code-specialized Llama model' },
          { id: 'phi', name: 'Phi', description: 'Microsoft Phi model' },
          { id: 'neural-chat', name: 'Neural Chat', description: 'Intel Neural Chat model' },
          { id: 'starling-lm', name: 'Starling LM', description: 'Starling language model' },
          { id: 'orca-mini', name: 'Orca Mini', description: 'Lightweight Orca model' },
        ];
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      provider,
      models,
      count: models.length,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

