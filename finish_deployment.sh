#!/bin/bash
set -e
echo "Finishing Deployment..."
LOGfile="/root/finish_deployment.log"
exec &> "$LOGfile"

cd /home/testdone/testdone/backend

echo "Generating Prisma Client..."
npx prisma generate

echo "Rebuilding Backend..."
npm run build

echo "Restarting Backend..."
pm2 restart testdone-backend

echo "Rebuilding Frontend..."
cd ../frontend

echo "Installing Frontend Deps..."
npm install

echo "Building Frontend..."
npm run build

echo "Restarting Frontend..."
pm2 restart testdone-frontend

echo "DEPLOYMENT SUCCESS!"
