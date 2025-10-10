// Test endpoint for Weaviate connection
// Developed by Zorost Intelligence

import { NextResponse } from 'next/server';
import { getWeaviateClient } from '@/lib/weaviate';

export async function GET() {
  try {
    const client = getWeaviateClient();
    
    // Test 1: Get meta information
    console.log('Testing Weaviate connection...');
    const meta = await client.misc.metaGetter().do();
    console.log('Meta:', meta);
    
    // Test 2: Get schema
    const schema = await client.schema.getter().do();
    console.log('Schema classes:', schema.classes?.length || 0);
    
    return NextResponse.json({
      success: true,
      connected: true,
      meta: {
        version: meta.version,
        hostname: meta.hostname,
      },
      schema: {
        classCount: schema.classes?.length || 0,
        classes: schema.classes?.map((c: any) => c.class) || [],
      },
    });
  } catch (error: any) {
    console.error('Weaviate connection test failed:', error);
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Unknown error',
      details: error.response?.data || error.toString(),
    }, { status: 500 });
  }
}

