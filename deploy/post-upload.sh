#!/bin/bash

# ============================================
# TestDone Post-Upload Setup Script
# Run this AFTER uploading code to /var/www/testdone
# ============================================

set -e

APP_DIR="/var/www/testdone"
cd $APP_DIR

echo "🔧 Installing dependencies..."

# Install backend dependencies
if [ -d "backend" ]; then
    # Ensure .env exists for backend (from deploy/.env.production)
    if [ -f "deploy/.env.production" ]; then
        cp deploy/.env.production backend/.env
        echo "✅ Copied .env.production to backend/.env"
    fi

    echo "Installing backend dependencies (including dev)..."
    cd backend
    # Need devDependencies for tsc and tsx (seed)
    npm install --include=dev
    npx prisma generate

    # Push database schema
    echo "Pushing database schema..."
    npx prisma db push

    # Seed database
    echo "Seeding database..."
    npm run db:seed || echo "Seed may have already run or failed"
    cd ..
fi

# Frontend
if [ -d "frontend" ]; then
    echo "📦 Setting up Frontend..."
    cd frontend
    
    # Ensure .env.production exists
    if [ -f "../deploy/.env.production" ]; then
        cp ../deploy/.env.production .env.production
        echo "✅ Copied .env.production to frontend"
    fi

    if [ -f "package.json" ]; then
        echo "Installing frontend dependencies (including dev)..."
        npm install --include=dev
        
        echo "Building frontend..."
        # We allow build to fail but catch error to print request
        npm run build || { echo "❌ Frontend build failed"; exit 1; }
    fi
    cd ..
fi

# Create logs directory
mkdir -p logs

# Configure Nginx & SSL
echo "Configuring Nginx & SSL..."
# Ensure Certbot is installed
sudo apt-get update -y && sudo apt-get install -y certbot python3-certbot-nginx || echo "Certbot installation warning"

if [ -d "/etc/letsencrypt/live/testdone.in" ]; then
    echo "🔒 SSL Certificates detected. Strengthening configuration..."
    # Re-run certbot to ensure Nginx config is correct (redirect behavior)
    sudo certbot --nginx -d testdone.in -d www.testdone.in --non-interactive --redirect --agree-tos -m admin@testdone.in || echo "Certbot renewal/config failed"
else
    echo "🌐 SSL Not found. Initializing HTTP and requesting Certs..."
    if [ -f "deploy/nginx.http.conf" ]; then
        sudo cp deploy/nginx.http.conf /etc/nginx/sites-available/testdone.in
        sudo ln -sf /etc/nginx/sites-available/testdone.in /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    # Request Certs
    sudo certbot --nginx -d testdone.in -d www.testdone.in --non-interactive --redirect --agree-tos -m admin@testdone.in || echo "Failed to obtain SSL certs. Check DNS."
fi

# Start with PM2
echo "Starting applications with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✅ Applications started!"
echo "Run 'pm2 status' to check"
echo "Check https://testdone.in"
