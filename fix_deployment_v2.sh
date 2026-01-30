#!/bin/bash
set -e
echo "Starting Recovery V2..."
LOGfile="/root/fix_deployment_v2.log"
exec &> "$LOGfile"

# 1. Extract files (already in correct place, but ensuring)
cd /home/testdone/testdone
# tar -xvf ... (optional, good to ensure)

# 2. Resolve blocking migration
echo "Resolving blocking migration..."
cd backend
npx prisma migrate resolve --applied 20260110170802_add_download_ticket || echo "Already applied or failed to resolve"

# 3. Run Migration verify
echo "Running migration deploy..."
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

echo "RECOVERY V2 COMPLETE!"
