#!/bin/bash
cd /home/testdone/testdone/backend

echo "Reading DATABASE_URL..."
# Be careful with strict grep
DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2-)
echo "URL found: $DB_URL"

echo "Exporting..."
export DATABASE_URL="$DB_URL"

echo "Running Node with Explicit Env..."
# Kill any rogue 5000 process
fuser -k 5000/tcp || true

node dist/index.js > /root/manual_explicit.log 2>&1 &
NODE_PID=$!

echo "Waiting for startup (5s)..."
sleep 5

echo "Checking logs head..."
head -n 20 /root/manual_explicit.log

echo "Curling..."
curl -I http://localhost:5000/api/v1/exams

echo "Cleaning up..."
kill $NODE_PID
