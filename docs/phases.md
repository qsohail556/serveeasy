# Phases: TapMenu Build Roadmap

## Phase 0 — Setup (Day 0–1)

- [ ] Create Supabase project, run schema from `architecture.md`
- [ ] Scaffold Express backend (`server/`), connect to Supabase
- [ ] Scaffold React + Vite + Tailwind frontend (`client/`)
- [ ] Set up `.env.example` for both client and server
- [ ] Deploy skeleton (empty pages, working DB connection) to Render + Vercel to confirm the pipeline works before building features

## Phase 1 — MVP: Single Restaurant, Pay-at-Counter Only

**Goal: a real customer can scan a QR, order food, and staff can see and fulfill it.**

- [ ] Seed one hotel + a few tables + a sample menu (categories + items) directly in DB
- [ ] `GET /api/menu/:hotelSlug` endpoint
- [ ] Customer menu page: `/m/:hotelSlug/:tableId` — categories, items, images, price, veg/non-veg tag
- [ ] Cart (React context): add/remove items, adjust quantity, running total
- [ ] `POST /api/orders` — creates order + order_items in a transaction, recalculates total server-side
- [ ] Order confirmation screen for customer (order number, "pay at counter" note)
- [ ] Staff login (`POST /api/auth/login`, JWT)
- [ ] Staff dashboard: `GET /api/staff/orders?status=pending`, list view sorted by table/time
- [ ] `PATCH /api/staff/orders/:id/status` — pending → preparing → served → paid
- [ ] Realtime: staff dashboard updates live when a new order lands (Supabase Realtime channel scoped to `hotel_id`)
- [ ] Customer status polling: `GET /api/orders/:id/status` every ~5s until served
- [ ] QR generation script: takes `hotelSlug` + `tableId` → outputs printable QR image encoding the menu URL

**Exit criteria:** you can physically print a QR, stick it on a table, scan it with your phone, place a real order, and see it appear on a staff laptop/phone in real time.

## Phase 2 — Admin Panel + Menu Management

- [ ] Admin login (role = admin)
- [ ] Admin: CRUD for categories and menu items (name, price, description, image upload, veg/non-veg, available toggle)
- [ ] Admin: table management — add/remove tables, regenerate QR
- [ ] Image upload/storage (Supabase Storage or similar)
- [ ] Basic validation + error handling polish across all forms

## Phase 3 — Online Payments

- [ ] Razorpay integration (order creation → payment link/checkout → webhook to mark `payment_status = paid`)
- [ ] Customer chooses Pay Now vs Pay at Counter at checkout
- [ ] Handle payment failure/retry gracefully
- [ ] Reconcile: staff dashboard shows payment status per order

## Phase 4 — Multi-Tenant (Selling to Multiple Restaurants)

- [ ] Hotel signup/onboarding flow (admin self-serve registration)
- [ ] Subdomain or slug-based routing per hotel
- [ ] Per-hotel branding (logo, theme color) on customer menu page
- [ ] Billing/subscription layer for restaurant owners (this is now a SaaS)
- [ ] Usage limits / plan tiers if needed

## Phase 5 — Polish & Scale Features

- [ ] Sales analytics dashboard (daily revenue, top-selling items, peak hours, table turnover time)
- [ ] "Call Waiter" button on customer screen
- [ ] SMS/WhatsApp order confirmation
- [ ] Order history per table/session
- [ ] Dedicated Kitchen Display Screen (KDS) view optimized for a mounted tablet
- [ ] Printer/KOT integration for kitchens that still want paper tickets

## Sequencing Rule

Do not start a later phase until the current phase's exit criteria are met and tested with a real (or realistic simulated) order flow. Phase 1 in particular should be validated with an actual physical QR-scan test before touching Phase 2.
