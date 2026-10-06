# Flowboard — Full-Stack Todo Application

A modern, production-style full-stack todo application built with **React**, **Node.js + Express**, and **TiDB Cloud (MySQL)**. Designed as a premium productivity workspace with a Linear/Todoist-inspired interface, command palette, dark/light themes, and full authentication.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20TiDB-blue)

## Features

**Authentication**
- User registration & login with validation
- Secure password hashing (bcrypt)
- JWT token-based authentication with persistence
- Protected routes (frontend + backend)
- Users can only access their own todos

**Todo Management**
- Create, read, update, delete, complete, reopen todos
- Title, description, priority (low/medium/high), due date
- Filtering: Inbox, Today, Upcoming, Completed, High Priority
- Sorting: recently created, due date, priority, title, and more
- Full-text search across titles and descriptions
- Live productivity statistics with animated counters

**Premium UI/UX**
- Linear-inspired sidebar workspace
- Quick-add task input
- Task detail drawer (Notion-style properties)
- Command palette (Raycast-style, `⌘K` / `Ctrl+K`)
- Keyboard shortcuts (`n` = new task, `⌘K` = palette)
- Dark & light themes with smooth transitions
- Micro-interactions: checkbox animations, toasts, skeletons, drawer/modal transitions
- Fully responsive (desktop, tablet, mobile with bottom nav)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | TiDB Cloud (MySQL-compatible) via `mysql2` |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Security | Helmet, CORS, express-rate-limit, express-validator |

## Project Structure

```
frontend/
  src/
    components/   # UI primitives, layout, todo components, command palette
    context/      # Auth, Theme, Toast providers
    hooks/        # useTodos, useDebounce
    pages/        # Login, Register, Dashboard, Profile
    services/     # API client
    utils/        # date helpers, icons
backend/
  src/
    config/       # App config + MySQL connection pool
    controllers/  # authController, todoController
    middleware/   # requireAuth, errorHandler
    models/       # user, todo data access
    routes/       # auth, todos
    utils/        # jwt, error classes
    db/           # schema migration
```

## Setup

### Prerequisites
- Node.js 18+ and npm
- A TiDB Cloud account (or any MySQL-compatible database)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and set:

```env
DATABASE_URL="mysql://user:password@host:4000/test"
JWT_SECRET=a-long-random-secret-string
CLIENT_URL=http://localhost:5173
```

> **Note:** TiDB Cloud serverless permits DDL (CREATE TABLE) only in the `test` database. Point `DATABASE_URL` at the `test` database on your instance.

Initialize the database schema:

```bash
npm run migrate
```

Start the API server:

```bash
npm run dev
```

The API runs on http://localhost:5000.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:5173 and proxies `/api` requests to the backend (see `vite.config.js`).

### 3. Run both (from the repo root)

```bash
npm run install:all
npm run dev
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Log in, returns JWT + user |
| GET | `/api/auth/me` | Get current user (auth required) |
| GET | `/api/todos` | List todos (supports `status`, `priority`, `due`, `sort`, `search`, `limit`, `offset`) |
| GET | `/api/todos/stats` | Aggregated todo statistics |
| GET | `/api/todos/:id` | Get a single todo |
| POST | `/api/todos` | Create a todo |
| PUT | `/api/todos/:id` | Update a todo |
| PATCH | `/api/todos/:id/toggle` | Complete / reopen a todo |
| DELETE | `/api/todos/:id` | Delete a todo |

All `/api/todos` endpoints require an `Authorization: Bearer <token>` header and are scoped to the authenticated user.

## Security Notes

- The database connection string lives **only** in `backend/.env` and is never exposed to the frontend.
- `.env` files are gitignored; `.env.example` files contain placeholders.
- Passwords are hashed with bcrypt (configurable salt rounds).
- All todo queries include a `user_id` condition, so cross-user access is impossible at the data layer.
- Helmet, CORS allow-listing, rate limiting, and centralized error handling are enabled.

## Testing

The backend was verified end-to-end with a 34-point API test suite covering registration, login, validation, JWT auth, full CRUD, filtering, sorting, searching, statistics, and cross-user authorization (all passing).

## License

MIT
