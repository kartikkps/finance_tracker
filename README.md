# Finance Data Processing & Access Control Backend API

A production-ready RESTful backend for managing financial records with **Role-Based Access Control (RBAC)**, JWT authentication, and dashboard analytics.

## Features

- **JWT Authentication** — Stateless, secure token-based auth
- **3-Tier RBAC** — Viewer / Analyst / Admin permission system
- **Financial Records CRUD** — Income & expense tracking with filters, search, and pagination
- **Dashboard Analytics** — Real-time summaries, monthly trends, category breakdowns
- **Input Validation** — Zod schema validation on all endpoints
- **Rate Limiting** — 100 req/15 min per IP
- **Clean Architecture** — Modular layered structure (controller → service → DB)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod 4 |
| Testing | Jest + Supertest |

## Project Structure

```
src/
├── config/          # DB singleton (Prisma)
├── middleware/      # auth, rbac, validate
├── modules/
│   ├── auth/        # register, login, /me
│   ├── users/       # Admin user management
│   ├── records/     # Financial CRUD
│   └── dashboard/   # Analytics & summaries
├── types/           # Express Request extension
└── utils/           # Response helpers, custom errors
```

## Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL running locally (or a connection string)

### Setup

```bash
# 1. Clone & install
git clone <repo-url>
cd finance-tracker
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed test data
npm run seed

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@acme.com | Admin@123 |
| Analyst | analyst@acme.com | Analyst@123 |
| Viewer | viewer@acme.com | Viewer@123 |

## API Endpoints

### Authentication
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | All roles |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id/role` | Update user role |
| DELETE | `/api/users/:id` | Delete user |

### Financial Records
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/records` | Analyst, Admin |
| GET | `/api/records` | All (Viewer: own data) |
| GET | `/api/records/:id` | All (Viewer: own data) |
| PUT | `/api/records/:id` | Analyst (own), Admin |
| DELETE | `/api/records/:id` | Admin only |

**Filter query params:** `type`, `category`, `from`, `to`, `search`, `page`, `limit`

### Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/dashboard/summary` | All roles |
| GET | `/api/dashboard/trends` | Analyst, Admin |
| GET | `/api/dashboard/categories` | Analyst, Admin |
| GET | `/api/dashboard/top-records` | Admin only |

## Scripts

```bash
npm run dev           # Start dev server with hot reload
npm run build         # Compile TypeScript
npm start             # Run compiled production build
npm run seed          # Seed database with test users & records
npm test              # Run integration tests
npm run test:coverage # Run tests with coverage report
npx prisma studio     # Open Prisma GUI
```

## Permission Matrix

| Endpoint | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ |
| View own records | ✅ | ✅ | ✅ |
| Dashboard summary | ✅ | ✅ | ✅ |
| Create records | ❌ | ✅ | ✅ |
| Update own records | ❌ | ✅ | ✅ |
| Dashboard trends | ❌ | ✅ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | ✅ |
| `JWT_EXPIRES_IN` | JWT expiry (default: `24h`) | ❌ |
| `PORT` | Server port (default: `3000`) | ❌ |
| `BCRYPT_ROUNDS` | Password hash rounds (default: `12`) | ❌ |

## Technical Decisions & Trade-offs

1. **Express.js vs NestJS/Fastify**: Chose Express for its unopinionated simplicity and massive ecosystem. *Trade-off*: Express lacks built-in structure, which was mitigated by strictly enforcing a layered architecture (Controllers -> Services -> DB) to keep the codebase maintainable.
2. **Prisma ORM vs Raw SQL/TypeORM**: Chose Prisma for its unmatched TypeScript integration and auto-generated data types. *Trade-off*: Prisma can be slightly less performant on highly complex, deeply nested queries compared to Raw SQL. For a standard CRUD finance application, the developer experience and type safety significantly outweigh this limit.
3. **Stateless JWT over Stateful Sessions**: Used JSON Web Tokens (JWT) for authentication. *Trade-off*: JWTs scale horizontally easily without needing a Redis instance, but immediate token revocation (logout) is harder. This is mitigated by setting a conservative 24h token expiry.
4. **Zod vs express-validator**: Chose Zod because it allows deriving TypeScript types directly from the validation schemas (DRY principle). *Trade-off*: Small runtime parsing overhead, which is entirely negligible compared to the network layer overhead.
5. **Database-Level Aggregation for Analytics**: Dashboard charts (e.g., spending trends) are calculated using PostgreSQL aggregations (`SUM()`, `GROUP BY`) rather than fetching raw rows and summing them in Node.js. *Trade-off*: Slightly increases database CPU load, but drastically saves Node.js memory and prevents network bottlenecks.
6. **Financial Precision (`DECIMAL` vs `FLOAT`)**: Used `Prisma.Decimal` mapped to PostgreSQL `DECIMAL(15,2)`. *Trade-off*: Requires string-to-number mapping in JavaScript rather than using native JS `Number`, but entirely prevents floating-point precision errors which are unacceptable in financial accounting.

## Architecture Notes & Assumptions

1. **DECIMAL(15,2) for money** — Never `FLOAT`. Financial precision requires fixed-point types.
2. **Viewers see only their own data** — Enforced at the service layer, not just the route.
3. **Analysts can only edit their own records** — Ownership check in `record.service.ts`.
4. **Aggregation at DB level** — Dashboard `groupBy` runs in PostgreSQL, not in Node.
5. **JWT is stateless** — No session store. Token expiry set to 24h. Refresh token not implemented (out of scope).
6. **Single role per user** — A user has exactly one role at a time. Role changes take effect on next login.
7. **Soft deletes not implemented** — Records are hard-deleted. Can be added with `deletedAt` field.

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
4. Start command: `npm start`
5. Add all environment variables in the Render dashboard

## Running Tests

Tests require a seeded database. Run `npm run seed` before `npm test`.

```bash
npm run seed   # Seed test users
npm test       # Run all integration tests
```
