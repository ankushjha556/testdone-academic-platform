# TestDone Academic Platform 🎓

<div align="center">

![TestDone Logo](https://img.shields.io/badge/TestDone-Academic%20Platform-4F46E5?style=for-the-badge&logo=graduation-cap&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**India's #1 Exam Preparation Platform for Banking, SSC, Railway & Government Exams**

[Live Demo](https://testdone.in) · [Report Bug](https://github.com/ankushjha556/testdone-academic-platform/issues) · [Request Feature](https://github.com/ankushjha556/testdone-academic-platform/issues)

</div>

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About The Project

TestDone is a comprehensive EdTech platform designed to help aspirants prepare for competitive examinations in India. The platform offers mock tests, study materials, performance analytics, and a robust admin panel for content management.

### Key Highlights

- 🎯 **10,000+ Practice Questions** across multiple subjects
- 📊 **Real-time Analytics** with detailed performance insights
- 📚 **Comprehensive Study Materials** including PDFs and e-books
- 🏆 **Leaderboards** to track your ranking among peers
- 📱 **Responsive Design** optimized for all devices
- 🔐 **Secure Authentication** with JWT & refresh tokens

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first styling |
| Lucide React | Modern icon library |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| Prisma | ORM for database |
| PostgreSQL | Relational database |
| JWT | Authentication tokens |
| Zod | Schema validation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Nginx | Reverse proxy |
| PM2 | Process manager |
| Let's Encrypt | SSL certificates |
| Cloudinary | Media storage |

---

## ✨ Features

### For Students
- ✅ Browse exams by category (Banking, SSC, Railway, etc.)
- ✅ Take timed mock tests with instant results
- ✅ View detailed solutions and explanations
- ✅ Track progress with performance analytics
- ✅ Download study materials and e-books
- ✅ Bookmark questions for later review
- ✅ Compete on leaderboards

### For Administrators
- ✅ Manage exams, subjects, and sections
- ✅ Create and edit questions with rich formatting
- ✅ Upload and manage study materials
- ✅ Monitor user activity and analytics
- ✅ Manage user subscriptions
- ✅ Content moderation tools

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ankushjha556/testdone-academic-platform.git
   cd testdone-academic-platform
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Backend Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

4. **Setup Database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

6. **Configure Frontend Environment**
   ```bash
   cp .env.example .env.local
   # Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

7. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

8. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/v1
   - Admin Panel: http://localhost:3000/admin

---

## 📁 Project Structure

```
testdone-academic-platform/
├── backend/                    # Express.js API Server
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeding
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── validators/        # Zod validation schemas
│   │   ├── lib/               # Utility libraries
│   │   └── index.ts           # Application entry
│   └── package.json
│
├── frontend/                   # Next.js Application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── admin/         # Admin panel pages
│   │   │   ├── exams/         # Exam pages
│   │   │   ├── tests/         # Test taking pages
│   │   │   └── books/         # Study materials
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   └── lib/               # Utilities & API client
│   └── package.json
│
├── docs/                       # Documentation
├── .github/                    # GitHub templates
└── README.md
```

---

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | User logout |

### Exams & Tests

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/exams` | GET | List all exams |
| `/api/v1/exams/:slug` | GET | Get exam details |
| `/api/v1/tests` | GET | List mock tests |
| `/api/v1/tests/:id/start` | POST | Start a test |
| `/api/v1/tests/:id/submit` | POST | Submit test answers |

### Questions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/questions` | GET | List questions (paginated) |
| `/api/v1/questions/:id` | GET | Get question details |
| `/api/v1/questions/random` | GET | Get random questions |

### Books & Materials

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/books` | GET | List study materials |
| `/api/v1/books/:id` | GET | Get book details |
| `/api/v1/books/:id/download-ticket` | POST | Generate download ticket |

---

## 🌐 Deployment

### Production Deployment (Ubuntu/VPS)

1. **Server Requirements**
   - Ubuntu 22.04+ / 24.04 LTS
   - 2GB RAM minimum
   - Node.js 20.x
   - PostgreSQL 14+
   - Nginx

2. **Deploy Backend**
   ```bash
   cd backend
   npm install
   npm run build
   pm2 start dist/index.js --name testdone-backend
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   pm2 start npm --name testdone-frontend -- start
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://127.0.0.1:3000;
       }
       
       location /api/ {
           proxy_pass http://127.0.0.1:5000;
       }
   }
   ```

5. **Setup SSL**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ankush Jha**

- GitHub: [@ankushjha556](https://github.com/ankushjha556)
- Website: [testdone.in](https://testdone.in)

---

<div align="center">

Made with ❤️ for Indian Exam Aspirants

⭐ Star this repo if you find it helpful!

</div>
#   C I / C D   T e s t  
 