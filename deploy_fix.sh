
#!/bin/bash
export NEXT_PUBLIC_API_URL=https://testdone.in/api/v1
cd /home/testdone/testdone/frontend
echo "Stopping frontend..."
pm2 stop frontend
echo "Cleaning .next..."
rm -rf .next
echo "Building..."
npm run build
if [ $? -eq 0 ]; then
  echo "Build Success. Starting frontend..."
  pm2 start frontend
else
  echo "Build Failed. Check logs."
fi
