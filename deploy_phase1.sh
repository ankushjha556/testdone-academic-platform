
#!/bin/bash
set -e

# 1. Extract files
echo "Extracting files..."
cd /home/testdone/
tar -xvf /home/testdone/mistake_intelligence_deploy.tar

# 2. Update .env with feature flags
echo "Updating .env..."
cd /home/testdone/testdone/backend
# Append flags if not present
if ! grep -q "FEATURE_MISTAKE_INTELLIGENCE" .env; then
  echo "" >> .env
  echo "# Mistake Intelligence System Feature Flags" >> .env
  echo "FEATURE_MISTAKE_INTELLIGENCE=true" >> .env
  echo "FEATURE_SMART_PRACTICE=true" >> .env
  echo ".env updated with feature flags."
else
  # Ensure they are true
  sed -i 's/FEATURE_MISTAKE_INTELLIGENCE=false/FEATURE_MISTAKE_INTELLIGENCE=true/' .env
  sed -i 's/FEATURE_SMART_PRACTICE=false/FEATURE_SMART_PRACTICE=true/' .env
  echo ".env flags verified."
fi

# 3. Run Migration
echo "Running migration..."
# Need to ensure we use the correct Database URL from .env (it is already there)
npx prisma migrate deploy

# 4. Rebuild Backend
echo "Rebuilding Backend..."
npm install
npm run build

# 5. Restart Backend
echo "Restarting Backend..."
pm2 restart testdone-backend

# 6. Frontend Build
echo "Rebuilding Frontend..."
cd /home/testdone/testdone/frontend
npm install
npm run build

# 7. Restart Frontend
echo "Restarting Frontend..."
pm2 restart testdone-frontend

echo "DEPLOYMENT COMPLETE!"
