# PRD: QR-Based Table Ordering & Payment System

**Product name (working):** TapMenu *(placeholder — rename later)*
**Owner:** Sohail
**Version:** 1.0 (MVP scope)

---

## 1. Problem Statement

Small and mid-size restaurants/hotels in India still rely on paper menus and manual order-taking. This causes slow service, order errors, and no digital record of sales. Customers increasingly expect contactless, self-serve ordering — scan a QR, browse menu, order, pay — without installing an app.

## 2. Goal

Build a lightweight, mobile-first web system where:
- A customer scans a table-specific QR code
- Browses the restaurant's live menu
- Places an order tied to their table
- Pays (or chooses pay-at-counter)
- Restaurant staff see and manage orders in real time

## 3. Users / Roles

| Role | Access | Auth |
|---|---|---|
| **Customer** | Public menu, cart, order, pay | No login (session tied to table QR) |
| **Staff (kitchen/waiter)** | Order queue, status updates | Login required |
| **Admin (owner)** | Menu CRUD, table/QR management, sales dashboard | Login required, role = admin |

## 4. Core User Flow

1. Customer scans QR on table → opens `https://app.com/m/{hotelSlug}/{tableId}`
2. Table number auto-detected from URL — no manual entry, no room for error
3. Menu loads: categories → items with photo, price, veg/non-veg tag, description
4. Customer adds items to cart, adjusts quantity
5. Customer places order → chooses **Pay Now (UPI/Razorpay)** or **Pay at Counter**
6. Order is inserted into DB with `status: pending`, linked to `table_id` and `hotel_id`
7. Kitchen/staff dashboard receives order in real time (Socket.io / Supabase Realtime)
8. Staff updates status: `pending → preparing → served → paid`
9. Customer's screen reflects live status (polling or websocket)
10. Admin can view daily sales, top items, table turnover from dashboard

## 5. MVP Scope (Phase 1)

✅ Single restaurant only (no multi-tenant yet)
✅ QR generates table-specific link
✅ Public menu page (categories, items, images, price)
✅ Cart + place order (pay-at-counter only, no gateway yet)
✅ Staff dashboard: live order list, status update buttons
✅ Admin: add/edit/delete menu items, mark item available/sold-out

❌ Out of scope for MVP: online payment, multi-restaurant, loyalty, analytics, table reservation, KOT printer integration

## 6. Phase 2+ (post-validation)

- Razorpay integration for pay-now
- Multi-tenant support (many restaurants, subdomain or slug-based)
- Sales analytics dashboard
- SMS/WhatsApp order confirmation
- "Call Waiter" button
- Order history per table/session

*(See `phases.md` for the full phased build-out plan.)*

## 7. Success Metrics

- Time from QR scan → order placed (target: under 2 minutes)
- % of orders placed without staff assistance
- Order error rate (wrong item/table) vs. paper-based baseline
- Staff dashboard adoption

## 8. Risks / Open Questions

- **Internet reliability** — many small restaurants have weak WiFi; consider a lightweight fallback for Phase 2
- **QR wear and tear** — laminate table QR codes; keep the encoded URL re-printable
- **Kitchen display hardware** — MVP assumes staff use a phone/tablet, not a dedicated KDS
- **Cash reconciliation** — pay-at-counter orders still need manual "mark as paid," which is a friction point during rush hours

---

*See `architecture.md` for system design, `design.md` for UI/UX direction, `rules.md` for build conventions, `phases.md` for the roadmap, and `memory.md` for the running decision log.*
