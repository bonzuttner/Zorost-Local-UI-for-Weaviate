#!/bin/bash
# Setup script for N8N integration with Weaviate
# Developed by Zorost Intelligence

echo "========================================="
echo "N8N + Weaviate Integration Setup"
echo "========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# Create shared network if it doesn't exist
if ! docker network inspect local-ai-network > /dev/null 2>&1; then
    echo "Creating shared network: local-ai-network..."
    docker network create \
        --driver bridge \
        --subnet 172.28.0.0/16 \
        local-ai-network
    echo "Network created successfully"
else
    echo "Network already exists: local-ai-network"
fi

# Check if N8N is running
if docker ps | grep -q n8n; then
    echo "N8N container found, connecting to network..."
    docker network connect local-ai-network n8n 2>/dev/null || echo "N8N already connected"
else
    echo "N8N not found. Starting N8N container..."
    docker run -d \
        --name n8n \
        --network local-ai-network \
        --ip 172.28.0.20 \
        -p 5678:5678 \
        -v n8n_data:/home/node/.n8n \
        -e N8N_HOST=localhost \
        -e N8N_PORT=5678 \
        -e N8N_PROTOCOL=http \
        -e WEBHOOK_URL=http://localhost:5678/ \
        docker.n8n.io/n8nio/n8n
    echo "N8N started successfully"
fi

# Start Weaviate with network configuration
echo ""
echo "Starting Weaviate services..."
docker-compose -f docker-compose.network.yml up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to start..."
sleep 5

# Test Weaviate connection
if curl -s http://localhost:8080/v1/meta > /dev/null; then
    echo "Weaviate is ready at http://localhost:8080"
else
    echo "Weaviate is starting..."
fi

# Test N8N connection
if curl -s http://localhost:5678 > /dev/null; then
    echo "N8N is ready at http://localhost:5678"
else
    echo "N8N is starting..."
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Services:"
echo "  - Weaviate: http://localhost:8080"
echo "  - Weaviate App: http://localhost:9501"
echo "  - N8N: http://localhost:5678"
echo ""
echo "Network: local-ai-network (172.28.0.0/16)"
echo ""
echo "Connection URLs for N8N:"
echo "  - From N8N to Weaviate: http://weaviate:8080"
echo "  - Or use IP: http://172.28.0.10:8080"
echo ""
echo "API Key: admin-key"
echo ""
echo "Next steps:"
echo "  1. Open N8N: http://localhost:5678"
echo "  2. Create a new workflow"
echo "  3. Add HTTP Request node"
echo "  4. Configure: http://weaviate:8080/v1/objects"
echo "  5. Add Authorization header: Bearer admin-key"
echo ""
echo "Developed by Zorost Intelligence"
echo "Visit: https://zorost.com"

