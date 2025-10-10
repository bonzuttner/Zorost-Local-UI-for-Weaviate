// Weaviate status endpoint
// Developed by Zorost Intelligence

import { NextResponse } from 'next/server';
import { checkWeaviateConnection, getWeaviateMeta } from '@/lib/weaviate';

export async function GET() {
  try {
    const connected = await checkWeaviateConnection();
    
    if (!connected) {
      return NextResponse.json(
        { connected: false, error: 'Cannot connect to Weaviate' },
        { status: 503 }
      );
    }

    const meta = await getWeaviateMeta();
    
    return NextResponse.json({
      connected: true,
      version: meta.version,
      modules: meta.modules,
    });
  } catch (error) {
    console.error('Weaviate status error:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check Weaviate status' },
      { status: 500 }
    );
  }
}

