# VoucherPro — Expense Voucher Management System

A production-ready full-stack web application that digitizes ABC Company's expense voucher workflow — from creation through director approval to accounts reimbursement.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/expense-voucher run dev` — run the frontend (port 19084)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Credentials

All passwords: `password123`

| Role       | Email                | Name           |
|------------|----------------------|----------------|
| Employee   | employee@abc.com     | Alice Johnson  |
| Employee   | employee2@abc.com    | Bob Smith      |
| Director   | director@abc.com     | Carol Director |
| Accounts   | accounts@abc.com     | Dave Accounts  |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion, React Hook Form, Wouter routing, Recharts
- **API:** Express 5, JWT auth (`jsonwebtoken` + `bcryptjs`), Multer for file uploads
- **DB:** PostgreSQL + Drizzle ORM
- **Validation:** Zod (`zod/v4`), `drizzle-zod`
- **API codegen:** Orval (from OpenAPI spec)
- **Build:** esbuild (CJS bundle)

## Where Things Live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — database tables (users, vouchers)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, vouchers, dashboard)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware + role guards
- `artifacts/expense-voucher/src/` — React frontend
  - `src/lib/auth.ts` — JWT token helpers
  - `src/lib/auth-context.tsx` — AuthProvider, useAuth hook
  - `src/pages/` — Login, Dashboard, Vouchers list, Create/Edit/Detail views

## Voucher Workflow

Draft → Submitted (pending_approval) → Approved or Rejected

- Employee creates/edits drafts, uploads signature, submits
- Director views pending vouchers, uploads director signature, approves or rejects with reason
- Accounts views all approved vouchers, can print/download

## Architecture Decisions

- JWT stored in `localStorage` — no server sessions, stateless API
- File uploads (signatures) stored on disk under `uploads/signatures/`, served at `/api/uploads/signatures/:filename`
- Employees can only see their own vouchers; Directors and Accounts see all
- Date columns use `drizzle-orm date(..., { mode: "string" })` for YYYY-MM-DD calendar values; Zod coerces to `Date` objects on the API boundary, then back to strings before DB writes
- `setAuthTokenGetter` from `@workspace/api-client-react` is called in `App.tsx` so all generated hooks automatically inject the Bearer token

## User Preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always re-run codegen before touching the frontend
- The DB date columns expect `YYYY-MM-DD` strings; convert Date objects via `.toISOString().slice(0, 10)` before inserting
- Signature upload endpoints are NOT in the generated hooks (multipart form TS2308 issue) — use raw `fetch` with FormData and Bearer token
- `pnpm approve-builds` may be needed after adding native node addons; use `bcryptjs` (pure JS) instead of `bcrypt` to avoid this
