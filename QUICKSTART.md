# Quick Start Guide

Get your Zorost Local UI for Weaviate running in **5 minutes**!

## Prerequisites Check

 Node.js 20+ installed  
 Docker Desktop running  
 Terminal/Command prompt open

## Step 1: Install Dependencies

```bash
cd weaviate-local-app
npm install
```

⏱ Takes about 2-3 minutes

## Step 2: Configure Environment

```bash
cp env.template .env
```

The default settings work for local development!

## Step 3: Start Everything

### Option A: Use the Startup Script (Recommended)

```bash
./start.sh
```

### Option B: Manual Start

```bash
# Terminal 1: Start Docker services
docker-compose up -d

# Wait 30 seconds for Weaviate to start

# Terminal 2: Start the app
npm run dev
```

## Step 4: Access the Application

Open your browser to:

```
http://localhost:9501
```

 **You're all set!**

## What You Can Do Now

### 1. View Dashboard
- See statistics about your Weaviate instance
- Monitor classes and objects
- Check system health

### 2. Browse Data
- Create new classes
- Add objects to classes
- Search and filter data
- Import/export data

### 3. Chat with AI
- Select a class
- Go to the Chat tab
- Ask questions about your data
- Get AI-generated answers

## Creating Your First Class

1. Click the **Data Browser** tab
2. Click the **+** button in the sidebar
3. Enter a class name (e.g., "Article")
4. Add a description
5. Click **Create**

## Adding Objects

1. Select your class from the sidebar
2. Click **Import** or create objects via API
3. View and manage your data

## Chat Example

```
User: What articles do we have about AI?
AI: Based on the data, we have 5 articles about AI...
```

## Stopping the Application

```bash
# If you used start.sh
Ctrl+C in the terminal

# Stop Docker services
./stop.sh

# Or manually
docker-compose down
```

## Common Commands

```bash
# View Docker logs
docker-compose logs -f weaviate

# Restart Docker services
docker-compose restart

# Check if Weaviate is running
curl http://localhost:8080/v1/meta

# Build for production
npm run build
npm start
```

## Troubleshooting

### Port 3000 Already in Use?

Change the port in `package.json`:
```json
"dev": "next dev --turbopack --port 3001"
```

### Weaviate Won't Start?

```bash
docker-compose down -v
docker-compose up -d
```

### Can't Connect?

1. Check Docker is running: `docker ps`
2. Check Weaviate status: `curl http://localhost:8080/v1/meta`
3. Verify `.env` settings

## Next Steps

 Read the full [README.md](README.md)  
 See [SETUP.md](SETUP.md) for detailed setup  
🤝 Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute  

## Getting Help

- Check the documentation files
- Review the code comments
- Open an issue on [GitHub](https://github.com/zorost/Zorost-Local-UI-for-Weaviate/issues)
- Visit [zorost.com](https://zorost.com)
- Contact us at [zorost.com/contact](https://zorost.com/contact)

---

**Made with  by [Zorost Intelligence](https://zorost.com)**

**© 2025 Zorost Intelligence. All rights reserved.**

**Ready to build something amazing!** 

