// ВРЕМЕННО добавьте эти функции в Google Apps Script для отладки продакшена:

function apiRegister_(payload) {
  console.log("🔍 PROD DEBUG: apiRegister_ payload", JSON.stringify(payload, null, 2));
  ensureHeaders_();
  var u = _resolveUserFromPayload_(payload);
  console.log("🔍 PROD DEBUG: resolved user", JSON.stringify(u, null, 2));
  
  if (!u || !u.id) {
    console.log("🔍 PROD DEBUG: NO USER ID FOUND");
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
  
  return result;
}

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

function getOrCreateCardForTelegram_(tgUser) {
  console.log("🔍 PROD DEBUG: getOrCreateCardForTelegram_", JSON.stringify(tgUser, null, 2));
  ensureHeaders_();
  if (!tgUser || !tgUser.id) throw new Error('no telegram user id');
  
  var sh = getSheet_('Cards');
  
  // Проверим содержимое таблицы Cards
  var allData = sh.getDataRange().getValues();
  console.log("🔍 PROD DEBUG: Cards table content:", JSON.stringify(allData, null, 2));
  
  var row = findCardRowByTelegram_(tgUser.id);
  console.log("🔍 PROD DEBUG: findCardRowByTelegram_ result for ID", tgUser.id, "row:", row);
  
  if (row) {
    var existingCard = String(sh.getRange(row, 2).getValue());
    console.log("🔍 PROD DEBUG: Found existing card", existingCard, "for user", tgUser.id);
    return existingCard;
  }
  
  var cardNew = nextCardNumber_();
  console.log("🔍 PROD DEBUG: Generated new card", cardNew, "for user", tgUser.id);
  
  var rowData = [tgUser.id, cardNew, (tgUser.username || tgUser.first_name || ''), tgUser.id];
  console.log("🔍 PROD DEBUG: Appending to Cards sheet:", JSON.stringify(rowData, null, 2));
  
  sh.appendRow(rowData);
  
  // Проверим что записалось
  var newData = sh.getDataRange().getValues();
  console.log("🔍 PROD DEBUG: Cards table after insert:", JSON.stringify(newData, null, 2));
  
  return cardNew;
}