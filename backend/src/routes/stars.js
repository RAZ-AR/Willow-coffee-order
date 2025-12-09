import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * Получить баланс звезд по номеру карты
 */
async function getCardStars(cardNumber) {
  const { data, error } = await supabase
    .rpc('get_card_stars', { card: cardNumber });

  if (error) {
    console.error('Error getting stars:', error);
    return 0;
  }

  return data || 0;
}

/**
 * POST /api/stars
 * Получение баланса звезд пользователя
 */
router.post('/', async (req, res) => {
  try {
    const { user } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({
        ok: false,
        error: 'Missing user data'
      });
    }

    // Получаем данные пользователя
    const { data: userData } = await supabase
      .from('users')
      .select('card_number')
      .eq('telegram_id', user.id)
      .single();

    if (!userData) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }

    const stars = await getCardStars(userData.card_number);

    return res.json({
      ok: true,
      card: userData.card_number,
      stars
    });

  } catch (error) {
    console.error('❌ Stars error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
