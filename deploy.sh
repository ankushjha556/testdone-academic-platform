#!/bin/bash
set -euo pipefail

APP_DIR=/home/testdone/testdone
BRANCH=main

echo "[DEPLOY] Starting deployment at $(date)"
cd $APP_DIR

# Fetch and reset to latest
echo "[DEPLOY] Pulling latest code from origin/$BRANCH"
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# Backend build (skip prisma migrate on prod)
echo "[DEPLOY] Building backend..."
cd $APP_DIR/backend
npm ci --production=false
npx prisma generate
npm run build --if-present

# Frontend build
echo "[DEPLOY] Building frontend..."
cd $APP_DIR/frontend
npm ci --production=false
npm run build

# Reload PM2 apps
echo "[DEPLOY] Reloading PM2 services..."
cd $APP_DIR
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

# Verify
echo "[DEPLOY] Verifying deployment..."
pm2 status
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://127.0.0.1:5000/api/v1/health || echo "Backend check skipped"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://127.0.0.1:3000/ || echo "Frontend check skipped"
echo "[DEPLOY] Deployment completed at $(date)"
