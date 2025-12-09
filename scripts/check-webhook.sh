#!/bin/bash

# Скрипт для проверки статуса Telegram webhook

echo "🔍 Проверка статуса Telegram Webhook"
echo ""

# Запрашиваем BOT TOKEN
read -p "Введите BOT TOKEN (от @BotFather): " BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Ошибка: BOT_TOKEN обязателен!"
    exit 1
fi

echo ""
echo "📤 Запрашиваю информацию о webhook..."
echo ""

# Получаем информацию о webhook
response=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

echo "📥 Ответ от Telegram:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Анализируем ответ
url=$(echo "$response" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
pending=$(echo "$response" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)
last_error=$(echo "$response" | grep -o '"last_error_date":[0-9]*' | cut -d':' -f2)
last_error_msg=$(echo "$response" | grep -o '"last_error_message":"[^"]*"' | cut -d'"' -f4)

if [ -n "$url" ]; then
    echo "✅ Webhook URL: $url"
else
    echo "❌ Webhook не установлен!"
fi

if [ -n "$pending" ]; then
    if [ "$pending" -eq 0 ]; then
        echo "✅ Pending updates: 0 (всё хорошо)"
    else
        echo "⚠️  Pending updates: $pending (есть необработанные сообщения)"
    fi
fi

if [ -n "$last_error" ]; then
    echo "❌ Last error date: $last_error"
    if [ -n "$last_error_msg" ]; then
        echo "   Error message: $last_error_msg"
    fi
    echo ""
    echo "💡 Совет: проверьте логи backend на Render.com"
else
    echo "✅ Ошибок нет"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
