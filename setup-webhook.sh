#!/bin/bash

# Telegram Webhook Setup Script
# Usage: ./setup-webhook.sh

echo "=== Telegram Bot Webhook Setup ==="
echo ""

# Check if BOT_TOKEN is provided
if [ -z "$1" ]; then
    echo "Enter your Telegram Bot Token (from @BotFather):"
    read -r BOT_TOKEN
else
    BOT_TOKEN="$1"
fi

if [ -z "$BOT_TOKEN" ]; then
    echo "Error: Bot token is required!"
    exit 1
fi

# Check if BACKEND_URL is provided
if [ -z "$2" ]; then
    echo ""
    echo "Enter your backend URL (e.g., https://willow-backend.onrender.com):"
    read -r BACKEND_URL
else
    BACKEND_URL="$2"
fi

if [ -z "$BACKEND_URL" ]; then
    echo "Error: Backend URL is required!"
    exit 1
fi

WEBHOOK_URL="${BACKEND_URL}/webhook"

echo ""
echo "=== Step 1: Check Bot Info ==="
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
echo "$BOT_INFO" | python3 -m json.tool 2>/dev/null || echo "$BOT_INFO"

# Check if bot token is valid
if echo "$BOT_INFO" | grep -q '"ok":false'; then
    echo ""
    echo "Error: Invalid bot token!"
    exit 1
fi

BOT_USERNAME=$(echo "$BOT_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['username'])" 2>/dev/null)
echo ""
echo "Bot username: @${BOT_USERNAME}"

echo ""
echo "=== Step 2: Check Current Webhook ==="
CURRENT_WEBHOOK=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$CURRENT_WEBHOOK" | python3 -m json.tool 2>/dev/null || echo "$CURRENT_WEBHOOK"

echo ""
echo "=== Step 3: Set New Webhook ==="
echo "Setting webhook to: ${WEBHOOK_URL}"
SET_RESULT=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")
echo "$SET_RESULT" | python3 -m json.tool 2>/dev/null || echo "$SET_RESULT"

if echo "$SET_RESULT" | grep -q '"ok":true'; then
    echo ""
    echo "=== Webhook set successfully! ==="
else
    echo ""
    echo "Error: Failed to set webhook!"
    exit 1
fi

echo ""
echo "=== Step 4: Verify Webhook ==="
VERIFY_WEBHOOK=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$VERIFY_WEBHOOK" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_WEBHOOK"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Make sure these env variables are set on your server:"
echo "   - TELEGRAM_BOT_TOKEN=${BOT_TOKEN}"
echo "   - GROUP_CHAT_ID=<your_group_chat_id>"
echo ""
echo "2. To get GROUP_CHAT_ID:"
echo "   - Add the bot to your staff group"
echo "   - Send a message in the group"
echo "   - Visit: https://api.telegram.org/bot${BOT_TOKEN}/getUpdates"
echo "   - Find 'chat':{'id': -XXXXXXXXXX} - this is your GROUP_CHAT_ID"
echo ""
echo "3. Test the bot by sending /start to @${BOT_USERNAME}"
echo ""
