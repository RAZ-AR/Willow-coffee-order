import fetch from 'node-fetch';

const TELEGRAM_API = 'https://api.telegram.org';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set');
}

/**
 * Отправка HTML сообщения в Telegram
 */
export async function sendHTMLMessage(chatId, html) {
  console.log('📨 sendHTMLMessage called:', { chatId, hasBotToken: !!BOT_TOKEN });

  if (!BOT_TOKEN || !chatId) {
    console.error('❌ Missing BOT_TOKEN or chatId:', {
      hasBotToken: !!BOT_TOKEN,
      chatId,
      botTokenLength: BOT_TOKEN?.length
    });
    return { ok: false, error: 'Missing credentials' };
  }

  const url = `${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`;

  try {
    console.log('📨 Sending to Telegram API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = await response.json();
    console.log('📨 Telegram API response:', result);

    if (result.ok) {
      console.log(`✅ Message sent to ${chatId}`);
      return { ok: true, result: result.result };
    } else {
      console.error(`❌ Telegram API error:`, result.description);
      return { ok: false, error: result.description };
    }
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error);
    console.error('❌ Error stack:', error.stack);
    return { ok: false, error: error.message };
  }
}

/**
 * Отправка приветственного сообщения
 */
export async function sendWelcomeMessage(user, cardNumber, stars) {
  const lang = (user.language_code || 'en').toLowerCase();
  const nick = user.username ? `@${user.username}` : (user.first_name || 'friend');

  const greetings = {
    en: 'Welcome to Willow! Your loyalty card:',
    ru: 'Добро пожаловать в Willow! Ваша карта лояльности:',
    sr: 'Dobrodošli u Willow! Vaša kartica lojalnosti:'
  };

  const cardLabels = {
    en: 'Card',
    ru: 'Карта',
    sr: 'Kartica'
  };

  const greeting = greetings[lang] || greetings.en;
  const cardLabel = cardLabels[lang] || cardLabels.en;

  const html = [
    `<b>Hi, ${nick}!</b>`,
    greeting,
    `<b>${cardLabel}:</b> #${cardNumber}`,
    `⭐ <b>${stars}</b>`
  ].join('\n');

  return sendHTMLMessage(user.id, html);
}

/**
 * Отправка подтверждения заказа клиенту
 */
export async function sendOrderConfirmation(user, order, starsEarned, totalStars) {
  const lang = (user.language_code || 'en').toLowerCase();

  const texts = {
    en: {
      received: 'Your order is received. We are starting to prepare!',
      order: 'Order',
      sum: 'Total',
      earned: 'You earned',
      stars: 'stars',
      card: 'Card',
      total: 'total stars',
      items: 'Items'
    },
    ru: {
      received: 'Ваш заказ получен. Начинаем готовить!',
      order: 'Заказ',
      sum: 'Сумма',
      earned: 'Вы получили',
      stars: 'звёзд',
      card: 'Карта',
      total: 'всего звёзд',
      items: 'Позиции'
    },
    sr: {
      received: 'Vaša porudžbina je primljena. Počinjemo sa pripremom!',
      order: 'Porudžbina',
      sum: 'Iznos',
      earned: 'Osvojili ste',
      stars: 'zvezda',
      card: 'Kartica',
      total: 'ukupno zvezda',
      items: 'Stavke'
    }
  };

  const t = texts[lang] || texts.en;

  const itemsHtml = order.items.map(item => {
    const lineTotal = item.unit_price * item.qty;
    return `• <b>${item.title}</b> ×${item.qty} — ${lineTotal} RSD`;
  }).join('\n');

  const starsMessage = starsEarned > 0
    ? `\n⭐ <b>${t.earned}:</b> +${starsEarned} ${t.stars}\n💳 <b>${t.card}:</b> #${order.card_number} (${t.total}: ${totalStars})`
    : `\n💳 <b>${t.card}:</b> #${order.card_number} (${t.total}: ${totalStars})`;

  const html = [
    `<b>✅ ${t.received}</b>`,
    '',
    `📋 <b>${t.order}:</b> #${order.order_number}`,
    `💰 <b>${t.sum}:</b> ${order.total} RSD${starsMessage}`,
    '',
    `<b>${t.items}:</b>`,
    itemsHtml
  ].join('\n');

  return sendHTMLMessage(user.id, html);
}

/**
 * Отправка уведомления о заказе в группу персонала
 */
export async function sendOrderToGroup(user, order, starsEarned, totalStars) {
  const groupId = process.env.GROUP_CHAT_ID;
  if (!groupId) {
    console.warn('⚠️  GROUP_CHAT_ID not set');
    return { ok: false, error: 'GROUP_CHAT_ID not configured' };
  }

  const nick = user.username ? `@${user.username}` : (user.first_name || String(user.id));

  const itemsHtml = order.items.map(item => {
    const lineTotal = item.unit_price * item.qty;
    return `• <b>${item.title}</b> ×${item.qty} — ${lineTotal} RSD`;
  }).join('\n');

  const whenHtml = order.when_time === 'now'
    ? (order.table_number ? `Now — <b>table ${order.table_number}</b>` : 'Now')
    : `+${order.when_time} min`;

  const telegramInfo = `📱 <b>Telegram ID:</b> ${user.id}` +
    (user.username ? ` | <b>@${user.username}</b>` : '');

  const starsInfo = starsEarned > 0
    ? `\n⭐ <b>Начислено звезд:</b> +${starsEarned} (всего у клиента: ${totalStars})`
    : `\n⭐ <b>Звезды:</b> не начислены (всего у клиента: ${totalStars})`;

  const html = [
    '<b>🧾 New order</b>',
    `👤 ${nick}`,
    telegramInfo,
    `💳 <b>Card:</b> #${order.card_number}`,
    `⏱️ <b>When:</b> ${whenHtml}`,
    `💰 <b>Payment:</b> ${order.payment_method}`,
    `📦 <b>Items:</b>`,
    itemsHtml,
    '— — —',
    `💵 <b>Total:</b> ${order.total} RSD${starsInfo}`
  ].join('\n');

  return sendHTMLMessage(groupId, html);
}

/**
 * Отправка уведомления об изменении звезд
 */
export async function sendStarsNotification(userId, cardNumber, delta, newTotal) {
  let message = '';

  if (delta > 0) {
    const starsWord = delta === 1 ? 'звезду' : (delta > 1 && delta < 5 ? 'звезды' : 'звезд');
    const totalWord = newTotal === 1 ? 'звезда' : (newTotal > 1 && newTotal < 5 ? 'звезды' : 'звезд');
    message = `🎉 Вы получили <b>${delta}</b> ${starsWord}!\n⭐ У вас теперь <b>${newTotal}</b> ${totalWord}`;
  } else if (delta < 0) {
    const absD = Math.abs(delta);
    const starsWord = absD === 1 ? 'звезда' : (absD > 1 && absD < 5 ? 'звезды' : 'звезд');
    const totalWord = newTotal === 1 ? 'звезда' : (newTotal > 1 && newTotal < 5 ? 'звезды' : 'звезд');
    message = `⭐ У вас списано <b>${absD}</b> ${starsWord}.\n💫 У вас осталось <b>${newTotal}</b> ${totalWord}`;
  }

  if (message) {
    return sendHTMLMessage(userId, message);
  }

  return { ok: false, error: 'No message to send' };
}

export default {
  sendHTMLMessage,
  sendWelcomeMessage,
  sendOrderConfirmation,
  sendOrderToGroup,
  sendStarsNotification
};
