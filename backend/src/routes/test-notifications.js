import { Router } from 'express';
import { sendHTMLMessage, sendOrderToGroup } from '../services/telegram.js';

const router = Router();

/**
 * GET /api/test-notifications/direct/:chatId
 * Тестовая отправка сообщения напрямую
 */
router.get('/direct/:chatId', async (req, res) => {
  const { chatId } = req.params;

  console.log('🧪 Testing direct message to:', chatId);

  const result = await sendHTMLMessage(
    chatId,
    '<b>🧪 Test Message</b>\n\nЭто тестовое сообщение от Willow Bot.\nЕсли вы видите это - бот работает!'
  );

  return res.json({
    ok: true,
    test: 'direct_message',
    chatId,
    result
  });
});

/**
 * GET /api/test-notifications/group
 * Тестовая отправка сообщения в группу
 */
router.get('/group', async (req, res) => {
  const groupId = process.env.GROUP_CHAT_ID;

  if (!groupId) {
    return res.status(500).json({
      ok: false,
      error: 'GROUP_CHAT_ID not configured'
    });
  }

  console.log('🧪 Testing group message to:', groupId);

  const result = await sendHTMLMessage(
    groupId,
    '<b>🧪 Test Group Message</b>\n\nТестовое сообщение в группу персонала.\nБот настроен правильно!'
  );

  return res.json({
    ok: true,
    test: 'group_message',
    groupId,
    result
  });
});

/**
 * POST /api/test-notifications/order
 * Тестовая отправка уведомления о заказе
 */
router.post('/order', async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({
      ok: false,
      error: 'chatId required in body'
    });
  }

  const testUser = {
    id: chatId,
    username: 'test_user',
    first_name: 'Test',
    language_code: 'ru'
  };

  const testOrder = {
    order_number: 'TEST_001',
    card_number: '1234',
    total: 500,
    when_time: 'now',
    table_number: 5,
    payment_method: 'cash',
    items: [
      { title: 'Espresso', qty: 2, unit_price: 150 },
      { title: 'Croissant', qty: 1, unit_price: 200 }
    ]
  };

  console.log('🧪 Testing order notifications to:', chatId);

  try {
    const result = await sendOrderToGroup(testUser, testOrder, 1, 5);

    return res.json({
      ok: true,
      test: 'order_notification',
      chatId,
      result
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * GET /api/test-notifications/env
 * Проверка переменных окружения (без показа секретов)
 */
router.get('/env', async (req, res) => {
  const env = {
    hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
    telegramTokenLength: process.env.TELEGRAM_BOT_TOKEN?.length,
    hasGroupChatId: !!process.env.GROUP_CHAT_ID,
    groupChatId: process.env.GROUP_CHAT_ID,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    nodeEnv: process.env.NODE_ENV
  };

  return res.json({
    ok: true,
    environment: env
  });
});

export default router;
