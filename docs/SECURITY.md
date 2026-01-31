# Security Documentation

## Overview

This document outlines the security measures implemented in TestDone and known limitations. The platform handles user authentication, personal data, and payment information, requiring appropriate security controls.

---

## Authentication

### JWT Token Strategy

| Token Type | Lifetime | Storage | Purpose |
|------------|----------|---------|---------|
| Access Token | 15 minutes | Memory (JS variable) | API authorization |
| Refresh Token | 7 days | httpOnly cookie | Token renewal |

**Token Flow**
1. Login returns both tokens
2. Access token included in `Authorization: Bearer <token>` header
3. Frontend interceptor detects 401 and attempts refresh
4. Refresh endpoint validates stored refresh token
5. New token pair issued, old refresh token invalidated

**Implementation**
```typescript
// Token generation (backend)
const accessToken = jwt.sign(
  { userId, role },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: '15m' }
);
```

### Password Security

| Aspect | Implementation |
|--------|----------------|
| Hashing Algorithm | bcrypt |
| Salt Rounds | 12 |
| Minimum Length | 8 characters (enforced) |
| Storage | Hash only, plaintext never stored |

---

## Input Validation

All API endpoints validate input using Zod schemas before processing.

**Example Schema**
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

**Validation Coverage**
- Request body
- Query parameters
- Route parameters
- File uploads (type, size)

---

## SQL Injection Prevention

Prisma ORM provides parameterized queries by default:

```typescript
// Safe: Prisma handles parameterization
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// Never used: Raw string concatenation
// const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`
```

---

## XSS Protection

| Layer | Protection |
|-------|------------|
| React | Automatic HTML escaping in JSX |
| Headers | X-Content-Type-Options: nosniff |
| CSP | Content-Security-Policy configured in NGINX |
| Input | Sanitized before database storage |

---

## CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Full system access |
| ADMIN | Content and user management |
| CONTENT_MANAGER | Create/edit content |
| MODERATOR | Review submissions |
| PREMIUM_USER | Full content access |
| FREE_USER | Limited content access |

### Route Protection

```typescript
// Middleware example
const requireAdmin = (req, res, next) => {
  if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Route usage
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);
```

---

## Environment Variables

### Validation at Startup

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const env = envSchema.parse(process.env);
```

### Secrets Management

| Secret | Storage |
|--------|---------|
| Database credentials | `.env` file (not committed) |
| JWT secrets | `.env` file |
| API keys | `.env` file |
| SSH keys | GitHub Secrets (CI/CD) |

---

## Rate Limiting

Configured at NGINX level:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:5000;
}
```

---

## HTTPS Configuration

| Aspect | Implementation |
|--------|----------------|
| Certificate | Let's Encrypt (auto-renewal) |
| Protocol | TLS 1.2+ only |
| Cipher Suites | Modern, AEAD preferred |
| HSTS | Enabled, max-age 1 year |

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=31536000" always;
```

---

## Known Limitations

| Limitation | Risk Level | Mitigation |
|------------|------------|------------|
| No OTP verification | Medium | Email confirmation planned |
| No 2FA | Medium | Planned for future release |
| Rate limiting at NGINX only | Low | Application-level throttling planned |
| No account lockout | Medium | Planned after failed attempts |

---

## Security Checklist

- [x] HTTPS enforced
- [x] JWT with short expiry
- [x] Password hashing (bcrypt)
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma)
- [x] XSS protection (React)
- [x] CORS configuration
- [x] Role-based access control
- [x] Environment variable validation
- [x] Secrets not in version control
- [ ] OTP verification
- [ ] Two-factor authentication
- [ ] Account lockout

---

## Reporting Security Issues

If you discover a security vulnerability, please email directly rather than opening a public issue:

**Contact**: ankushjha556@gmail.com

We aim to respond within 48 hours and will work with you to address the issue promptly.
