// Weaviate classes/collections endpoint
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getWeaviateSchema, createWeaviateClass, getWeaviateClient } from '@/lib/weaviate';

export async function GET() {
  try {
    const schema = await getWeaviateSchema();
    
    // Fetch object counts for each class
    const client = await getWeaviateClient();
    const classesWithCounts = await Promise.all(
      (schema.classes || []).map(async (cls: any) => {
        try {
          const result = await client.graphql
            .aggregate()
            .withClassName(cls.class)
            .withFields('meta { count }')
            .do();
          
          const count = result.data?.Aggregate?.[cls.class]?.[0]?.meta?.count || 0;
          return { ...cls, objectCount: count };
        } catch (error) {
          console.error(`Error fetching count for class ${cls.class}:`, error);
          return { ...cls, objectCount: 0 };
        }
      })
    );
    
    return NextResponse.json({
      classes: classesWithCounts,
      total: classesWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes', classes: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { className, description, properties, vectorizer, moduleConfig } = body;

    console.log('Creating class with params:', { className, description, vectorizer });

    if (!className) {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      );
    }

    // Validate class name format
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      return NextResponse.json(
        { error: 'Invalid class name format. Must be PascalCase (e.g., MyClass, Documents)' },
        { status: 400 }
      );
    }

    // Ensure properties have at least one field if empty
    const classProperties = properties && properties.length > 0 ? properties : [
      {
        name: 'content',
        dataType: ['text'],
        description: 'Default content field',
      }
    ];

    const classObj: Record<string, unknown> = {
      class: className,
      description: description || '',
      vectorizer: vectorizer || 'none',
      properties: classProperties,
    };

    if (moduleConfig) {
      classObj.moduleConfig = moduleConfig;
    }

    console.log('Creating class with config:', JSON.stringify(classObj, null, 2));

    try {
      const result = await createWeaviateClass(classObj);
      console.log('Class created successfully:', result);
      
      return NextResponse.json({
        success: true,
        class: result,
      });
    } catch (weaviateError: any) {
      console.error('Weaviate error details:', weaviateError);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create class';
      if (weaviateError.message) {
        errorMessage = weaviateError.message;
      } else if (weaviateError.response?.data?.error) {
        errorMessage = weaviateError.response.data.error[0]?.message || weaviateError.response.data.error;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/weaviate/classes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create class: ${errorMessage}` },
      { status: 500 }
    );
  }
}

