# Rules: TapMenu Build Conventions

These are the standing rules for anyone (or any AI coding agent) working on this codebase. Read `prd.md` and `architecture.md` first — this file governs *how* to build, not *what*.

## 1. General Principles

- Ship the MVP scope in `phases.md` — do not silently add Phase 2/3 features "while you're in there."
- Prefer boring, well-understood solutions over clever ones. This is a restaurant-facing tool; it needs to work on a cheap Android phone with patchy WiFi, not impress other developers.
- Every server-side money calculation (`subtotal`, `total_amount`) must be recomputed from the database — never trust a price sent from the client.
- Every DB write that touches more than one table (e.g. `orders` + `order_items`) must be wrapped in a transaction.

## 2. Tech Stack Lock

Do not swap these without updating `architecture.md` first:
- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- DB: PostgreSQL via Supabase
- Auth: JWT + bcrypt (staff/admin only — customers never authenticate)
- Realtime: Supabase Realtime (fallback: Socket.io)

## 3. Naming Conventions

- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- **DB tables**: `snake_case`, plural (`menu_items`, not `MenuItem`)
- **API routes**: `/api/<resource>/<action>`, plural resource names (`/api/menu-items`)
- **Env vars**: `SCREAMING_SNAKE_CASE`, always documented in `.env.example`

## 4. Frontend Rules

- Mobile-first. Design for a 375px viewport first, then scale up — most customers will scan the QR with their phone.
- No app install, no forced login for the customer flow. Every customer-facing page must be reachable and usable as a plain browser page.
- Cart state lives in React context, not localStorage (per project-wide rule: never use localStorage/sessionStorage in any artifact or client build tied to Claude-generated code — use in-memory state; if persistence across reloads is needed, persist via the backend against the order/table session instead).
- Loading and empty states are not optional — show a skeleton/spinner while menu loads, and a clear empty-cart state.
- Use optimistic UI sparingly: for order status updates, prefer showing "confirming…" over assuming success before the server responds.

## 5. Backend Rules

- Every route handler validates its input (use `zod` or manual checks) before touching the DB.
- Every staff/admin route reads `hotel_id` from the authenticated JWT, never from the request body or query string — prevents one restaurant's staff from touching another's data once multi-tenant lands.
- Rate-limit public `POST /api/orders` per `table_id` to stop duplicate/spam submissions from a flaky connection or accidental double-tap.
- Log errors server-side; never leak stack traces or internal error messages to the client response (same discipline as the PersonalOS production log leak fix).
- All passwords hashed with bcrypt, `JWT_SECRET` required at boot (fail fast if missing — don't silently run with a default secret).

## 6. Database Rules

- Every table gets `created_at TIMESTAMPTZ DEFAULT now()`.
- Foreign keys always specify `ON DELETE` behavior explicitly (`CASCADE` or `SET NULL`) — never leave it implicit.
- Money columns are always `NUMERIC(10,2)`, never `FLOAT`/`REAL`.
- `order_items` always snapshots `item_name` and `unit_price` at order time — never join back to `menu_items` to display historical orders.

## 7. Git / Workflow

- Branch per feature: `feature/customer-menu`, `feature/staff-dashboard`, etc.
- Commit messages: `type: short description` (`feat: add cart context`, `fix: recompute order total server-side`)
- No committing `.env` files — `.env.example` only, with placeholder values.

## 8. What NOT to Do

- Don't add payment gateway code until Phase 2 (see `phases.md`) — pay-at-counter only for MVP.
- Don't build multi-tenant UI (hotel switcher, org management) before the single-restaurant MVP is validated.
- Don't over-engineer the kitchen dashboard with drag-and-drop or complex filtering — a simple status-sorted list is enough for MVP.
- Don't skip server-side price recalculation, ever, even "just for testing."

## 9. When Unsure

Default to whatever keeps the customer-facing flow (scan → menu → order) fastest and simplest. That flow is the product; everything else (admin, analytics, multi-tenant) supports it.
