# OpenRouter Integration Guide

**Zorost Local UI for Weaviate - OpenRouter LLM Integration**

**Developed by Zorost Intelligence**

---

## Overview

This application now supports [OpenRouter](https://openrouter.ai/), providing access to 500+ AI models from 60+ providers through a single unified API. OpenRouter offers better prices, better uptime, and no subscription requirements.

---

## What is OpenRouter?

OpenRouter is a unified interface for Large Language Models (LLMs) that provides:

- **500+ Models**: Access to Claude, GPT, Gemini, Llama, and more
- **60+ Providers**: Microsoft, NVIDIA, Meta, Google, Amazon, OpenAI, Anthropic, and others
- **Unified API**: OpenAI-compatible API that works with any model
- **Better Pricing**: Competitive pricing across all providers
- **High Availability**: Distributed infrastructure with automatic fallbacks
- **No Subscription**: Pay-as-you-go with no monthly commitments

Reference: [OpenRouter Official Website](https://openrouter.ai/)

---

## Setup Instructions

### 1. Create OpenRouter Account

1. Visit [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up using:
   - Google
   - GitHub
   - MetaMask

### 2. Buy Credits

1. Navigate to the Credits section
2. Purchase credits (starting from $10)
3. Credits can be used with any model or provider

### 3. Get API Key

1. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Create a new API key
3. Copy the key (format: `sk-or-...`)
4. Keep it secure - it won't be shown again

---

## Configuration in Zorost Local UI for Weaviate

### Step 1: Open API Keys Modal

1. Navigate to the **Chat** tab in the application
2. Click the **Configure LLM** button in the header

### Step 2: Select OpenRouter

1. In the API Keys modal, click on the **OpenRouter** provider tab
2. You'll see:
   - Provider name: "OpenRouter"
   - Description: "Access 500+ models from 60+ providers with unified API"
   - Purple badge indicating the provider

### Step 3: Enter API Key

1. Paste your OpenRouter API key in the input field
2. Format: `sk-or-v1-...`
3. Click **Save Configuration**

### Step 4: Start Chatting

1. Your API key is stored securely in your browser (localStorage)
2. Select a collection from the dropdown
3. Start asking questions - the app will use OpenRouter's Claude 3.7 Sonnet by default

---

## Vector Store Connection

### How It Works

The chat system follows this flow:

1. **User Input**: You ask a question about your data
2. **Vector Search**: The app searches your Weaviate database using hybrid search
3. **Context Retrieval**: Relevant objects are retrieved from your selected collection
4. **LLM Processing**: Context + Question sent to OpenRouter
5. **AI Response**: Claude analyzes the context and generates an answer
6. **Source Attribution**: Response includes which objects were used

### Example Flow

```
User: "What are the main features mentioned in the documents?"

1. Vector Search: Query "main features documents"
   -> Searches className: "Document"
   -> Retrieves top 5 relevant objects

2. Context Preparation:
   Source 1:
   title: "Product Features"
   content: "Advanced search, real-time updates..."
   
   Source 2:
   title: "Technical Specs"
   content: "AI-powered, scalable architecture..."

3. OpenRouter Request:
   Model: anthropic/claude-3.7-sonnet
   Context: [Prepared sources]
   Question: "What are the main features mentioned?"

4. AI Response:
   "Based on the documents, the main features include:
   1. Advanced search capabilities
   2. Real-time updates
   3. AI-powered analysis
   4. Scalable architecture
   
   Sources: Document objects [abc123, def456]"
```

---

## Available Models

### Recommended Models (via OpenRouter)

#### Claude 3.7 Sonnet (Default)
- Model ID: `anthropic/claude-3.7-sonnet`
- Best for: Comprehensive analysis, detailed responses
- Context: 200K tokens
- Performance: 2.1s latency

#### GPT-5
- Model ID: `openai/gpt-5`
- Best for: Tool calling, complex reasoning
- Context: 128K tokens
- Performance: 7.4s latency

#### Gemini 2.5 Pro
- Model ID: `google/gemini-2.5-pro`
- Best for: Large context windows
- Context: 2M tokens
- Performance: 2.5s latency

### Model Selection

Currently, the app uses Claude 3.7 Sonnet by default. To use other models, modify the model parameter in:

```typescript
// src/app/api/chat/enhanced/route.ts
model: 'anthropic/claude-3.7-sonnet'
```

Change to any supported model:
- `openai/gpt-5`
- `google/gemini-2.5-pro`
- `meta-llama/llama-3.1-405b`
- And 500+ more

---

## LLM Provider Priority

The application automatically selects the LLM provider in this order:

1. **OpenRouter** (if API key configured) - Recommended
2. **OpenAI Direct** (if API key configured)
3. **Local LLM** (if endpoint configured)
4. **Context-Only** (fallback - no AI, just shows retrieved data)

---

## Local LLM Support

### Ollama Integration

For local models using Ollama:

1. Install Ollama: [https://ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3`
3. Start Ollama: `ollama serve`
4. Configure endpoint: `http://localhost:11434/api/generate`

### LM Studio Integration

For LM Studio:

1. Download LM Studio
2. Load a model
3. Start local server
4. Configure endpoint in the app

### Advantages of Local LLMs

- Privacy: Data never leaves your machine
- Cost: Free to use after download
- Offline: Works without internet
- Customization: Fine-tune models

---

## OpenAI Direct Integration

If you prefer OpenAI's official API:

1. Get API key: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Configure in the OpenAI tab
3. Uses GPT-4-Turbo by default

---

## API Usage Example

### Direct API Call

```javascript
const response = await fetch('/api/chat/enhanced', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: "What is machine learning?",
    className: "Document",
    limit: 5,
    apiKeys: {
      openrouter: "sk-or-v1-your-key-here",
      openai: "",
      cohere: "",
      huggingface: "",
      localLLM: ""
    },
    llmProvider: "openrouter"
  })
});

const data = await response.json();
console.log(data.answer);
console.log(data.sources);
console.log(data.metadata);
```

### Response Format

```json
{
  "answer": "Machine learning is...",
  "sources": [
    {
      "id": "uuid-123",
      "title": "ML Introduction",
      "content": "...",
      "_additional": {
        "score": 0.95
      }
    }
  ],
  "metadata": {
    "model": "claude-3.7-sonnet (via OpenRouter)",
    "provider": "openrouter",
    "responseTime": 1641735000000,
    "totalSources": 5
  }
}
```

---

## Cost Optimization

### OpenRouter Benefits

- **Better Pricing**: Often 50% cheaper than direct provider APIs
- **No Minimums**: Start with as little as $10
- **Free BYOK**: 1M free requests per month if you bring your own keys
- **Volume Discounts**: Available for high-volume usage

### Tips to Save Money

1. **Use Appropriate Models**: 
   - Simple queries: Use smaller models
   - Complex analysis: Use larger models

2. **Limit Context**: 
   - Default: 5 sources
   - Increase only when needed

3. **Optimize Prompts**: 
   - Shorter prompts = lower costs
   - Clear questions = better responses

4. **Monitor Usage**:
   - Check OpenRouter dashboard
   - Track spending patterns

---

## Troubleshooting

### Common Issues

#### 1. "No response generated"

**Cause**: API key invalid or expired

**Solution**:
- Verify API key is correct
- Check credits balance
- Generate new key if needed

#### 2. "Error: Unauthorized"

**Cause**: Invalid or missing API key

**Solution**:
- Open Configure LLM modal
- Re-enter API key
- Save configuration

#### 3. "No relevant data found"

**Cause**: No matching data in vector database

**Solution**:
- Check if collection has data
- Try different search query
- Add more data to collection

#### 4. Slow Responses

**Cause**: Large context or complex model

**Solution**:
- Reduce number of sources (limit)
- Use faster model
- Check network connection

---

## Security Best Practices

### API Key Storage

- Keys stored in browser localStorage
- Never committed to git
- Not sent to external servers except LLM providers
- Cleared on logout/clear cache

### Data Privacy

- **OpenRouter**: Follow their [privacy policy](https://openrouter.ai/privacy)
- **OpenAI**: Data used for training unless opted out
- **Local LLM**: Complete privacy, no data leaves your machine

### Recommendations

1. **Use Local LLM** for sensitive data
2. **Rotate Keys** regularly
3. **Monitor Usage** for unusual activity
4. **Set Spending Limits** in OpenRouter dashboard

---

## Advanced Configuration

### Custom Model Selection

Edit `/src/app/api/chat/enhanced/route.ts`:

```typescript
const completion = await openrouter.chat.completions.create({
  model: 'anthropic/claude-3.7-sonnet', // Change this
  messages: [...],
  max_tokens: 1000, // Adjust based on needs
  temperature: 0.7, // 0.0-1.0, lower = more focused
});
```

### Multiple Models Strategy

Implement model routing based on query type:

```typescript
let selectedModel = 'anthropic/claude-3.7-sonnet';

if (query.length < 50) {
  // Simple questions
  selectedModel = 'meta-llama/llama-3.1-8b';
} else if (query.includes('analyze') || query.includes('compare')) {
  // Complex analysis
  selectedModel = 'openai/gpt-5';
}
```

---

## Performance Metrics

### Latency Comparison

| Provider | Model | Average Latency |
|----------|-------|-----------------|
| OpenRouter | Claude 3.7 Sonnet | 2.1s |
| OpenRouter | GPT-5 | 7.4s |
| OpenRouter | Gemini 2.5 Pro | 2.5s |
| OpenAI Direct | GPT-4-Turbo | 3-5s |
| Local (Ollama) | Llama 3 | 1-3s (hardware dependent) |

### Token Usage

Typical chat query:
- System prompt: ~100 tokens
- Context (5 sources): ~500-1000 tokens
- User question: ~20-50 tokens
- Response: ~200-500 tokens

**Total**: ~820-1650 tokens per query

---

## Support and Resources

### OpenRouter Resources

- Website: [https://openrouter.ai/](https://openrouter.ai/)
- Status: [https://openrouter.ai/status](https://openrouter.ai/status)
- Documentation: [https://openrouter.ai/docs](https://openrouter.ai/docs)
- Discord: Join OpenRouter community

### Application Support

- GitHub: [https://github.com/zorost/Zorost-Local-UI-for-Weaviate](https://github.com/zorost/Zorost-Local-UI-for-Weaviate)
- Issues: [https://github.com/zorost/Zorost-Local-UI-for-Weaviate/issues](https://github.com/zorost/Zorost-Local-UI-for-Weaviate/issues)
- Website: [https://zorost.com](https://zorost.com)
- Contact: [https://zorost.com/contact](https://zorost.com/contact)

---

## Conclusion

The Zorost Local UI for Weaviate now provides enterprise-grade AI chat capabilities through OpenRouter integration, offering:

- Access to 500+ models from 60+ providers
- Seamless vector database integration
- Cost-effective pricing
- High availability and performance
- Support for local LLMs

Choose the LLM provider that best fits your needs:
- **OpenRouter**: Best overall, most models, best prices
- **OpenAI**: Direct access to GPT models
- **Local LLM**: Maximum privacy and control

---

**Developed by Zorost Intelligence**

**Visit: [https://zorost.com](https://zorost.com)**

**© 2025 Zorost Intelligence. All rights reserved.**

