#!/bin/bash
# Weaviate Local App Stop Script
# Developed by Zorost Intelligence

echo "🛑 Stopping Weaviate Local App..."
echo ""

# Stop Docker services
echo "📦 Stopping Docker services..."
docker-compose down

echo ""
echo "✅ All services stopped successfully!"
echo ""
echo "💡 To start again, run: ./start.sh"
echo ""

