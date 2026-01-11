# TestDone Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## Local Development

### 1. Clone and Install

```bash
cd testdone-app
npm run install:all
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/testdone"
JWT_ACCESS_SECRET="your-secure-secret-key"
JWT_REFRESH_SECRET="another-secure-secret-key"
```

### 3. Database Setup

```bash
# Push schema to database
cd backend
npx prisma db push

# Seed sample data
npm run db:seed
```

### 4. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Production Deployment

### Option 1: Traditional VPS

#### Backend (Node.js)

```bash
cd backend
npm install
npm run build
npm start
```

Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/index.js --name testdone-api
```

#### Frontend (Next.js)

```bash
cd frontend
npm install
npm run build
npm start
```

### Option 2: Docker

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: testdone
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/testdone
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Option 3: Vercel + Railway

1. **Frontend on Vercel:**
   - Connect GitHub repo
   - Set root directory to `frontend`
   - Add environment variables

2. **Backend on Railway:**
   - Connect GitHub repo
   - Add PostgreSQL database
   - Set environment variables
   - Deploy backend folder

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name testdone.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name testdone.in;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables (Production)

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/testdone"

# App
NODE_ENV=production
PORT=5000
NEXT_PUBLIC_API_URL=https://api.testdone.in/api/v1
NEXT_PUBLIC_APP_URL=https://testdone.in

# Security (use strong random values)
JWT_ACCESS_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="another-random-secret"

# Optional
SMTP_HOST=smtp.gmail.com
RAZORPAY_KEY_ID=your_key
```

## SSL Certificate

Use Let's Encrypt:
```bash
sudo certbot --nginx -d testdone.in -d www.testdone.in
```

## Monitoring

- Use PM2 for process management
- Setup Sentry for error tracking
- Use Datadog or New Relic for APM
- Enable CloudWatch for AWS

## Backup

```bash
# Database backup
pg_dump testdone > backup_$(date +%Y%m%d).sql

# Restore
psql testdone < backup_20250101.sql
```
