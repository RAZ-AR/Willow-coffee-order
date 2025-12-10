import { Router } from 'express';
import supabase from '../config/supabase.js';
import { sendOrderConfirmation, sendOrderToGroup } from '../services/telegram.js';

const router = Router();

/**
 * Подсчет звезд за сумму заказа
 * 1 звезда за каждые 350 RSD (округление вверх)
 */
function calculateStars(amount) {
  if (amount <= 0) return 0;
  return Math.max(1, Math.ceil(amount / 350));
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
 * POST /api/order
 * Создание нового заказа
 */
router.post('/', async (req, res) => {
  try {
    const { user, items, total, when, table, payment } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({
        ok: false,
        error: 'Missing user data'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Cart is empty'
      });
    }

    console.log('🛒 Order request from user:', user.id);
    console.log('🛒 User data:', JSON.stringify(user, null, 2));

    // Получаем данные пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('card_number')
      .eq('telegram_id', user.id)
      .single();

    console.log('👤 User lookup result:', { userData, userError });

    let cardNumber;

    if (!userData) {
      // Пользователь не найден - создаем нового с уникальной картой
      console.log('📝 User not found - creating new user');

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

      cardNumber = newCardNumber;
      console.log('✅ Created new user with card:', cardNumber);
    } else {
      cardNumber = userData.card_number;
      console.log('✅ Found existing user with card:', cardNumber);
    }
    const orderNumber = `o_${Date.now()}`;

    // Создаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        telegram_id: user.id,
        card_number: cardNumber,
        total: parseFloat(total),
        when_time: when || 'now',
        table_number: when === 'now' ? table : null,
        payment_method: payment || 'cash',
        items: items,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return res.status(500).json({
        ok: false,
        error: 'Failed to create order'
      });
    }

    console.log('✅ Order created:', orderNumber);

    // Начисляем звезды
    const starsEarned = calculateStars(total);

    if (starsEarned > 0) {
      const { error: starsError } = await supabase
        .from('stars_log')
        .insert([{
          card_number: cardNumber,
          delta: starsEarned,
          reason: `order_${orderNumber}`,
          order_id: order.id
        }]);

      if (starsError) {
        console.error('❌ Error adding stars:', starsError);
      } else {
        console.log(`⭐ Added ${starsEarned} stars to card ${cardNumber}`);
      }
    }

    // Получаем новый баланс звезд
    const totalStars = await getCardStars(cardNumber);

    // Отправляем уведомления (с детальным логированием)
    console.log('📤 Sending notifications...');
    console.log('📤 Order user ID (from request):', user.id);
    console.log('📤 Card number:', cardNumber);
    console.log('📤 Order:', { orderNumber, cardNumber, total, starsEarned, totalStars });

    try {
      // ВСЕГДА отправляем в группу персонала
      const groupResult = await sendOrderToGroup(user, order, starsEarned, totalStars).catch(err => {
        console.error('❌ Failed to send group notification:', err.message);
        return { ok: false, error: err.message };
      });

      console.log('📤 Group notification result:', groupResult);

      if (!groupResult.ok) {
        console.warn('⚠️  Group notification failed');
      }

      // Отправляем личное уведомление ТОЛЬКО если ID выглядит как реальный Telegram ID
      // Реальные Telegram ID обычно > 1000000
      const isRealTelegramId = user.id > 1000000;
      console.log('📤 Is real Telegram ID?', isRealTelegramId, '(ID:', user.id, ')');

      if (isRealTelegramId) {
        console.log('📤 Attempting to send personal notification to real user');
        const confirmResult = await sendOrderConfirmation(user, order, starsEarned, totalStars).catch(err => {
          console.error('❌ Failed to send user confirmation:', err.message);
          return { ok: false, error: err.message };
        });

        console.log('📤 Confirmation result:', confirmResult);

        if (!confirmResult.ok) {
          console.warn('⚠️  User notification failed (user may not have started the bot yet)');
        }
      } else {
        console.log('⚠️  Skipping personal notification (temporary ID detected)');
        console.log('💡 User should run /start in @Willow_coffee_bot to link account and receive notifications');
      }
    } catch (err) {
      console.error('❌ Unexpected error sending notifications:', err);
      console.error('❌ Full error:', JSON.stringify(err, null, 2));
    }

    return res.json({
      ok: true,
      order_id: orderNumber,
      card: cardNumber,
      stars: totalStars,
      stars_earned: starsEarned
    });

  } catch (error) {
    console.error('❌ Order error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
