<p align="center">
  <h1 align="center">🏢 EnterpriseFlow</h1>
  <p align="center">
    A full-stack ERP system for inventory management, procurement, HR, and reporting — built with NestJS, React, and Prisma.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis" alt="Redis" />

</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)

- [License](#-license)

---

## 🔍 Overview

**EnterpriseFlow** is a modular ERP (Enterprise Resource Planning) system designed for small-to-medium businesses. It provides a unified platform to manage core operations — inventory tracking, supplier procurement, human resources, and reporting — all through a modern, responsive interface.

The application is a modern **web app** backed by a robust REST API with role-based access control.

---

## ✨ Features

### 📦 Inventory Management
- Track items with SKU, category, quantity, and unit price
- Automatic reorder-level alerts
- Soft-delete support for historical auditing
- Supplier association per item

### 🛒 Procurement
- Create and manage purchase orders (Draft → Pending → Approved → Received)
- Multi-item order support with automatic total calculation
- Supplier management with contact info and ratings
- Approval workflows for managers

### 👥 Human Resources
- Employee records with department, designation, and salary tracking
- Leave request management (Casual, Sick, Earned, Unpaid)
- Leave approval/rejection workflow
- Employee status tracking (Active, On Leave, Terminated)

### 📊 Reporting
- Generate reports across Inventory, Procurement, HR, and Financial domains
- JSON-based report data storage for flexibility
- Report history with user attribution

### 🔐 Authentication & Authorization
- JWT-based authentication with access & refresh tokens
- Role-based access control (Admin, Manager, Employee)
- Protected routes on both frontend and backend
- Bcrypt password hashing

### 🛠 Platform
- Swagger/OpenAPI documentation
- Redis caching layer
- Cron job scheduling
- Global exception filtering & response transformation
- Docker-based infrastructure (PostgreSQL + Redis)

---

## 🧱 Tech Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| **Frontend** | React 19, React Router 7, Vite 8, Axios, Lucide Icons   |
| **Backend**  | NestJS 11, Passport, JWT, class-validator, Swagger       |
| **ORM**      | Prisma 6 with PostgreSQL                                |
| **Cache**    | Redis 7 via ioredis                                     |
| **Database** | PostgreSQL 16 (Dockerized)                              |

| **Infra**    | Docker Compose, Concurrently                            |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client Layer                  │
│            ┌──────────────────┐                 │
│            │   Web Browser    │                 │
│            │  (React + Vite)  │                 │
│            └────────┬─────────┘                 │
│                     │  REST API                 │
│                     ▼                           │
│  ┌─────────────────────────────────────────┐    │
│  │           NestJS Backend (3001)         │    │
│  │  ┌──────┐ ┌──────┐ ┌────┐ ┌─────────┐  │    │
│  │  │ Auth │ │ Inv. │ │ HR │ │Procure. │  │    │
│  │  └──────┘ └──────┘ └────┘ └─────────┘  │    │
│  │  ┌──────────┐  ┌──────┐  ┌──────────┐  │    │
│  │  │Reporting │  │ Cron │  │  Users   │  │    │
│  │  └──────────┘  └──────┘  └──────────┘  │    │
│  └─────────┬─────────────┬─────────────────┘    │
│            ▼             ▼                      │
│  ┌──────────────┐  ┌──────────┐                 │
│  │ PostgreSQL   │  │  Redis   │                 │
│  │   (5432)     │  │  (6379)  │                 │
│  └──────────────┘  └──────────┘                 │
└─────────────────────────────────────────────────┘
```

---

## 📌 Prerequisites

Make sure you have the following installed:

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** & **Docker Compose** (for PostgreSQL and Redis)


---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/enterprise-flow.git
cd enterprise-flow
```

### 2. One-command setup

This spins up Docker containers (Postgres + Redis), installs all dependencies, and generates the Prisma client:

```bash
npm run setup
```

### 3. Configure environment

Copy the example `.env` to both root and backend directories. The default values work out of the box with the Docker setup:

```bash
cp .env backend/.env
```

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Seed the database (optional)

Populates the database with sample data:

```bash
npm run db:seed
```

### 6. Start development servers

Runs both backend and frontend concurrently:

```bash
npm run start:dev
```

| Service      | URL                                  |
| ------------ | ------------------------------------ |
| Frontend     | http://localhost:5173                 |
| Backend API  | http://localhost:3001/api             |
| Swagger Docs | http://localhost:3001/api/docs        |

---

## 📁 Project Structure

```
enterprise-flow/
├── backend/                    # NestJS API server
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & models
│   │   └── seed.ts             # Seed data script
│   └── src/
│       ├── auth/               # JWT authentication & strategies
│       ├── common/             # Shared guards, filters, decorators, DTOs
│       │   ├── decorators/     # Custom decorators (roles, etc.)
│       │   ├── dto/            # Shared DTOs
│       │   ├── enums/          # Shared enums
│       │   ├── filters/        # Global exception filter
│       │   ├── guards/         # Auth & role guards
│       │   └── interceptors/   # Response transform interceptor
│       ├── cron/               # Scheduled tasks
│       ├── hr/                 # HR module (employees, leave)
│       ├── inventory/          # Inventory management module
│       ├── prisma/             # Prisma service module
│       ├── procurement/        # Purchase orders & suppliers
│       ├── redis/              # Redis caching service
│       ├── reporting/          # Report generation module
│       ├── users/              # User management module
│       ├── app.module.ts       # Root application module
│       └── main.ts             # Application bootstrap
│
├── frontend/                   # React + Vite SPA
│   ├── public/                 # Static assets
│   └── src/
│       ├── api/                # Axios API client
│       ├── components/         # Shared UI components
│       │   ├── Layout.jsx      # App shell with sidebar
│       │   ├── Modal.jsx       # Reusable modal component
│       │   ├── ProtectedRoute.jsx  # Auth route guard
│       │   └── Sidebar.jsx     # Navigation sidebar
│       ├── context/            # React context (AuthContext)
│       ├── pages/              # Page components
│       │   ├── Dashboard.jsx   # Overview dashboard
│       │   ├── HR.jsx          # HR management page
│       │   ├── Inventory.jsx   # Inventory management page
│       │   ├── Login.jsx       # Login page
│       │   ├── Procurement.jsx # Procurement page
│       │   └── Reports.jsx     # Reports page
│       ├── App.jsx             # Root component with routing
│       ├── main.jsx            # React entry point
│       └── index.css           # Global styles
│

├── docker-compose.yml          # PostgreSQL & Redis containers
├── package.json                # Root workspace scripts
└── .env                        # Environment variables
```

---

## 📜 Available Scripts

Run these from the **project root**:

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start backend & frontend concurrently                |
| `npm run dev:backend`  | Start only the NestJS backend (watch mode)        |
| `npm run dev:frontend` | Start only the Vite dev server                    |
| `npm run setup`     | Full setup: Docker → install deps → Prisma generate  |
| `npm run db:push`   | Push Prisma schema to database                       |
| `npm run db:seed`   | Seed the database with sample data                   |
| `npm run db:studio` | Open Prisma Studio (visual DB editor)                |
| `npm run docker:up` | Start PostgreSQL & Redis containers                  |
| `npm run docker:down` | Stop and remove containers                         |

---

## 📖 API Documentation

The backend automatically generates interactive API documentation via **Swagger/OpenAPI**.

Once the backend is running, open:

```
http://localhost:3001/api/docs
```

All endpoints are prefixed with `/api` and support Bearer token authentication.

### Key Endpoints

| Module       | Base Path                | Description                    |
| ------------ | ------------------------ | ------------------------------ |
| Auth         | `/api/auth`              | Login, register, refresh token |
| Users        | `/api/users`             | User management (CRUD)         |
| Inventory    | `/api/inventory`         | Inventory items (CRUD)         |
| Procurement  | `/api/procurement`       | Purchase orders & suppliers    |
| HR           | `/api/hr`                | Employees & leave requests     |
| Reporting    | `/api/reporting`         | Report generation & retrieval  |

---

## 🗄 Database Schema

The database uses **PostgreSQL** with the following models managed by Prisma:

| Model               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `User`              | System users with role-based access              |
| `InventoryItem`     | Products/items with stock tracking               |
| `Supplier`          | Vendor/supplier information                      |
| `PurchaseOrder`     | Purchase orders with status workflow             |
| `PurchaseOrderItem` | Line items within a purchase order               |
| `Employee`          | Employee records with HR details                 |
| `LeaveRequest`      | Employee leave requests with approval flow       |
| `Report`            | Generated reports with JSON data payload         |

### Roles
- **ADMIN** — Full system access
- **MANAGER** — Approval capabilities, departmental access
- **EMPLOYEE** — Standard access, self-service

Explore the schema visually with:

```bash
npm run db:studio
```

---

## ⚙️ Environment Variables

| Variable               | Default                          | Description                   |
| ---------------------- | -------------------------------- | ----------------------------- |
| `DATABASE_URL`         | `postgresql://erp_user:...`      | PostgreSQL connection string  |
| `REDIS_HOST`           | `localhost`                      | Redis host                    |
| `REDIS_PORT`           | `6379`                           | Redis port                    |
| `JWT_SECRET`           | *(set in .env)*                  | JWT signing secret            |
| `JWT_ACCESS_EXPIRATION`| `15m`                            | Access token TTL              |
| `JWT_REFRESH_EXPIRATION`| `7d`                            | Refresh token TTL             |
| `BACKEND_PORT`         | `3001`                           | Backend server port           |
| `FRONTEND_URL`         | `http://localhost:5173`          | CORS allowed origin           |
| `NODE_ENV`             | `development`                    | Environment mode              |

> ⚠️ **Important**: Change `JWT_SECRET` and database credentials before deploying to production.

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  Built with ❤️ using NestJS, React, and Prisma
</p>
