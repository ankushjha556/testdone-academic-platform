#!/bin/bash
set -e
echo "Starting Recovery..."
LOGfile="/root/fix_deployment.log"
exec &> "$LOGfile"

# 1. Extract files to CORRECT location
echo "Extracting files to CORRECT location..."
cd /home/testdone/testdone
tar -xvf /home/testdone/mistake_intelligence_deploy.tar

# 2. Check files
ls -l frontend/src/app/smart-practice/page.tsx
ls -l backend/src/routes/mistake.routes.ts

# 3. Run Migration (now schema should be updated)
echo "Running migration..."
cd backend
npx prisma migrate deploy

# 4. Rebuild Backend
echo "Rebuilding Backend..."
npm install
npm run build

# 5. Restart Backend
echo "Restarting Backend..."
pm2 restart testdone-backend

# 6. Rebuild Frontend
echo "Rebuilding Frontend..."
cd ../frontend
npm install
npm run build

# 7. Restart Frontend
echo "Restarting Frontend..."
pm2 restart testdone-frontend

echo "RECOVERY COMPLETE!"
