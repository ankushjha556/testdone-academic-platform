# System Architecture

## Overview

TestDone follows a three-tier architecture with clear separation between presentation, business logic, and data layers. The system is designed for horizontal scalability and can handle concurrent users with efficient resource utilization.

---

## Architecture Diagram

```
                                    ┌──────────────────┐
                                    │   CDN (Static)   │
                                    │   Cloudinary     │
                                    └────────┬─────────┘
                                             │
┌────────────────────────────────────────────┼────────────────────────────────────────────┐
│                                   NGINX LAYER                                            │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          NGINX Reverse Proxy                                     │    │
│  │                                                                                  │    │
│  │  • SSL/TLS Termination (Let's Encrypt)                                          │    │
│  │  • Rate Limiting                                                                 │    │
│  │  • Request Routing                                                               │    │
│  │  • Static File Serving                                                           │    │
│  │  • Gzip Compression                                                              │    │
│  └──────────────────────────────┬───────────────────────────┬──────────────────────┘    │
│                                 │                           │                            │
└─────────────────────────────────┼───────────────────────────┼────────────────────────────┘
                                  │                           │
                                  ▼                           ▼
┌─────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│         FRONTEND (Port 3000)            │   │          BACKEND (Port 5000)            │
│                                         │   │                                         │
│  ┌───────────────────────────────────┐  │   │  ┌───────────────────────────────────┐  │
│  │         Next.js 14                │  │   │  │         Express.js                │  │
│  │                                   │  │   │  │                                   │  │
│  │  • App Router (SSR/SSG)           │  │   │  │  • RESTful API                    │  │
│  │  • React 18 Components            │  │   │  │  • JWT Authentication             │  │
│  │  • TypeScript                     │  │   │  │  • Zod Validation                 │  │
│  │  • Tailwind CSS                   │  │   │  │  • Error Handling Middleware      │  │
│  │  • Client State (Context API)     │  │   │  │  • CORS Configuration             │  │
│  └───────────────────────────────────┘  │   │  └───────────────────────────────────┘  │
│                                         │   │                    │                    │
│  ┌───────────────────────────────────┐  │   │  ┌───────────────────────────────────┐  │
│  │         API Client                │  │   │  │         Prisma ORM                │  │
│  │                                   │  │   │  │                                   │  │
│  │  • Axios Instance                 │──┼───┼─▶│  • Type-safe Queries              │  │
│  │  • Interceptors (Auth)            │  │   │  │  • Migrations                     │  │
│  │  • Error Handling                 │  │   │  │  • Connection Pooling             │  │
│  └───────────────────────────────────┘  │   │  └─────────────────┬─────────────────┘  │
│                                         │   │                    │                    │
└─────────────────────────────────────────┘   └────────────────────┼────────────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────────────────────────────────┐
                                              │        DATABASE LAYER                   │
                                              │                                         │
                                              │  ┌───────────────────────────────────┐  │
                                              │  │       PostgreSQL 16               │  │
                                              │  │                                   │  │
                                              │  │  • 17+ Data Models                │  │
                                              │  │  • Indexed Queries                │  │
                                              │  │  • Full-text Search               │  │
                                              │  │  • ACID Transactions              │  │
                                              │  │  • UUID Primary Keys              │  │
                                              │  └───────────────────────────────────┘  │
                                              │                                         │
                                              └─────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend (Next.js 14)

| Directory | Purpose |
|-----------|---------|
| `app/` | Page routes using App Router |
| `app/admin/` | Admin panel pages (protected) |
| `app/exams/` | Exam listing and detail pages |
| `app/tests/` | Test taking interface |
| `components/` | Reusable UI components |
| `contexts/` | React Context providers (Auth, Theme) |
| `lib/` | API client, utilities, types |

**Key Patterns**
- Server Components for initial data fetching
- Client Components for interactive elements
- Context API for global state (authentication)
- Axios interceptors for automatic token refresh

### Backend (Express.js)

| Directory | Purpose |
|-----------|---------|
| `routes/` | API endpoint handlers |
| `middleware/` | Auth, validation, error handling |
| `validators/` | Zod schemas for request validation |
| `lib/` | Prisma client, utilities |

**Middleware Stack**
```
Request → CORS → JSON Parser → Auth Middleware → Route Handler → Error Handler → Response
```

### Database (PostgreSQL)

**Core Models**
| Model | Purpose |
|-------|---------|
| User | User accounts with roles |
| Exam | Exam categories (SSC, Banking, etc.) |
| Subject | Academic subjects |
| Topic | Subject subdivisions |
| Question | Question bank entries |
| MockTest | Test configurations |
| TestAttempt | User test sessions |
| Subscription | Premium access tracking |

**Indexing Strategy**
- Primary keys: UUID
- Foreign keys: Indexed for JOIN performance
- Slug fields: Unique indexed for URL lookups
- Status fields: Indexed for filtered queries

---

## Request Flow

### Authentication Flow

```
1. User submits credentials
2. Backend validates against bcrypt hash
3. Generate accessToken (15min) + refreshToken (7days)
4. Store refreshToken in database
5. Return tokens to client
6. Client stores in memory (access) + httpOnly cookie (refresh)
7. Subsequent requests include accessToken in Authorization header
8. Token expiry triggers automatic refresh via interceptor
```

### Test Taking Flow

```
1. User starts test → POST /tests/:id/start
2. Backend creates TestAttempt record
3. Frontend receives questions and timer config
4. User answers → State managed client-side
5. Timer expires or user submits → POST /tests/:id/submit
6. Backend calculates score, stores AttemptAnswers
7. Frontend displays results with analytics
```

---

## Data Model (Entity Relationships)

```
User
 ├── TestAttempt[]
 ├── Bookmark[]
 ├── Subscription[]
 └── RefreshToken[]

Exam
 ├── Subject[]
 ├── MockTest[]
 └── Question[] (via ExamCategory)

MockTest
 ├── TestQuestion[]
 └── TestAttempt[]

Question
 ├── Subject
 ├── Topic
 ├── Section
 ├── TestQuestion[]
 └── AttemptAnswer[]
```

---

## Security Boundaries

| Boundary | Protection |
|----------|------------|
| Internet → NGINX | SSL/TLS, Rate limiting |
| NGINX → Services | Internal network only |
| Frontend → Backend | JWT validation |
| Backend → Database | Prisma (parameterized queries) |
| Admin Routes | Role-based middleware |

---

## Scalability Considerations

**Current Architecture (Single VPS)**
- Suitable for ~1000 concurrent users
- PM2 cluster mode for CPU utilization
- PostgreSQL connection pooling

**Horizontal Scaling (Future)**
- Load balancer in front of multiple app servers
- Redis for session storage and caching
- Read replicas for database
- CDN for static assets
