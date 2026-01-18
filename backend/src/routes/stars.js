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
    let { data: userData } = await supabase
      .from('users')
      .select('card_number')
      .eq('telegram_id', user.id)
      .single();

    // Если пользователя нет - создаём его с новой картой
    if (!userData) {
      console.log('📝 User not found - creating new user for:', user.id);

      // Генерируем уникальный номер карты (4 цифры)
      const newCardNumber = String(Math.floor(1000 + Math.random() * 9000));

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          telegram_id: user.id,
          card_number: newCardNumber,
          first_name: user.first_name || 'User',
          username: user.username || null,
          language_code: user.language_code || 'en'
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return res.status(500).json({
          ok: false,
          error: 'Failed to create user'
        });
      }

      console.log('✅ Created new user with card:', newCardNumber);
      userData = { card_number: newCardNumber };
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
