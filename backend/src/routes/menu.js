import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * GET /api/menu
 * Получение меню
 */
router.get('/', async (req, res) => {
  try {
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category')
      .order('sort_order');

    if (error) {
      console.error('❌ Error fetching menu:', error);
      return res.status(500).json({
        ok: false,
        error: 'Failed to fetch menu'
      });
    }

    console.log(`✅ Menu fetched: ${menuItems.length} items`);

    return res.json({
      ok: true,
      items: menuItems
    });

  } catch (error) {
    console.error('❌ Menu error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
