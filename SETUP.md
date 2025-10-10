# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v20.x or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **yarn**
   - Comes with Node.js
   - Verify installation: `npm --version`

3. **Docker Desktop**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Required for running Weaviate locally

4. **Git** (optional, for cloning the repository)
   - Download from [git-scm.com](https://git-scm.com/)

## Installation Steps

### 1. Clone or Download the Repository

```bash
# Option A: Clone with Git
git clone https://github.com/zorost/weaviate-local-app.git
cd weaviate-local-app

# Option B: Download ZIP and extract
# Then navigate to the extracted folder
cd weaviate-local-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required Node.js packages defined in `package.json`.

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp env.template .env
```

Edit `.env` and configure your settings:

```env
# Weaviate Configuration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_SCHEME=http
WEAVIATE_API_KEY=admin-key

# Optional: External API Keys for AI Features
OPENAI_API_KEY=your_openai_key_here
COHERE_API_KEY=your_cohere_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here

# Public Configuration (accessible by browser)
NEXT_PUBLIC_WEAVIATE_HOST=localhost
NEXT_PUBLIC_WEAVIATE_PORT=8080
NEXT_PUBLIC_WEAVIATE_PROTOCOL=http
NEXT_PUBLIC_WEAVIATE_API_KEY=admin-key
```

### 4. Start Weaviate Database

```bash
# Start Weaviate and supporting services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs if needed
docker-compose logs -f weaviate
```

Wait 30-60 seconds for Weaviate to fully start.

### 5. Verify Weaviate is Running

Test the connection:

```bash
curl http://localhost:8080/v1/meta
```

You should see JSON output with Weaviate's version and configuration.

### 6. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode (requires build first)
npm run build
npm start
```

### 7. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the Zorost Local UI for Weaviate interface!

## Quick Start Script

For convenience, you can use the startup script:

```bash
./start.sh
```

This script will:
1. Start Docker services
2. Wait for Weaviate to be ready
3. Start the Next.js application

To stop everything:

```bash
./stop.sh
```

## Troubleshooting

### Port Already in Use

If port 9501 is already in use, you can change it in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3003",
    "start": "next start --port 3003"
  }
}
```

### Weaviate Won't Start

1. Check Docker is running:
   ```bash
   docker info
   ```

2. Check logs for errors:
   ```bash
   docker-compose logs weaviate
   ```

3. Restart Docker Desktop

4. Clear volumes and restart:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Cannot Connect to Weaviate

1. Verify Weaviate is running:
   ```bash
   curl http://localhost:8080/v1/meta
   ```

2. Check your `.env` configuration

3. Verify firewall settings aren't blocking port 8080

### Module Installation Errors

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Use a specific Node version (recommend v20.x):
   ```bash
   nvm install 20
   nvm use 20
   npm install
   ```

### Build Errors

1. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run build
   ```

2. Check TypeScript errors:
   ```bash
   npm run type-check
   ```

## Development Tips

### Hot Reload

The development server (`npm run dev`) includes hot reload. Any changes to your code will automatically refresh the browser.

### TypeScript

All code is written in TypeScript. Type errors will appear in your IDE and during build.

To check types without building:

```bash
npm run type-check
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

### Tailwind CSS

The project uses Tailwind CSS v4. Classes are available in all components.

## Next Steps

After setup:

1.  Explore the **Dashboard** to see statistics
2.  Try the **Data Browser** to manage classes and objects
3.  Use the **Chat** interface for RAG queries
4.  Create your first class and add data
5.  Configure vectorizers for semantic search

## Additional Resources

- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Getting Help

If you encounter issues:

1. Check this setup guide
2. Review the main [README.md](README.md)
3. Check [GitHub Issues](https://github.com/zorost/Zorost-Local-UI-for-Weaviate/issues)
4. Visit [zorost.com](https://zorost.com)
5. Contact us at [zorost.com/contact](https://zorost.com/contact)

---

**Made with  by [Zorost Intelligence](https://zorost.com)**

**© 2025 Zorost Intelligence. All rights reserved.**

**Happy Coding! **

