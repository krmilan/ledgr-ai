# Ledgr.ai — AI-Powered Personal Finance Dashboard

![Ledgr.ai Dashboard](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/dashboard.png)

> A production-grade full-stack web application for tracking personal finances, setting budgets, and getting AI-powered spending insights.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-10b981?style=for-the-badge)](https://ledgr-ai-frontend.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-6366f1?style=for-the-badge)](https://ledgr-ai-backend.onrender.com/health)
[![GitHub](https://img.shields.io/badge/Source%20Code-GitHub-1e1e2e?style=for-the-badge&logo=github)](https://github.com/krmilan/ledgr-ai)

## 🔑 Demo Access
**Email:** demo@ledgr.ai
**Password:** demo2026@
> Once signed in, hit "Load Demo Data" to seed the 32 transactions + 8 budgets
> ⚠️ First load may take 30–60 seconds (Render free tier cold start). Fully functional once the API wakes up.

---

## 📸 Screenshots

| Dashboard | Transactions | Budgets |
|-----------|-------------|---------|
| ![Dashboard](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/dashboard.png) | ![Transactions](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/transactions.png) | ![Budgets](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/budgets.png) |

| AI Insights | Profile | Login / Sign Up |
|-------------|---------|--------|
| ![AI Insights](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/ai-insights.png) | ![Profile](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/profile.png) | ![Login](https://raw.githubusercontent.com/krmilan/ledgr-ai/main/docs/login-signup.png) |

---

## 🚀 Features

- **Dashboard** — Monthly financial snapshot with income, expenses, savings rate, and spending chart
- **Transactions** — Full CRUD with search, category filtering, pagination, and debounced search
- **Budgets** — Set monthly spending limits per category with real-time progress tracking
- **AI Insights** — GPT-4o mini powered spending analysis and actionable financial tips
- **Auto-categorization** — AI automatically categorizes transactions by name
- **Demo data** — One-click seed with 32 realistic transactions and 8 budgets (safety check prevents overwriting real data)
- **Authentication** — Secure JWT-based auth via Clerk (sign up, sign in, sign out, profile management)
- **Responsive** — Mobile-first design with hamburger navigation
- **Profile** — User profile with account details and Clerk-managed settings

---

## 🏗️ Architecture

```
ledgr-ai/                          ← Monorepo
├── frontend/                      ← Next.js 15 (Vercel)
│   ├── src/app/                   ← App Router pages
│   ├── src/components/            ← Reusable UI components
│   └── src/lib/                   ← API client, utilities
└── backend/                       ← Express + TypeScript (Render)
    ├── src/controllers/           ← HTTP request handlers
    ├── src/services/              ← Business logic + DB queries
    ├── src/middleware/            ← Auth, rate limiting, validation
    ├── src/routes/                ← URL → controller mapping
    └── prisma/                    ← Database schema + migrations
```

```
Browser → Vercel (Next.js) → Render (Express API) → Supabase (PostgreSQL)
                ↕                      ↕
           Clerk (Auth)           OpenAI API
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15 (App Router) | React framework with SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Clerk | Authentication & session management |
| Recharts | Data visualization |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| Prisma ORM 5.22.0 | Type-safe database queries |
| PostgreSQL | Relational database |
| Clerk Backend SDK | JWT verification |
| OpenAI SDK | AI categorization & insights |
| express-rate-limit | API rate limiting |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting + CDN |
| Render | Backend hosting |
| Supabase | Managed PostgreSQL + PgBouncer connection pooling |
| GitHub Actions | CI/CD pipeline |

---

## 🗄️ Database Schema

```sql
users          → id, clerk_id, email, created_at
transactions   → id, user_id (FK), name, amount, category, date, ai_categorized
budgets        → id, user_id (FK), category, limit_amount, month, year
ai_insights    → id, user_id (FK), insight_text, month, year, generated_at
```

Key design decisions:
- **UUIDs** as primary keys (no sequential enumeration attacks)
- **DECIMAL(12,2)** for money (never Float — avoids floating point errors)
- **Composite indexes** on `(user_id, date)` and `(user_id, category)` for dashboard query patterns
- **Cascade deletes** — removing a user removes all their data
- **Unique constraint** on `(user_id, category, month, year)` in budgets — one budget per category per month

---

## 🔐 Authentication Flow

```
1. User signs in via Clerk (frontend)
2. Clerk issues a signed JWT
3. Frontend attaches JWT to every API request: Authorization: Bearer <token>
4. Backend middleware calls Clerk's verifyToken() to validate
5. Clerk ID extracted from JWT → looked up in our DB → PostgreSQL UUID used for all queries
```

The separation between Clerk's user ID and our own UUID means we can swap auth providers without touching any relational data.

---

## 📡 API Endpoints

```
POST   /api/users/sync              Sync Clerk user to database
GET    /api/users/me                Get current user profile

GET    /api/transactions            List with pagination + filters
GET    /api/transactions/summary    Aggregated stats (income, expenses, by category)
POST   /api/transactions            Create (with optional AI auto-categorization)
PATCH  /api/transactions/:id        Update
DELETE /api/transactions/:id        Delete

GET    /api/budgets                 List budgets with actual spend merged in
POST   /api/budgets                 Create or update (upsert)
PATCH  /api/budgets/:id             Update limit
DELETE /api/budgets/:id             Delete

GET    /api/ai/insights             Get saved insight for a month
POST   /api/ai/insights             Generate new insight via OpenAI
POST   /api/ai/categorize           Categorize a transaction name

GET    /health                      Server health check
GET    /api/health/detailed         Health + database connectivity

POST   /api/demo/seed               Seed 32 demo transactions + 8 budgets
DELETE /api/demo/clear              Clear all demo data
```

All routes except `/health` require `Authorization: Bearer <jwt>` header.

---

## ⚡ Key Engineering Decisions

**Why a monorepo?**
Keeps frontend and backend in one repository with shared versioning. Atomic commits can span both layers. Single CI/CD pipeline covers the whole system.

**Why Prisma over raw SQL?**
Type-safe queries catch bugs at compile time. Schema-as-code means migrations are version-controlled and reproducible. Still exposes `$queryRaw` for complex queries.

**Why connection pooling?**
Supabase uses PgBouncer (port 6543) to multiplex many app connections into fewer real database connections. PostgreSQL has a hard connection limit — pooling is essential at scale. Migrations use the direct connection (port 5432) because PgBouncer's transaction mode doesn't support DDL statements.

**Why Clerk instead of custom auth?**
Implementing secure authentication (password hashing, session management, OAuth, MFA) correctly takes weeks and is a common source of vulnerabilities. Clerk handles all of this. The backend only needs to verify the JWT — no session storage, no password handling.

**Why separate Clerk ID from database UUID?**
Clerk's `user_2abc...` ID format isn't suitable as a foreign key across millions of rows. Our own UUID is used for all relational data. This also means migrating auth providers only requires updating the sync logic — all data stays intact.

**Why are migrations not automated in CI/CD?**
Supabase's free tier blocks direct connections on port 5432 from external IP ranges like GitHub Actions runners. Running DDL through PgBouncer (port 6543) is also unsafe — transaction mode doesn't support schema changes. Migrations are a deliberate manual step run locally before deploying schema changes, which is safer than auto-running them on every push anyway.

**Why does the CI pipeline use Node 18 for backend and Node 20 for frontend?**
Next.js 15 enforces `>=20.9.0` at build time. The Express backend is stable on Node 18 LTS. Running both on the same version would either break the frontend build or use a newer-than-necessary runtime for the backend.

---

## 🐛 Production Bugs Fixed

Real issues encountered and solved during development — each one a learning moment.

| Bug | Symptom | Root Cause | Fix |
|-----|---------|-----------|-----|
| PgBouncer prepared statement conflict | `prepared statement already exists` error on first query | PgBouncer's transaction mode doesn't support named prepared statements that Prisma uses by default | Added `?pgbouncer=true` to `DATABASE_URL` to disable prepared statements |
| Timezone date filtering off by 1 day | Transactions on the 1st of the month missing from monthly summaries | `new Date()` uses local timezone; comparison was inconsistent across environments | Switched to `Date.UTC()` everywhere for consistent UTC-based filtering |
| Clerk ID vs PostgreSQL UUID mismatch | Auth middleware passing Clerk's `user_2abc...` string as a UUID FK causing DB errors | Clerk IDs are not UUIDs — cannot be used directly as PostgreSQL foreign keys | Built `resolveDbUserId()` helper that looks up our internal UUID from the Clerk ID on every request |
| Prisma namespace types crashing on Render | `TypeError: Cannot read properties of undefined` in production only | Prisma's namespace types (`Prisma.TransactionGetPayload`) not available after build on Render | Replaced all Prisma namespace types with plain TypeScript object types |
| `prisma generate` missing from Render build | Prisma client not found error on first deploy | Render's build command only ran `npm run build` — Prisma client must be generated before TypeScript compilation | Added `npx prisma generate` to the Render build command |
| CORS blocking Vercel preview URLs | API calls failing from Vercel preview deployments (e.g. `ledgr-ai-xxx.vercel.app`) | CORS was configured with an exact origin match — preview URLs are dynamic and unpredictable | Switched to regex pattern matching on origin (`/vercel\.app$/`) instead of exact string comparison |
| Recharts formatter type error on Vercel build | TypeScript build failing only in CI, not locally | Recharts `formatter` prop expects a specific callback signature; local TS was lenient, Vercel's strict build caught it | Fixed the TypeScript type annotation on the formatter callback |
| Rate limiter `X-Forwarded-For` warning | `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` in Render logs | Render sits behind a reverse proxy — Express didn't know to trust the forwarded IP headers, so rate limiter couldn't identify real client IPs | Added `app.set('trust proxy', 1)` in `app.ts` |
| Vercel internal server error on production URL | `Internal Server Error` on `ledgr-ai-frontend.vercel.app` only; preview URLs worked fine | GitHub Actions was deploying to Vercel via CLI (`vercel deploy --prod`) which created a production deployment without the env vars set in Vercel's dashboard | Removed CLI deploy from GitHub Actions; Vercel's native Git integration handles frontend deploys automatically and reads env vars correctly |
| GitHub Actions cache path failure | `Some specified paths were not resolved, unable to cache dependencies` | `cache-dependency-path` pointed to lockfiles that didn't exist in the CI environment | Removed `cache-dependency-path` and switched from `npm ci` to `npm install` |
| `workflow_call` missing from CI workflow | `deploy.yml` failing with "workflow is not reusable" error | `ci.yml` was missing the `on: workflow_call` trigger required for another workflow to call it | Added `workflow_call` trigger to `ci.yml` |

---

## ⚙️ CI/CD Pipeline

```
Push to main
    ↓
CI Gate — lint + typecheck + build (backend Node 18, frontend Node 20)
    ↓
Deploy Backend → Render (via deploy hook)
Frontend → auto-deployed by Vercel Git integration
```

**On every PR:** CI runs automatically — catches type errors and broken builds before merge.

**On push to main:** CI gate must pass before any deployment triggers.

**Migrations:** Run manually (`cd backend && npx prisma migrate deploy`) — not automated due to Supabase network restrictions on CI runners.

---

## 🏃 Running Locally

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) account (free)
- A [Clerk](https://clerk.com) account (free)

### 1. Clone the repository

```bash
git clone https://github.com/krmilan/ledgr-ai.git
cd ledgr-ai
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
CLERK_SECRET_KEY=sk_test_your_key
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=sk-your-key-optional
```

Run migrations and start:

```bash
npx prisma migrate dev
npm run dev
```

Backend runs on `http://localhost:8080`

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 🚀 Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | Vercel | Root: `frontend/`, auto-deploys on push to `main` via Git integration |
| Backend | Render | Root: `backend/`, Build: `npm install --include=dev && npx prisma generate && npm run build` |
| Database | Supabase | PostgreSQL with PgBouncer — use port 6543 for app, port 5432 for migrations |

---

## 📁 Project Structure

```
backend/src/
├── controllers/
│   ├── aiController.ts          AI endpoints handler
│   ├── budgetController.ts      Budget CRUD handler
│   ├── transactionController.ts Transaction CRUD handler
│   └── userController.ts        User sync handler
├── middleware/
│   ├── asyncHandler.ts          Async error wrapper
│   ├── auth.ts                  Clerk JWT verification
│   ├── rateLimiter.ts           express-rate-limit config
│   └── validate.ts              Request body validation
├── routes/
│   ├── ai.ts                    /api/ai routes
│   ├── budgets.ts               /api/budgets routes
│   ├── health.ts                /api/health routes
│   ├── transactions.ts          /api/transactions routes
│   └── users.ts                 /api/users routes
├── services/
│   ├── aiService.ts             OpenAI integration
│   ├── budgetService.ts         Budget DB operations
│   ├── prisma.ts                Prisma client singleton
│   ├── transactionService.ts    Transaction DB operations
│   └── userService.ts           User DB operations
├── types/
│   ├── categories.ts            Shared category constants
│   └── index.ts                 Custom TypeScript types
├── app.ts                       Express app setup + CORS
└── index.ts                     Server entry point

frontend/src/
├── app/
│   ├── ai-insights/             AI Insights page
│   ├── budgets/                 Budgets page
│   ├── dashboard/               Dashboard page
│   ├── profile/                 User profile page
│   ├── sign-in/                 Clerk sign-in
│   ├── sign-up/                 Clerk sign-up
│   └── transactions/            Transactions page
├── components/
│   └── Sidebar.tsx              Responsive navigation
└── lib/
    ├── api.ts                   Typed API client
    └── categories.ts            Category constants + colors
```

---

## 🧑‍💻 Author

**Milan Ray** — [@KRMILAN](https://github.com/krmilan)

Built as a portfolio project to demonstrate full-stack TypeScript development, RESTful API design, relational database modeling, JWT authentication, and AI integration.

---

## 📄 License

MIT