// Advanced Weaviate Functions
// Developed by Zorost Intelligence

import { getWeaviateClient } from './weaviate';

export interface FilterOperator {
  operator: 'Equal' | 'NotEqual' | 'GreaterThan' | 'GreaterThanEqual' | 'LessThan' | 'LessThanEqual' | 'And' | 'Or' | 'Like' | 'WithinGeoRange' | 'ContainsAny' | 'ContainsAll';
  path: string[];
  valueText?: string;
  valueInt?: number;
  valueBoolean?: boolean;
  valueDate?: string;
  valueGeoRange?: {
    geoCoordinates: {
      latitude: number;
      longitude: number;
    };
    distance: {
      max: number;
    };
  };
}

export interface AggregationQuery {
  className: string;
  properties?: string[];
  groupBy?: string;
  limit?: number;
}

export interface BatchOperationResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Perform hybrid search combining vector and keyword search
 */
export async function advancedHybridSearch(
  className: string,
  query: string,
  alpha: number = 0.7,
  limit: number = 10,
  filters?: FilterOperator
) {
  try {
    const client = getWeaviateClient();
    
    let queryBuilder = client.graphql
      .get()
      .withClassName(className)
      .withHybrid({
        query,
        alpha, // 0 = pure keyword, 1 = pure vector
      })
      .withLimit(limit)
      .withFields('_additional { id score distance }');

    // Add filters if provided
    if (filters) {
      queryBuilder = queryBuilder.withWhere(filters as never);
    }

    const result = await queryBuilder.do();
    
    return {
      success: true,
      data: result,
      metadata: {
        count: result.data?.Get?.[className]?.length || 0,
        alpha,
      },
    };
  } catch (error) {
    console.error('Advanced hybrid search error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Perform aggregation queries
 */
export async function performAggregation(query: AggregationQuery) {
  try {
    const client = getWeaviateClient();
    const { className, properties = [], groupBy, limit = 100 } = query;

    let aggregationQuery = client.graphql
      .aggregate()
      .withClassName(className)
      .withFields('meta { count }');

    // Add property aggregations
    if (properties.length > 0) {
      properties.forEach(prop => {
        aggregationQuery = aggregationQuery.withFields(
          `${prop} { count mean sum minimum maximum }`
        );
      });
    }

    // Add groupBy if provided
    if (groupBy) {
      aggregationQuery = aggregationQuery.withGroupBy([groupBy]);
    }

    if (limit) {
      aggregationQuery = aggregationQuery.withLimit(limit);
    }

    const result = await aggregationQuery.do();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Aggregation error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Batch create objects
 */
export async function batchCreateObjects(
  className: string,
  objects: Array<Record<string, unknown>>
): Promise<BatchOperationResult> {
  try {
    const client = getWeaviateClient();
    let batcher = client.batch.objectsBatcher();

    objects.forEach(obj => {
      batcher = batcher.withObject({
        class: className,
        properties: obj,
      });
    });

    const result = await batcher.do();
    
    const errors: Array<{ index: number; error: string }> = [];
    let successCount = 0;

    if (Array.isArray(result)) {
      result.forEach((item, index) => {
        if (item.result?.errors) {
          errors.push({
            index,
            error: item.result.errors.error?.[0]?.message || 'Unknown error',
          });
        } else {
          successCount++;
        }
      });
    }

    return {
      success: errors.length === 0,
      successCount,
      errorCount: errors.length,
      errors,
    };
  } catch (error) {
    console.error('Batch create error:', error);
    return {
      success: false,
      successCount: 0,
      errorCount: objects.length,
      errors: [{ index: 0, error: String(error) }],
    };
  }
}

/**
 * Batch delete objects
 */
export async function batchDeleteObjects(
  className: string,
  objectIds: string[]
): Promise<BatchOperationResult> {
  try {
    const client = getWeaviateClient();
    
    const deletePromises = objectIds.map(id =>
      client.data
        .deleter()
        .withClassName(className)
        .withId(id)
        .do()
        .then(() => ({ success: true, id }))
        .catch((error) => ({ success: false, id, error: String(error) }))
    );

    const results = await Promise.all(deletePromises);
    
    const errors = results
      .map((result, index) => 
        !result.success ? { index, error: result.error || 'Unknown error' } : null
      )
      .filter(Boolean) as Array<{ index: number; error: string }>;

    const successCount = results.filter(r => r.success).length;

    return {
      success: errors.length === 0,
      successCount,
      errorCount: errors.length,
      errors,
    };
  } catch (error) {
    console.error('Batch delete error:', error);
    return {
      success: false,
      successCount: 0,
      errorCount: objectIds.length,
      errors: [{ index: 0, error: String(error) }],
    };
  }
}

/**
 * Create class with advanced configuration
 */
export async function createAdvancedClass(config: {
  className: string;
  description?: string;
  vectorizer?: string;
  moduleConfig?: Record<string, unknown>;
  properties: Array<{
    name: string;
    dataType: string[];
    description?: string;
    indexInverted?: boolean;
    indexSearchable?: boolean;
    moduleConfig?: Record<string, unknown>;
  }>;
  vectorIndexConfig?: {
    distance?: 'cosine' | 'dot' | 'l2-squared' | 'hamming' | 'manhattan';
    ef?: number;
    efConstruction?: number;
    maxConnections?: number;
    dynamicEfMin?: number;
    dynamicEfMax?: number;
    dynamicEfFactor?: number;
    vectorCacheMaxObjects?: number;
    flatSearchCutoff?: number;
    skip?: boolean;
  };
  invertedIndexConfig?: {
    bm25?: {
      b?: number;
      k1?: number;
    };
    stopwords?: {
      preset?: string;
      additions?: string[];
      removals?: string[];
    };
    indexTimestamps?: boolean;
    indexNullState?: boolean;
    indexPropertyLength?: boolean;
  };
  replicationConfig?: {
    factor?: number;
  };
  multiTenancyConfig?: {
    enabled?: boolean;
  };
}) {
  try {
    const client = getWeaviateClient();
    
    const classObj = {
      class: config.className,
      description: config.description,
      vectorizer: config.vectorizer || 'none',
      moduleConfig: config.moduleConfig || {},
      properties: config.properties,
      vectorIndexConfig: config.vectorIndexConfig,
      invertedIndexConfig: config.invertedIndexConfig,
      replicationConfig: config.replicationConfig,
      multiTenancyConfig: config.multiTenancyConfig,
    };

    const result = await client.schema.classCreator().withClass(classObj).do();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Create advanced class error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Get class schema with full details
 */
export async function getClassSchema(className: string) {
  try {
    const client = getWeaviateClient();
    const result = await client.schema.classGetter().withClassName(className).do();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Get class schema error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Update class schema
 */
export async function updateClassSchema(
  className: string,
  _updates: {
    description?: string;
    vectorIndexConfig?: Record<string, unknown>;
    invertedIndexConfig?: Record<string, unknown>;
  }
) {
  try {
    // Note: Weaviate doesn't support direct class updates
    // This would require recreating the class with new config
    // For now, return the current schema
    const current = await getClassSchema(className);
    
    return {
      success: false,
      error: 'Class updates require recreation. Export data, delete class, and recreate with new config.',
      data: current.data,
    };
  } catch (error) {
    console.error('Update class schema error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Export objects to JSON
 */
export async function exportObjectsToJSON(
  className: string,
  limit: number = 1000
) {
  try {
    const client = getWeaviateClient();
    
    const result = await client.graphql
      .get()
      .withClassName(className)
      .withLimit(limit)
      .withFields('_additional { id } ')
      .do();

    const objects = result.data?.Get?.[className] || [];
    
    return {
      success: true,
      data: objects,
      metadata: {
        count: objects.length,
        className,
        exportedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Export objects error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Get cluster nodes information
 */
export async function getClusterNodes() {
  try {
    const client = getWeaviateClient();
    const result = await client.cluster.getter().do();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Get cluster nodes error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}

/**
 * Get shards information for a class
 */
export async function getClassShards(className: string) {
  try {
    const client = getWeaviateClient();
    const result = await client.schema
      .shardsGetter()
      .withClassName(className)
      .do();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Get class shards error:', error);
    return {
      success: false,
      error: String(error),
      data: null,
    };
  }
}
