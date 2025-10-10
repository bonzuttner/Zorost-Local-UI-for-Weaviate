// Advanced Weaviate operations API
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import {
  advancedHybridSearch,
  performAggregation,
  batchCreateObjects,
  batchDeleteObjects,
  createAdvancedClass,
  getClassSchema,
  exportObjectsToJSON,
  getClusterNodes,
  getClassShards,
} from '@/lib/weaviate-advanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'hybridSearch': {
        const { className, query, alpha, limit, filters } = params;
        if (!className || !query) {
          return NextResponse.json(
            { success: false, error: 'className and query are required' },
            { status: 400 }
          );
        }
        const result = await advancedHybridSearch(className, query, alpha, limit, filters);
        return NextResponse.json(result);
      }

      case 'aggregate': {
        const result = await performAggregation(params);
        return NextResponse.json(result);
      }

      case 'batchCreate': {
        const { className, objects } = params;
        if (!className || !objects) {
          return NextResponse.json(
            { success: false, error: 'className and objects are required' },
            { status: 400 }
          );
        }
        const result = await batchCreateObjects(className, objects);
        return NextResponse.json(result);
      }

      case 'batchDelete': {
        const { className, objectIds } = params;
        if (!className || !objectIds) {
          return NextResponse.json(
            { success: false, error: 'className and objectIds are required' },
            { status: 400 }
          );
        }
        const result = await batchDeleteObjects(className, objectIds);
        return NextResponse.json(result);
      }

      case 'createAdvancedClass': {
        const result = await createAdvancedClass(params);
        return NextResponse.json(result);
      }

      case 'getSchema': {
        const { className } = params;
        if (!className) {
          return NextResponse.json(
            { success: false, error: 'className is required' },
            { status: 400 }
          );
        }
        const result = await getClassSchema(className);
        return NextResponse.json(result);
      }

      case 'export': {
        const { className, limit } = params;
        if (!className) {
          return NextResponse.json(
            { success: false, error: 'className is required' },
            { status: 400 }
          );
        }
        const result = await exportObjectsToJSON(className, limit);
        return NextResponse.json(result);
      }

      case 'clusterNodes': {
        const result = await getClusterNodes();
        return NextResponse.json(result);
      }

      case 'shards': {
        const { className } = params;
        if (!className) {
          return NextResponse.json(
            { success: false, error: 'className is required' },
            { status: 400 }
          );
        }
        const result = await getClassShards(className);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Advanced API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
