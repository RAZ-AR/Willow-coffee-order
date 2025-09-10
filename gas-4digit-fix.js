// ЗАМЕНИТЕ в Google Apps Script функцию nextCardNumber_() на эту:

function nextCardNumber_() {
  console.log("🔍 GAS DEBUG: Generating 4-digit card number...");
  var sh = getSheet_('Cards');
  var existingCards = new Set();

  // Собираем все существующие номера карт
  if (sh.getLastRow() > 1) {
    var vals = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues(); // только колонка B (card)
    console.log("🔍 GAS DEBUG: Found", vals.length, "existing cards");
    
    for (var i = 0; i < vals.length; i++) {
      var cardNum = String(vals[i][0]); // vals[i][0] потому что берем только один столбец
      if (cardNum && cardNum !== '' && cardNum !== 'undefined') {
        existingCards.add(cardNum);
        console.log("🔍 GAS DEBUG: Existing card:", cardNum);
      }
    }
  }

  // ГАРАНТИРОВАННО генерируем 4-значный номер (1000-9999)
  var newCard;
  var attempts = 0;
  var maxAttempts = 500; // увеличиваем количество попыток
  
  do {
    // Math.random() * 9000 даст 0-8999, + 1000 = 1000-9999
    newCard = String(Math.floor(Math.random() * 9000) + 1000);
    attempts++;
    console.log("🔍 GAS DEBUG: Attempt", attempts, "generated:", newCard, "length:", newCard.length);

    if (attempts > maxAttempts) {
      // Если все случайные числа заняты, генерируем на основе времени
      var timestamp = String(Date.now());
      newCard = timestamp.slice(-4); // последние 4 цифры timestamp
      
      // Если получилось менее 4 цифр, добавляем нули в начале
      while (newCard.length < 4) {
        newCard = '0' + newCard;
      }
      
      // Убеждаемся что начинается не с 0 (минимум 1000)
      if (newCard.charAt(0) === '0') {
        newCard = '1' + newCard.slice(1);
      }
      
      console.log("🔍 GAS DEBUG: Using timestamp fallback:", newCard);
      break;
    }
  } while (existingCards.has(newCard));

  console.log("🔍 GAS DEBUG: Final 4-digit card:", newCard, "length:", newCard.length, "after", attempts, "attempts");
  
  // Дополнительная проверка что номер точно 4-значный
  if (newCard.length !== 4) {
    console.error("🔍 GAS ERROR: Generated card is not 4-digit:", newCard);
    newCard = String(Math.floor(Math.random() * 9000) + 1000); // запасной вариант
  }
  
  return newCard;
}

// ТАКЖЕ ЗАМЕНИТЕ getOrCreateCardForTelegram_() на эту версию с проверкой:
function getOrCreateCardForTelegram_(tgUser) {
  console.log("🔍 GAS DEBUG: getOrCreateCardForTelegram_", JSON.stringify(tgUser));
  ensureHeaders_();
  if (!tgUser || !tgUser.id) throw new Error('no telegram user id');
  
  var sh = getSheet_('Cards');
  var row = findCardRowByTelegram_(tgUser.id);
  
  if (row) {
    var existingCard = String(sh.getRange(row, 2).getValue());
    console.log("🔍 GAS DEBUG: Found existing card", existingCard, "for user", tgUser.id);
    return existingCard;
  }
  
  var cardNew = nextCardNumber_();
  console.log("🔍 GAS DEBUG: Creating new 4-digit card", cardNew, "for user", tgUser.id);
  
  // ВАЖНО: убеждаемся что карта точно 4-значная перед сохранением
  if (cardNew.length !== 4) {
    console.error("🔍 GAS ERROR: Card is not 4-digit, regenerating...");
    cardNew = String(Math.floor(Math.random() * 9000) + 1000);
  }
  
  var rowData = [tgUser.id, cardNew, (tgUser.username || tgUser.first_name || ''), tgUser.id];
  console.log("🔍 GAS DEBUG: Appending 4-digit card to Cards sheet:", JSON.stringify(rowData));
  
  sh.appendRow(rowData);
  return cardNew;
}