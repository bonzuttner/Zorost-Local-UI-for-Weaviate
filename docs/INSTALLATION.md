# Installation Guide

Complete installation instructions for all platforms and deployment scenarios.

**Developed by Zorost Intelligence**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Install](#quick-install)
3. [Platform-Specific Guides](#platform-specific-guides)
   - [macOS](#macos)
   - [Windows](#windows)
   - [Linux](#linux)
4. [Installation Methods](#installation-methods)
   - [NPM/Yarn](#npmyarn-installation)
   - [Docker](#docker-installation)
   - [Kubernetes](#kubernetes-installation)
   - [Cloud Platforms](#cloud-platform-installation)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Download Link |
|----------|----------------|-------------|---------------|
| Node.js | 18.x | 20.x+ | [nodejs.org](https://nodejs.org/) |
| npm | 8.x | 10.x+ | Included with Node.js |
| Docker | 20.x | 24.x+ | [docker.com](https://docker.com/) |
| Git | 2.x | Latest | [git-scm.com](https://git-scm.com/) |

### System Requirements

**Minimum:**
- RAM: 4 GB
- Disk Space: 2 GB
- CPU: 2 cores

**Recommended:**
- RAM: 8 GB+
- Disk Space: 10 GB+
- CPU: 4 cores+

---

## Quick Install

The fastest way to get started:

```bash
# Clone repository
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate

# Install and start
npm install
./start.sh
```

**Access:** http://localhost:9501

---

## Platform-Specific Guides

### macOS

#### Using Homebrew (Recommended)

```bash
# Install prerequisites
brew install node docker git

# Start Docker Desktop
open -a Docker

# Clone and install
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate
npm install

# Configure environment
cp env.template .env

# Start services
./start.sh
```

#### Using Mac App Store

1. Install Docker Desktop from Mac App Store
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Download Node.js installer from [nodejs.org](https://nodejs.org/)
4. Follow Quick Install steps above

---

### Windows

#### Using Windows Terminal (Recommended)

```powershell
# Install Node.js and Git
# Download from nodejs.org and git-scm.com

# Install Docker Desktop
# Download from docker.com

# Clone repository
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate

# Install dependencies
npm install

# Copy environment file
copy env.template .env

# Start Docker Desktop manually

# Start Weaviate
docker-compose up -d

# Start application
npm run dev
```

#### Using WSL2 (Advanced)

```bash
# In WSL2 terminal
# Ensure Docker Desktop is configured for WSL2

# Follow Linux installation steps
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate
npm install
./start.sh
```

---

### Linux

#### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install git -y

# Clone and install
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate
npm install
cp env.template .env
./start.sh
```

#### RHEL/CentOS/Fedora

```bash
# Install Node.js
sudo dnf module install nodejs:20

# Install Docker
sudo dnf install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Git
sudo dnf install git -y

# Clone and install
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate
npm install
cp env.template .env
./start.sh
```

#### Arch Linux

```bash
# Install prerequisites
sudo pacman -S nodejs npm docker git

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Clone and install
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate
npm install
cp env.template .env
./start.sh
```

---

## Installation Methods

### NPM/Yarn Installation

#### Standard NPM

```bash
# Clone repository
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate

# Install dependencies
npm install

# Configure
cp env.template .env
nano .env  # Edit configuration

# Start Weaviate
docker-compose up -d

# Start application
npm run dev  # Development
npm run build && npm start  # Production
```

#### Using Yarn

```bash
# Install Yarn
npm install -g yarn

# Clone repository
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate

# Install dependencies
yarn install

# Configure
cp env.template .env

# Start
yarn dev  # Development
yarn build && yarn start  # Production
```

#### Using pnpm

```bash
# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate

# Install dependencies
pnpm install

# Configure
cp env.template .env

# Start
pnpm dev  # Development
pnpm build && pnpm start  # Production
```

---

### Docker Installation

#### Full Stack (Recommended)

```bash
# Clone repository
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Application Only

```bash
# Build image
docker build -t weaviate-local-app .

# Run container
docker run -d \
  -p 3000:3000 \
  -e WEAVIATE_HOST=host.docker.internal \
  -e WEAVIATE_PORT=8080 \
  -e WEAVIATE_API_KEY=admin-key \
  --name weaviate-app \
  weaviate-local-app

# View logs
docker logs -f weaviate-app

# Stop container
docker stop weaviate-app
docker rm weaviate-app
```

#### Using Docker Hub

Visit [zorost.com](https://zorost.com) for official Docker images and updates.

```bash
# Pull image
docker pull zorost/weaviate-local-app:latest

# Run
docker run -d -p 9501:9501 zorost/weaviate-local-app:latest
```

---

### Kubernetes Installation

#### Using Helm (Recommended)

Visit [zorost.com](https://zorost.com) for Helm charts and Kubernetes resources.

```bash
# Add Helm repository
helm repo add zorost https://charts.zorost.com
helm repo update

# Install
helm install weaviate-app zorost/weaviate-local-app \
  --set weaviate.host=weaviate-service \
  --set weaviate.port=8080

# Check status
kubectl get pods
kubectl get services
```

#### Using kubectl

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: weaviate-local-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: weaviate-local-app
  template:
    metadata:
      labels:
        app: weaviate-local-app
    spec:
      containers:
      - name: app
        image: zorost/weaviate-local-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: WEAVIATE_HOST
          value: "weaviate-service"
        - name: WEAVIATE_PORT
          value: "8080"
---
apiVersion: v1
kind: Service
metadata:
  name: weaviate-local-app-service
spec:
  selector:
    app: weaviate-local-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl get services
```

---

### Cloud Platform Installation

#### Vercel (Recommended)

1. **One-Click Deploy:**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zorost/Zorost-Local-UI-for-Weaviate)

2. **CLI Deploy:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

3. **Configure Environment:**
   - Go to Project Settings → Environment Variables
   - Add your Weaviate connection details

#### Netlify

1. **One-Click Deploy:**
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/zorost/Zorost-Local-UI-for-Weaviate)

2. **CLI Deploy:**
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```

#### AWS (EC2)

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install prerequisites
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and install
git clone https://github.com/zorost/Zorost-Local-UI-for-Weaviate.git
cd Zorost-Local-UI-for-Weaviate
npm install
cp env.template .env

# Configure for production
nano .env

# Start with PM2
npm install -g pm2
npm run build
pm2 start npm --name "weaviate-app" -- start
pm2 save
pm2 startup
```

#### Google Cloud Platform (Cloud Run)

```bash
# Install gcloud CLI
# Visit: https://cloud.google.com/sdk/docs/install

# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/weaviate-app

# Deploy
gcloud run deploy weaviate-app \
  --image gcr.io/YOUR_PROJECT/weaviate-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure (App Service)

```bash
# Install Azure CLI
# Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create resource group
az group create --name weaviate-app-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name weaviate-app-plan \
  --resource-group weaviate-app-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group weaviate-app-rg \
  --plan weaviate-app-plan \
  --name weaviate-app \
  --runtime "NODE|20-lts"

# Deploy
az webapp deployment source config \
  --name weaviate-app \
  --resource-group weaviate-app-rg \
  --repo-url https://github.com/zorost/Zorost-Local-UI-for-Weaviate \
  --branch main \
  --manual-integration
```

#### DigitalOcean (App Platform)

1. **Via Dashboard:**
   - Go to Apps → Create App
   - Connect GitHub repository
   - Configure build settings
   - Deploy

2. **Via CLI:**
   ```bash
   # Install doctl
   # Visit: https://docs.digitalocean.com/reference/doctl/

   # Create app spec
   doctl apps create --spec .do/app.yaml
   ```

---

## Verification

### Check Installation

```bash
# Verify Node.js
node --version  # Should be 20.x+

# Verify npm
npm --version  # Should be 10.x+

# Verify Docker
docker --version  # Should be 24.x+
docker ps  # Should list running containers

# Verify Git
git --version  # Should be 2.x+
```

### Test Application

```bash
# Check if Weaviate is running
curl http://localhost:8080/v1/meta

# Check if app is running
curl http://localhost:9501

# Open in browser
open http://localhost:9501  # macOS
start http://localhost:9501  # Windows
xdg-open http://localhost:9501  # Linux
```

### Health Checks

```bash
# Check Weaviate status
curl -H "Authorization: Bearer admin-key" \
  http://localhost:8080/v1/.well-known/ready

# Check app API
curl http://localhost:9501/api/weaviate/status

# Check Docker containers
docker ps | grep weaviate
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or change port in package.json
```

#### Docker Not Running

```bash
# Start Docker service
sudo systemctl start docker  # Linux
open -a Docker  # macOS
# Use Docker Desktop icon on Windows
```

#### Permission Errors

```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER node_modules

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Getting Help

-  [Documentation](../README.md)
-  [GitHub Issues](https://github.com/zorost/Zorost-Local-UI-for-Weaviate/issues)
-  [Discussions](https://github.com/zorost/Zorost-Local-UI-for-Weaviate/discussions)

---

**Made with  by Zorost Intelligence**

© 2025 Zorost Intelligence. All rights reserved.

