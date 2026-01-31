# TestDone

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14.0-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**A production-grade EdTech platform for competitive exam preparation in India**

[Live Platform](https://testdone.in) · [Documentation](docs/) · [Report Issue](https://github.com/ankushjha556/testdone-academic-platform/issues)

</div>

---

## Overview

TestDone is a full-scale EdTech web platform designed to help Indian competitive exam aspirants prepare smarter, practice better, and track their performance with precision. It provides a complete digital learning ecosystem including mock tests, question banks, performance analytics, books, previous year papers, and exam-specific study tools.

### Problem Statement

Competitive exam preparation in India lacks unified platforms that combine practice, analytics, and content in a single production-ready system. Most solutions are either fragmented across multiple apps or lack the engineering rigor required for scale.

### Target Users

- **Students & Aspirants**: Banking (IBPS, SBI), SSC (CGL, CHSL), Railways (RRB NTPC), and other government exam candidates
- **Content Administrators**: Educators managing exams, questions, and study materials
- **Institutions**: Coaching centers requiring white-label test platforms

### Philosophy

Practice-first learning with immediate feedback. Every interaction is designed to reinforce concepts through active recall and spaced repetition principles.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX (Reverse Proxy)                           │
│                         SSL Termination · Rate Limiting                      │
└─────────────────────────────┬───────────────────────────┬───────────────────┘
                              │                           │
                    ┌─────────▼─────────┐       ┌─────────▼─────────┐
                    │   Frontend (3000) │       │   Backend (5000)  │
                    │                   │       │                   │
                    │   Next.js 14      │       │   Express.js      │
                    │   React 18        │◄─────►│   Prisma ORM      │
                    │   TypeScript      │  API  │   JWT Auth        │
                    │   Tailwind CSS    │       │   Zod Validation  │
                    └───────────────────┘       └─────────┬─────────┘
                                                          │
                                                ┌─────────▼─────────┐
                                                │   PostgreSQL 16   │
                                                │                   │
                                                │   17+ Models      │
                                                │   Full-text Search│
                                                │   Indexed Queries │
                                                └───────────────────┘
```

### Data Flow

1. **User Request** → NGINX terminates SSL and routes to appropriate service
2. **Frontend** → Server-side rendering with Next.js App Router
3. **API Calls** → RESTful endpoints with JWT authentication
4. **Database** → Prisma ORM with PostgreSQL, optimized indexes for query performance

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | SSR/SSG with App Router |
| **Styling** | Tailwind CSS, shadcn/ui | Component-based design system |
| **Backend** | Node.js, Express.js | RESTful API server |
| **ORM** | Prisma 5.x | Type-safe database access |
| **Database** | PostgreSQL 16 | ACID-compliant relational storage |
| **Auth** | JWT (Access + Refresh tokens) | Stateless authentication |
| **Validation** | Zod | Runtime schema validation |
| **Process Manager** | PM2 | Production process management |
| **Reverse Proxy** | NGINX | Load balancing, SSL termination |
| **SSL** | Let's Encrypt (Certbot) | HTTPS certificates |
| **Media** | Cloudinary | Image and file storage |

---

## Key Features

### For Students
- Exam-wise mock tests with real-time scoring
- Question bank with 10,000+ practice questions
- Performance analytics with accuracy trends
- Bookmarking and revision tools
- Leaderboard rankings
- PDF study materials and e-books

### For Administrators
- Full CRUD for exams, subjects, and questions
- Bulk question import
- User management and role-based access
- Subscription and payment tracking
- Content moderation workflow

### Technical Capabilities
- JWT-based stateless authentication with refresh token rotation
- Role-based access control (SUPER_ADMIN, ADMIN, CONTENT_MANAGER, MODERATOR, PREMIUM_USER, FREE_USER)
- RESTful API with consistent error handling
- Paginated responses for large datasets
- Database-level indexing for query optimization
- CI/CD pipeline with GitHub Actions

---

## Local Development

### Prerequisites

- Node.js 20.x
- PostgreSQL 14+
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/ankushjha556/testdone-academic-platform.git
cd testdone-academic-platform

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL and JWT secrets in .env

# Database initialization
npx prisma generate
npx prisma db push
npm run db:seed

# Frontend setup
cd ../frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

**Access Points**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`
- Admin Panel: `http://localhost:3000/admin`

---

## Production Deployment

TestDone runs on a VPS with the following stack:

| Component | Technology |
|-----------|------------|
| Server | Ubuntu 22.04 LTS |
| Reverse Proxy | NGINX with SSL |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Certbot) |
| CI/CD | GitHub Actions |

Deployment is automated via GitHub Actions. Pushes to `main` trigger:
1. Build and test verification
2. SSH deployment to VPS
3. PM2 process restart
4. Health check validation

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Security Considerations

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | JWT with short-lived access tokens (15min) and refresh token rotation |
| **Password Storage** | bcrypt hashing with salt rounds |
| **Input Validation** | Zod schemas on all API endpoints |
| **Environment Variables** | Validated at startup, never committed |
| **SQL Injection** | Prevented via Prisma ORM parameterized queries |
| **XSS Protection** | React's built-in escaping, CSP headers |

**Known Limitations**
- OTP-based authentication not yet implemented
- Rate limiting configured at NGINX level only

For complete security documentation, see [docs/SECURITY.md](docs/SECURITY.md).

---

## API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/refresh` | POST | Token refresh |
| `/api/v1/auth/logout` | POST | Session termination |

### Exams & Tests
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/exams` | GET | List all exams |
| `/api/v1/exams/:slug` | GET | Exam details |
| `/api/v1/tests` | GET | List mock tests |
| `/api/v1/tests/:id/start` | POST | Start test attempt |
| `/api/v1/tests/:id/submit` | POST | Submit answers |

### Questions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/questions` | GET | Paginated question list |
| `/api/v1/questions/:id` | GET | Question details |
| `/api/v1/questions/random` | GET | Random practice questions |

For complete API documentation, see [docs/API.md](docs/API.md).

---

## Project Structure

```
testdone-academic-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (17+ models)
│   │   └── seed.ts            # Initial data seeding
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── validators/        # Zod schemas
│   │   └── lib/               # Utilities (Prisma client, helpers)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React context providers
│   │   └── lib/               # API client, utilities
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   └── API.md
├── .github/
│   ├── workflows/             # CI/CD pipelines
│   └── ISSUE_TEMPLATE/
├── deploy/
│   ├── deploy.sh
│   └── rollback.sh
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| High | Payment integration (Razorpay) | Planned |
| High | Subscription management | Planned |
| Medium | Advanced analytics dashboard | Planned |
| Medium | Mobile application (React Native) | Planned |
| Low | Multi-tenancy support | Under consideration |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Code style and conventions
- Pull request process
- Issue reporting

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Author

**Ankush Jha**  
B.Tech, IIT Patna

- GitHub: [@ankushjha556](https://github.com/ankushjha556)
- Platform: [testdone.in](https://testdone.in)

This project was built as both an academic endeavor and a production learning experience, demonstrating full-stack engineering principles at scale.