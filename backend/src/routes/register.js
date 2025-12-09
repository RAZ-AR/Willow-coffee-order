import { Router } from 'express';
import supabase from '../config/supabase.js';
import { sendWelcomeMessage } from '../services/telegram.js';

const router = Router();

/**
 * Генерация уникального 4-значного номера карты
 */
async function generateCardNumber() {
  const { data: existingCards } = await supabase
    .from('users')
    .select('card_number');

  const usedCards = new Set(existingCards?.map(c => c.card_number) || []);

  // Пытаемся 100 раз сгенерировать случайный номер
  for (let i = 0; i < 100; i++) {
    const cardNumber = String(Math.floor(Math.random() * 9000) + 1000);
    if (!usedCards.has(cardNumber)) {
      return cardNumber;
    }
  }

  // Если не получилось, ищем первый свободный
  for (let num = 1000; num <= 9999; num++) {
    const cardNumber = String(num);
    if (!usedCards.has(cardNumber)) {
      return cardNumber;
    }
  }

  throw new Error('All card numbers are taken');
}

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
 * POST /api/register
 * Регистрация или получение данных пользователя
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

    console.log('📝 Register request for user:', user.id);

    // Проверяем существующего пользователя
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single();

    if (existingUser) {
      // Пользователь уже существует
      const stars = await getCardStars(existingUser.card_number);

      console.log('✅ Existing user:', existingUser.card_number);

      return res.json({
        ok: true,
        card: existingUser.card_number,
        stars,
        user_id: user.id,
        is_new: false
      });
    }

    // Создаем нового пользователя
    const cardNumber = await generateCardNumber();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
        card_number: cardNumber,
        language_code: user.language_code || 'en'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating user:', insertError);
      return res.status(500).json({
        ok: false,
        error: 'Failed to create user'
      });
    }

    console.log('✅ New user created:', cardNumber);

    // Отправляем приветственное сообщение
    await sendWelcomeMessage(user, cardNumber, 0);

    return res.json({
      ok: true,
      card: cardNumber,
      stars: 0,
      user_id: user.id,
      is_new: true
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
