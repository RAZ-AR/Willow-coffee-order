# 🚀 Шпаргалка команд

Быстрый справочник по всем командам для работы с Willow Mini App.

---

## 📦 Установка и настройка

### Локальная разработка

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Заполните .env
npm start

# Frontend
npm install
cp .env.example .env
# Укажите VITE_API_URL=http://localhost:3000
npm run dev
```

---

## 🤖 Telegram Bot

### Создание бота

```
1. Откройте @BotFather в Telegram
2. /newbot
3. Введите имя: Willow Coffee
4. Введите username: willow_coffee_bot
5. Сохраните токен
```

### Настройка webhook

**Автоматически:**
```bash
bash scripts/set-webhook.sh
```

**Вручную:**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-backend.onrender.com/webhook"
```

**Проверка:**
```bash
bash scripts/check-webhook.sh
# или
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Установка Menu Button

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "☕ Заказать",
      "web_app": {
        "url": "https://your-frontend.onrender.com"
      }
    }
  }'
```

### Получить GROUP_CHAT_ID

```bash
# 1. Добавьте бота в группу
# 2. Отправьте сообщение в группу
# 3. Получите updates:
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"

# 4. Найдите "chat":{"id":-1234567890...}
```

### Удалить webhook (для разработки)

```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

---

## 🗄️ Supabase

### Применить SQL schema

```sql
-- В Supabase SQL Editor:
-- 1. Скопируйте содержимое supabase/schema.sql
-- 2. Вставьте в редактор
-- 3. Нажмите RUN
```

### Полезные SQL запросы

```sql
-- Посмотреть всех пользователей
SELECT * FROM users ORDER BY created_at DESC;

-- Посмотреть заказы
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Посмотреть звезды пользователя
SELECT card_number, SUM(delta) as total_stars
FROM stars_log
WHERE card_number = '1234'
GROUP BY card_number;

-- Топ клиентов по звездам
SELECT
  u.card_number,
  u.username,
  SUM(sl.delta) as total_stars
FROM users u
LEFT JOIN stars_log sl ON u.card_number = sl.card_number
GROUP BY u.card_number, u.username
ORDER BY total_stars DESC
LIMIT 10;

-- Статистика заказов за сегодня
SELECT
  COUNT(*) as total_orders,
  SUM(total) as total_revenue
FROM orders
WHERE DATE(created_at) = CURRENT_DATE;
```

---

## 🚀 Render.com

### Deploy backend

```bash
# Push на GitHub
git add .
git commit -m "Update backend"
git push origin main

# Render автоматически задеплоит
```

### Проверка логов

```
https://dashboard.render.com → willow-backend → Logs
```

### Environment Variables

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
TELEGRAM_BOT_TOKEN=123456789:ABC...
GROUP_CHAT_ID=-1234567890
CASHIER_GROUP_ID=-9876543210
NODE_ENV=production
```

---

## 🧪 Тестирование

### Health check

```bash
# Backend
curl https://your-backend.onrender.com/health

# Должно вернуть:
# {"ok":true,"uptime":123,"timestamp":"..."}
```

### API endpoints

```bash
# Регистрация
curl -X POST https://your-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"user":{"id":999999,"first_name":"Test"}}'

# Меню
curl https://your-backend.onrender.com/api/menu

# Звезды
curl -X POST https://your-backend.onrender.com/api/stars \
  -H "Content-Type: application/json" \
  -d '{"user":{"id":128136200}}'
```

### Локальное тестирование

```
http://localhost:5173?tgWebAppStartParam=test
```

---

## 📊 Мониторинг

### Webhook статус

```bash
watch -n 60 'curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | grep pending_update_count'
```

### Backend health

```bash
watch -n 30 'curl -s https://your-backend.onrender.com/health | grep ok'
```

### Database stats

```sql
-- В Supabase SQL Editor
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'stars_log', COUNT(*) FROM stars_log;
```

---

## 🐛 Troubleshooting

### Backend не отвечает

```bash
# 1. Проверьте статус
curl https://your-backend.onrender.com/health

# 2. Проверьте логи в Render Dashboard

# 3. Проверьте env variables
```

### Уведомления не приходят

```bash
# 1. Проверьте webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 2. Проверьте TELEGRAM_BOT_TOKEN в Render

# 3. Отправьте /start снова
```

### База данных пустая

```sql
-- 1. Проверьте что schema применилась
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 2. Проверьте меню
SELECT COUNT(*) FROM menu_items;

-- Должно быть 6 товаров
```

### Frontend ошибки

```bash
# 1. Проверьте VITE_API_URL
cat .env

# 2. Проверьте backend
curl https://your-backend.onrender.com/health

# 3. Проверьте browser console (F12)
```

---

## 🔧 Полезные команды

### Git

```bash
# Проверить статус
git status

# Commit и push
git add .
git commit -m "Your message"
git push origin main

# Просмотр логов
git log --oneline -10
```

### npm

```bash
# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Build для продакшена
npm run build

# Проверить версии
npm list --depth=0
```

### Render CLI (опционально)

```bash
# Установка
npm install -g @render-cli/render

# Login
render login

# Логи
render logs willow-backend

# Redeploy
render deploy willow-backend
```

---

## 📚 Быстрые ссылки

| Что | Где |
|-----|-----|
| Supabase Dashboard | https://app.supabase.com |
| Render Dashboard | https://dashboard.render.com |
| Backend Health | https://your-backend.onrender.com/health |
| Frontend | https://your-frontend.onrender.com |
| Telegram Bot | https://t.me/your_bot |
| Webhook Info | https://api.telegram.org/bot<TOKEN>/getWebhookInfo |
| Logs | Render Dashboard → Logs |

---

## 📖 Документация

- [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт (15 мин)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Полное руководство
- [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) - Настройка webhook
- [README_V2.md](./README_V2.md) - Обзор проекта
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Что изменилось

---

## 💡 Полезные трюки

### Быстрый тест всей системы

```bash
# 1. Backend health
curl https://your-backend.onrender.com/health

# 2. Webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 3. Отправить /start боту

# 4. Открыть Mini App

# 5. Сделать тестовый заказ
```

### Быстрый reset webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook" && \
sleep 2 && \
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-backend.onrender.com/webhook"
```

### Проверка всех env variables

```bash
# Backend
cd backend
grep -v '^#' .env | grep -v '^$'

# Frontend
cd ..
grep -v '^#' .env | grep -v '^$'
```

---

**Сохраните эту шпаргалку - она пригодится! 📋**
