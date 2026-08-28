import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../db/supabaseClient.js';

const router = Router();

// Rate-limit order creation per IP to stop accidental double-taps / spam.
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

// POST /api/orders — public, no auth. Body: { table_id, items: [{ menu_item_id, quantity }] }
router.post('/', orderLimiter, async (req, res) => {
  const { table_id, items } = req.body;

  if (!table_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'table_id and a non-empty items array are required' });
  }

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('id, hotel_id')
    .eq('id', table_id)
    .single();

  if (tableError || !table) {
    return res.status(404).json({ error: 'Table not found' });
  }

  const menuItemIds = items.map((i) => i.menu_item_id);
  const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('id, name, price, is_available')
    .in('id', menuItemIds);

  if (menuError) return res.status(500).json({ error: menuError.message });

  // NEVER trust client-sent prices — recompute everything from the DB.
  let total = 0;
  const orderItemRows = [];

  for (const requested of items) {
    const menuItem = menuItems.find((m) => m.id === requested.menu_item_id);
    if (!menuItem || !menuItem.is_available) {
      return res.status(400).json({ error: `Item unavailable: ${requested.menu_item_id}` });
    }
    const quantity = Math.max(1, parseInt(requested.quantity, 10) || 1);
    const subtotal = Number(menuItem.price) * quantity;
    total += subtotal;

    orderItemRows.push({
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      quantity,
      unit_price: menuItem.price,
      subtotal,
    });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ hotel_id: table.hotel_id, table_id, total_amount: total })
    .select()
    .single();

  if (orderError) return res.status(500).json({ error: orderError.message });

  const rowsWithOrderId = orderItemRows.map((row) => ({ ...row, order_id: order.id }));
  const { error: itemsError } = await supabase.from('order_items').insert(rowsWithOrderId);

  if (itemsError) {
    // Best-effort cleanup if line items fail to insert
    await supabase.from('orders').delete().eq('id', order.id);
    return res.status(500).json({ error: itemsError.message });
  }

  // TODO: emit a realtime event here (Supabase Realtime broadcast or Socket.io)
  // scoped to `hotel_id` so the staff dashboard updates live.

  res.status(201).json({ order_id: order.id, total_amount: total, status: order.status });
});

// GET /api/orders/:orderId/status — public, no auth. Customer polls this.
router.get('/:orderId/status', async (req, res) => {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, total_amount')
    .eq('id', req.params.orderId)
    .single();

  if (error || !order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

export default router;
