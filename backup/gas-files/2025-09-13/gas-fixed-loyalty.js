/***************
 * Willow Mini-app — Google Apps Script backend (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * - ГАРАНТИРОВАННЫЕ 4-значные карты лояльности (1000-9999)
 * - Исправлена проблема с записью номеров в таблицу
 * - Улучшена обработка Telegram WebApp initData
 * - Исправлена отправка сообщений пользователям
 ***************/

var __SS = null; // cache Spreadsheet handle

function _prop(key, def) {
  try { return PropertiesService.getScriptProperties().getProperty(key) || def; }
  catch (e) { return def; }
}

function _ss() {
  if (__SS) return __SS;
  var id = _prop('SPREADSHEET_ID', null);
  if (!id) throw new Error('SPREADSHEET_ID is not set in Script Properties');
  __SS = SpreadsheetApp.openById(id);
  return __SS;
}

function getSheet_(name) {
  var ss = _ss();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders_() {
  var shCards = getSheet_('Cards');   
  if (shCards.getLastRow() === 0) {
    shCards.appendRow(['telegram_id', 'card_number', 'username', 'first_name', 'created_at']);
  }
  
  var shUsers = getSheet_('Users');   
  if (shUsers.getLastRow() === 0) {
    shUsers.appendRow(['telegram_id', 'username', 'card_number', 'stars', 'created_at']);
  }
  
  var shOrders= getSheet_('Orders');  
  if (shOrders.getLastRow() === 0) {
    shOrders.appendRow(['order_id', 'telegram_id', 'card_number', 'total', 'when', 'table', 'payment', 'items_json', 'created_at']);
  }
  
  var shLog   = getSheet_('StarsLog');
  if (shLog.getLastRow() === 0) {
    shLog.appendRow(['card_number', 'delta', 'reason', 'created_at']);
  }
}

function json(o) { 
  // Возвращаем JSON как plain text (CORS автоматически поддерживается GAS)
  const jsonStr = JSON.stringify(o);
  return ContentService
    .createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

function simpleOk() {
  // Простой HTML ответ для Telegram webhook (без лишнего контента)
  return HtmlService.createHtmlOutput("OK");
}

/** ===== i18n ===== */
function langFromUser_(tgUser) {
  var code = (tgUser && tgUser.language_code) || '';
  if (/^ru/i.test(code)) return 'ru';
  if (/^sr/i.test(code)) return 'sr';
  return 'en';
}

function t_(k, lang) {
  var d = {
    greet: {
      en: 'Welcome to Willow! Your loyalty card:',
      ru: 'Добро пожаловать в Willow! Ваша карта лояльности:',
      sr: 'Dobrodošli u Willow! Vaša kartica lojalnosti:'
    },
    youCard: { en: 'Card', ru: 'Карта', sr: 'Kartica' },
    orderReceived: {
      en: 'Your order is received. We are starting to prepare!',
      ru: 'Ваш заказ получен. Начинаем готовить!',
      sr: 'Vaša porudžbina je primljena. Počinjemo sa pripremom!'
    },
    newOrder: { en: 'New order', ru: 'Новый заказ', sr: 'Nova porudžbina' },
    sum: { en: 'Sum', ru: 'Сумма', sr: 'Iznos' },
    when: { en: 'When', ru: 'Когда', sr: 'Kada' },
    table: { en: 'table', ru: 'стол', sr: 'sto' },
    payment: { en: 'Payment', ru: 'Оплата', sr: 'Plaćanje' },
    items: { en: 'Items', ru: 'Позиции', sr: 'Stavke' }
  };
  return (d[k] && d[k][lang]) || (d[k] && d[k].en) || k;
}

/** ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ ПАРСИНГА initData ===== */
function parseInitUser_(initData) {
  console.log("🔍 parseInitUser_ called with:", initData);
  try {
    if (!initData || typeof initData !== 'string') return null;
    
    // Убираем возможные префиксы и пробелы
    var raw = String(initData).trim();
    
    // Проверяем разные форматы initData
    var parts = raw.split('&');
    var params = {};
    
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      if (kv.length >= 2) {
        var key = decodeURIComponent(kv[0]);
        var value = decodeURIComponent(kv.slice(1).join('='));
        params[key] = value;
      }
    }
    
    // Ищем параметр user
    if (params.user) {
      try {
        var user = JSON.parse(params.user);
        console.log("✅ Parsed user from initData:", user);
        if (user && user.id) {
          return {
            id: Number(user.id),
            username: user.username || '',
            first_name: user.first_name || '',
            language_code: user.language_code || 'en'
          };
        }
      } catch (parseError) {
        console.log("❌ Error parsing user JSON:", parseError);
      }
    }
    
    console.log("❌ No valid user found in initData");
    return null;
  } catch (e) {
    console.log("❌ Error in parseInitUser_:", e);
    return null;
  }
}

/** ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ ГЕНЕРАЦИИ НОМЕРОВ КАРТ ===== */
function nextCardNumber_() {
  console.log("🎯 Generating 4-digit card number...");
  
  var sh = getSheet_('Cards');
  var existingCards = new Set();
  
  // Получаем все существующие номера карт
  try {
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      var cardRange = sh.getRange(2, 2, lastRow - 1, 1);
      var cardValues = cardRange.getValues();
      
      for (var i = 0; i < cardValues.length; i++) {
        var cardNum = String(cardValues[i][0]).trim();
        if (cardNum && cardNum !== '' && cardNum !== 'undefined' && cardNum.length === 4) {
          existingCards.add(cardNum);
        }
      }
    }
  } catch (e) {
    console.log("Error reading existing cards:", e);
  }
  
  console.log("📊 Found", existingCards.size, "existing cards");
  
  // Генерируем уникальный 4-значный номер (1000-9999)
  var attempts = 0;
  var maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    var randomNum = Math.floor(Math.random() * 9000) + 1000;
    var newCard = String(randomNum);
    
    if (!existingCards.has(newCard)) {
      console.log("✅ Generated unique card:", newCard);
      return newCard;
    }
    attempts++;
  }
  
  // Если случайная генерация не удалась, ищем первый свободный номер
  console.log("⚠️ Random generation failed, searching systematically...");
  for (var num = 1000; num <= 9999; num++) {
    var testCard = String(num);
    if (!existingCards.has(testCard)) {
      console.log("✅ Found free card:", testCard);
      return testCard;
    }
  }
  
  throw new Error("All 4-digit card numbers are taken!");
}

/** ===== ИСПРАВЛЕННЫЕ ФУНКЦИИ РАБОТЫ С БАЗОЙ ДАННЫХ ===== */
function findCardByTelegramId_(telegramId) {
  var sh = getSheet_('Cards');
  var lastRow = sh.getLastRow();
  
  if (lastRow <= 1) return null;
  
  var data = sh.getRange(2, 1, lastRow - 1, 5).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(telegramId)) {
      return {
        row: i + 2,
        telegramId: data[i][0],
        cardNumber: String(data[i][1]),
        username: data[i][2],
        firstName: data[i][3],
        createdAt: data[i][4]
      };
    }
  }
  
  return null;
}

function getOrCreateCardForUser_(tgUser, sendNotification) {
  console.log("🔄 getOrCreateCardForUser_ for:", tgUser);
  ensureHeaders_();
  
  if (!tgUser || !tgUser.id) {
    throw new Error('No telegram user ID provided');
  }
  
  // Ищем существующую карту
  var existingCard = findCardByTelegramId_(tgUser.id);
  
  if (existingCard && existingCard.cardNumber && existingCard.cardNumber.length === 4) {
    console.log("✅ Found existing card:", existingCard.cardNumber, "for user", tgUser.id);
    
    // Отправляем приветствие даже для существующих карт при /start
    if (sendNotification !== false) {
      sendWelcomeMessage_(tgUser, existingCard.cardNumber);
    }
    
    return existingCard.cardNumber;
  }
  
  // Создаем новую карту
  var newCardNumber = nextCardNumber_();
  
  var cardsSheet = getSheet_('Cards');
  var newRowData = [
    tgUser.id,
    newCardNumber,
    tgUser.username || '',
    tgUser.first_name || '',
    new Date()
  ];
  
  if (existingCard) {
    // Обновляем существующую запись
    cardsSheet.getRange(existingCard.row, 1, 1, 5).setValues([newRowData]);
    console.log("🔄 Updated existing card row with new card:", newCardNumber);
  } else {
    // Создаем новую запись
    cardsSheet.appendRow(newRowData);
    console.log("➕ Created new card record:", newCardNumber);
  }
  
  // Обновляем или создаем запись в Users
  updateUserRecord_(tgUser, newCardNumber);
  
  // Отправляем уведомление только если это запрошено (например, при /start)
  if (sendNotification !== false) {
    sendWelcomeMessage_(tgUser, newCardNumber);
  }
  
  return newCardNumber;
}

function sendWelcomeMessage_(user, cardNumber) {
  var stars = getCardStars_(cardNumber); // Используем новую систему StarsLog
  var lang = langFromUser_(user);
  var nick = user.username ? '@' + user.username : (user.first_name || 'friend');
  
  var html = [
    '<b>Hi, ' + nick + '!</b>',
    t_('greet', lang),
    '<b>' + t_('youCard', lang) + ':</b> #' + cardNumber,
    '⭐ <b>' + stars + '</b>'
  ].join('\n');
  
  tgSendHTML_(user.id, html);
}

function updateUserRecord_(tgUser, cardNumber) {
  var usersSheet = getSheet_('Users');
  var lastRow = usersSheet.getLastRow();
  
  // Ищем существующего пользователя
  if (lastRow > 1) {
    var userData = usersSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    for (var i = 0; i < userData.length; i++) {
      if (String(userData[i][0]) === String(tgUser.id)) {
        // Обновляем существующую запись (без звезд - они теперь в StarsLog)
        var updateRow = i + 2;
        usersSheet.getRange(updateRow, 1, 1, 5).setValues([[
          tgUser.id,
          tgUser.username || '',
          cardNumber,
          0, // Звезды больше не хранятся в Users (только в StarsLog)
          userData[i][4] || new Date() // Сохраняем дату создания
        ]]);
        console.log("🔄 Updated user record for:", tgUser.id);
        return updateRow;
      }
    }
  }
  
  // Создаем новую запись
  usersSheet.appendRow([
    tgUser.id,
    tgUser.username || '',
    cardNumber,
    0,
    new Date()
  ]);
  
  console.log("➕ Created new user record for:", tgUser.id);
  return usersSheet.getLastRow();
}

function getUserStars_(telegramId) {
  // Находим карту пользователя по telegram ID
  const card = findCardByTelegramId_(telegramId);
  if (!card || !card.cardNumber) {
    console.log(`❌ No card found for telegram ID: ${telegramId}`);
    return 0;
  }
  
  // Получаем количество звезд по номеру карты из StarsLog
  return getCardStars_(card.cardNumber);
}

/** ===== ИСПРАВЛЕННЫЕ TELEGRAM ФУНКЦИИ ===== */
function tgSendHTML_(chatId, html) {
  var token = _prop('TELEGRAM_TOKEN', '');
  if (!token || !chatId) {
    console.log("❌ No token or chatId for sending message");
    return { ok: false, reason: 'no token/chatId' };
  }
  
  try {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      payload: {
        chat_id: String(chatId),
        text: String(html),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      },
      muteHttpExceptions: true
    });
    
    var responseText = res.getContentText();
    
    var js = {};
    try { 
      js = JSON.parse(responseText); 
    } catch(e) {
      console.log("❌ Failed to parse Telegram response:", e);
    }
    
    if (js.ok) {
      console.log("✅ Message sent successfully");
      return { ok: true };
    } else {
      console.log("❌ Telegram API error:", js.description || responseText);
      return { ok: false, reason: js.description || responseText };
    }
  } catch (e) {
    console.log("❌ Error sending Telegram message:", e);
    return { ok: false, reason: String(e) };
  }
}

/** ===== СИСТЕМА НАЧИСЛЕНИЯ ЗВЕЗД ===== */

function calculateStarsForAmount_(totalAmount) {
  // Конвертируем в число, если это строка
  const amount = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
  
  if (amount <= 0) return 0;
  
  // Система начисления звезд:
  // 1-350 динар = 1 звезда
  // 351-700 динар = 2 звезды  
  // 701-1050 динар = 3 звезды
  // И так далее...
  
  // Правильная формула: округляем вверх результат деления на 350
  const starsEarned = Math.ceil(amount / 350);
  return Math.max(1, starsEarned); // Минимум 1 звезда за любой заказ
}

function addStarsToCard_(cardNumber, starsToAdd, reason) {
  console.log(`⭐ Adding ${starsToAdd} stars to card ${cardNumber}, reason: ${reason}`);
  
  if (!cardNumber || starsToAdd <= 0) {
    console.log("❌ Invalid card number or stars amount");
    return false;
  }
  
  try {
    ensureHeaders_();
    
    // Записываем в StarsLog
    const starsLogSheet = getSheet_('StarsLog');
    starsLogSheet.appendRow([
      cardNumber,
      starsToAdd,
      reason,
      new Date()
    ]);
    
    console.log("✅ Stars logged successfully");
    return true;
  } catch (error) {
    console.log("❌ Error adding stars:", error);
    return false;
  }
}

function getCardStars_(cardNumber) {
  if (!cardNumber) return 0;
  
  try {
    ensureHeaders_();
    const starsLogSheet = getSheet_('StarsLog');
    const lastRow = starsLogSheet.getLastRow();
    
    if (lastRow <= 1) return 0; // Только заголовки
    
    // ОПТИМИЗАЦИЯ: читаем только нужные колонки вместо всего листа
    const data = starsLogSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    
    let totalStars = 0;
    
    // Быстрый поиск по карте
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(cardNumber)) {
        totalStars += parseFloat(data[i][1]) || 0;
      }
    }
    
    return Math.max(0, totalStars);
  } catch (error) {
    console.log("❌ Error getting stars:", error);
    return 0;
  }
}

/** ===== ИСПРАВЛЕННЫЕ API ФУНКЦИИ ===== */
function _resolveUserFromPayload_(payload) {
  console.log("🔍 _resolveUserFromPayload_ called with:", JSON.stringify(payload));
  
  // Сначала проверяем прямой объект user
  var user = (payload && payload.user) || null;
  if (user && user.id) {
    console.log("✅ Found user in payload.user:", user);
    return user;
  }
  
  // Если нет прямого user, пытаемся распарсить initData
  if (payload && payload.initData) {
    console.log("🔍 Trying to parse initData:", payload.initData);
    user = parseInitUser_(payload.initData);
    if (user && user.id) {
      console.log("✅ Parsed user from initData:", user);
      return user;
    }
  }
  
  // Fallback для разработки - если есть user в корне payload
  if (payload && payload.tg_id) {
    console.log("🔍 Using fallback tg_id:", payload.tg_id);
    return {
      id: payload.tg_id,
      first_name: payload.first_name || 'TestUser',
      username: payload.username || 'testuser'
    };
  }
  
  console.log("❌ No valid user found in payload");
  return null;
}

function apiRegister_(payload) {
  console.log("🚀 apiRegister_ called");
  ensureHeaders_();
  
  var user = _resolveUserFromPayload_(payload);
  if (!user || !user.id) {
    console.log("❌ No valid user for registration");
    return { ok: false, error: 'no telegram user id' };
  }
  
  try {
    // API register НЕ должен отправлять уведомления (false)
    var cardNumber = getOrCreateCardForUser_(user, false);
    var stars = getUserStars_(user.id);
    
    console.log("✅ Registration successful - card:", cardNumber, "stars:", stars);
    return { 
      ok: true, 
      card: cardNumber, 
      stars: stars,
      user_id: user.id 
    };
  } catch (error) {
    console.log("❌ Registration error:", error);
    return { ok: false, error: String(error) };
  }
}

function apiStars_(payload) {
  console.log("⭐ apiStars_ called");
  ensureHeaders_();
  
  var user = _resolveUserFromPayload_(payload);
  if (!user || !user.id) {
    return { ok: false, error: 'no telegram user id' };
  }
  
  try {
    // API stars также НЕ должен отправлять уведомления (false)
    var cardNumber = getOrCreateCardForUser_(user, false);
    var stars = getUserStars_(user.id);
    
    return { 
      ok: true, 
      card: cardNumber, 
      stars: stars 
    };
  } catch (error) {
    console.log("❌ Stars API error:", error);
    return { ok: false, error: String(error) };
  }
}

function apiOrder_(payload) {
  console.log("🛒 apiOrder_ called");
  ensureHeaders_();
  
  var user = _resolveUserFromPayload_(payload);
  if (!user || !user.id) {
    return { ok: false, error: 'no telegram user id' };
  }
  
  try {
    var cardNumber = getOrCreateCardForUser_(user, false);
    var total = Number(payload.total) || 0;
    var when = payload.when || 'now';
    var table = payload.table;
    var payment = payload.payment || '';
    var items = payload.items || [];
    
    // Создаем заказ
    var ordersSheet = getSheet_('Orders');
    var orderId = 'o_' + Date.now();
    
    ordersSheet.appendRow([
      orderId,
      user.id,
      cardNumber,
      total,
      when,
      when === 'now' ? (table || '') : '',
      payment,
      JSON.stringify(items),
      new Date()
    ]);
    
    // Рассчитываем и начисляем звезды за заказ
    var starsEarned = calculateStarsForAmount_(total);
    if (starsEarned > 0) {
      addStarsToCard_(cardNumber, starsEarned, `Заказ #${orderId} на сумму ${total} RSD`);
      console.log(`⭐ Added ${starsEarned} stars for order ${orderId}`);
    }
    
    var totalStars = getUserStars_(user.id);
    
    // Отправляем только критически важные уведомления быстро
    sendOrderNotifications_(user, cardNumber, total, when, table, payment, items, starsEarned);
    
    return { 
      ok: true, 
      order_id: orderId, 
      card: cardNumber, 
      stars: totalStars,
      stars_earned: starsEarned
    };
  } catch (error) {
    console.log("❌ Order error:", error);
    return { ok: false, error: String(error) };
  }
}

function sendOrderNotifications_(user, cardNumber, total, when, table, payment, items, starsEarned) {
  var nick = user.username ? '@' + user.username : (user.first_name || String(user.id));
  
  var itemsHtml = (items || []).map(function(item) {
    var qty = Number(item.qty) || 0;
    var unitPrice = Number(item.unit_price) || 0;
    var lineTotal = unitPrice * qty;
    return '• <b>' + (item.title || '') + '</b> ×' + qty + ' — ' + lineTotal + ' RSD';
  }).join('\n');
  
  var whenHtml = (when === 'now') ? 
    ('Now' + (table ? (' — <b>table ' + table + '</b>') : '')) : 
    ('+' + when + ' min');
  
  // Сообщение для группы (кухня/бариста) с информацией о звездах
  var starsInfo = starsEarned > 0 ? '\n⭐ <b>Звезд получено:</b> ' + starsEarned : '';
  
  var groupHtml = [
    '<b>🧾 ' + t_('newOrder', 'en') + '</b>',
    '👤 ' + nick,
    '💳 <b>' + t_('youCard', 'en') + ':</b> #' + cardNumber,
    '⏱️ <b>' + t_('when', 'en') + ':</b> ' + whenHtml,
    '💰 <b>' + t_('payment', 'en') + ':</b> ' + payment,
    '📦 <b>' + t_('items', 'en') + ':</b>',
    itemsHtml,
    '— — —',
    '💵 <b>' + t_('sum', 'en') + ':</b> ' + total + ' RSD' + starsInfo
  ].join('\n');
  
  // Сообщение для клиента с благодарностью и информацией о звездах
  var lang = langFromUser_(user);
  var totalStars = getUserStars_(user.id);
  var thanksMessage = starsEarned > 0 ? 
    `\n\n🎉 <b>Спасибо за заказ!</b>\n⭐ Вы получили ${starsEarned} звезд${starsEarned > 1 ? 'ы' : 'у'}\n💫 Всего звезд: ${totalStars}` : 
    '\n\n🎉 <b>Спасибо за заказ!</b>';
    
  var clientHtml = [
    '<b>' + t_('orderReceived', lang) + '</b>',
    '👤 ' + nick,
    '💳 <b>' + t_('youCard', lang) + ':</b> #' + cardNumber,
    '⏱️ ' + t_('when', lang) + ': ' + whenHtml,
    '📦 ' + t_('items', lang) + ':',
    itemsHtml,
    '💵 ' + t_('sum', lang) + ': ' + total + ' RSD' + thanksMessage
  ].join('\n');
  
  // Отправляем сообщения
  var groupId = _prop('GROUP_CHAT_ID', '');
  if (groupId) {
    tgSendHTML_(groupId, groupHtml);
  }
  
  tgSendHTML_(user.id, clientHtml);
}

/** ===== ОБРАБОТКА TELEGRAM WEBHOOK ===== */
function handleStart_(update) {
  console.log("🎯 handleStart_ called");
  ensureHeaders_();
  
  var user = update.message && update.message.from;
  if (!user || !user.id) {
    console.log("❌ No user in start command");
    return;
  }
  
  try {
    // handleStart_ ДОЛЖЕН отправлять уведомления (true) - это основная функция /start
    var cardNumber = getOrCreateCardForUser_(user, true);
    console.log("✅ Start command processed successfully");
  } catch (error) {
    console.log("❌ Error in handleStart_:", error);
    tgSendHTML_(user.id, '❌ Error generating card. Please try again or contact support.');
  }
}

function adjustStarsFromMessage_(text, chatId) {
  // Принимаем команды формата: "1234 +5" или "1234 -2"
  var match = String(text || '').match(/^\s*(\d{4})\s*([+\-])\s*(\d+)\s*$/);
  if (!match) {
    if (chatId) {
      tgSendHTML_(chatId, '❌ Invalid format. Use: 1234 +2 or 1234 -1');
    }
    return { ok: false, reason: 'Invalid format' };
  }
  
  var cardNumber = match[1];
  var sign = (match[2] === '-') ? -1 : 1;
  var delta = sign * Number(match[3]);
  
  try {
    ensureHeaders_();
    
    // Находим пользователя по номеру карты
    var cardsSheet = getSheet_('Cards');
    var lastRow = cardsSheet.getLastRow();
    var userTelegramId = null;
    
    if (lastRow > 1) {
      var cardsData = cardsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < cardsData.length; i++) {
        if (String(cardsData[i][1]) === cardNumber) {
          userTelegramId = cardsData[i][0];
          break;
        }
      }
    }
    
    if (!userTelegramId) {
      if (chatId) {
        tgSendHTML_(chatId, '❌ Card <b>#' + cardNumber + '</b> not found');
      }
      return { ok: false, reason: 'card_not_found' };
    }
    
    // Обновляем звезды пользователя
    var usersSheet = getSheet_('Users');
    var usersLastRow = usersSheet.getLastRow();
    var newTotal = 0;
    var userUpdated = false;
    
    if (usersLastRow > 1) {
      var usersData = usersSheet.getRange(2, 1, usersLastRow - 1, 4).getValues();
      for (var j = 0; j < usersData.length; j++) {
        if (String(usersData[j][0]) === String(userTelegramId)) {
          var currentStars = Number(usersData[j][3]) || 0;
          newTotal = Math.max(0, currentStars + delta);
          usersSheet.getRange(j + 2, 4).setValue(newTotal);
          userUpdated = true;
          break;
        }
      }
    }
    
    if (!userUpdated) {
      // Создаем новую запись пользователя
      newTotal = Math.max(0, delta);
      usersSheet.appendRow([userTelegramId, '', cardNumber, newTotal, new Date()]);
    }
    
    // Логируем изменение
    var starsLogSheet = getSheet_('StarsLog');
    starsLogSheet.appendRow([cardNumber, delta, 'cashier', new Date()]);
    
    // Уведомляем кассира
    if (chatId) {
      var signText = (delta >= 0 ? '+' + delta : String(delta));
      tgSendHTML_(chatId, '✅ Stars updated for card <b>#' + cardNumber + '</b>: ' + signText + ' → total <b>' + newTotal + '</b>');
    }
    
    // Уведомляем пользователя
    if (userTelegramId) {
      tgSendHTML_(userTelegramId, '⭐ Your stars were updated: total <b>' + newTotal + '</b>');
    }
    
    return { 
      ok: true, 
      card: cardNumber, 
      delta: delta, 
      total: newTotal 
    };
    
  } catch (error) {
    console.log("❌ Error adjusting stars:", error);
    if (chatId) {
      tgSendHTML_(chatId, '❌ Error updating stars: ' + String(error));
    }
    return { ok: false, reason: String(error) };
  }
}

/** ===== ОСНОВНЫЕ ENTRY POINTS ===== */
function doPost(e) {
  console.log("📥 doPost called");
  
  var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  console.log("📄 Request body:", body);
  
  var data = {};
  try { 
    data = JSON.parse(body); 
  } catch (e2) { 
    console.log("❌ Failed to parse JSON body:", e2);
    data = {}; 
  }
  
  // API endpoints
  if (data && data.action === 'register') {
    console.log("🎯 Processing register action");
    return json(apiRegister_(data));
  }
  
  if (data && data.action === 'stars') {
    console.log("⭐ Processing stars action");
    return json(apiStars_(data));
  }
  
  if (data && data.action === 'order') {
    console.log("🛒 Processing order action");
    return json(apiOrder_(data));
  }
  
  // Telegram webhook
  if (data && data.message) {
    var text = data.message.text || '';
    var chatId = data.message.chat && data.message.chat.id;
    
    console.log("💬 Processing Telegram message:", text, "from chat:", chatId);
    
    if (/^\/start/.test(text)) {
      handleStart_(data);
      return simpleOk();
    }
    
    // Проверяем, что сообщение из разрешенных групп
    var allowedChats = [
      _prop('CASHIER_GROUP_ID', ''),
      _prop('GROUP_CHAT_ID', '')
    ].filter(Boolean);
    
    var isAllowedChat = allowedChats.some(function(allowedId) {
      return String(chatId) === String(allowedId);
    });
    
    if (!isAllowedChat) {
      console.log("ℹ️ Message from non-allowed chat, ignoring");
      return simpleOk();
    }
    
    // Обрабатываем команды управления звездами
    var result = adjustStarsFromMessage_(text, chatId);
    return simpleOk();
  }
  
  console.log("ℹ️ Unknown request type");
  return json({ ok: true, echo: data || null });
}

function doGet(e) {
  console.log("📥 doGet called");
  
  // Тестирование генерации карт
  if (e && e.parameter && e.parameter.test === 'card') {
    try {
      var testCard = nextCardNumber_();
      return json({ 
        ok: true, 
        test_card: testCard, 
        length: testCard.length,
        is_valid: testCard.length === 4 && !isNaN(testCard)
      });
    } catch (error) {
      return json({ 
        ok: false, 
        error: String(error) 
      });
    }
  }
  
  return json({ 
    ok: true, 
    ts: Date.now(),
    version: "FIXED_LOYALTY_v1.0"
  });
}

function ping() { 
  return HtmlService.createHtmlOutput("ok"); 
}

// Функция для исправления существующих некорректных карт
function fixExistingCards() {
  console.log("🔧 Starting fixExistingCards...");
  
  try {
    ensureHeaders_();
    
    var cardsSheet = getSheet_('Cards');
    var lastRow = cardsSheet.getLastRow();
    var fixed = 0;
    
    if (lastRow <= 1) {
      return "No cards to fix";
    }
    
    var cardsData = cardsSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    for (var i = 0; i < cardsData.length; i++) {
      var cardNumber = String(cardsData[i][1]);
      var telegramId = cardsData[i][0];
      
      // Проверяем, нужно ли исправлять карту
      if (!cardNumber || cardNumber.length !== 4 || isNaN(cardNumber) || cardNumber === 'undefined') {
        var newCard = nextCardNumber_();
        
        // Обновляем карту в Cards
        cardsSheet.getRange(i + 2, 2).setValue(newCard);
        
        // Обновляем карту в Users
        var usersSheet = getSheet_('Users');
        var usersLastRow = usersSheet.getLastRow();
        
        if (usersLastRow > 1) {
          var usersData = usersSheet.getRange(2, 1, usersLastRow - 1, 5).getValues();
          for (var j = 0; j < usersData.length; j++) {
            if (String(usersData[j][0]) === String(telegramId)) {
              usersSheet.getRange(j + 2, 3).setValue(newCard);
              break;
            }
          }
        }
        
        console.log("Fixed card for user", telegramId, "from", cardNumber, "to", newCard);
        fixed++;
      }
    }
    
    return "Fixed " + fixed + " cards";
    
  } catch (error) {
    console.log("❌ Error in fixExistingCards:", error);
    return "Error: " + String(error);
  }
}

// Функция для получения статистики
function migrateOldStarsToStarsLog() {
  console.log("🔄 Migrating old stars from Users table to StarsLog...");
  
  try {
    ensureHeaders_();
    
    var usersSheet = getSheet_('Users');
    var starsLogSheet = getSheet_('StarsLog');
    var cardsSheet = getSheet_('Cards');
    
    var usersData = usersSheet.getDataRange().getValues();
    var cardsData = cardsSheet.getDataRange().getValues();
    
    var migrated = 0;
    
    // Пропускаем заголовки (начинаем с индекса 1)
    for (var i = 1; i < usersData.length; i++) {
      var telegramId = usersData[i][0];
      var oldStars = parseFloat(usersData[i][3]) || 0;
      
      if (oldStars > 0) {
        // Найти номер карты по telegram ID
        var cardNumber = null;
        for (var j = 1; j < cardsData.length; j++) {
          if (String(cardsData[j][0]) === String(telegramId)) {
            cardNumber = cardsData[j][1];
            break;
          }
        }
        
        if (cardNumber) {
          // Добавить старые звезды в StarsLog
          starsLogSheet.appendRow([
            cardNumber,
            oldStars,
            'Миграция из старой системы',
            new Date()
          ]);
          
          // Обнулить звезды в Users таблице
          usersSheet.getRange(i + 1, 4, 1, 1).setValue(0);
          
          migrated++;
          console.log(`✅ Migrated ${oldStars} stars for card ${cardNumber}`);
        }
      }
    }
    
    console.log(`🎉 Migration completed! Migrated ${migrated} star records.`);
    return { ok: true, migrated: migrated };
  } catch (error) {
    console.log("❌ Migration error:", error);
    return { ok: false, error: String(error) };
  }
}

function testStarsCalculation() {
  console.log("🧪 Testing stars calculation:");
  
  var testCases = [
    { amount: 100, expected: 1 },
    { amount: 350, expected: 1 },
    { amount: 351, expected: 2 },
    { amount: 700, expected: 2 },
    { amount: 701, expected: 3 },
    { amount: 1000, expected: 3 },
    { amount: 1050, expected: 3 },
    { amount: 1051, expected: 4 }
  ];
  
  testCases.forEach(function(test) {
    var result = calculateStarsForAmount_(test.amount);
    var status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.amount} RSD = ${result} звезд (ожидалось: ${test.expected})`);
  });
  
  return { ok: true, message: "Stars calculation test completed" };
}

function getStats() {
  try {
    ensureHeaders_();
    
    var cardsSheet = getSheet_('Cards');
    var usersSheet = getSheet_('Users');
    var ordersSheet = getSheet_('Orders');
    
    return {
      total_cards: Math.max(0, cardsSheet.getLastRow() - 1),
      total_users: Math.max(0, usersSheet.getLastRow() - 1),
      total_orders: Math.max(0, ordersSheet.getLastRow() - 1),
      timestamp: new Date()
    };
  } catch (error) {
    return { error: String(error) };
  }
}