import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ---- Categories ----

router.get('/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, sort_order')
    .eq('hotel_id', req.user.hotel_id)
    .order('sort_order', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/categories', async (req, res) => {
  const { name, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('categories')
    .insert({ hotel_id: req.user.hotel_id, name, sort_order: sort_order ?? 0 })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/categories/:id', async (req, res) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id)
    .eq('hotel_id', req.user.hotel_id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ---- Menu items CRUD ----

router.get('/menu-items', async (req, res) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, category_id, name, description, price, image_url, is_veg, is_available')
    .eq('hotel_id', req.user.hotel_id)
    .order('name', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/menu-items', async (req, res) => {
  const { name, description, price, category_id, image_url, is_veg } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });

  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      hotel_id: req.user.hotel_id,
      name,
      description,
      price,
      category_id,
      image_url,
      is_veg: is_veg ?? true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/menu-items/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('hotel_id', req.user.hotel_id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ error: 'Menu item not found' });
  res.json(data);
});

router.delete('/menu-items/:id', async (req, res) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', req.params.id)
    .eq('hotel_id', req.user.hotel_id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ---- Tables ----

router.get('/tables', async (req, res) => {
  const { data, error } = await supabase
    .from('tables')
    .select('id, table_number, qr_code_url')
    .eq('hotel_id', req.user.hotel_id)
    .order('table_number', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/tables', async (req, res) => {
  const { table_number } = req.body;
  if (!table_number) return res.status(400).json({ error: 'table_number is required' });

  // Need the hotel's slug (not id) — the public customer URL is /m/:hotelSlug/:tableId
  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .select('slug')
    .eq('id', req.user.hotel_id)
    .single();

  if (hotelError || !hotel) return res.status(500).json({ error: 'Could not resolve hotel for QR URL' });

  const { data, error } = await supabase
    .from('tables')
    .insert({ hotel_id: req.user.hotel_id, table_number })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const qrUrl = `${process.env.CLIENT_ORIGIN}/m/${hotel.slug}/${data.id}`;
  const { data: updated, error: updateError } = await supabase
    .from('tables')
    .update({ qr_code_url: qrUrl })
    .eq('id', data.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });
  res.status(201).json(updated);
});

router.delete('/tables/:id', async (req, res) => {
  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', req.params.id)
    .eq('hotel_id', req.user.hotel_id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;