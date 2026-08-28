# Architecture: TapMenu

## 1. System Overview

Three surfaces, one backend:

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Customer Web    │     │  Staff Dashboard  │     │  Admin Panel      │
│  (public, no     │     │  (JWT auth)       │     │  (JWT auth, role  │
│   login)         │     │                   │     │   = admin)        │
└────────┬─────────┘     └────────┬──────────┘     └────────┬──────────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │  Express REST API  │
                         │  + Socket.io /     │
                         │  Supabase Realtime │
                         └─────────┬─────────┘
                                   │
                         ┌─────────▼─────────┐
                         │  PostgreSQL         │
                         │  (Supabase)         │
                         └────────────────────┘
```

All three frontends can be a single React app with route-based sections (`/m/:hotel/:table` public, `/staff/*` and `/admin/*` behind auth) — simplest to build and deploy as one Vercel project. Split into separate apps only if the project grows past MVP.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Tailwind + Vite | Fast, mobile-first, matches your existing stack |
| Backend | Node.js + Express | Matches PersonalOS stack |
| Database | PostgreSQL (Supabase) | Concurrent orders across tables need real transactional integrity — flat-file JSON won't hold up here |
| Real-time | Supabase Realtime (preferred) or Socket.io | Kitchen dashboard must update without manual refresh |
| Auth (staff/admin only) | JWT + bcrypt | Same pattern as PersonalOS AuthContext |
| Payments (Phase 2) | Razorpay | Best UPI support in India |
| QR generation | `qrcode` npm package | Encodes `hotelSlug` + `tableId` into a URL |
| Hosting | Render/Railway (backend) + Vercel (frontend), or both on Render | Free-tier friendly for MVP |

## 3. Data Flow — Placing an Order

1. Customer's browser loads `GET /api/menu/:hotelSlug` → renders categories/items
2. Customer builds cart client-side (React state, not persisted server-side until submit)
3. On submit: `POST /api/orders` with `{ table_id, items: [{menu_item_id, quantity}] }`
4. Backend validates items are `is_available = true`, recalculates prices server-side (never trust client-sent prices), inserts `orders` + `order_items` rows in a single DB transaction
5. Backend emits a realtime event (`new_order`) scoped to `hotel_id`
6. Staff dashboard, subscribed to that hotel's channel, receives the event and prepends the order to the queue
7. Customer's screen polls `GET /api/orders/:id/status` every ~5s (simplest for MVP; upgrade to websocket push later) until status changes

## 4. Database Schema

```sql
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, preparing, served, paid, cancelled
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'counter', -- counter, online
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  item_name TEXT NOT NULL,   -- snapshot at order time
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,  -- snapshot at order time
  subtotal NUMERIC(10,2) NOT NULL
);

CREATE TABLE staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'staff', -- staff, admin
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Design notes:**
- `hotel_id` is on every table even in single-restaurant MVP — avoids a painful migration if this becomes multi-tenant later.
- `order_items.item_name` / `unit_price` are snapshotted so historical orders don't change if a menu item is later edited.
- `tables.qr_code_url` stores the exact encoded URL so QR codes can be reprinted without breaking.

## 5. API Endpoints (MVP)

**Public (no auth):**
- `GET /api/menu/:hotelSlug` — menu grouped by category
- `POST /api/orders` — create order
- `GET /api/orders/:orderId/status` — poll status

**Staff/Admin (JWT-protected):**
- `POST /api/auth/login`
- `GET /api/staff/orders?status=pending` — live queue
- `PATCH /api/staff/orders/:id/status` — update status
- `POST/PATCH/DELETE /api/admin/menu-items` — menu CRUD
- `POST /api/admin/tables` — add table, auto-generate QR

## 6. Folder Structure (suggested)

```
tapmenu/
├── client/                # React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── customer/  # /m/:hotel/:table
│   │   │   ├── staff/
│   │   │   └── admin/
│   │   ├── components/
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── lib/             # api client, supabase client
│   │   └── App.tsx
├── server/                 # Express API
│   ├── routes/
│   ├── controllers/
│   ├── middleware/          # auth, error handling
│   ├── db/                  # supabase client, migrations
│   └── index.ts
└── docs/                    # this doc set
```

## 7. Security Notes

- Never trust client-sent prices — always recompute `subtotal`/`total_amount` server-side from `menu_items.price`
- Staff/admin routes require JWT middleware; scope every query by `hotel_id` from the token, not from the request body
- Rate-limit `POST /api/orders` per table to prevent spam/duplicate submissions
- Sanitize/validate all admin menu-item inputs (same MIME/type validation discipline as PersonalOS)
