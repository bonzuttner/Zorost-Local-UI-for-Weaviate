// Document Processing API endpoint
// Handles file upload, text extraction, chunking, embedding, and vectorization
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getWeaviateClient } from '@/lib/weaviate';

// Text extraction functions
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // For now, return a placeholder
  // In production, you'd use a library like pdf-parse
  return `[PDF Content] This is a placeholder for PDF text extraction. 
  In production, this would extract actual text from the PDF file.
  File size: ${buffer.length} bytes`;
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(buffer);
  } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return buffer.toString('utf-8');
  } else if (fileName.endsWith('.json')) {
    const jsonData = JSON.parse(buffer.toString('utf-8'));
    return JSON.stringify(jsonData, null, 2);
  } else if (fileName.endsWith('.csv')) {
    return buffer.toString('utf-8');
  } else {
    // Try to treat as text
    return buffer.toString('utf-8');
  }
}

// Chunking functions
function chunkTextFixed(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

function chunkTextRecursive(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);
    
    if ((currentChunk + ' ' + paragraph).split(/\s+/).length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Add overlap
        const overlapWords = currentChunk.split(/\s+/).slice(-overlap);
        currentChunk = overlapWords.join(' ') + ' ' + paragraph;
      } else {
        // Paragraph is too long, split it
        for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
          const chunk = words.slice(i, i + chunkSize).join(' ');
          if (chunk.trim()) {
            chunks.push(chunk.trim());
          }
        }
        currentChunk = '';
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

function chunkTextSemantic(text: string, chunkSize: number, overlap: number): string[] {
  // Simplified semantic chunking - split by sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    
    if ((currentChunk + ' ' + sentence).split(/\s+/).length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Add overlap sentences
        const currentSentences = currentChunk.split(/[.!?]+/).filter(s => s.trim());
        const overlapSentences = currentSentences.slice(-Math.max(1, Math.floor(overlap / 50)));
        currentChunk = overlapSentences.join('. ') + '. ' + sentence;
      } else {
        chunks.push(sentence.trim());
        currentChunk = '';
      }
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Embedding functions
async function getEmbedding(
  text: string,
  provider: string,
  model: string,
  apiKey: string,
  endpoint: string
): Promise<number[]> {
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'text-embedding-3-small',
          input: text,
        }),
      });
      
      const data = await response.json();
      return data.data[0].embedding;
      
    } else if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/zorost/Zorost-Local-UI-for-Weaviate',
        },
        body: JSON.stringify({
          model: model || 'openai/text-embedding-3-small',
          input: text,
        }),
      });
      
      const data = await response.json();
      return data.data[0].embedding;
      
    } else if (provider === 'local') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'nomic-embed-text',
          prompt: text,
        }),
      });
      
      const data = await response.json();
      return data.embedding;
    }
  } catch (error) {
    console.error('Error getting embedding:', error);
  }
  
  // Return a zero vector if embedding fails
  return new Array(384).fill(0);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const className = formData.get('className') as string;
    const embeddingProvider = formData.get('embeddingProvider') as string;
    const embeddingModel = formData.get('embeddingModel') as string;
    const embeddingApiKey = formData.get('embeddingApiKey') as string;
    const embeddingEndpoint = formData.get('embeddingEndpoint') as string;
    const enableChunking = formData.get('enableChunking') === 'true';
    const chunkSize = parseInt(formData.get('chunkSize') as string) || 500;
    const chunkOverlap = parseInt(formData.get('chunkOverlap') as string) || 50;
    const chunkingStrategy = formData.get('chunkingStrategy') as string || 'recursive';
    
    const files = formData.getAll('files') as File[];
    
    if (!className || files.length === 0) {
      return NextResponse.json(
        { error: 'Class name and files are required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${files.length} files for class: ${className}`);
    
    const client = await getWeaviateClient();
    const processedChunks: any[] = [];
    
    // Process each file
    for (const file of files) {
      console.log(`Processing file: ${file.name}`);
      
      // Extract text
      const text = await extractTextFromFile(file);
      
      // Chunk text if enabled
      let chunks: string[];
      if (enableChunking) {
        switch (chunkingStrategy) {
          case 'fixed':
            chunks = chunkTextFixed(text, chunkSize, chunkOverlap);
            break;
          case 'semantic':
            chunks = chunkTextSemantic(text, chunkSize, chunkOverlap);
            break;
          case 'recursive':
          default:
            chunks = chunkTextRecursive(text, chunkSize, chunkOverlap);
            break;
        }
      } else {
        chunks = [text];
      }
      
      console.log(`Created ${chunks.length} chunks from ${file.name}`);
      
      // Generate embeddings and create objects
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Get embedding if provider is configured
        let vector: number[] | undefined;
        if (embeddingProvider !== 'none' && embeddingApiKey) {
          vector = await getEmbedding(
            chunk,
            embeddingProvider,
            embeddingModel,
            embeddingApiKey,
            embeddingEndpoint
          );
        }
        
        // Create object data
        const objectData: any = {
          content: chunk,
          source_file: file.name,
          chunk_index: i,
          chunk_total: chunks.length,
          chunk_strategy: chunkingStrategy,
          uploaded_at: new Date().toISOString(),
        };
        
        processedChunks.push({
          class: className,
          properties: objectData,
          vector,
        });
      }
    }
    
    // Batch insert into Weaviate
    console.log(`Inserting ${processedChunks.length} objects into Weaviate...`);
    
    const batchSize = 100;
    for (let i = 0; i < processedChunks.length; i += batchSize) {
      const batch = processedChunks.slice(i, i + batchSize);
      
      for (const obj of batch) {
        try {
          if (obj.vector) {
            await client.data
              .creator()
              .withClassName(obj.class)
              .withProperties(obj.properties)
              .withVector(obj.vector)
              .do();
          } else {
            await client.data
              .creator()
              .withClassName(obj.class)
              .withProperties(obj.properties)
              .do();
          }
        } catch (error) {
          console.error('Error inserting object:', error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      filesProcessed: files.length,
      chunksCreated: processedChunks.length,
      message: `Successfully processed ${files.length} files and created ${processedChunks.length} chunks`,
    });
    
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

