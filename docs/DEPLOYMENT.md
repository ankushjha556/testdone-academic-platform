# Deployment Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20.x LTS |
| PostgreSQL | 14+ |
| npm | 9+ |
| Git | 2.x |

---

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/ankushjha556/testdone-academic-platform.git
cd testdone-academic-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/testdone"
JWT_ACCESS_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="another-secure-secret"
NODE_ENV=development
PORT=5000
```

### 3. Database Initialization

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Configure `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 5. Start Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Access Points**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Admin: http://localhost:3000/admin

---

## Production Deployment

### Server Requirements

| Component | Specification |
|-----------|---------------|
| OS | Ubuntu 22.04 LTS |
| RAM | 2GB minimum |
| Storage | 20GB SSD |
| CPU | 2 vCPUs |

### Stack Overview

```
Internet → NGINX (443) → PM2 → Frontend (3000) / Backend (5000) → PostgreSQL
```

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/ankushjha556/testdone-academic-platform.git
cd testdone-academic-platform

# Backend
cd backend
npm ci --production
npm run build
pm2 start dist/index.js --name testdone-backend

# Frontend
cd ../frontend
npm ci
npm run build
pm2 start npm --name testdone-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. NGINX Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4. SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## CI/CD Pipeline

TestDone uses GitHub Actions for automated deployment.

### Workflow Triggers

| Event | Action |
|-------|--------|
| Push to `main` | Build, test, deploy |
| Pull request | Build and test only |

### Deployment Flow

```
Push → Build → Test → SSH to VPS → deploy.sh → Health check
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | VPS IP address |
| `SSH_USER` | SSH username |
| `SSH_PRIVATE_KEY` | ED25519 private key |

---

## Environment Variables (Production)

### Backend `.env`

```env
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
```

### Frontend `.env`

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Monitoring

### PM2 Commands

```bash
pm2 status          # Process status
pm2 logs            # View logs
pm2 monit           # Real-time monitor
pm2 restart all     # Restart all processes
```

### Health Checks

```bash
curl https://yourdomain.com           # Frontend check
curl https://yourdomain.com/api/v1    # Backend check
```

---

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump -U postgres testdone > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated (cron)
0 2 * * * pg_dump -U postgres testdone > /backups/testdone_$(date +\%Y\%m\%d).sql
```

### Restore

```bash
psql -U postgres testdone < backup_20260131.sql
```

---

## Rollback Procedure

```bash
# Execute rollback script
./deploy/rollback.sh

# Manual rollback
git log --oneline -5        # Find previous commit
git reset --hard <commit>   # Reset to commit
pm2 restart all             # Restart services
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check if PM2 processes are running |
| Database connection failed | Verify DATABASE_URL and PostgreSQL status |
| SSL certificate error | Run `sudo certbot renew` |
| Memory exhaustion | Increase swap or upgrade VPS |
