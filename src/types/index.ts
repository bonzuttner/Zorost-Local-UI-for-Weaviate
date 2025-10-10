// Type definitions for Weaviate Local App
// Developed by Zorost Intelligence

export interface DatabaseClass {
  class: string;
  description?: string;
  properties: DatabaseProperty[];
  vectorizer?: string;
  vectorIndexType?: string;
  moduleConfig?: Record<string, unknown>;
  invertedIndexConfig?: Record<string, unknown>;
  replicationConfig?: Record<string, unknown>;
  shardingConfig?: Record<string, unknown>;
  objectCount?: number;
}

export interface DatabaseProperty {
  name: string;
  dataType: string[];
  description?: string;
  moduleConfig?: Record<string, unknown>;
  indexFilterable?: boolean;
  indexSearchable?: boolean;
  tokenization?: string;
}

export interface DatabaseObject {
  id: string;
  class?: string;
  properties: Record<string, unknown>;
  vector?: number[];
  _additional?: {
    id?: string;
    vector?: number[];
    certainty?: number;
    distance?: number;
    score?: number;
    creationTimeUnix?: number;
    lastUpdateTimeUnix?: number;
  };
}

export interface DatabaseStats {
  version?: string;
  nodeInfo?: string;
  totalClasses?: number;
  totalObjects?: number;
  performanceMetrics?: PerformanceMetrics;
  clusterHealth?: ClusterHealth;
  shardDetails?: ShardDetail[];
  classStats?: ClassStat[];
  collectionDetails?: CollectionDetail[];
  qdrantMetrics?: QdrantMetrics;
}

export interface PerformanceMetrics {
  totalNodes?: number;
  healthyNodes?: number;
  totalShards?: number;
  indexingShards?: number;
  totalBatchRate?: number;
  totalVectorQueue?: number;
  totalCollections?: number;
  readyCollections?: number;
  indexedVectors?: number;
  totalVectors?: number;
}

export interface ClusterHealth {
  nodes: ClusterNode[];
}

export interface ClusterNode {
  name: string;
  status: 'HEALTHY' | 'INDEXING' | 'UNHEALTHY' | 'UNAVAILABLE';
  version: string;
  gitHash?: string;
  stats?: {
    shardCount?: number;
    objectCount?: number;
  };
  batchStats?: {
    ratePerSecond?: number;
  };
  shards?: ShardInfo[];
}

export interface ShardInfo {
  name: string;
  class: string;
  objectCount: number;
  vectorQueueLength: number;
  vectorIndexingStatus: string;
}

export interface ShardDetail {
  nodeName: string;
  className: string;
  shardName: string;
  objectCount: number;
  vectorIndexingStatus: string;
  vectorQueueLength: number;
}

export interface ClassStat {
  name: string;
  objectCount: number;
  properties: number;
  vectorizer?: string;
}

export interface CollectionDetail {
  name: string;
  objectCount: number;
  vectorSize: number;
  distance: string;
  status: string;
  indexingProgress: number;
  indexedVectors: number;
}

export interface QdrantMetrics {
  averageVectorSize?: number;
  distanceMetrics?: string[];
  collectionsReady?: number;
  collectionsIndexing?: number;
  indexingStatus?: IndexingStatus[];
}

export interface IndexingStatus {
  collection: string;
  status: string;
  indexingProgress: number;
  indexedVectors: number;
  totalVectors: number;
}

export interface SearchResult {
  objects: DatabaseObject[];
  total?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: DatabaseObject[];
  metadata?: Record<string, unknown>;
}

export interface VectorizerConfig {
  type: 'openai' | 'cohere' | 'huggingface' | 'clip' | 'none';
  apiKey?: string;
  model?: string;
  settings?: Record<string, unknown>;
}

export interface ConnectionSettings {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey?: string;
  timeout?: number;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'jsonl';
  includeVectors?: boolean;
  className: string;
  limit?: number;
  offset?: number;
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'jsonl';
  className: string;
  batchSize?: number;
  validateSchema?: boolean;
  skipErrors?: boolean;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface FilterCondition {
  path: string[];
  operator: 'Equal' | 'NotEqual' | 'GreaterThan' | 'LessThan' | 'GreaterThanEqual' | 'LessThanEqual' | 'Like' | 'And' | 'Or';
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: string;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  where?: FilterCondition;
  sort?: {
    path: string[];
    order: 'asc' | 'desc';
  };
  nearText?: {
    concepts: string[];
    certainty?: number;
    distance?: number;
  };
  nearVector?: {
    vector: number[];
    certainty?: number;
    distance?: number;
  };
  hybrid?: {
    query: string;
    alpha?: number;
  };
}

export interface RAGOptions {
  query: string;
  className: string;
  limit?: number;
  prompt?: string;
  model?: string;
  temperature?: number;
}

export interface RAGResponse {
  answer: string;
  sources: DatabaseObject[];
  metadata: {
    model: string;
    tokensUsed?: number;
    responseTime: number;
  };
}

