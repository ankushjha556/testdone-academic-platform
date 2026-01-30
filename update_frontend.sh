#!/bin/bash
cd /home/testdone/testdone/frontend

echo "Installing Deps..."
npm install

echo "Building Frontend..."
# Ensure env vars are present during build
export FEATURE_MISTAKE_INTELLIGENCE=true
export FEATURE_SMART_PRACTICE=true
export NEXT_PUBLIC_FEATURE_MISTAKE_INTELLIGENCE=true
export NEXT_PUBLIC_FEATURE_SMART_PRACTICE=true

npm run build

echo "Restarting Frontend..."
pm2 restart frontend --update-env

echo "Done."
