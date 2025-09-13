/***************
 * Willow Mini-app — Google Apps Script backend (v9) - ГАРАНТИРОВАННЫЕ 4-ЗНАЧНЫЕ КАРТЫ
 * - Кассир управляет звёздами сообщениями "<card> +N" / "<card> -N" в CASHIER_GROUP_ID
 * - Никаких авто-начислений при заказе
 * - ИСПРАВЛЕНО: ВСЕГДА генерирует 4-значные карты (1000-9999)
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
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function ensureHeaders_() {
  var shCards = getSheet_('Cards');   if (shCards.getLastRow() === 0) shCards.appendRow(['id','card','name','telegram']);
  var shUsers = getSheet_('Users');   if (shUsers.getLastRow() === 0) shUsers.appendRow(['user_id','username','card','stars','created_at']);
  var shOrders= getSheet_('Orders');  if (shOrders.getLastRow() === 0) shOrders.appendRow(['order_id','user_id','card','total','when','table','payment','items_json','created_at']);
  var shLog   = getSheet_('StarsLog');if (shLog.getLastRow() === 0) shLog.appendRow(['card','delta','reason','created_at']);
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

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

/** ===== utils: parse initData → user ===== */
function parseInitUser_(initData) {
  try {
    if (!initData) return null;
    var raw = String(initData);
    var qs  = raw.indexOf('#') >= 0 ? raw.split('#').pop() : raw;
    var parts = qs.split('&');
    var params = {};
    for (var i=0;i<parts.length;i++){
      var kv = parts[i].split('=');
      var k = decodeURIComponent(kv[0]||'');
      var v = decodeURIComponent((kv.slice(1).join('='))||'');
      params[k]=v;
    }
    if (params.user) {
      var u = JSON.parse(params.user);
      if (u && u.id) return u;
    }
  } catch(e){}
  return null;
}

/** ===== Cards & Users - ИСПРАВЛЕННЫЕ ФУНКЦИИ ===== */
function findCardRowByTelegram_(tgId) {
  var sh = getSheet_('Cards');
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][3]) === String(tgId)) return i + 1;
  }
  return null;
}

function findCardRowByCard_(card) {
  var sh = getSheet_('Cards');
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][1]) === String(card)) return i + 1;
  }
  return null;
}

// КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ - ИСПРАВЛЕНА ДЛЯ 100% ГАРАНТИИ 4-ЗНАЧНЫХ НОМЕРОВ
function nextCardNumber_() {
  console.log("🎯 GENERATING 4-DIGIT CARD NUMBER...");
  
  var sh = getSheet_('Cards');
  var existingCards = {};
  
  // Собираем все существующие номера карт в объект для быстрой проверки
  try {
    var vals = sh.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      var cardNum = String(vals[i][1]);
      if (cardNum && cardNum !== '' && cardNum !== 'undefined') {
        existingCards[cardNum] = true;
      }
    }
  } catch (e) {
    console.log("Error reading existing cards:", e);
  }
  
  // Генерируем уникальный 4-значный номер
  var attempts = 0;
  var maxAttempts = 100;
  var newCard;
  
  while (attempts < maxAttempts) {
    // Генерируем число от 1000 до 9999
    var randomNum = Math.floor(Math.random() * 9000) + 1000;
    newCard = String(randomNum);
    
    // Проверяем что это точно 4 цифры
    if (newCard.length === 4 && !existingCards[newCard]) {
      console.log("✅ Generated unique 4-digit card:", newCard);
      return newCard;
    }
    attempts++;
  }
  
  // Если случайная генерация не удалась, ищем первый свободный номер
  console.log("⚠️ Random generation failed, searching for free number...");
  for (var num = 1000; num <= 9999; num++) {
    var testCard = String(num);
    if (!existingCards[testCard]) {
      console.log("✅ Found free 4-digit card:", testCard);
      return testCard;
    }
  }
  
  // Это практически невозможно (9000 карт заняты), но на всякий случай
  throw new Error("All 4-digit card numbers are taken!");
}

function getOrCreateCardForTelegram_(tgUser) {
  ensureHeaders_();
  if (!tgUser || !tgUser.id) throw new Error('no telegram user id');
  
  var sh = getSheet_('Cards');
  var row = findCardRowByTelegram_(tgUser.id);
  
  if (row) {
    var existingCard = String(sh.getRange(row, 2).getValue());
    // Проверяем что существующая карта 4-значная
    if (existingCard && existingCard.length === 4 && !isNaN(existingCard)) {
      console.log("Found existing 4-digit card", existingCard, "for user", tgUser.id);
      return existingCard;
    } else {
      // Если карта не 4-значная, генерируем новую и обновляем
      console.log("⚠️ Existing card is not 4-digit:", existingCard, "- generating new one");
      var newCard = nextCardNumber_();
      sh.getRange(row, 2).setValue(newCard);
      console.log("✅ Updated card to", newCard, "for user", tgUser.id);
      return newCard;
    }
  }
  
  // Генерируем новую 4-значную карту
  var cardNew = nextCardNumber_();
  
  // Финальная проверка перед сохранением
  if (cardNew.length !== 4 || isNaN(cardNew) || Number(cardNew) < 1000 || Number(cardNew) > 9999) {
    throw new Error("Generated invalid card number: " + cardNew);
  }
  
  var rowData = [tgUser.id, cardNew, (tgUser.username || tgUser.first_name || ''), tgUser.id];
  sh.appendRow(rowData);
  
  console.log("✅ Created new 4-digit card", cardNew, "for user", tgUser.id);
  return cardNew;
}

function findUserRowByUserId_(userId) {
  var sh = getSheet_('Users');
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(userId)) return i + 1;
  }
  return null;
}

function getOrCreateUser_(tgUser, card) {
  ensureHeaders_();
  if (!tgUser || !tgUser.id) throw new Error('no telegram user id');
  var sh = getSheet_('Users');
  var row = findUserRowByUserId_(tgUser.id);
  if (row) {
    // Обновляем карту если она изменилась
    var currentCard = String(sh.getRange(row, 3).getValue());
    if (currentCard !== String(card)) {
      sh.getRange(row, 3).setValue(card);
    }
    return row;
  }
  sh.appendRow([tgUser.id, tgUser.username || '', card || '', 0, new Date()]);
  return sh.getLastRow();
}

function getStarsByUserRow_(row) {
  return Number(getSheet_('Users').getRange(row, 4).getValue()) || 0;
}

/** ===== Telegram helpers (HTML + parallel) ===== */
function tgSendHTML_(chatId, html) {
  var token = _prop('TELEGRAM_TOKEN', '');
  if (!token || !chatId) return { ok:false, reason:'no token/chatId' };
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
    var js = {};
    try { js = JSON.parse(res.getContentText()); } catch(e){}
    if (!js.ok) return { ok:false, reason: res.getContentText() };
    return { ok:true };
  } catch (e) {
    return { ok:false, reason:String(e) };
  }
}

function tgSendParallelHTML_(messages) {
  var token = _prop('TELEGRAM_TOKEN', '');
  if (!token || !messages || !messages.length) return [];
  var reqs = messages.map(function(m) {
    return {
      url: 'https://api.telegram.org/bot' + token + '/sendMessage',
      method: 'post',
      payload: {
        chat_id: String(m.chatId),
        text: String(m.html),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      },
      muteHttpExceptions: true
    };
  });
  try {
    var res = UrlFetchApp.fetchAll(reqs);
    return res.map(function(r) {
      var js = {};
      try { js = JSON.parse(r.getContentText()); } catch(e){}
      return js && js.ok ? { ok:true } : { ok:false, reason: r.getContentText() };
    });
  } catch (e) {
    return messages.map(function(){ return { ok:false, reason:String(e) }; });
  }
}

/** ===== API: register / stars / order ===== */
function _resolveUserFromPayload_(payload) {
  var u = (payload && payload.user) || null;
  if ((!u || !u.id) && payload && payload.initData) {
    u = parseInitUser_(payload.initData);
  }
  return u;
}

function apiRegister_(payload) {
  console.log("📱 apiRegister_ called");
  ensureHeaders_();
  var u = _resolveUserFromPayload_(payload);
  if (!u || !u.id) return { ok:false, error:'no telegram user id' };
  
  var baseU = { id: u.id, username: u.username || '', first_name: u.first_name || '', language_code: u.language_code || '' };
  var card = getOrCreateCardForTelegram_(baseU);
  
  // Дополнительная проверка что карта 4-значная
  if (!card || card.length !== 4) {
    console.error("❌ Card validation failed:", card);
    return { ok:false, error:'card generation failed' };
  }
  
  var row  = getOrCreateUser_(baseU, card);
  var stars= getStarsByUserRow_(row);
  
  console.log("✅ apiRegister_ success - card:", card, "stars:", stars);
  return { ok: true, card: card, stars: stars };
}

function apiStars_(payload) {
  ensureHeaders_();
  var u = _resolveUserFromPayload_(payload);
  if (!u || !u.id) return { ok:false, error:'no telegram user id' };
  
  var baseU = { id: u.id, username: u.username || '', first_name: u.first_name || '', language_code: u.language_code || '' };
  var card = getOrCreateCardForTelegram_(baseU);
  
  // Дополнительная проверка что карта 4-значная
  if (!card || card.length !== 4) {
    console.error("❌ Card validation failed:", card);
    return { ok:false, error:'card validation failed' };
  }
  
  var row  = getOrCreateUser_(baseU, card);
  var stars= getStarsByUserRow_(row);
  return { ok: true, card: card, stars: stars };
}

function apiOrder_(payload) {
  ensureHeaders_();
  var u = _resolveUserFromPayload_(payload);
  if (!u || !u.id) return { ok:false, error:'no telegram user id' };
  
  var baseU = { id: u.id, username: u.username || '', first_name: u.first_name || '', language_code: u.language_code || '' };

  var card    = payload && payload.card || '';
  var total   = Number(payload && payload.total) || 0;
  var when    = (payload && payload.when) || 'now';
  var table   = payload && payload.table;
  var payment = (payload && payload.payment) || '';
  var items   = (payload && payload.items) || [];

  var realCard = getOrCreateCardForTelegram_(baseU);
  
  // Если переданная карта не совпадает или не 4-значная, используем правильную
  if (!card || String(card) !== String(realCard) || card.length !== 4) {
    card = realCard;
  }

  var nick = baseU.username ? '@' + baseU.username : (baseU.first_name || String(baseU.id));
  var itemsHtml = (items || []).map(function(it){
    var qty = Number(it.qty) || 0;
    var up  = Number(it.unit_price) || 0;
    var lineTotal = up * qty;
    return '• <b>' + (it.title || '') + '</b> ×' + qty + ' — ' + lineTotal + ' RSD';
  }).join('\n');
  var whenHtml = (when === 'now') ? ('Now' + (table ? (' — <b>table ' + table + '</b>') : '')) : ('+' + when + ' min');

  // Сообщение для кухни/баристы - ВСЕГДА показываем 4-значный номер карты
  var groupHtml =
    '<b>🧾 ' + t_('newOrder', 'en') + '</b>\n' +
    '👤 ' + nick + '\n' +
    '💳 <b>' + t_('youCard', 'en') + ':</b> #' + card + '\n' +
    '⏱️ <b>' + t_('when', 'en') + ':</b> ' + whenHtml + '\n' +
    '💰 <b>' + t_('payment', 'en') + ':</b> ' + payment + '\n' +
    '📦 <b>' + t_('items', 'en') + ':</b>\n' + itemsHtml + '\n' +
    '— — —\n' +
    '💵 <b>' + t_('sum', 'en') + ':</b> ' + total + ' RSD';

  // Сообщение для клиента - ВСЕГДА показываем 4-значный номер карты
  var langU = langFromUser_(baseU);
  var clientHtml =
    '<b>' + t_('orderReceived', langU) + '</b>\n' +
    '👤 ' + nick + '\n' +
    '💳 <b>' + t_('youCard', langU) + ':</b> #' + card + '\n' +
    '⏱️ ' + t_('when', langU) + ': ' + whenHtml + '\n' +
    '📦 ' + t_('items', langU) + ':\n' + itemsHtml + '\n' +
    '💵 ' + t_('sum', langU) + ': ' + total + ' RSD';

  var groupId = _prop('GROUP_CHAT_ID', '');
  var batch = [];
  if (groupId) batch.push({ chatId: groupId, html: groupHtml });
  batch.push({ chatId: baseU.id, html: clientHtml });
  tgSendParallelHTML_(batch);

  var rowUser = getOrCreateUser_(baseU, card);
  var orders  = getSheet_('Orders');
  var oid = 'o_' + (new Date().getTime());
  orders.appendRow([ oid, baseU.id || '', card, total, when, when === 'now' ? (table || '') : '', payment, JSON.stringify(items), new Date() ]);

  var currentStars = getStarsByUserRow_(rowUser);
  return { ok:true, order_id: oid, card: card, stars: currentStars };
}

/** ===== Telegram webhook: /start и кассир-команды ===== */
function handleStart_(update) {
  ensureHeaders_();
  var u = update.message && update.message.from;
  if (!u || !u.id) return;
  
  var card = getOrCreateCardForTelegram_(u);
  
  // Проверяем что карта 4-значная
  if (!card || card.length !== 4) {
    console.error("❌ Invalid card in handleStart_:", card);
    tgSendHTML_(u.id, '❌ Error generating card. Please try again or contact support.');
    return;
  }
  
  var row  = getOrCreateUser_(u, card);
  var stars= getStarsByUserRow_(row);
  var lang = langFromUser_(u);
  var nick = u.username ? '@' + u.username : (u.first_name || 'friend');
  
  // Показываем 4-значный номер карты с # для красоты
  var html =
    '<b>Hi, ' + nick + '!</b>\n' +
    t_('greet', lang) + '\n' +
    '<b>' + t_('youCard', lang) + ':</b> #' + card + '\n' +
    '⭐ <b>' + stars + '</b>';
  tgSendHTML_(u.id, html);
}

function adjustStarsFromMessage_(text, chatId) {
  // Принимаем только 4-значные номера карт
  var m = String(text || '').match(/^\s*(\d{4})\s*([+\-])\s*(\d+)\s*$/);
  if (!m) return { ok:false, reason:'Invalid format. Use: 1234 +2 or 1234 -1' };
  ensureHeaders_();

  var card  = m[1];
  var sign  = (m[2] === '-') ? -1 : 1;
  var delta = sign * Number(m[3]);

  var rowCard = findCardRowByCard_(card);
  if (!rowCard) {
    if (chatId) tgSendHTML_(chatId, '❌ Card <b>#'+card+'</b> not found. No changes made.');
    return { ok:false, reason:'card_not_found' };
  }

  var users = getSheet_('Users');
  var vals  = users.getDataRange().getValues();
  var row   = null;
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][2]) === String(card)) { row = i + 1; break; }
  }

  var newTotal;
  if (!row) {
    users.appendRow(['', '', card, Math.max(0, delta), new Date()]);
    row = users.getLastRow();
    newTotal = Math.max(0, delta);
  } else {
    var cur = Number(users.getRange(row, 4).getValue()) || 0;
    newTotal = cur + delta;
    if (newTotal < 0) newTotal = 0;
    users.getRange(row, 4).setValue(newTotal);
  }

  getSheet_('StarsLog').appendRow([card, delta, 'cashier', new Date()]);

  if (chatId) {
    var signTxt = (delta >= 0 ? '+' + delta : String(delta));
    tgSendHTML_(chatId, '✅ Stars updated for card <b>#' + card + '</b>: ' + signTxt + ' → total <b>' + newTotal + '</b>');
  }
  var ownerTgId = String(getSheet_('Cards').getRange(rowCard, 1).getValue());
  if (ownerTgId) tgSendHTML_(ownerTgId, '⭐ Your stars were updated: total <b>' + newTotal + '</b>');

  return { ok:true, card: card, delta: delta, total: newTotal };
}

/** ===== Entry points ===== */
function doPost(e) {
  var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  var data = {};
  try { data = JSON.parse(body); } catch (e2) { data = {}; }

  if (data && data.action === 'register') return json(apiRegister_(data));
  if (data && data.action === 'stars')    return json(apiStars_(data));
  if (data && data.action === 'order')    return json(apiOrder_(data));

  if (data && data.message) {
    var txt    = data.message.text || '';
    var chatId = data.message.chat && data.message.chat.id;

    if (/^\/start/.test(txt)) { handleStart_(data); return json({ ok: true }); }

    var allowChat = String(chatId) === String(_prop('CASHIER_GROUP_ID','')) ||
                    String(chatId) === String(_prop('GROUP_CHAT_ID',''));
    if (!allowChat) return json({ ok:true, ignored:true });

    var res = adjustStarsFromMessage_(txt, chatId);
    return json(res);
  }

  return json({ ok: true, echo: data || null });
}

function doGet(e) { 
  // Для тестирования генерации карт
  if (e && e.parameter && e.parameter.test === 'card') {
    var testCard = nextCardNumber_();
    return json({ ok: true, test_card: testCard, length: testCard.length });
  }
  return json({ ok: true, ts: Date.now() }); 
}

function ping() { return ContentService.createTextOutput("ok"); }

// Функция для исправления существующих не-4-значных карт
function fixExistingCards() {
  var sh = getSheet_('Cards');
  var vals = sh.getDataRange().getValues();
  var fixed = 0;
  
  for (var i = 1; i < vals.length; i++) {
    var cardNum = String(vals[i][1]);
    if (!cardNum || cardNum.length !== 4 || isNaN(cardNum)) {
      var newCard = nextCardNumber_();
      sh.getRange(i + 1, 2).setValue(newCard);
      console.log("Fixed card for row", i + 1, "from", cardNum, "to", newCard);
      fixed++;
      
      // Обновляем также в Users
      var userId = vals[i][0];
      var usersSheet = getSheet_('Users');
      var usersVals = usersSheet.getDataRange().getValues();
      for (var j = 1; j < usersVals.length; j++) {
        if (String(usersVals[j][0]) === String(userId)) {
          usersSheet.getRange(j + 1, 3).setValue(newCard);
          break;
        }
      }
    }
  }
  
  return "Fixed " + fixed + " cards";
}
