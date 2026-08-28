# Memory: TapMenu Project Log

This file is a running log of decisions, context, and status for this project. Read this first when resuming work — it's the fastest way to get an AI coding agent (Cursor/Windsurf) or a future you back up to speed without re-reading everything.

**How to use this file:** append new entries at the top under "Log," dated. Don't rewrite history — if a decision changes, add a new entry noting the change and why, rather than editing the old one.

---

## Project Snapshot

- **Name:** ServeEasy (renamed from placeholder "TapMenu" — repo folder/package names still say tapmenu internally, not yet renamed in code)
- **One-liner:** QR-based contactless table ordering + payment for restaurants/hotels
- **Current phase:** Phase 2 — COMPLETE and fully tested through the real UI. Ready to start Phase 3 (online payments) or tackle open Phase 2 items (image upload, rename).
- **Stack:** React + Vite + Tailwind (frontend), Node.js + Express (backend), PostgreSQL via Supabase (DB), Supabase Realtime (live orders — not yet wired, currently polling), JWT + bcrypt (staff/admin auth), Razorpay (Phase 2 payments)
- **Related docs:** `prd.md` (what/why), `architecture.md` (how it's built), `rules.md` (build conventions), `phases.md` (roadmap), `design.md` (UI/UX direction), `functional.md` (how to actually run it, day to day)

## Key Decisions (with reasoning)

| Decision | Reasoning |
|---|---|
| PostgreSQL/Supabase instead of flat-file JSON (unlike PersonalOS) | Concurrent orders from multiple tables need real transactional integrity; JSON files don't scale to concurrent writes safely |
| `hotel_id` on every table from day one, even single-restaurant MVP | Avoids a painful schema migration if/when this becomes a multi-tenant SaaS |
| Pay-at-counter only for MVP, Razorpay deferred to Phase 2 | Validates the core scan→order flow before adding payment gateway complexity |
| Table number auto-detected from QR URL, never manually entered | Removes the single biggest source of order-routing errors |
| `order_items` snapshots item name/price at order time | Historical orders must not change if menu prices are edited later |
| Single React app with route-based sections (not 3 separate apps) | Simplest to build/deploy for MVP; split later only if it becomes a maintenance problem |
| Postgres GRANTs must be set manually per table for `service_role` | Turning off "Automatically expose new tables" in Supabase stops auto-granting privileges — RLS and table grants are separate layers; both must be configured (see Log entry below for the actual incident) |
| Local network IP (not `localhost`) needed for real device testing | Phones can't reach a laptop's `localhost`; both `client/.env` (`VITE_API_URL`) and `server/.env` (`CLIENT_ORIGIN`) must point to the laptop's real IP, and Vite must run with `--host` to accept LAN connections |

## Log

### [Date of this doc's creation]
- Initial planning session completed. Defined problem, user flow, MVP scope, tech stack, DB schema, and phased roadmap.
- Six planning docs created: `prd.md`, `architecture.md`, `rules.md`, `phases.md`, `design.md`, `memory.md`.
- Status: nothing built yet. Next step is Phase 0 (Supabase project setup + repo scaffolding).

### [Follow-up session]
- Repo scaffold built: full folder structure, `schema.sql`, Express server with all 5 route files (menu, orders, auth, staff, admin), JWT auth middleware, React + Vite + Tailwind client with customer menu page, staff login + live dashboard (polling), and an admin stub (Phase 2).
- Added `server/scripts/createStaffUser.js` (`npm run seed:staff`) to create the first staff/admin user via CLI instead of manual DB inserts.
- Status: Phase 1 scaffold complete but not yet connected to a live Supabase project or tested with a real QR scan. Next step: set up Supabase, run schema.sql, seed a staff user, add a demo table + menu item, and test the full flow end-to-end on a phone.

### [Phase 1 completion session]
- **Project renamed** from placeholder "TapMenu" to **ServeEasy**. Code/folder/package names still say `tapmenu` — not yet renamed, tracked as an open item below.
- Created live Supabase project ("ServeEasy", `wveervuypesmbplzmrtf`, region `ap-southeast-1`). Enabled Data API, disabled "automatically expose new tables," enabled automatic RLS.
- Ran `schema.sql` successfully — all 7 tables created, seeded `demo-restaurant` hotel.
- **Bug hit #1:** `npm install` run from repo root instead of `server/` — no `package.json` there. Fixed by `cd server` first. (Applies to `client/` too — always `cd` into the specific app folder before `npm install`.)
- **Bug hit #2:** `GET /api/menu/demo-restaurant` returned "Restaurant not found" even though the row existed. Root cause: disabling "automatically expose new tables" in Supabase stops it from auto-granting table privileges to `service_role` — this is separate from RLS. Fixed by running explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO service_role;` for all 7 tables. **This will bite again** if more tables are added later — new tables need the same GRANT statements run manually.
- **Bug hit #3:** while adding a debug `console.log`, a chunk of Supabase query code got accidentally pasted into `index.js` instead of `routes/menu.js`, causing `SyntaxError: Illegal return statement`. Fixed by removing it from `index.js` — that file should only ever contain app setup/route mounting, never query logic.
- **Bug hit #4:** `npm run seed:staff` failed with "Missing script" — the `scripts/createStaffUser.js` file and the corresponding `package.json` script line hadn't been created locally (only existed in the originally-shared zip, not carried over during manual edits). Recreated both.
- Seeded real data directly via SQL: 1 table (`table_number: 1`), 1 category ("Starters"), 2 menu items (Paneer Tikka ₹220, Chicken 65 ₹260).
- **Full Phase 1 flow verified working, end to end, on a real phone over WiFi (not localhost):**
  - Menu loads correctly on `http://192.168.1.10:5173/m/demo-restaurant/{table_id}`
  - Order placed successfully from customer page → confirmed in DB via direct query
  - Staff login works (`admin@demo.com`, seeded via `npm run seed:staff`)
  - Staff dashboard displays live pending orders
  - Order status update (pending → preparing) confirmed working
- **Status: Phase 1 is fully complete and verified.** This is the real MVP milestone — ready to move to Phase 2 (admin panel) per `phases.md`.

### [Phase 2 session — admin panel]
- Extended `server/routes/admin.js`: added GET endpoints for categories/menu-items/tables (needed so the admin UI can list existing data, not just create), full categories CRUD (was missing entirely before), DELETE for tables.
- **Fixed a real bug found while building this:** QR code URL generation was using `hotel_id` instead of the hotel's `slug` — would have produced broken QR codes (`/m/{uuid}/{tableId}` instead of `/m/demo-restaurant/{tableId}`, which doesn't match the customer route pattern). Fixed to look up and use `hotel.slug`.
- Built the real `client/src/pages/admin/AdminMenuManager.jsx` (replacing the Phase 1 stub): category management, menu item CRUD with availability toggle, table management with **inline QR code images** (rendered via api.qrserver.com — no server-side QR generation library needed for MVP).
- Added a "Manage menu →" link from the staff dashboard and a "View live orders →" link back, so admin and staff views are reachable from the UI instead of only by typing URLs directly.
- Image upload still not implemented — `image_url` is a plain text field for now, no file upload UI. Tracked as still open in Phase 2 checklist.

### [Phase 2 verification + routing/home page session]
- Hit a JSX syntax error in `AdminMenuManager.jsx` after a manual copy-paste — root cause: the opening `<a` tag in the Tables section got dropped during paste (only its attributes survived), which cascaded into "no corresponding closing tag" errors below it. Fixed by restoring the `<a>` tag. **Lesson for future manual copy-pastes:** if VS Code shows cascading JSX errors starting partway through a file, check for a dropped/truncated tag right above the first reported error line — the real bug is usually earlier than where TypeScript first complains.
- Added a public **home page** (`client/src/pages/HomePage.jsx`) at `/` — previously `/` had no route at all ("No routes matched" error), then briefly redirected straight to `/staff/login`, now shows a proper landing page with a "Staff / Admin Login" button and a note that customers should use their table's QR code instead.
- Updated `App.jsx`: added the `/` route, added a catch-all `*` route redirecting unmatched paths back to `/` (previously unmatched paths also errored).
- **Bug hit #5:** login suddenly failed with `ERR_CONNECTION_TIMED_OUT`. Root cause: local IP address had changed (moved to a different WiFi network — `192.168.1.10` → `192.168.31.183`) but `.env` files still pointed at the old IP. **This will happen again** any time the WiFi network changes — local IPs aren't stable across networks or even always across reconnects to the same network. Fixed by switching both `.env` files back to `localhost` for laptop-only work; documented in `functional.md` that phone-testing requires re-checking `ipconfig` fresh each time, not reusing an old IP.
- **Full Phase 2 flow verified through the actual UI** (not just API testing): logged in, added a category, added a menu item, added a table, confirmed the QR code image rendered correctly for the new table.
- **Status: Phase 2 is fully complete and verified.** Both Phase 1 and Phase 2 of the original roadmap are done. Next up per `phases.md`: Phase 3 (Razorpay payments) — or first, the still-open Phase 2 items (image upload UI, code-level rename to `serveeasy`) if preferred before moving on.

---

## What's Built (Phase 1 + Phase 2 — both complete)

- ✅ Supabase project live, schema deployed, RLS + grants configured correctly
- ✅ Express backend: menu, orders, auth, staff, admin routes all functional (admin routes now full CRUD, not just create)
- ✅ Server-side price recalculation on order creation (never trusts client-sent prices)
- ✅ JWT auth for staff/admin, scoped by `hotel_id` from token
- ✅ React customer menu page: categories, cart, floating cart bar, order placement, confirmation screen
- ✅ Staff login + live dashboard (5s polling, color-coded status, one-tap status advance)
- ✅ `npm run seed:staff` CLI script for creating staff/admin users
- ✅ Verified on a real phone over local WiFi — not just localhost
- ✅ Full admin panel: category management, menu item CRUD with availability toggle, table management with inline QR code rendering
- ✅ Public home page at `/` with clear staff/customer separation
- ✅ Full routing: home, customer menu, staff login/dashboard, admin, and catch-all all working

## What Remains (Phase 3 onward — see `phases.md` for full detail)

- ❌ Image upload — `image_url` is still a plain text field, no file picker/Supabase Storage integration
- ❌ Code-level rename from `tapmenu` to `serveeasy` — folder name, `package.json` `name` fields, README still say tapmenu
- ❌ Supabase Realtime — dashboard currently uses polling (5s interval), not true push
- ❌ Online payment (Razorpay) — pay-at-counter only right now
- ❌ Multi-tenant support — single hotel (`demo-restaurant`) only
- ❌ Production deployment (Render/Vercel) — everything is local-only so far
- ❌ Form validation polish — basic required-field checks only, no deeper UX polish on error states

## Open Questions (unresolved, revisit later)

- Pricing model for eventual SaaS version — flat monthly fee vs. per-order commission — not yet decided (see PRD's earlier business-model note: ₹500–2000/month is the common range for this category in India).
- Which restaurant (if any) will be the first real pilot for testing the physical QR-scan flow?
- When to actually do the code-level rename from `tapmenu` → `serveeasy`? (folder name, `package.json` `name` fields, README) — best done before Phase 2 gets much further, to avoid renaming a bigger codebase later.

## Known Risks (carried from PRD, tracked here so they don't get lost)

- Weak WiFi in small restaurants could break the real-time flow — no fallback designed yet
- Cash reconciliation for pay-at-counter orders relies on staff manually marking "paid" — possible friction point, not yet solved