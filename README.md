# ServeEasy

QR-based contactless table ordering for restaurants. See `/docs` for full planning docs (`prd.md`, `architecture.md`, `rules.md`, `phases.md`, `design.md`, `memory.md`).

## Current status

Phase 0/1 scaffold — folder structure, DB schema, server routes, and the customer menu + staff dashboard pages are in place. Not yet wired to a live Supabase project. Admin panel is a stub (Phase 2).

## Setup

### 1. Database

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL editor and run `server/db/schema.sql`
3. Copy your project URL and **service role key** (Settings → API)

### 2. Server

```bash
cd server
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
npm install
npm run dev             # runs on http://localhost:4000
```

Create a staff/admin user manually for now (Phase 2 will add a signup flow):

```js
// quick one-off script, or run in Node REPL with dotenv loaded
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('yourpassword', 10);
console.log(hash); // insert into staff_users manually via Supabase table editor
```

### 3. Client

```bash
cd client
cp .env.example .env    # points at your local server by default
npm install
npm run dev              # runs on http://localhost:5173
```

### 4. Test the flow

1. In Supabase, grab the `demo-restaurant` hotel's `id`, and manually insert a row into `tables` for it
2. Add a category and a menu item via the Supabase table editor (Phase 2 admin UI will replace this)
3. Visit `http://localhost:5173/m/demo-restaurant/{table_id}` — you should see the menu
4. Add items, place an order
5. Log in at `http://localhost:5173/staff/login` and watch the order appear on `/staff`

## What's next

Follow `docs/phases.md` in order. Do not start Phase 2 (admin CRUD) until the Phase 1 flow above works end-to-end with a real QR scan on a phone.
