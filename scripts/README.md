# Scripts

This directory contains essential scripts for the Zorost Local UI for Weaviate.

## Available Scripts

### setup-n8n-integration.sh
Sets up N8N integration with Zorost Local UI for Weaviate.
- Creates shared Docker network
- Connects services
- Configures integration

Usage:
```bash
./scripts/setup-n8n-integration.sh
```

### transfer-to-cloud.py
Python script for transferring local Weaviate database to cloud vector stores.

Supports:
- Weaviate Cloud
- Pinecone
- Qdrant

Usage:
```bash
python scripts/transfer-to-cloud.py --source backup.json --target weaviate --url YOUR_URL --api-key YOUR_KEY
```

## Development Scripts

Development and testing scripts are located in `.scripts-dev/` (excluded from GitHub).
