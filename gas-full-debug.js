/***************
 * Willow Mini-app — Google Apps Script backend (v8-DEBUG)
 * ПОЛНЫЙ КОД С ОТЛАДКОЙ ДЛЯ ПРОДАКШЕНА
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
  console.log("🔍 PROD DEBUG: parseInitUser_ input:", initData);
  try {
    if (!initData) {
      console.log("🔍 PROD DEBUG: parseInitUser_ - no initData");
      return null;
    }
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
    console.log("🔍 PROD DEBUG: parseInitUser_ params:", JSON.stringify(params, null, 2));
    if (params.user) {
      var u = JSON.parse(params.user);
      console.log("🔍 PROD DEBUG: parseInitUser_ parsed user:", JSON.stringify(u, null, 2));
      if (u && u.id) return u;
    }
  } catch(e){
    console.log("🔍 PROD DEBUG: parseInitUser_ error:", e);
  }
  return null;
}

/** ===== Cards & Users - С ОТЛАДКОЙ ===== */
function findCardRowByTelegram_(tgId) {
  console.log("🔍 PROD DEBUG: findCardRowByTelegram_ searching for", tgId);
  var sh = getSheet_('Cards');
  var vals = sh.getDataRange().getValues();
  console.log("🔍 PROD DEBUG: Cards sheet has", vals.length, "rows");
  console.log("🔍 PROD DEBUG: Cards sheet content:", JSON.stringify(vals, null, 2));
  
  for (var i = 1; i < vals.length; i++) {
    console.log("🔍 PROD DEBUG: Row", i, "telegram ID:", vals[i][3], "vs searching for:", tgId, "match:", String(vals[i][3]) === String(tgId));
    if (String(vals[i][3]) === String(tgId)) {
      console.log("🔍 PROD DEBUG: FOUND match at row", i + 1);
      return i + 1;
    }
  }
  console.log("🔍 PROD DEBUG: NO match found for", tgId);
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

function nextCardNumber_() {
  console.log("🔍 PROD DEBUG: Generating 4-digit card number...");
  var sh = getSheet_('Cards');
  var existingCards = new Set();

  try {
    var vals = sh.getDataRange().getValues();
    console.log("🔍 PROD DEBUG: Found", vals.length - 1, "existing cards");
    
    for (var i = 1; i < vals.length; i++) {
      var cardNum = String(vals[i][1]);
      if (cardNum && cardNum !== '' && cardNum !== 'undefined') {
        existingCards.add(cardNum);
        console.log("🔍 PROD DEBUG: Existing card:", cardNum);
      }
    }
  } catch (e) {
    console.log("🔍 PROD DEBUG: Error reading existing cards:", e);
  }

  var newCard;
  var attempts = 0;
  var maxAttempts = 1000;
  
  do {
    newCard = String(Math.floor(Math.random() * 9000) + 1000);
    attempts++;
    console.log("🔍 PROD DEBUG: Attempt", attempts, "generated:", newCard, "length:", newCard.length);

    if (attempts > maxAttempts) {
      var now = new Date().getTime();
      var lastFour = String(now).slice(-4);
      
      if (lastFour.charAt(0) === '0') {
        lastFour = '1' + lastFour.slice(1);
      }
      
      newCard = lastFour;
      
      while (newCard.length < 4) {
        newCard = '1' + newCard;
      }
      
      console.log("🔍 PROD DEBUG: Using timestamp fallback:", newCard, "length:", newCard.length);
      break;
    }
  } while (existingCards.has(newCard));

  if (newCard.length !== 4) {
    console.error("🔍 PROD DEBUG: Generated card is not 4-digit:", newCard, "length:", newCard.length);
    newCard = String(1000 + Math.floor(Math.random() * 9000));
  }

  console.log("🔍 PROD DEBUG: Final 4-digit card:", newCard, "length:", newCard.length, "after", attempts, "attempts");
  return newCard;
}

function getOrCreateCardForTelegram_(tgUser) {
  console.log("🔍 PROD DEBUG: getOrCreateCardForTelegram_", JSON.stringify(tgUser, null, 2));
  ensureHeaders_();
  if (!tgUser || !tgUser.id) throw new Error('no telegram user id');
  
  var sh = getSheet_('Cards');
  
  // Проверим содержимое таблицы Cards ДО поиска
  var allDataBefore = sh.getDataRange().getValues();
  console.log("🔍 PROD DEBUG: Cards table content BEFORE:", JSON.stringify(allDataBefore, null, 2));
  
  var row = findCardRowByTelegram_(tgUser.id);
  console.log("🔍 PROD DEBUG: findCardRowByTelegram_ result for ID", tgUser.id, "row:", row);
  
  if (row) {
    var existingCard = String(sh.getRange(row, 2).getValue());
    console.log("🔍 PROD DEBUG: Found existing card", existingCard, "for user", tgUser.id);
    return existingCard;
  }
  
  var cardNew = nextCardNumber_();
  console.log("🔍 PROD DEBUG: Generated new card", cardNew, "for user", tgUser.id);
  
  if (cardNew.length !== 4 || isNaN(cardNew) || Number(cardNew) < 1000 || Number(cardNew) > 9999) {
    console.error("🔍 PROD DEBUG: Invalid card number before save:", cardNew);
    cardNew = String(1000 + Math.floor(Math.random() * 9000));
    console.log("🔍 PROD DEBUG: Generated backup card:", cardNew);
  }
  
  var rowData = [tgUser.id, cardNew, (tgUser.username || tgUser.first_name || ''), tgUser.id];
  console.log("🔍 PROD DEBUG: Appending to Cards sheet:", JSON.stringify(rowData, null, 2));
  
  sh.appendRow(rowData);
  
  // Проверим что записалось ПОСЛЕ вставки
  var allDataAfter = sh.getDataRange().getValues();
  console.log("🔍 PROD DEBUG: Cards table content AFTER:", JSON.stringify(allDataAfter, null, 2));
  
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
  if (row) return row;
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

/** ===== API: register / stars / order (С ПОЛНОЙ ОТЛАДКОЙ) ===== */
function _resolveUserFromPayload_(payload) {
  console.log("🔍 PROD DEBUG: _resolveUserFromPayload_ input", JSON.stringify(payload, null, 2));
  
  var u = (payload && payload.user) || null;
  console.log("🔍 PROD DEBUG: user from payload.user", JSON.stringify(u, null, 2));
  
  if ((!u || !u.id) && payload && payload.initData) {
    console.log("🔍 PROD DEBUG: trying to parse initData", payload.initData);
    u = parseInitUser_(payload.initData);
    console.log("🔍 PROD DEBUG: user from initData", JSON.stringify(u, null, 2));
  }
  
  console.log("🔍 PROD DEBUG: final resolved user", JSON.stringify(u, null, 2));
  return u;
}

function apiRegister_(payload) {
  console.log("🔍 PROD DEBUG: ===== apiRegister_ START =====");
  console.log("🔍 PROD DEBUG: apiRegister_ payload", JSON.stringify(payload, null, 2));
  ensureHeaders_();
  var u = _resolveUserFromPayload_(payload);
  console.log("🔍 PROD DEBUG: resolved user", JSON.stringify(u, null, 2));
  
  if (!u || !u.id) {
    console.log("🔍 PROD DEBUG: NO USER ID FOUND - returning error");
    return { ok:false, error:'no telegram user id' };
  }
  
  var baseU = { id: u.id, username: u.username || '', first_name: u.first_name || '', language_code: u.language_code || '' };
  console.log("🔍 PROD DEBUG: baseU", JSON.stringify(baseU, null, 2));
  
  var card = getOrCreateCardForTelegram_(baseU);
  console.log("🔍 PROD DEBUG: card for user", baseU.id, "is", card);
  
  var row  = getOrCreateUser_(baseU, card);
  var stars= getStarsByUserRow_(row);
  
  var result = { ok: true, card: card, stars: stars };
  console.log("🔍 PROD DEBUG: final result", JSON.stringify(result, null, 2));
  console.log("🔍 PROD DEBUG: ===== apiRegister_ END =====");
  
  return result;
}

function apiStars_(payload) {
  ensureHeaders_();
  var u = _resolveUserFromPayload_(payload);
  if (!u || !u.id) return { ok:false, error:'no telegram user id' };
  var baseU = { id: u.id, username: u.username || '', first_name: u.first_name || '', language_code: u.language_code || '' };
  var card = getOrCreateCardForTelegram_(baseU);
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
  if (!card || String(card) !== String(realCard)) card = realCard;

  var nick = baseU.username ? '@' + baseU.username : (baseU.first_name || String(baseU.id));
  var itemsHtml = (items || []).map(function(it){
    var qty = Number(it.qty) || 0;
    var up  = Number(it.unit_price) || 0;
    var lineTotal = up * qty;
    return '• <b>' + (it.title || '') + '</b> ×' + qty + ' — ' + lineTotal + ' RSD';
  }).join('\n');
  var whenHtml = (when === 'now') ? ('Now' + (table ? (' — <b>table ' + table + '</b>') : '')) : ('+' + when + ' min');

  var groupHtml =
    '<b>🧾 ' + t_('newOrder', 'en') + '</b>\n' +
    '👤 ' + nick + '\n' +
    '💳 <b>' + t_('youCard', 'en') + ':</b> ' + card + '\n' +
    '⏱️ <b>' + t_('when', 'en') + ':</b> ' + whenHtml + '\n' +
    '💰 <b>' + t_('payment', 'en') + ':</b> ' + payment + '\n' +
    '📦 <b>' + t_('items', 'en') + ':</b>\n' + itemsHtml + '\n' +
    '— — —\n' +
    '💵 <b>' + t_('sum', 'en') + ':</b> ' + total + ' RSD';

  var langU = langFromUser_(baseU);
  var clientHtml =
    '<b>' + t_('orderReceived', langU) + '</b>\n' +
    '👤 ' + nick + '\n' +
    '💳 <b>' + t_('youCard', langU) + ':</b> ' + card + '\n' +
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
  var row  = getOrCreateUser_(u, card);
  var stars= getStarsByUserRow_(row);
  var lang = langFromUser_(u);
  var nick = u.username ? '@' + u.username : (u.first_name || 'friend');
  var html =
    '<b>Hi, ' + nick + '!</b>\n' +
    t_('greet', lang) + '\n' +
    '<b>' + t_('youCard', lang) + ':</b> ' + card + '\n' +
    '⭐ <b>' + stars + '</b>';
  tgSendHTML_(u.id, html);
}

function adjustStarsFromMessage_(text, chatId) {
  var m = String(text || '').match(/^\s*(\d{4})\s*([+\-])\s*(\d+)\s*$/);
  if (!m) return { ok:false, reason:'no match - card must be 4-digit' };
  ensureHeaders_();

  var card  = m[1];
  var sign  = (m[2] === '-') ? -1 : 1;
  var delta = sign * Number(m[3]);

  var rowCard = findCardRowByCard_(card);
  if (!rowCard) {
    if (chatId) tgSendHTML_(chatId, '❌ Card <b>'+card+'</b> not found in Cards. No changes made.');
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
    tgSendHTML_(chatId, '✅ Stars updated for card <b>' + card + '</b>: ' + signTxt + ' → total <b>' + newTotal + '</b>');
  }
  var ownerTgId = String(getSheet_('Cards').getRange(rowCard, 1).getValue());
  if (ownerTgId) tgSendHTML_(ownerTgId, '⭐ Your stars were updated: total <b>' + newTotal + '</b>');

  return { ok:true, card: card, delta: delta, total: newTotal };
}

/** ===== Entry points ===== */
function doPost(e) {
  console.log("🔍 PROD DEBUG: ===== doPost START =====");
  var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  console.log("🔍 PROD DEBUG: doPost body:", body);
  var data = {};
  try { 
    data = JSON.parse(body); 
    console.log("🔍 PROD DEBUG: doPost parsed data:", JSON.stringify(data, null, 2));
  } catch (e2) { 
    console.log("🔍 PROD DEBUG: doPost JSON parse error:", e2);
    data = {};
  }

  if (data && data.action === 'register') {
    console.log("🔍 PROD DEBUG: Calling apiRegister_");
    return json(apiRegister_(data));
  }
  if (data && data.action === 'stars') {
    console.log("🔍 PROD DEBUG: Calling apiStars_");
    return json(apiStars_(data));
  }
  if (data && data.action === 'order') {
    console.log("🔍 PROD DEBUG: Calling apiOrder_");
    return json(apiOrder_(data));
  }

  if (data && data.message) {
    console.log("🔍 PROD DEBUG: Processing Telegram message");
    var txt    = data.message.text || '';
    var chatId = data.message.chat && data.message.chat.id;

    if (/^\/start/.test(txt)) { 
      console.log("🔍 PROD DEBUG: Handling /start command");
      handleStart_(data); 
      return json({ ok: true }); 
    }

    var allowChat = String(chatId) === String(_prop('CASHIER_GROUP_ID','')) ||
                    String(chatId) === String(_prop('GROUP_CHAT_ID',''));
    if (!allowChat) {
      console.log("🔍 PROD DEBUG: Chat not allowed for star commands");
      return json({ ok:true, ignored:true });
    }

    console.log("🔍 PROD DEBUG: Processing star command:", txt);
    var res = adjustStarsFromMessage_(txt, chatId);
    return json(res);
  }

  console.log("🔍 PROD DEBUG: No specific action, returning echo");
  return json({ ok: true, echo: data || null });
}

function doGet(e) { 
  console.log("🔍 PROD DEBUG: doGet called");
  return json({ ok: true, ts: Date.now() }); 
}

function ping() { 
  console.log("🔍 PROD DEBUG: ping called");
  return ContentService.createTextOutput("ok"); 
}

// Тестовая функция для проверки генерации карт
function testCardGeneration() {
  console.log("🔍 PROD DEBUG: Testing card generation");
  var testUser = { id: '999999', username: 'testuser', first_name: 'Test' };
  var card = getOrCreateCardForTelegram_(testUser);
  console.log("🔍 PROD DEBUG: Test card generated:", card, "length:", card.length);
  return card;
}