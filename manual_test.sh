#!/bin/bash
cd /home/testdone/testdone/backend

echo "Stopping PM2..."
pm2 stop testdone-backend

echo "Running Manual Node..."
export PORT=5001
# Log to specific file
node dist/index.js > /root/manual_node.log 2>&1 &
NODE_PID=$!

echo "Waiting for startup (5s)..."
sleep 5

echo "Checking logs head..."
head -n 10 /root/manual_node.log

echo "Curling..."
curl -I http://localhost:5001/api/v1/exams

echo "Cleaning up..."
kill $NODE_PID
echo "Restarting PM2..."
pm2 start testdone-backend
