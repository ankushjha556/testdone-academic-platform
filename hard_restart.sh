#!/bin/bash
cd /home/testdone/testdone/backend

echo "Current PM2 List:"
pm2 list

echo "Stopping all related processes..."
pm2 stop testdone-backend || true
pm2 delete testdone-backend || true
pm2 delete backend || true

echo "Starting Fresh..."
# Ensure we are in the backend dir
pwd
ls -l .env
# Start process
pm2 start dist/index.js --name testdone-backend

echo "Saving PM2 list..."
pm2 save

echo "New PM2 List:"
pm2 list

echo "Check logs..."
# Wait a second for compilation/startup
sleep 2
pm2 logs testdone-backend --lines 30 --nostream > /root/hard_restart.log
