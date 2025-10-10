#!/usr/bin/env python3
"""
Transfer Weaviate database to cloud vector stores
Supports: Weaviate Cloud, Pinecone, Qdrant, Milvus
Developed by Zorost Intelligence
"""

import argparse
import json
import sys
from typing import Dict, List, Any
import weaviate
from tqdm import tqdm

def load_backup(filepath: str) -> Dict[str, Any]:
    """Load backup JSON file"""
    print(f"Loading backup from {filepath}...")
    with open(filepath, 'r') as f:
        data = json.load(f)
    print(f"Loaded {data['metadata']['totalClasses']} classes with {data['metadata']['totalObjects']} objects")
    return data

def transfer_to_weaviate_cloud(data: Dict[str, Any], url: str, api_key: str):
    """Transfer to Weaviate Cloud"""
    print("\nConnecting to Weaviate Cloud...")
    
    client = weaviate.Client(
        url=url,
        auth_client_secret=weaviate.AuthApiKey(api_key)
    )
    
    # Test connection
    meta = client.get_meta()
    print(f"Connected to Weaviate {meta['version']}")
    
    # Create schema
    print("\nCreating schema...")
    for class_obj in data['schema']['classes']:
        try:
            client.schema.create_class(class_obj)
            print(f"  Created class: {class_obj['class']}")
        except Exception as e:
            print(f"  Warning: {class_obj['class']} - {str(e)}")
    
    # Import data
    print("\nImporting objects...")
    for class_name, objects in data['data'].items():
        if not objects:
            continue
            
        print(f"\n  Importing {len(objects)} objects to {class_name}...")
        
        client.batch.configure(batch_size=100)
        with client.batch as batch:
            for obj in tqdm(objects, desc=f"  {class_name}"):
                # Remove internal fields
                clean_obj = {k: v for k, v in obj.items() if not k.startswith('_')}
                
                batch.add_data_object(
                    data_object=clean_obj,
                    class_name=class_name
                )
        
        print(f"  Completed {class_name}")
    
    print("\nTransfer to Weaviate Cloud completed successfully!")

def transfer_to_pinecone(data: Dict[str, Any], api_key: str, environment: str, index_name: str):
    """Transfer to Pinecone"""
    try:
        import pinecone
    except ImportError:
        print("Error: pinecone-client not installed. Run: pip install pinecone-client")
        sys.exit(1)
    
    print("\nConnecting to Pinecone...")
    pinecone.init(api_key=api_key, environment=environment)
    
    # Create index if it doesn't exist
    if index_name not in pinecone.list_indexes():
        print(f"Creating index: {index_name}")
        pinecone.create_index(
            name=index_name,
            dimension=1536,  # Default OpenAI embedding size
            metric='cosine'
        )
    
    index = pinecone.Index(index_name)
    
    # Import data
    print("\nImporting vectors...")
    for class_name, objects in data['data'].items():
        if not objects:
            continue
        
        print(f"\n  Importing {len(objects)} vectors from {class_name}...")
        
        vectors = []
        for obj in tqdm(objects, desc=f"  {class_name}"):
            if '_additional' in obj and 'vector' in obj['_additional']:
                vector = {
                    'id': obj['_additional']['id'],
                    'values': obj['_additional']['vector'],
                    'metadata': {
                        'class': class_name,
                        **{k: v for k, v in obj.items() if not k.startswith('_')}
                    }
                }
                vectors.append(vector)
                
                if len(vectors) >= 100:
                    index.upsert(vectors=vectors)
                    vectors = []
        
        if vectors:
            index.upsert(vectors=vectors)
        
        print(f"  Completed {class_name}")
    
    print("\nTransfer to Pinecone completed successfully!")

def transfer_to_qdrant(data: Dict[str, Any], url: str, api_key: str, collection_name: str):
    """Transfer to Qdrant"""
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams, PointStruct
    except ImportError:
        print("Error: qdrant-client not installed. Run: pip install qdrant-client")
        sys.exit(1)
    
    print("\nConnecting to Qdrant...")
    client = QdrantClient(url=url, api_key=api_key)
    
    # Create collection
    print(f"Creating collection: {collection_name}")
    try:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )
    except Exception as e:
        print(f"Collection may already exist: {str(e)}")
    
    # Import data
    print("\nImporting points...")
    for class_name, objects in data['data'].items():
        if not objects:
            continue
        
        print(f"\n  Importing {len(objects)} points from {class_name}...")
        
        points = []
        for obj in tqdm(objects, desc=f"  {class_name}"):
            if '_additional' in obj and 'vector' in obj['_additional']:
                point = PointStruct(
                    id=obj['_additional']['id'],
                    vector=obj['_additional']['vector'],
                    payload={
                        'class': class_name,
                        **{k: v for k, v in obj.items() if not k.startswith('_')}
                    }
                )
                points.append(point)
                
                if len(points) >= 100:
                    client.upsert(
                        collection_name=collection_name,
                        points=points
                    )
                    points = []
        
        if points:
            client.upsert(
                collection_name=collection_name,
                points=points
            )
        
        print(f"  Completed {class_name}")
    
    print("\nTransfer to Qdrant completed successfully!")

def main():
    parser = argparse.ArgumentParser(
        description='Transfer Weaviate database to cloud vector stores'
    )
    parser.add_argument('--source', required=True, help='Path to backup JSON file')
    parser.add_argument('--target', required=True, 
                       choices=['weaviate', 'pinecone', 'qdrant'],
                       help='Target cloud provider')
    parser.add_argument('--url', help='Target URL (for Weaviate Cloud, Qdrant)')
    parser.add_argument('--api-key', required=True, help='API key for target')
    parser.add_argument('--environment', help='Environment (for Pinecone)')
    parser.add_argument('--index-name', help='Index/Collection name')
    
    args = parser.parse_args()
    
    # Load backup
    data = load_backup(args.source)
    
    # Transfer based on target
    if args.target == 'weaviate':
        if not args.url:
            print("Error: --url required for Weaviate Cloud")
            sys.exit(1)
        transfer_to_weaviate_cloud(data, args.url, args.api_key)
    
    elif args.target == 'pinecone':
        if not args.environment or not args.index_name:
            print("Error: --environment and --index-name required for Pinecone")
            sys.exit(1)
        transfer_to_pinecone(data, args.api_key, args.environment, args.index_name)
    
    elif args.target == 'qdrant':
        if not args.url or not args.index_name:
            print("Error: --url and --index-name required for Qdrant")
            sys.exit(1)
        transfer_to_qdrant(data, args.url, args.api_key, args.index_name)

if __name__ == '__main__':
    main()

