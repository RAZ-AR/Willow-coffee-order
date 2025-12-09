#!/bin/bash

# Скрипт для установки Menu Button в Telegram боте

echo "🎨 Установка Menu Button"
echo ""

BOT_TOKEN="8452257685:AAGoz5_czLVTY-ldwq3HonmhyucZ2oUueZA"
FRONTEND_URL="https://willow-coffee-order.onrender.com"

echo "📤 Отправляю запрос к Telegram API..."
echo "Frontend URL: $FRONTEND_URL"
echo ""

response=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{
    \"menu_button\": {
      \"type\": \"web_app\",
      \"text\": \"☕ Заказать\",
      \"web_app\": {
        \"url\": \"${FRONTEND_URL}\"
      }
    }
  }")

echo "📥 Ответ от Telegram:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

if echo "$response" | grep -q '"ok":true'; then
    echo ""
    echo "✅ Menu Button успешно установлен!"
    echo ""
    echo "Теперь:"
    echo "1. Откройте вашего бота в Telegram"
    echo "2. Внизу должна появиться кнопка '☕ Заказать'"
    echo "3. Нажмите на неё - откроется Mini App!"
else
    echo ""
    echo "❌ Ошибка при установке Menu Button"
fi
