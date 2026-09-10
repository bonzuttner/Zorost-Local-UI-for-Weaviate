// Weaviate client configuration and utilities
// Developed by Zorost Intelligence

import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';



console.log('Weaviate env:', {
  host: process.env.WEAVIATE_HOST,
  port: process.env.WEAVIATE_PORT,
  scheme: process.env.WEAVIATE_SCHEME,
  apiKeyPresent: !!process.env.WEAVIATE_API_KEY,
  apiKeyLength: process.env.WEAVIATE_API_KEY?.length,
});

let client: WeaviateClient | null = null;

export interface WeaviateConfig {
  host: string;
  port?: number;
  scheme: 'http' | 'https';
  apiKey?: string;
}

export function getWeaviateClient(config?: WeaviateConfig): WeaviateClient {
  if (client) {
    return client;
  }

  const defaultConfig: WeaviateConfig = {
    host: process.env.WEAVIATE_HOST || 'weaviate.railway.internal',
    port: parseInt(process.env.WEAVIATE_PORT || '8080', 10),
    scheme: (process.env.WEAVIATE_SCHEME as 'http' | 'https') || 'http',
    apiKey: process.env.WEAVIATE_API_KEY || undefined,
  };

  const finalConfig = { ...defaultConfig, ...config };

  const headers: Record<string, string> = {};

  if (finalConfig.apiKey) {
    headers['Authorization'] = `Bearer ${finalConfig.apiKey}`;
  }

  if (process.env.OPENAI_API_KEY) {
    headers['X-OpenAI-Api-Key'] = process.env.OPENAI_API_KEY;
  }

  if (process.env.COHERE_API_KEY) {
    headers['X-Cohere-Api-Key'] = process.env.COHERE_API_KEY;
  }

  if (process.env.HUGGINGFACE_API_KEY) {
    headers['X-HuggingFace-Api-Key'] = process.env.HUGGINGFACE_API_KEY;
  }

  const clientConfig: {
    scheme: string;
    host: string;
    authClientSecret?: ApiKey;
    headers?: Record<string, string>;
  } = {
    scheme: finalConfig.scheme,
    host: `${finalConfig.host}:${finalConfig.port}`,
  };

  if (finalConfig.apiKey) {
    clientConfig.authClientSecret = new ApiKey(finalConfig.apiKey);
  }

  if (Object.keys(headers).length > 0) {
    clientConfig.headers = headers;
  }

  console.log('Weaviate client configuration:', {
    scheme: finalConfig.scheme,
    host: finalConfig.host,
    port: finalConfig.port,
    hasApiKey: !!finalConfig.apiKey,
  });

  client = weaviate.client(clientConfig);

  return client;
}



export async function checkWeaviateConnection(): Promise<boolean> {
  try {
    const client = getWeaviateClient();
    const result = await client.misc.metaGetter().do();
    return !!result;
  } catch (error) {
    console.error('Weaviate connection error:', error);
    return false;
  }
}

export async function getWeaviateMeta() {
  const client = getWeaviateClient();
  return await client.misc.metaGetter().do();
}

export async function getWeaviateSchema() {
  const client = getWeaviateClient();
  return await client.schema.getter().do();
}

export async function createWeaviateClass(classObj: unknown) {
  const client = getWeaviateClient();
  return await client.schema.classCreator().withClass(classObj).do();
}

export async function deleteWeaviateClass(className: string) {
  const client = getWeaviateClient();
  return await client.schema.classDeleter().withClassName(className).do();
}

export async function getWeaviateObjects(className: string, limit: number = 20, offset: number = 0) {
  const client = getWeaviateClient();
  return await client.data
    .getter()
    .withClassName(className)
    .withLimit(limit)
    .do();
}

export async function createWeaviateObject(className: string, properties: Record<string, unknown>, id?: string) {
  const client = getWeaviateClient();
  let creator = client.data.creator().withClassName(className).withProperties(properties);
  
  if (id) {
    creator = creator.withId(id);
  }
  
  return await creator.do();
}

export async function updateWeaviateObject(className: string, id: string, properties: Record<string, unknown>) {
  const client = getWeaviateClient();
  return await client.data
    .updater()
    .withClassName(className)
    .withId(id)
    .withProperties(properties)
    .do();
}

export async function deleteWeaviateObject(className: string, id: string) {
  const client = getWeaviateClient();
  return await client.data.deleter().withClassName(className).withId(id).do();
}

export async function searchWeaviate(className: string, query: string, limit: number = 10) {
  const client = getWeaviateClient();
  return await client.graphql
    .get()
    .withClassName(className)
    .withNearText({ concepts: [query] })
    .withLimit(limit)
    .withFields('_additional { id certainty distance } ')
    .do();
}

export async function hybridSearchWeaviate(
  className: string,
  query: string,
  limit: number = 10,
  alpha: number = 0.5
) {
  const client = getWeaviateClient();
  return await client.graphql
    .get()
    .withClassName(className)
    .withHybrid({ query, alpha })
    .withLimit(limit)
    .withFields('_additional { id score explainScore }')
    .do();
}

export async function comprehensiveSearchWeaviate(
  className: string,
  query: string,
  limit: number = 10
) {
  const client = getWeaviateClient();
  
  // Perform both vector and keyword search for comprehensive results
  const [vectorResults, keywordResults] = await Promise.all([
    // Vector search
    client.graphql
      .get()
      .withClassName(className)
      .withNearText({ concepts: [query] })
      .withLimit(limit)
      .withFields('_additional { id score explainScore }')
      .do(),
    
    // Keyword search (BM25)
    client.graphql
      .get()
      .withClassName(className)
      .withBm25({ query })
      .withLimit(limit)
      .withFields('_additional { id score explainScore }')
      .do()
  ]);

  // Combine and deduplicate results
  const vectorData = vectorResults.data?.Get?.[className] || [];
  const keywordData = keywordResults.data?.Get?.[className] || [];
  
  // Create a map to deduplicate by ID
  const combinedMap = new Map();
  
  // Add vector results with higher weight
  vectorData.forEach((item: any) => {
    combinedMap.set(item._additional.id, {
      ...item,
      _additional: {
        ...item._additional,
        searchType: 'vector',
        combinedScore: item._additional.score * 1.2 // Give vector search slight preference
      }
    });
  });
  
  // Add keyword results, keeping higher scores
  keywordData.forEach((item: any) => {
    const existing = combinedMap.get(item._additional.id);
    if (!existing || item._additional.score > existing._additional.score) {
      combinedMap.set(item._additional.id, {
        ...item,
        _additional: {
          ...item._additional,
          searchType: existing ? 'hybrid' : 'keyword',
          combinedScore: item._additional.score
        }
      });
    }
  });
  
  // Convert back to array and sort by combined score
  const combinedResults = Array.from(combinedMap.values())
    .sort((a: any, b: any) => b._additional.combinedScore - a._additional.combinedScore)
    .slice(0, limit);

  return {
    data: {
      Get: {
        [className]: combinedResults
      }
    }
  };
}

export async function generativeSearch(
  className: string,
  query: string,
  prompt: string,
  limit: number = 5
) {
  const client = getWeaviateClient();
  return await client.graphql
    .get()
    .withClassName(className)
    .withNearText({ concepts: [query] })
    .withLimit(limit)
    .withGenerate({
      singlePrompt: prompt,
    })
    .withFields('_additional { id generate { singleResult error } }')
    .do();
}

export async function batchCreateObjects(className: string, objects: Array<Record<string, unknown>>) {
  const client = getWeaviateClient();
  let batcher = client.batch.objectsBatcher();

  objects.forEach(obj => {
    batcher = batcher.withObject({
      class: className,
      properties: obj,
    });
  });

  return await batcher.do();
}

export async function getClusterNodes() {
  const client = getWeaviateClient();
  return await client.cluster.getter().do();
}

export function resetClient() {
  client = null;
}

export default {
  getClient: getWeaviateClient,
  checkConnection: checkWeaviateConnection,
  getMeta: getWeaviateMeta,
  getSchema: getWeaviateSchema,
  createClass: createWeaviateClass,
  deleteClass: deleteWeaviateClass,
  getObjects: getWeaviateObjects,
  createObject: createWeaviateObject,
  updateObject: updateWeaviateObject,
  deleteObject: deleteWeaviateObject,
  search: searchWeaviate,
  hybridSearch: hybridSearchWeaviate,
  generativeSearch,
  batchCreate: batchCreateObjects,
  getClusterNodes,
  reset: resetClient,
};

