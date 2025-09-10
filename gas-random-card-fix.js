// Замените функцию nextCardNumber_() в Google Apps Script на эту версию:

function nextCardNumber_() {
  var sh = getSheet_('Cards');
  var existingCards = new Set();
  
  // Собираем все существующие номера карт
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    var cardNum = String(vals[i][1]);
    if (cardNum && cardNum !== '') {
      existingCards.add(cardNum);
    }
  }
  
  // Генерируем случайный 4-значный номер, пока не найдем уникальный
  var newCard;
  var attempts = 0;
  do {
    // Генерируем случайный номер от 1000 до 9999
    newCard = String(Math.floor(Math.random() * 9000) + 1000);
    attempts++;
    
    // Защита от бесконечного цикла (если все номера заняты)
    if (attempts > 100) {
      // В крайнем случае используем timestamp
      newCard = String(Date.now()).slice(-4);
      break;
    }
  } while (existingCards.has(newCard));
  
  console.log("🔍 GAS DEBUG: Generated new random card:", newCard, "after", attempts, "attempts");
  return newCard;
}

// Также обновите функцию с лучшей проверкой уникальности:
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
  console.log("🔍 GAS DEBUG: Creating new random card", cardNew, "for user", tgUser.id);
  
  var rowData = [tgUser.id, cardNew, (tgUser.username || tgUser.first_name || ''), tgUser.id];
  console.log("🔍 GAS DEBUG: Appending to Cards sheet:", JSON.stringify(rowData));
  
  sh.appendRow(rowData);
  return cardNew;
}