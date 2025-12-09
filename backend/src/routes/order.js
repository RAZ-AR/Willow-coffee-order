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

    // Получаем данные пользователя
    const { data: userData } = await supabase
      .from('users')
      .select('card_number')
      .eq('telegram_id', user.id)
      .single();

    if (!userData) {
      return res.status(404).json({
        ok: false,
        error: 'User not found. Please register first.'
      });
    }

    const cardNumber = userData.card_number;
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

    // Отправляем уведомления (асинхронно, не блокируем ответ)
    Promise.all([
      sendOrderConfirmation(user, order, starsEarned, totalStars),
      sendOrderToGroup(user, order, starsEarned, totalStars)
    ]).catch(err => {
      console.error('❌ Error sending notifications:', err);
    });

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
