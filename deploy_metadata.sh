#!/bin/bash
# Deploy dynamic metadata updates

# Create target directories if needed
mkdir -p /home/testdone/testdone/frontend/src/app/exams/\[slug\]
mkdir -p /home/testdone/testdone/frontend/src/app/tests/\[testId\]

echo "Deploying exam and test page updates..."

# Rebuild frontend
cd /home/testdone/testdone/frontend
rm -rf .next
npm run build
pm2 restart frontend

# Wait and verify
sleep 5

echo "=== EXAM PAGE VERIFICATION ==="
curl -s "http://localhost:3000/exams/ssc-cgl" | grep -oP '(?<=<title>)[^<]+'

echo ""
echo "=== TEST PAGE VERIFICATION ==="
# Find a test ID from database or try common one
curl -s "http://localhost:3000/tests" | grep -oP 'href="/tests/[^"]+' | head -n 1
