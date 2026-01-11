#!/bin/bash
# Update DATABASE_URL in backend .env
cd /home/testdone/testdone/backend
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://testdone:Ankush@2004@127.0.0.1:5432/testdone?schema=public|' .env
echo "Updated DATABASE_URL"

# Install backend dependencies
npm install
npx prisma generate

# Build frontend
cd /home/testdone/testdone/frontend  
npm install
npm run build
