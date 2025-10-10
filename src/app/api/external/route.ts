// External API endpoint for OpenRoot platform integration
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getWeaviateSchema, searchWeaviate } from '@/lib/weaviate';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    switch (endpoint) {
      case 'schema':
        const schema = await getWeaviateSchema();
        return NextResponse.json({
          success: true,
          data: schema,
          timestamp: new Date().toISOString(),
        });

      case 'stats':
        const allClasses = await getWeaviateSchema();
        const stats = {
          totalClasses: allClasses.classes?.length || 0,
          classes: allClasses.classes?.map((cls: Record<string, unknown>) => ({
            name: cls.class,
            description: cls.description,
            vectorizer: cls.vectorizer,
            properties: cls.properties?.length || 0,
          })) || [],
        };
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Weaviate Local App External API',
          endpoints: [
            'GET /api/external?endpoint=schema - Get database schema',
            'GET /api/external?endpoint=stats - Get database statistics',
            'POST /api/external/search - Search vector database',
            'POST /api/external/chat - Chat with AI assistant',
          ],
          version: '1.0.0',
          developedBy: 'Zorost Intelligence',
          website: 'https://zorost.com',
        });
    }
  } catch (error) {
    console.error('External API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, className, query, limit = 10, apiKey } = body;

    // Basic API key validation (you can enhance this)
    if (!apiKey || apiKey !== 'zorost-api-key-2025') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid API key',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    switch (action) {
      case 'search':
        if (!className || !query) {
          return NextResponse.json(
            { 
              success: false,
              error: 'className and query are required for search',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        const searchResult = await searchWeaviate(className, query, limit);
        const searchData = searchResult.data?.Get?.[className] || [];

        return NextResponse.json({
          success: true,
          data: {
            results: searchData,
            total: searchData.length,
            className,
            query,
          },
          timestamp: new Date().toISOString(),
        });

      case 'chat':
        if (!className || !query) {
          return NextResponse.json(
            { 
              success: false,
              error: 'className and query are required for chat',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        // Forward to enhanced chat API
        const chatResponse = await fetch(`${request.nextUrl.origin}/api/chat/enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            className,
            limit: limit || 5,
            llmProvider: body.llmProvider || 'context-only',
          }),
        });

        const chatData = await chatResponse.json();

        return NextResponse.json({
          success: true,
          data: chatData,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid action. Supported actions: search, chat',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('External API POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
