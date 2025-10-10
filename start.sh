#!/bin/bash
# Weaviate Local App Startup Script
# Developed by Zorost Intelligence

echo "Starting Weaviate Local App..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo " Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start Docker services
echo "� Starting Weaviate and related services..."
docker-compose up -d

# Wait for Weaviate to be ready
echo "�� Waiting for Weaviate to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/v1/meta > /dev/null 2>&1; then
        echo " Weaviate is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo " Weaviate failed to start in time. Check logs with: docker-compose logs weaviate"
        exit 1
    fi
    sleep 2
done

# Start the Next.js app
echo ""
echo "�� Starting the web interface..."
npm run dev &

echo ""
echo "� Weaviate Local App is running!"
echo ""
echo "� Access points:"
echo "   - Web Interface: http://localhost:9501"
echo "   - Weaviate API: http://localhost:8080"
echo "   - API Docs: http://localhost:8080/v1"
echo ""
echo "� Authentication:"
echo "   - Admin API Key: admin-key"
echo "   - User API Key: user-key"
echo ""
echo " View logs:"
echo "   - Weaviate: docker-compose logs -f weaviate"
echo "   - App: Check your terminal"
echo ""
echo "�� To stop all services, run: ./stop.sh or Ctrl+C"
echo ""

