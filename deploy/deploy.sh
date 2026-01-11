#!/bin/bash

# ============================================
# TestDone VPS Deployment Script
# Run this on your Ubuntu VPS after SSH login
# ============================================

set -e  # Exit on error

echo "🚀 TestDone Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
APP_DIR="/var/www/testdone"
DOMAIN="testdone.in"

# Step 1: Update system
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js 20
echo -e "${YELLOW}[2/10] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Step 3: Install PostgreSQL
echo -e "${YELLOW}[3/10] Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Step 4: Install Nginx
echo -e "${YELLOW}[4/10] Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 5: Install PM2
echo -e "${YELLOW}[5/10] Installing PM2...${NC}"
sudo npm install -g pm2

# Step 6: Install Certbot for SSL
echo -e "${YELLOW}[6/10] Installing Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx

# Step 7: Create app directory
echo -e "${YELLOW}[7/10] Setting up app directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Step 8: Setup PostgreSQL database
echo -e "${YELLOW}[8/10] Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE testdone;
CREATE USER testdone_user WITH ENCRYPTED PASSWORD 'TestDone@SecurePass123';
GRANT ALL PRIVILEGES ON DATABASE testdone TO testdone_user;
ALTER DATABASE testdone OWNER TO testdone_user;
\c testdone
GRANT ALL ON SCHEMA public TO testdone_user;
EOF

echo -e "${GREEN}✓ Database 'testdone' created${NC}"
echo -e "${GREEN}✓ User 'testdone_user' created${NC}"

# Step 9: Create .env file
echo -e "${YELLOW}[9/10] Creating environment file...${NC}"
cat > $APP_DIR/.env << 'EOF'
# Database
DATABASE_URL="postgresql://testdone_user:TestDone@SecurePass123@localhost:5432/testdone"

# Server
NODE_ENV=production
PORT=5000

# Frontend
NEXT_PUBLIC_API_URL=https://testdone.in/api/v1
NEXT_PUBLIC_APP_URL=https://testdone.in

# JWT Secrets (CHANGE THESE!)
JWT_ACCESS_SECRET=change_this_to_a_secure_random_string_at_least_32_chars
JWT_REFRESH_SECRET=another_secure_random_string_at_least_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Admin
ADMIN_EMAIL=admin@testdone.in
ADMIN_PASSWORD=Admin@TestDone123
EOF

echo -e "${GREEN}✓ Environment file created at $APP_DIR/.env${NC}"
echo -e "${RED}⚠ IMPORTANT: Update JWT secrets in .env file!${NC}"

# Step 10: Setup Nginx
echo -e "${YELLOW}[10/10] Configuring Nginx...${NC}"

# Create temporary HTTP-only config for SSL certificate
sudo tee /etc/nginx/sites-available/testdone.in << 'NGINX'
server {
    listen 80;
    server_name testdone.in www.testdone.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/testdone.in /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Base setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "1. Upload your code to $APP_DIR"
echo "2. Run: cd $APP_DIR && npm install"
echo "3. Run: cd backend && npx prisma db push && npm run db:seed"
echo "4. Run: npm run build"
echo "5. Run: pm2 start ecosystem.config.js"
echo "6. Get SSL: sudo certbot --nginx -d testdone.in -d www.testdone.in"
echo ""
