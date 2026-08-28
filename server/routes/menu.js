import { Router } from 'express';
import { supabase } from '../db/supabaseClient.js';

const router = Router();

// GET /api/menu/:hotelSlug — public, no auth. Returns menu grouped by category.
router.get('/:hotelSlug', async (req, res) => {
  const { hotelSlug } = req.params;

  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .select('id, name, slug')
    .eq('slug', hotelSlug)
    .single();
  
  // console.log('DEBUG:', { hotelSlug, hotelError, hotel });  
  if (hotelError || !hotel) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, sort_order')
    .eq('hotel_id', hotel.id)
    .order('sort_order', { ascending: true });

  if (catError) return res.status(500).json({ error: catError.message });

  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, category_id, name, description, price, image_url, is_veg, is_available')
    .eq('hotel_id', hotel.id)
    .eq('is_available', true);

  if (itemsError) return res.status(500).json({ error: itemsError.message });

  const menu = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));

  res.json({ hotel: { id: hotel.id, name: hotel.name, slug: hotel.slug }, menu });
});

export default router;
