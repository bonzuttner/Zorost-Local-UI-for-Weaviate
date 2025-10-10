// Database abstraction layer for switching between Weaviate and Qdrant
// Developed by Zorost Intelligence

const DB_TYPE_KEY = 'db-type';

export type DatabaseType = 'weaviate' | 'qdrant';

export function getCurrentDbType(): DatabaseType {
  if (typeof window === 'undefined') {
    return 'weaviate'; // Default for SSR
  }
  
  const stored = localStorage.getItem(DB_TYPE_KEY);
  return (stored as DatabaseType) || 'weaviate';
}

export function setCurrentDbType(type: DatabaseType): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_TYPE_KEY, type);
  }
}

export function getDbConfig() {
  const dbType = getCurrentDbType();
  
  if (dbType === 'weaviate') {
    return {
      type: 'weaviate',
      host: process.env.NEXT_PUBLIC_WEAVIATE_HOST || 'localhost',
      port: process.env.NEXT_PUBLIC_WEAVIATE_PORT || '8080',
      protocol: process.env.NEXT_PUBLIC_WEAVIATE_PROTOCOL || 'http',
      apiKey: process.env.NEXT_PUBLIC_WEAVIATE_API_KEY || 'admin-key',
    };
  } else {
    return {
      type: 'qdrant',
      host: process.env.NEXT_PUBLIC_QDRANT_HOST || 'localhost',
      port: process.env.NEXT_PUBLIC_QDRANT_PORT || '6333',
      protocol: process.env.NEXT_PUBLIC_QDRANT_PROTOCOL || 'http',
      apiKey: process.env.NEXT_PUBLIC_QDRANT_API_KEY,
    };
  }
}

export function getDbUrl(): string {
  const config = getDbConfig();
  return `${config.protocol}://${config.host}:${config.port}`;
}

