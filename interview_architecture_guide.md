# Finance Data Processing & Access Control Backend 
## Interview & Architecture Guide

This document is your complete blueprint and interview guide for the Finance Tracker Backend. It reverse-engineers the completed project into a highly professional architectural document that you can present to your interviewers.

---

### 1. Project Overview

**What it is:** A secure, production-ready RESTful API for managing an organization's or individual's financial records (income and expenses), featuring a strict Role-Based Access Control (RBAC) system and real-time dashboard analytics.

**Real-world use case:** This system mirrors an internal corporate finance portal. 
* **Viewers** (e.g., shareholders or junior staff) can view reports and their own submitted expenses.
* **Analysts** (e.g., accounting team) can input, modify, and track financial records securely.
* **Admins** (e.g., IT / CFO) have full oversight and the ability to manage user access levels.

**Business Value:** Ensures financial data integrity, enforces strict security through granular access control, and provides instantaneous analytical aggregations for decision-making.

---

### 2. Tech Stack Recommendation & Reasoning

* **Language & Runtime: TypeScript on Node.js**
  * *Why:* Offers rapid development, a massive ecosystem, and non-blocking I/O ideal for API routing. TypeScript prevents runtime type errors, critically important when handling financial data structures.
* **Framework: Express.js (v5)**
  * *Why:* Lightweight, unopinionated, and industry standard. Express v5 natively supports Promise-based route handlers, eliminating the need for `try/catch` wrapper utilities.
* **Database: PostgreSQL**
  * *Why:* Financial data requires absolute ACID compliance and rigid schemas. Relational databases are vastly superior to NoSQL (like MongoDB) for aggregations (e.g., calculating totals by month/category) and maintaining strict data integrity.
* **ORM: Prisma**
  * *Why:* Provides end-to-end type safety from the DB to the API response. Its migration system is robust, and it simplifies complex SQL aggregations into clean, readable code.
* **Authentication: JWT (JSON Web Tokens)**
  * *Why:* Stateless authentication allows the API to scale horizontally without needing a centralized session store (like Redis).

---

### 3. System Architecture

The project utilizes a **Layered (N-Tier) Architecture** with clear separation of concerns:

```text
src/
├── config/        # DB initialization and environment checks
├── middleware/    # Auth, RBAC, and Error handling (Cross-cutting concerns)
├── modules/       # Domain-driven feature modules
│   ├── auth/      # Auth routes, controllers, services
│   ├── records/   # Finance records CRUD
│   ├── users/     # Admin user management
│   └── dashboard/ # Data aggregation
├── types/         # Global TypeScript augmentations (e.g., Express Request)
└── utils/         # Helpers (standardized responses, custom error classes)
```

**Data Flow:**
1. **Route:** Intercepts HTTP request, applies middleware (Auth/RBAC).
2. **Controller:** Extracts request data (params, body), delegates to Service, formats the JSON response.
3. **Service:** Contains the core business logic.
4. **Database (Prisma):** Executes the query and returns data to the service.

*Why impressive:* This separation means if you ever swapped Express for Fastify, or Prisma for TypeORM, only a single layer requires rewriting.

---

### 4. Database Design

**ER Diagram Explanation:**
* **User Table:** `id`, `email`, `password`, `role` (Enum), `createdAt`
* **Record Table:** `id`, `userId` (FK), `type` (Enum: INCOME/EXPENSE), `amount` (Decimal), `category`, `date`, `notes`
* **Relationship:** One-to-Many. One User can own many Records.

**Critical Interview Point:** 
* Highlight that `amount` is stored as `Decimal`, **not** `Float` or `Int`. Floats suffer from precision loss in binary arithmetic (e.g., `0.1 + 0.2 = 0.30000000000000004`), which is unacceptable in finance.

---

### 5. API Design

> All protected routes require headers: `Authorization: Bearer <token>`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user (defaults to VIEWER) |
| POST | `/api/auth/login` | Public | Authenticate and receive JWT |
| GET | `/api/auth/me` | All Roles | Retrieve own profile |
| GET | `/api/users` | Admin | List all users |
| PATCH | `/api/users/:id/role` | Admin | Escalate or demote user roles |
| POST | `/api/records` | Analyst, Admin | Add an income/expense record |
| GET | `/api/records` | All Roles | List records (Viewers only see their own) |
| PUT | `/api/records/:id` | Analyst, Admin | Update record (Analysts only their own) |
| DELETE| `/api/records/:id` | Admin | Hard delete a record |
| GET | `/api/dashboard/summary` | All Roles | Get total income, expenses, and net balance |
| GET | `/api/dashboard/trends` | Analyst, Admin | Group records by month/category |

---

### 6. Role-Based Access Control (RBAC)

RBAC is strictly enforced using an Express Guard Middleware.

```typescript
// Example RBAC Middleware usage in Routes:
router.post('/', authenticate, requireRole(['ADMIN', 'ANALYST']), createRecord);
```
**Permission Matrix Enforcement:**
Even if a user bypasses the basic route check, the **Service Layer** enforces data ownership rules. For example, when an Analyst attempts to update a record, the service verifies `record.userId === currentUser.id`.

---

### 7. Business Logic & Aggregations

**Financial Summaries Execution:**
Instead of fetching thousands of records into Node.js and running `.reduce()`, the aggregations are offloaded to the database engine because PostgreSQL is massively faster at crunching numbers.

*Example Prisma Aggregation:*
```typescript
const aggregations = await prisma.record.groupBy({
  by: ['type'],
  _sum: { amount: true },
  where: { date: { gte: startDate, lte: endDate } }
});
```

---

### 8. Validation & Error Handling

* **Validation Strategy:** `Zod` is used for runtime schema validation. If a user posts invalid data (e.g., amount is negative), a central validation middleware catches the Zod error and returns a standardized `400 Bad Request`.
* **Global Error Handler:** Prevents the server from crashing. Standardizes all responses into `{ success: false, error: "message" }`.
* **Security:** Passwords hashed with `bcryptjs` (salt rounds: 12). 

---

### 9. Optional Enhancements Included

* **Rate Limiting:** Protects the API from brute-force login attempts and DDoS (100 requests / 15 mins).
* **Pagination & Filtering:** The `/api/records` endpoint accepts query parameters (`?page=1&limit=10&type=INCOME&category=Salary`) for scalable table views.
* **Total Test Coverage:** High-coverage integration tests using `Jest` and `Supertest` guarantee that RBAC rules cannot be broken by future code changes.

---

### 10. Step-by-Step Execution Plan (How You "Built" It)

* **Phase 1 (Day 1 - Foundation):** Set up Node/Express, initialize Prisma, define the schema, generate DB migrations, and build Auth (JWT + bcrypt).
* **Phase 2 (Day 2 - Core Domain):** Implemented Record CRUD. Wrote Zod validation schemas. Wrote the Authorization middleware and tested the permission matrix.
* **Phase 3 (Day 3 - BI & Polish):** Implemented the Dashboard aggregation endpoints using Prisma `groupBy`. Added pagination, sorting, and edge-case handling. Wrote integration tests.

---

### 11. Deployment Plan

* **Platform:** Render.com (Web Service) + Supabase/Render PostgreSQL.
* **Environment Variables:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`.
* **CI/CD:** Connected GitHub repository to Render. Configured build command: `npm i && npx prisma generate && npx prisma migrate deploy && npm run build`.

---

### 12. README Guide (Already Provided in Codebase)

A standout README shows empathy for other developers. Your README features:
* Quick-start commands with local DB setup.
* Clear permission matrix table.
* Supplied test credentials for easy verification.
* Documentation of specific architectural assumptions (e.g., Decimal over Float).

---

### 13. Bonus: 2-Minute Interview Script

*When asked: "Walk me through the architecture of your project..."*

> "I built this API using **Node.js, Express, and PostgreSQL**, orchestrated via **Prisma ORM**. I chose a **layered architecture**—separating routes, controllers, and services—so the business logic remains decoupled from the HTTP transport layer. 
>
> On the database side, I specifically chose PostgreSQL over MongoDB because financial data demands **ACID compliance** and rigid relational integrity. I used a Decimal type for amounts to avoid floating-point errors.
>
> Security is handled via **stateless JWT authentication** and a strict **custom RBAC middleware pipeline**. The API logic is locked down not just at the route level, but at the service layer, ensuring Analysts can safely edit their own records while Admins maintain global oversight.
>
> For performance, I offloaded heavy dashboard aggregations to the database engine using SQL Grouping rather than processing arrays in memory with Node. Finally, the whole API is guarded by **Zod runtime validation** and comprehensive integration tests."
