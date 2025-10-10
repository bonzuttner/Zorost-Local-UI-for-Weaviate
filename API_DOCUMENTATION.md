#  Zorost Local UI for Weaviate - API Documentation

**Advanced Vector Database Manager with External API Access**

**Developed by [Zorost Intelligence](https://zorost.com)**

---

##  External API Endpoints

The Zorost Local UI for Weaviate provides a comprehensive REST API for external integrations, including OpenRoot platform connectivity.

### Base URL
```
http://localhost:9501/api
```

### Authentication
All external API endpoints require an API key:
```bash
# Default API Key (for development)
API_KEY=zorost-api-key-2025
```

---

##  API Endpoints

### 1. **GET /api/external** - API Information
Get information about available endpoints and API version.

**Request:**
```bash
curl "http://localhost:9501/api/external"
```

**Response:**
```json
{
  "success": true,
  "message": "Zorost Local UI for Weaviate External API",
  "endpoints": [
    "GET /api/external?endpoint=schema - Get database schema",
    "GET /api/external?endpoint=stats - Get database statistics",
    "POST /api/external/search - Search vector database",
    "POST /api/external/chat - Chat with AI assistant"
  ],
  "version": "1.0.0",
  "developedBy": "Zorost Intelligence",
  "website": "https://zorost.com"
}
```

### 2. **GET /api/external?endpoint=schema** - Database Schema
Get the complete schema of your Weaviate database.

**Request:**
```bash
curl "http://localhost:9501/api/external?endpoint=schema"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "class": "Document",
        "description": "Document collection",
        "vectorizer": "text2vec-openai",
        "properties": [
          {
            "name": "content",
            "dataType": ["text"],
            "description": "Document content"
          }
        ]
      }
    ]
  },
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

### 3. **GET /api/external?endpoint=stats** - Database Statistics
Get statistics about your database including class counts and properties.

**Request:**
```bash
curl "http://localhost:9501/api/external?endpoint=stats"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClasses": 3,
    "classes": [
      {
        "name": "Document",
        "description": "Document collection",
        "vectorizer": "text2vec-openai",
        "properties": 5
      }
    ]
  },
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

### 4. **POST /api/external/search** - Vector Search
Search your vector database using semantic search.

**Request:**
```bash
curl -X POST "http://localhost:9501/api/external/search" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search",
    "className": "Document",
    "query": "machine learning algorithms",
    "limit": 10,
    "apiKey": "zorost-api-key-2025"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid-123",
        "content": "Machine learning algorithms are...",
        "_additional": {
          "id": "uuid-123",
          "certainty": 0.95,
          "distance": 0.05
        }
      }
    ],
    "total": 5,
    "className": "Document",
    "query": "machine learning algorithms"
  },
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

### 5. **POST /api/external/chat** - AI Chat
Chat with an AI assistant powered by your vector database.

**Request:**
```bash
curl -X POST "http://localhost:9501/api/external/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "className": "Document",
    "query": "What are the main types of machine learning?",
    "limit": 5,
    "apiKey": "zorost-api-key-2025",
    "llmProvider": "openai"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Based on the documents in your database, there are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning...",
    "sources": [
      {
        "id": "uuid-123",
        "content": "Machine learning types include...",
        "_additional": {
          "id": "uuid-123",
          "score": 0.95
        }
      }
    ],
    "metadata": {
      "model": "gpt-3.5-turbo",
      "provider": "openai",
      "responseTime": 1641735000000,
      "totalSources": 3
    }
  },
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

---

## 🤖 AI Chat API

### Enhanced Chat Endpoint: **POST /api/chat/enhanced**

Advanced chat endpoint with multiple LLM provider support.

**Request Body:**
```json
{
  "query": "Your question here",
  "className": "YourClass",
  "limit": 5,
  "apiKeys": {
    "openai": "sk-...",
    "cohere": "cohere_...",
    "huggingface": "hf_...",
    "localLLM": "http://localhost:11434/api/generate"
  },
  "llmProvider": "openai"
}
```

**LLM Providers:**
- `openai` - OpenAI GPT models (requires OpenAI API key)
- `cohere` - Cohere Command models (requires Cohere API key)
- `local` - Local LLM via Ollama/LM Studio (requires local endpoint)
- `context-only` - Fallback mode using only vector search results

**Response:**
```json
{
  "answer": "AI-generated response based on your vector data",
  "sources": [...],
  "metadata": {
    "model": "gpt-3.5-turbo",
    "provider": "openai",
    "responseTime": 1641735000000,
    "totalSources": 3
  }
}
```

---

##  API Key Management

### Supported LLM Providers

#### 1. **OpenAI**
- **Models:** GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **API Key:** Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Format:** `sk-...`

#### 2. **Cohere**
- **Models:** Command, Command Light, Embed
- **API Key:** Get from [Cohere Dashboard](https://dashboard.cohere.ai/api-keys)
- **Format:** `cohere_...`

#### 3. **Hugging Face**
- **Models:** Access to Hugging Face model hub
- **API Key:** Get from [Hugging Face Settings](https://huggingface.co/settings/tokens)
- **Format:** `hf_...`

#### 4. **Local LLM**
- **Models:** Any model supported by Ollama, LM Studio, etc.
- **Endpoint:** Your local LLM service URL
- **Format:** `http://localhost:11434/api/generate`

---

##  OpenRoot Platform Integration

### Connection Configuration

To connect your Zorost Local UI for Weaviate to the OpenRoot platform:

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Configure API access:**
   ```bash
   # Set your API key (default: zorost-api-key-2025)
   export WEAVIATE_API_KEY="your-custom-api-key"
   ```

3. **Test connection:**
   ```bash
   curl "http://localhost:9501/api/external"
   ```

### Integration Examples

#### Python Integration
```python
import requests

# Base URL
BASE_URL = "http://localhost:9501/api/external"
API_KEY = "zorost-api-key-2025"

# Search your vector database
def search_documents(query, className="Document", limit=10):
    response = requests.post(BASE_URL, json={
        "action": "search",
        "className": className,
        "query": query,
        "limit": limit,
        "apiKey": API_KEY
    })
    return response.json()

# Chat with AI
def chat_with_ai(query, className="Document"):
    response = requests.post(BASE_URL, json={
        "action": "chat",
        "className": className,
        "query": query,
        "apiKey": API_KEY,
        "llmProvider": "context-only"
    })
    return response.json()

# Example usage
results = search_documents("machine learning algorithms")
print(results)
```

#### JavaScript Integration
```javascript
const BASE_URL = "http://localhost:9501/api/external";
const API_KEY = "zorost-api-key-2025";

async function searchDocuments(query, className = "Document", limit = 10) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'search',
      className,
      query,
      limit,
      apiKey: API_KEY
    })
  });
  return response.json();
}

async function chatWithAI(query, className = "Document") {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'chat',
      className,
      query,
      apiKey: API_KEY,
      llmProvider: 'context-only'
    })
  });
  return response.json();
}

// Example usage
searchDocuments("machine learning algorithms").then(results => {
  console.log(results);
});
```

---

##  Production Deployment

### Environment Variables
```bash
# Weaviate Configuration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_SCHEME=http
WEAVIATE_API_KEY=admin-key

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:9501
EXTERNAL_API_KEY=your-production-api-key

# Optional: External LLM API Keys
OPENAI_API_KEY=sk-...
COHERE_API_KEY=cohere_...
HUGGINGFACE_API_KEY=hf_...
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 9501
CMD ["npm", "start"]
```

### Security Considerations
- Change the default API key in production
- Use HTTPS in production
- Implement rate limiting
- Add CORS configuration for your domains
- Use environment variables for sensitive data

---

##  Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "className and query are required for search",
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid API key",
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "timestamp": "2025-01-10T10:30:00.000Z"
}
```

---

##  Useful Links

- **Application:** http://localhost:9501
- **API Documentation:** http://localhost:9501/api/external
- **Weaviate API:** http://localhost:8080/v1
- **Zorost Intelligence:** https://zorost.com
- **GitHub Repository:** https://github.com/zorost/Zorost-Local-UI-for-Weaviate

---

##  Support

- **Website:** [zorost.com](https://zorost.com)
- **GitHub Issues:** [github.com/zorost/Zorost-Local-UI-for-Weaviate/issues](https://github.com/zorost/Zorost-Local-UI-for-Weaviate/issues)
- **Contact:** [zorost.com/contact](https://zorost.com/contact)

---

<div align="center">

### Made with  by [Zorost Intelligence](https://zorost.com)

**© 2025 Zorost Intelligence. All rights reserved.**

**Building the future of AI, one application at a time** 

</div>
