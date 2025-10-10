// Enhanced Chat API endpoint for RAG queries with multiple LLM support
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { hybridSearchWeaviate, comprehensiveSearchWeaviate } from '@/lib/weaviate';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, className, limit = 5, apiKeys, llmProvider = 'openai', selectedModel } = body;

    if (!query || !className) {
      return NextResponse.json(
        { error: 'Query and class name are required' },
        { status: 400 }
      );
    }

    // Search the vector database using comprehensive search
    console.log(`Searching vector database for query: "${query}" in class: "${className}"`);
    
    let searchResult;
    try {
      // Try comprehensive search first (vector + keyword)
      searchResult = await comprehensiveSearchWeaviate(className, query, limit);
    } catch (error) {
      console.log('Comprehensive search failed, falling back to hybrid search:', error);
      // Fallback to hybrid search if comprehensive search fails
      searchResult = await hybridSearchWeaviate(className, query, limit, 0.7);
    }
    
    const searchData = searchResult.data?.Get?.[className] || [];
    console.log(`Found ${searchData.length} results from vector database`);

    if (searchData.length === 0) {
      return NextResponse.json({
        answer: `I couldn't find any relevant information in the "${className}" collection that matches your query "${query}". The vector database might not contain data related to this topic, or you might want to try rephrasing your question.`,
        sources: [],
        metadata: {
          model: 'none',
          responseTime: 0,
          searchResults: 0,
        },
      });
    }

    // Prepare comprehensive context from search results
    const context = searchData.map((item: Record<string, unknown>, index: number) => {
      const properties = item as Record<string, unknown>;
      const additional = properties._additional as any;
      
      // Extract all non-metadata properties
      const relevantProps = Object.entries(properties)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => {
          // Format the value nicely
          if (typeof value === 'string' && value.length > 200) {
            return `${key}: ${value.substring(0, 200)}...`;
          }
          return `${key}: ${JSON.stringify(value)}`;
        })
        .join('\n');
      
      const searchInfo = additional ? 
        ` (Search Score: ${additional.score?.toFixed(3) || 'N/A'}, Type: ${additional.searchType || 'hybrid'})` : '';
      
      return `--- Source ${index + 1}${searchInfo} ---\n${relevantProps}`;
    }).join('\n\n');

    console.log(`Prepared context with ${searchData.length} sources, total length: ${context.length} characters`);

    // Generate response based on LLM provider
    let answer = '';
    let model = 'unknown';

    try {
      // OpenRouter - Unified API for 500+ models
      if (llmProvider === 'openrouter' && apiKeys?.openrouter) {
        const openrouter = new OpenAI({
          apiKey: apiKeys.openrouter,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://github.com/zorost/Zorost-Local-UI-for-Weaviate',
            'X-Title': 'Weaviate Local App by Zorost Intelligence',
          },
        });

        const completion = await openrouter.chat.completions.create({
          model: selectedModel || 'anthropic/claude-3.7-sonnet', // Use selected model or default
          messages: [
            {
              role: 'system',
              content: `You are an expert AI assistant specialized in analyzing vector database content. Your role is to:

1. ANALYZE the provided vector database context thoroughly
2. EXTRACT relevant information that directly relates to the user's question
3. SYNTHESIZE insights from multiple sources when available
4. PROVIDE accurate, well-structured answers based on the retrieved data
5. CITE specific sources when making claims
6. IDENTIFY gaps in the data and suggest what additional information might be helpful

Guidelines:
- Base your answer primarily on the provided context
- If the context contains conflicting information, acknowledge this
- If the context is insufficient, clearly explain what's missing
- Use the search scores to prioritize more relevant information
- Be specific and factual rather than generic`
            },
            {
              role: 'user',
              content: `Vector Database Context from "${className}" collection:\n\n${context}\n\nUser Question: ${query}\n\nPlease analyze the provided context and answer the question comprehensively. Reference specific sources and search scores when relevant. If you need additional information to fully answer the question, please specify what's missing.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        answer = completion.choices[0]?.message?.content || 'No response generated';
        model = `${selectedModel || 'claude-3.7-sonnet'} (via OpenRouter)`;
      } 
      // OpenAI Direct
      else if (llmProvider === 'openai' && apiKeys?.openai) {
        const openai = new OpenAI({
          apiKey: apiKeys.openai,
        });

        const completion = await openai.chat.completions.create({
          model: selectedModel || 'gpt-4-turbo-preview', // Use selected model or default
          messages: [
            {
              role: 'system',
              content: `You are an expert AI assistant specialized in analyzing vector database content. Your role is to:

1. ANALYZE the provided vector database context thoroughly
2. EXTRACT relevant information that directly relates to the user's question
3. SYNTHESIZE insights from multiple sources when available
4. PROVIDE accurate, well-structured answers based on the retrieved data
5. CITE specific sources when making claims
6. IDENTIFY gaps in the data and suggest what additional information might be helpful

Guidelines:
- Base your answer primarily on the provided context
- If the context contains conflicting information, acknowledge this
- If the context is insufficient, clearly explain what's missing
- Use the search scores to prioritize more relevant information
- Be specific and factual rather than generic`
            },
            {
              role: 'user',
              content: `Vector Database Context from "${className}" collection:\n\n${context}\n\nUser Question: ${query}\n\nPlease analyze the provided context and answer the question comprehensively. Reference specific sources and search scores when relevant. If you need additional information to fully answer the question, please specify what's missing.`
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        });

        answer = completion.choices[0]?.message?.content || 'No response generated';
        model = 'gpt-4-turbo-preview';
      } 
      // Local LLM (Ollama, LM Studio, etc.)
      else if (llmProvider === 'local' && apiKeys?.localLLM) {
        // For local LLM integration (Ollama, etc.)
        const localModel = selectedModel || 'llama2';
        const response = await fetch(apiKeys.localLLM, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: localModel,
            prompt: `You are an expert AI assistant specialized in analyzing vector database content. Your role is to:

1. ANALYZE the provided vector database context thoroughly
2. EXTRACT relevant information that directly relates to the user's question
3. SYNTHESIZE insights from multiple sources when available
4. PROVIDE accurate, well-structured answers based on the retrieved data
5. CITE specific sources when making claims
6. IDENTIFY gaps in the data and suggest what additional information might be helpful

Guidelines:
- Base your answer primarily on the provided context
- If the context contains conflicting information, acknowledge this
- If the context is insufficient, clearly explain what's missing
- Use the search scores to prioritize more relevant information
- Be specific and factual rather than generic

Vector Database Context from "${className}" collection:

${context}

User Question: ${query}

Please analyze the provided context and answer the question comprehensively. Reference specific sources and search scores when relevant. If you need additional information to fully answer the question, please specify what's missing.

Answer:`,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Local LLM request failed: ${response.status} ${response.statusText}`);
        }

        const localData = await response.json();
        answer = localData.response || localData.message || 'No response from local LLM';
        model = `local-${localModel}`;
      } else {
        // Fallback: enhanced context-based response
        answer = `I found ${searchData.length} relevant results in the "${className}" collection that relate to your question "${query}". Here's a summary of the retrieved information:\n\n${context.substring(0, 800)}${context.length > 800 ? '...' : ''}\n\nNote: This is a direct summary of the vector database content. To get more sophisticated analysis and insights, please configure an LLM provider (OpenAI, OpenRouter, or Local LLM) in the settings.`;
        model = 'context-only';
      }
    } catch (llmError) {
      console.error('LLM Error:', llmError);
      console.error('LLM Provider:', llmProvider);
      console.error('API Keys available:', Object.keys(apiKeys || {}));
      console.error('Selected Model:', selectedModel);
      
      // More specific error messages
      if (llmProvider === 'local') {
        answer = `Local LLM Error: ${(llmError as Error).message || 'Unable to connect to local LLM service. Please check if your local LLM (Ollama, LM Studio, etc.) is running and the endpoint is correct.'}`;
      } else {
        answer = `LLM Error: ${(llmError as Error).message || 'Unable to generate response due to an error with the language model.'} Here's the relevant data I found:\n\n${context.substring(0, 500)}${context.length > 500 ? '...' : ''}`;
      }
      model = 'error';
    }

    // Prepare enhanced sources with better information
    const enhancedSources = searchData.map((item: any, index: number) => ({
      id: item._additional?.id || `source-${index}`,
      score: item._additional?.score || 0,
      searchType: item._additional?.searchType || 'hybrid',
      combinedScore: item._additional?.combinedScore || item._additional?.score || 0,
      content: Object.entries(item)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, value]) => `${key}: ${typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : JSON.stringify(value)}`)
        .join(', ')
    }));

    return NextResponse.json({
      answer,
      sources: enhancedSources,
      metadata: {
        model,
        provider: llmProvider,
        responseTime: Date.now(),
        totalSources: searchData.length,
        contextLength: context.length,
        searchMethod: searchData.length > 0 ? searchData[0]._additional?.searchType || 'hybrid' : 'none',
        className,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      },
    });
  } catch (error) {
    console.error('Enhanced Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
