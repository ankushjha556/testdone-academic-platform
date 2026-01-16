#!/bin/bash
cd /home/testdone/testdone/frontend/src/app

# Fix layout.tsx - replace India's #1 with Smart Competitive
sed -i "s/India's #1/Smart Competitive/g" layout.tsx
sed -i "s/India&#x27;s #1/Smart Competitive/g" layout.tsx

# Fix page.tsx - replace India's #1 with Smart Competitive
sed -i "s/India's #1/Smart Competitive/g" page.tsx
sed -i "s/India&#x27;s #1/Smart Competitive/g" page.tsx

# Verify changes
echo "=== layout.tsx title lines ==="
grep -n "title" layout.tsx | head -n 10

echo "=== page.tsx metadata ==="
grep -n "title" page.tsx | head -n 5

# Rebuild
cd /home/testdone/testdone/frontend
rm -rf .next
npm run build
pm2 restart frontend

# Wait and verify
sleep 5
echo "=== FINAL VERIFICATION ==="
curl -s http://localhost:3000 | grep -o "<title>[^<]*</title>"
