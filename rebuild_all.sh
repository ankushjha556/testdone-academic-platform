#!/bin/bash
set -e

# Load NVM or set PATH (adjust if needed, assuming default installation location)
export PATH=$PATH:/root/.nvm/versions/node/v20.18.3/bin
export PATH=$PATH:/usr/bin:/usr/local/bin

echo "=== STARTING FULL REBUILD ==="

# Backend Rebuild
echo "--- Rebuilding Backend ---"
cd /home/testdone/testdone/backend
rm -rf node_modules dist
npm ci
npx prisma generate
npm run build

# Frontend Rebuild
echo "--- Rebuilding Frontend ---"
cd /home/testdone/testdone/frontend
rm -rf node_modules .next
npm ci
# Set required env vars for build time if needed
export NEXT_PUBLIC_API_URL=https://testdone.in/api/v1
export NEXT_PUBLIC_APP_URL=https://testdone.in
npm run build

# Restart Services
echo "--- Restarting PM2 Services ---"
pm2 restart all
pm2 save

echo "=== REBUILD COMPLETE ==="
