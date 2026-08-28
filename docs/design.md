# Design: TapMenu UI/UX Direction

## 1. Design Principles

- **Mobile-first, thumb-reachable.** The customer is holding their phone one-handed at a table. Primary actions (add to cart, place order) sit in the bottom third of the screen, not the top.
- **Zero-friction.** No login, no app download, no unnecessary steps between scanning the QR and seeing food. Table number is auto-filled — never make the customer type or select it.
- **Food photography does the selling.** Menu items need real, appetizing photos — this is the single biggest driver of order value in QR-menu products. Budget time for decent product photography, not just placeholder icons.
- **Staff dashboard is a work tool, not a showcase.** Optimize for speed of scanning/updating orders under time pressure, not visual flourish. Big tap targets, high contrast, glanceable status.

## 2. Customer-Facing Menu (Primary Surface)

### Layout
- Sticky header: restaurant name/logo + table number badge (e.g. "Table 5") so the customer always knows they're on the right table
- Category tabs (horizontal scroll) below header: Starters / Mains / Drinks / Desserts, etc.
- Item cards: photo (left or top), name, short description, price, veg/non-veg dot indicator, quantity stepper or "Add" button
- Floating cart bar pinned to bottom: "🛒 3 items · ₹450 · View Cart" — always visible once cart is non-empty

### Cart / Checkout
- Slide-up sheet (not a full page navigation) for reviewing cart — keeps it feeling fast
- Quantity adjustment inline, swipe-to-remove or explicit remove button
- Clear total, then a single prominent "Place Order" button
- Payment method choice (Pay Now / Pay at Counter) as a simple toggle, not a separate page

### Order Confirmation
- Big, clear order number/status ("Order #24 · Preparing")
- Estimated time if available, otherwise just a status label
- No dead-end screen — always show "Add more items" to return to menu (upsell + convenience)

## 3. Staff Dashboard

### Layout
- Column or card-based queue, grouped/sorted by status: **Pending → Preparing → Served**
- Each order card shows: table number (large, most important info), items + quantities, time since order placed, one-tap status advance button
- Color coding: pending = amber/red urgency tone, preparing = blue, served = green — staff should be able to triage by color alone from across the room
- Sound/visual pulse on new order arrival (real-time feel matters here — this is the dashboard's whole value proposition over shouting orders across a kitchen)

## 4. Admin Panel

- Standard CRUD table/list UI — this surface is used rarely, so clarity beats cleverness
- Menu item form: name, category dropdown, price, description, image upload, veg/non-veg toggle, available toggle
- Table management: list of tables with "Print QR" action per row

## 5. Visual Style

- **Typography:** one clean sans-serif (Inter or similar) throughout — don't mix fonts across the three surfaces
- **Color:** a warm, appetite-appropriate primary color (red/orange family is standard for food, but pick something that differentiates from generic templates — see `frontend-design` conventions for avoiding a templated look) plus a neutral gray scale for structure
- **Spacing:** generous padding on customer-facing cards — this is touched with a thumb, not a mouse
- **Icons:** minimal, functional (cart, veg/non-veg dot, status icons) — not decorative

## 6. Accessibility

- All form inputs need proper labels (carry over the form accessibility fixes already applied in PersonalOS)
- Sufficient color contrast on status badges — don't rely on color alone to convey pending/preparing/served (pair with text label)
- Tap targets minimum 44×44px on customer-facing buttons

## 7. What to Avoid

- Don't make the customer scroll through a wall of text menu — visual, card-based browsing only
- Don't hide the cart behind a menu icon — it should always be visible once non-empty
- Don't over-animate; Framer Motion is fine for subtle transitions (cart sheet sliding up) but skip anything that slows down repeat use
- Don't design the staff dashboard to look like the customer menu — different job, different visual language
