#!/bin/bash
# Fix database password
sudo -u postgres psql -c "ALTER USER testdone WITH PASSWORD 'TestDone2024';"

# Update .env file
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://testdone:TestDone2024@127.0.0.1:5432/testdone?schema=public|' /home/testdone/testdone/backend/.env

# Regenerate Prisma client
cd /home/testdone/testdone/backend
npx prisma generate

# Restart backend
pm2 restart testdone-backend

echo "Done! Testing connection..."
sleep 3
curl -s http://127.0.0.1:5000/api/v1/exams | head -c 100
