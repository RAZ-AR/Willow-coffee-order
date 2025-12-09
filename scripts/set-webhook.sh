#!/bin/bash

# Скрипт для настройки Telegram webhook

echo "🤖 Настройка Telegram Webhook"
echo ""

# Запрашиваем данные
read -p "Введите BOT TOKEN (от @BotFather): " BOT_TOKEN
read -p "Введите URL вашего backend (например: https://willow-backend.onrender.com): " BACKEND_URL

# Проверяем что URL не пустой
if [ -z "$BOT_TOKEN" ] || [ -z "$BACKEND_URL" ]; then
    echo "❌ Ошибка: BOT_TOKEN и BACKEND_URL обязательны!"
    exit 1
fi

# Формируем полный URL webhook
WEBHOOK_URL="${BACKEND_URL}/webhook"

echo ""
echo "📤 Отправляю запрос к Telegram API..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Отправляем запрос
response=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}")

echo "📥 Ответ от Telegram:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

# Проверяем результат
if echo "$response" | grep -q '"ok":true'; then
    echo ""
    echo "✅ Webhook успешно установлен!"
    echo ""
    echo "Теперь проверьте статус:"
    echo "bash scripts/check-webhook.sh"
else
    echo ""
    echo "❌ Ошибка при установке webhook"
    echo "Проверьте BOT_TOKEN и BACKEND_URL"
fi
