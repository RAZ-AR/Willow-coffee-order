import { Router } from 'express';
import supabase from '../config/supabase.js';
import { sendWelcomeMessage, sendHTMLMessage, sendStarsNotification } from '../services/telegram.js';

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
 * Обработка команды /start
 */
async function handleStartCommand(message) {
  const user = message.from;

  if (!user || !user.id) {
    console.error('❌ No user in /start command');
    return;
  }

  console.log('🎯 /start command from user:', user.id);

  // Проверяем существующего пользователя
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', user.id)
    .single();

  let cardNumber;
  let stars;

  if (existingUser) {
    cardNumber = existingUser.card_number;
    stars = await getCardStars(cardNumber);
  } else {
    // Создаем нового пользователя
    cardNumber = String(Math.floor(Math.random() * 9000) + 1000);

    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
        card_number: cardNumber,
        language_code: user.language_code || 'en'
      }]);

    if (insertError) {
      console.error('❌ Error creating user:', insertError);
      return;
    }

    stars = 0;
  }

  // Отправляем приветственное сообщение
  await sendWelcomeMessage(user, cardNumber, stars);
}

/**
 * Обработка команды управления звездами (для персонала)
 * Формат: "1234 +5" или "1234 -2"
 */
async function handleStarsAdjustment(text, chatId) {
  const match = text.match(/^\s*(\d{4})\s*([+\-])\s*(\d+)\s*$/);

  if (!match) {
    await sendHTMLMessage(chatId, '❌ Invalid format. Use: 1234 +2 or 1234 -1');
    return;
  }

  const cardNumber = match[1];
  const sign = match[2] === '-' ? -1 : 1;
  const delta = sign * parseInt(match[3]);

  // Находим пользователя по номеру карты
  const { data: userData } = await supabase
    .from('users')
    .select('telegram_id')
    .eq('card_number', cardNumber)
    .single();

  if (!userData) {
    await sendHTMLMessage(chatId, `❌ Card <b>#${cardNumber}</b> not found`);
    return;
  }

  // Получаем текущий баланс
  const currentStars = await getCardStars(cardNumber);
  const newTotal = Math.max(0, currentStars + delta);

  // Записываем изменение
  const { error: logError } = await supabase
    .from('stars_log')
    .insert([{
      card_number: cardNumber,
      delta: delta,
      reason: 'manual_adjustment'
    }]);

  if (logError) {
    console.error('❌ Error logging stars:', logError);
    await sendHTMLMessage(chatId, '❌ Error updating stars');
    return;
  }

  // Уведомляем кассира
  const signText = delta >= 0 ? `+${delta}` : String(delta);
  await sendHTMLMessage(
    chatId,
    `✅ Stars updated for card <b>#${cardNumber}</b>: ${signText} → total <b>${newTotal}</b>`
  );

  // Уведомляем клиента
  await sendStarsNotification(userData.telegram_id, cardNumber, delta, newTotal);
}

/**
 * POST /webhook
 * Обработка Telegram webhook
 */
router.post('/', async (req, res) => {
  try {
    const update = req.body;

    console.log('📥 Webhook received:', JSON.stringify(update, null, 2));

    // Обрабатываем сообщения
    if (update.message) {
      const message = update.message;
      const text = message.text || '';
      const chatId = message.chat?.id;

      // Команда /start
      if (text.startsWith('/start')) {
        await handleStartCommand(message);
        return res.json({ ok: true });
      }

      // Команды управления звездами (только из разрешенных чатов)
      const allowedChats = [
        process.env.GROUP_CHAT_ID,
        process.env.CASHIER_GROUP_ID
      ].filter(Boolean);

      if (allowedChats.some(id => String(chatId) === String(id))) {
        await handleStarsAdjustment(text, chatId);
      }

      return res.json({ ok: true });
    }

    // Пока просто отвечаем OK на все остальное
    return res.json({ ok: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.json({ ok: true }); // Всегда возвращаем 200 для Telegram
  }
});

export default router;
