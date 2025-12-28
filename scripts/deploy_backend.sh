#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Backend Deployment Setup..."

# 1. Update System & Install Dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl git unzip nginx

# 2. Install Node.js v20
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed"
fi

# 3. Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    sudo npm install -g pnpm
else
    echo "✅ pnpm is already installed"
fi

# 4. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed"
fi

# 5. Setup Project Directory
PROJECT_DIR="$HOME/Sketch"

if [ -d "$PROJECT_DIR" ]; then
    echo "📂 Project directory exists. Pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "📂 Cloning repository..."
    git clone https://github.com/dheeraj1717/Sketch.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 6. Install Project Dependencies
echo "📦 Installing project dependencies..."
pnpm install

# 7. Generate Prisma Client
echo "🗄️ Generating Prisma Client..."
pnpm --filter db generate

# 8. Build Dependencies (Explicit Order)
echo "🛠️ Building common packages..."
pnpm --filter @repo/db build
pnpm --filter @repo/common build
pnpm --filter @repo/backend-common build

# 9. Build Backends
echo "🛠️ Building http-backend..."
pnpm --filter http-backend build

echo "🛠️ Building ws-backend..."
pnpm --filter ws-backend build

# 9a. Configure Nginx (Reverse Proxy)
echo "🌐 Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

# Create Nginx Config
sudo bash -c 'cat > /etc/nginx/sites-available/sketch-backend <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/sketch-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Configure Environment Variables (User must provide .env)
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file is missing!"
    echo "creating a placeholder .env file..."
    touch .env
    echo "Please edit the .env file with your actual secrets."
fi

# 10. Start Services with PM2
echo "🚀 Starting services with PM2..."

# Start HTTP Backend
cd apps/http-backend
pm2 delete http-backend 2>/dev/null || true
pm2 start ecosystem.config.js
cd ../..

# Start WS Backend
cd apps/ws-backend
pm2 delete ws-backend 2>/dev/null || true
pm2 start ecosystem.config.js
cd ../..

# Save PM2 List
pm2 save

echo "✅ Backend Deployment Complete!"
echo "👉 Make sure to update your .env file with DATABASE_URL, JWT_SECRET, and FRONTEND_URL"
echo "👉 Ensure Security Groups allow ports 3001 and 8080"
