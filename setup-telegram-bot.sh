#!/bin/bash

# Настройка Telegram бота Willow Coffee
# Использование: ./setup-telegram-bot.sh

set -e

# Ваши данные
BOT_TOKEN="8471476848:AAEV1eSNi6lO5aH--fS4YivQNb8Qe2fRD58"
GROUP_CHAT_ID="-1003082827591"

# URL вашего сайта на Render (обновите после деплоя)
MINIAPP_URL="https://willow-miniapp.onrender.com"

# URL вашего Google Apps Script (обновите после деплоя GAS)
WEBHOOK_URL="https://script.google.com/macros/s/AKfycbztt8YDXYTAb9xPOSVF5ivBoSc9IJCiywY5iQWBDxPMlBuJ10XhGnoPycVwp0lhshMY/exec"

echo "🤖 Настройка Telegram бота Willow Coffee"
echo "========================================="
echo ""

# 1. Проверка бота
echo "1️⃣ Проверка бота..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
echo "Ответ: $BOT_INFO"

if echo "$BOT_INFO" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*' | cut -d'"' -f4)
    echo "✅ Бот активен: @$BOT_USERNAME"
else
    echo "❌ Ошибка: бот не отвечает. Проверьте токен."
    exit 1
fi

echo ""

# 2. Установка webhook
echo "2️⃣ Установка webhook..."
WEBHOOK_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")
echo "Ответ: $WEBHOOK_RESPONSE"

if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook установлен"
else
    echo "❌ Ошибка установки webhook"
fi

echo ""

# 3. Проверка webhook
echo "3️⃣ Проверка webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "Информация о webhook:"
echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*' | cut -d'"' -f4
echo ""

# 4. Настройка Menu Button
echo "4️⃣ Настройка Menu Button..."
MENU_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "Заказать кофе",
      "web_app": {
        "url": "'"${MINIAPP_URL}"'"
      }
    }
  }')

echo "Ответ: $MENU_RESPONSE"

if echo "$MENU_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Menu Button настроен"
else
    echo "❌ Ошибка настройки Menu Button"
fi

echo ""

# 5. Проверка Menu Button
echo "5️⃣ Проверка Menu Button..."
MENU_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getChatMenuButton")
echo "Menu Button: $MENU_INFO"
echo ""

# 6. Тестовое сообщение в группу
echo "6️⃣ Отправка тестового сообщения в группу..."
TEST_MESSAGE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": '"${GROUP_CHAT_ID}"',
    "text": "🧪 Тестовое сообщение от Willow Coffee Bot\n\n✅ Бот успешно настроен и готов к работе!",
    "parse_mode": "HTML"
  }')

if echo "$TEST_MESSAGE" | grep -q '"ok":true'; then
    echo "✅ Тестовое сообщение отправлено в группу"
else
    echo "❌ Ошибка отправки в группу. Проверьте:"
    echo "   - Бот добавлен в группу?"
    echo "   - Бот является администратором?"
    echo "   - Правильный GROUP_CHAT_ID?"
    echo "Ответ: $TEST_MESSAGE"
fi

echo ""
echo "========================================="
echo "✅ Настройка завершена!"
echo ""
echo "📋 Ваши настройки:"
echo "   Bot: @$BOT_USERNAME"
echo "   Group ID: $GROUP_CHAT_ID"
echo "   Mini App URL: $MINIAPP_URL"
echo "   Webhook URL: $WEBHOOK_URL"
echo ""
echo "🧪 Тестирование:"
echo "   1. Откройте бота в Telegram: https://t.me/$BOT_USERNAME"
echo "   2. Отправьте /start"
echo "   3. Нажмите кнопку Menu (☰)"
echo "   4. Должно открыться Mini App"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Настройте Script Properties в Google Apps Script"
echo "   2. Разверните Web App в Google Apps Script"
echo "   3. Обновите WEBHOOK_URL в этом скрипте"
echo "   4. Запустите скрипт снова для обновления webhook"
echo ""
