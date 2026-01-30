#!/bin/bash
LOGfile="/root/check_deployment.log"
exec &> "$LOGfile"
echo "=== DATE ==="
date
echo "=== MEMORY ==="
free -h
cd /home/testdone/testdone
echo "=== FILES ==="
ls -l frontend/src/app/smart-practice/page.tsx
ls -l backend/src/routes/mistake.routes.ts
cd backend
echo "=== BACKEND ENV ==="
tail -n 5 .env
echo "=== SCHEMA MODEL ==="
grep "model UserMistakeLog" prisma/schema.prisma
echo "=== MIGRATION CLI STATUS ==="
echo "DEBUG: npx path is $(which npx)"
npx prisma migrate status || echo "Migration Command Failed with code $?"
echo "=== PM2 LIST ==="
pm2 list
echo "=== DONE ==="
