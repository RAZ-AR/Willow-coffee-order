# 🔗 Настройка Telegram Webhook

Webhook нужен чтобы Telegram отправлял уведомления о новых сообщениях на ваш backend.

---

## 📋 Что вам нужно

- BOT_TOKEN (от @BotFather)
- Backend URL (из Render.com)

**Пример:**
```
BOT_TOKEN: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
Backend URL: https://willow-backend-abc123.onrender.com
```

---

## ⚡ Способ 1: Автоматический (рекомендуется)

### Установить webhook

```bash
cd /path/to/willow-miniapp
bash scripts/set-webhook.sh
```

Скрипт запросит:
1. BOT_TOKEN
2. Backend URL

И автоматически всё настроит.

### Проверить webhook

```bash
bash scripts/check-webhook.sh
```

---

## 🖱️ Способ 2: Через curl вручную

### 2.1 Установить webhook

```bash
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-backend.onrender.com/webhook"}'
```

**Замените:**
- `<ВАШ_ТОКЕН>` → ваш BOT_TOKEN
- `your-backend` → ваше имя сервиса на Render

**Пример:**
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdef/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://willow-backend-abc123.onrender.com/webhook"}'
```

**Ожидаемый ответ:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 2.2 Проверить webhook

```bash
curl "https://api.telegram.org/bot<ВАШ_ТОКЕН>/getWebhookInfo"
```

**Пример:**
```bash
curl "https://api.telegram.org/bot123456789:ABCdef/getWebhookInfo"
```

**Ожидаемый ответ:**
```json
{
  "ok": true,
  "result": {
    "url": "https://willow-backend-abc123.onrender.com/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40,
    "ip_address": "3.123.45.67"
  }
}
```

---

## 🌐 Способ 3: Через браузер

### 3.1 Установить webhook

Откройте в браузере:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://your-backend.onrender.com/webhook
```

**Пример:**
```
https://api.telegram.org/bot123456789:ABCdef/setWebhook?url=https://willow-backend-abc123.onrender.com/webhook
```

Должно показать:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### 3.2 Проверить webhook

Откройте в браузере:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/getWebhookInfo
```

---

## 🧪 Способ 4: Через Postman

### Установить webhook

1. Откройте Postman
2. Создайте новый POST запрос
3. URL: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
   ```json
   {
     "url": "https://your-backend.onrender.com/webhook"
   }
   ```
6. Send

### Проверить webhook

1. GET запрос
2. URL: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getWebhookInfo`
3. Send

---

## ✅ Что проверять в ответе

### Успешная установка

```json
{
  "ok": true,
  "result": {
    "url": "https://willow-backend-abc123.onrender.com/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0  // ← Должно быть 0!
  }
}
```

**Хорошие признаки:**
- ✅ `"ok": true`
- ✅ `"url"` содержит ваш backend URL
- ✅ `"pending_update_count": 0` (нет необработанных сообщений)
- ✅ Нет поля `"last_error_date"`

### Проблемы

#### 1. Webhook не установлен
```json
{
  "ok": true,
  "result": {
    "url": "",  // ← Пусто!
    "pending_update_count": 0
  }
}
```

**Решение:** Запустите команду установки снова

#### 2. Есть необработанные сообщения
```json
{
  "ok": true,
  "result": {
    "url": "https://willow-backend-abc123.onrender.com/webhook",
    "pending_update_count": 5  // ← Не 0!
  }
}
```

**Причины:**
- Backend был недоступен
- Backend возвращал ошибки
- Webhook был установлен неправильно

**Решение:**
1. Проверьте логи backend на Render
2. Откройте `/health` endpoint
3. Отправьте `/start` боту снова

#### 3. Есть ошибки
```json
{
  "ok": true,
  "result": {
    "url": "https://willow-backend-abc123.onrender.com/webhook",
    "last_error_date": 1699000000,
    "last_error_message": "Wrong response from the webhook: 500 Internal Server Error"
  }
}
```

**Решение:**
1. Проверьте логи backend: `https://dashboard.render.com → Logs`
2. Проверьте env variables (особенно SUPABASE_SERVICE_KEY)
3. Откройте backend URL в браузере

---

## 🧪 Тестирование webhook

### Тест 1: Health check

Откройте в браузере:
```
https://your-backend.onrender.com/health
```

Должно вернуть:
```json
{
  "ok": true,
  "uptime": 123.45,
  "timestamp": "2025-01-XX..."
}
```

### Тест 2: Отправьте /start боту

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. Должно прийти приветственное сообщение

**Если не пришло:**
- Проверьте логи backend
- Проверьте `TELEGRAM_BOT_TOKEN` в env variables
- Проверьте webhook статус

### Тест 3: Проверьте логи

В Render Dashboard → вашего backend → Logs

Должны видеть:
```
📥 Webhook received: {...}
🎯 /start command from user: 128136200
✅ Message sent to 128136200
```

---

## 🔄 Переустановка webhook

Если нужно изменить URL или что-то пошло не так:

```bash
# Удалить webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Установить новый
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://new-backend.onrender.com/webhook"

# Проверить
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 🐛 Troubleshooting

### Проблема: "Webhook not found"

**Причина:** Backend недоступен или `/webhook` route не работает

**Решение:**
1. Проверьте что backend запущен
2. Откройте `https://your-backend.onrender.com/` (должно вернуть JSON)
3. Проверьте код в `backend/src/routes/webhook.js`

### Проблема: "Connection timeout"

**Причина:** Backend слишком долго отвечает (холодный старт Render)

**Решение:**
- Это нормально для FREE плана Render
- Webhook автоматически повторит запрос
- Первый `/start` может не сработать - отправьте ещё раз

### Проблема: "SSL error"

**Причина:** Render ещё не выпустил SSL сертификат

**Решение:**
- Подождите 5-10 минут после первого деплоя
- Render автоматически настроит HTTPS

### Проблема: pending_update_count растёт

**Причина:** Backend возвращает ошибки

**Решение:**
1. Посмотрите логи в Render
2. Найдите ошибку
3. Исправьте код
4. Redeploy
5. Отправьте `/start` снова

---

## 📊 Мониторинг webhook

### Регулярная проверка

Добавьте в cron (опционально):
```bash
# Проверять webhook каждый час
0 * * * * curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | grep -o '"pending_update_count":[0-9]*'
```

### Алерты

Если `pending_update_count > 10`:
- Проверьте backend
- Посмотрите логи
- Возможно backend упал

---

## 💡 Полезные команды

```bash
# Получить info о боте
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Получить последние обновления (для отладки)
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"

# Удалить webhook (для локальной разработки)
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Установить webhook с max_connections
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://backend.onrender.com/webhook" \
  -d "max_connections=40"
```

---

## ✅ Checklist

Webhook настроен правильно если:

- [ ] `getWebhookInfo` показывает ваш backend URL
- [ ] `pending_update_count` = 0
- [ ] Нет `last_error_date`
- [ ] `/start` работает
- [ ] Приходят приветственные сообщения
- [ ] В логах backend видны webhook запросы

---

## 📚 Официальная документация

- [Telegram Bot API - setWebhook](https://core.telegram.org/bots/api#setwebhook)
- [Telegram Bot API - getWebhookInfo](https://core.telegram.org/bots/api#getwebhookinfo)
- [Render Docs - Web Services](https://render.com/docs/web-services)

---

## 💬 Нужна помощь?

Если webhook не работает:
1. Проверьте все пункты в Troubleshooting
2. Посмотрите логи backend
3. Создайте Issue с деталями ошибки

**Удачи! 🚀**
