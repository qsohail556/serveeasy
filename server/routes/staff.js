import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/staff/orders?status=pending — hotel_id comes from the JWT, never the request.
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  let query = supabase
    .from('orders')
    .select('id, table_id, status, total_amount, payment_method, payment_status, created_at, order_items(*), tables(table_number)')
    .eq('hotel_id', req.user.hotel_id)
    .order('created_at', { ascending: true });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/staff/orders/:id/status — Body: { status: 'preparing' | 'served' | 'paid' | 'cancelled' }
router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'preparing', 'served', 'paid', 'cancelled'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .eq('hotel_id', req.user.hotel_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Order not found' });
  res.json(data);
});

export default router;