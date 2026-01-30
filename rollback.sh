#!/bin/bash
set -euo pipefail

APP_DIR=/home/testdone/testdone

if [ -z "${1:-}" ]; then
    echo "Usage: ./rollback.sh <commit_hash>"
    echo "Example: ./rollback.sh abc123"
    exit 1
fi

COMMIT=$1

echo "[ROLLBACK] Rolling back to commit $COMMIT at $(date)"
cd $APP_DIR

# Verify commit exists
if ! git cat-file -e "$COMMIT^{commit}" 2>/dev/null; then
    echo "[ROLLBACK] ERROR: Commit $COMMIT does not exist"
    exit 1
fi

# Reset to specified commit
git reset --hard $COMMIT

# Rebuild backend
echo "[ROLLBACK] Rebuilding backend..."
cd $APP_DIR/backend
npm ci --production=false
npm run build --if-present

# Rebuild frontend
echo "[ROLLBACK] Rebuilding frontend..."
cd $APP_DIR/frontend
npm ci --production=false
npm run build

# Reload PM2
echo "[ROLLBACK] Reloading PM2 services..."
cd $APP_DIR
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "[ROLLBACK] Rollback to $COMMIT completed at $(date)"
pm2 status
