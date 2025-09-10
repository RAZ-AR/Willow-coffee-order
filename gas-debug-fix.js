// Добавьте этот код в ваш Google Apps Script для отладки:

function getOrCreateCardForTelegram_(tgUser) {
  console.log("🔍 GAS DEBUG: getOrCreateCardForTelegram_", JSON.stringify(tgUser));
  ensureHeaders_();
  if (!tgUser || !tgUser.id) throw new Error('no telegram user id');
  
  var sh = getSheet_('Cards');
  var row = findCardRowByTelegram_(tgUser.id);
  console.log("🔍 GAS DEBUG: findCardRowByTelegram_ result for ID", tgUser.id, "row:", row);
  
  if (row) {
    var existingCard = String(sh.getRange(row, 2).getValue());
    console.log("🔍 GAS DEBUG: Found existing card", existingCard, "for user", tgUser.id);
    return existingCard;
  }
  
  var cardNew = nextCardNumber_();
  console.log("🔍 GAS DEBUG: Creating new card", cardNew, "for user", tgUser.id);
  
  // ВАЖНО: проверим, что записываем в таблицу
  var rowData = [tgUser.id, cardNew, (tgUser.username || tgUser.first_name || ''), tgUser.id];
  console.log("🔍 GAS DEBUG: Appending to Cards sheet:", JSON.stringify(rowData));
  
  sh.appendRow(rowData);
  return cardNew;
}

function findCardRowByTelegram_(tgId) {
  console.log("🔍 GAS DEBUG: findCardRowByTelegram_ searching for", tgId);
  var sh = getSheet_('Cards');
  var vals = sh.getDataRange().getValues();
  console.log("🔍 GAS DEBUG: Cards sheet has", vals.length, "rows");
  
  for (var i = 1; i < vals.length; i++) {
    console.log("🔍 GAS DEBUG: Row", i, "telegram column:", vals[i][3], "vs searching for:", tgId);
    if (String(vals[i][3]) === String(tgId)) {
      console.log("🔍 GAS DEBUG: FOUND match at row", i + 1);
      return i + 1;
    }
  }
  console.log("🔍 GAS DEBUG: NO match found for", tgId);
  return null;
}

function nextCardNumber_() {
  var sh = getSheet_('Cards');
  var vals = sh.getDataRange().getValues();
  var max = 0;
  console.log("🔍 GAS DEBUG: Finding max card number from", vals.length, "rows");
  
  for (var i = 1; i < vals.length; i++) {
    var n = Number(vals[i][1]);
    console.log("🔍 GAS DEBUG: Row", i, "card number:", vals[i][1], "parsed as:", n);
    if (Number.isFinite(n) && n > max) max = n;
  }
  
  var nextCard = String(max + 1 || 1234);
  console.log("🔍 GAS DEBUG: Next card number will be:", nextCard, "(max was:", max, ")");
  return nextCard;
}