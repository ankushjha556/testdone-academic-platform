#!/bin/bash
cd /home/testdone/testdone/backend

echo "Stopping existing process..."
pm2 delete testdone-backend || true

echo "Loading Environment..."
set -a
source .env
set +a
echo "DATABASE_URL is set to: ${DATABASE_URL:0:20}..."

echo "Starting Backend..."
pm2 start dist/index.js --name testdone-backend

echo "Saving PM2..."
pm2 save

echo "Checking logs (10s)..."
run_check() {
  sleep 5
  pm2 logs testdone-backend --lines 20 --nostream
}
run_check > /root/final_fix_logs.log 2>&1

echo "Done."
