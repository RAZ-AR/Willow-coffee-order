# ⚡ Быстрый старт за 15 минут

Этот гайд поможет запустить Willow Mini App на продакшене за 15 минут.

---

## ✅ Что вам нужно

- [ ] Аккаунт GitHub
- [ ] Telegram Bot (создайте через @BotFather)
- [ ] 15 минут времени

Всё бесплатно! 💰

---

## 📝 Шаг 1: Supabase (3 минуты)

### 1.1 Создайте проект

1. Откройте [supabase.com](https://supabase.com)
2. Sign up / Log in
3. **New Project**
4. Заполните:
   - Name: `willow`
   - Password: (придумайте и сохраните!)
   - Region: `Europe (Frankfurt)`
5. **Create project** (подождите 2 мин)

### 1.2 Примените SQL схему

1. Меню слева → **SQL Editor**
2. **New Query**
3. Откройте файл `supabase/schema.sql` в вашем проекте
4. Скопируйте ВСЁ содержимое
5. Вставьте в SQL Editor
6. **RUN** ▶️

### 1.3 Сохраните credentials

1. Меню слева → **Settings** → **API**
2. Скопируйте и сохраните:
   ```
   Project URL: https://xxxxx.supabase.co
   service_role key: eyJhbG...очень-длинный-ключ
   ```

✅ **Supabase готов!**

---

## 🤖 Шаг 2: Telegram Bot (2 минуты)

### 2.1 Создайте бота

В Telegram найдите **@BotFather** и отправьте:

```
/newbot
Willow Coffee
willow_coffee_bot
```

**Сохраните токен:** `123456789:ABCdef...`

### 2.2 Создайте группу для уведомлений

1. Создайте группу в Telegram
2. Добавьте туда бота
3. Отправьте сообщение: `test`
4. Откройте в браузере:
   ```
   https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
   ```
5. Найдите `"chat":{"id":-1234567890`
6. Скопируйте ID **с минусом**

✅ **Telegram готов!**

---

## 🚀 Шаг 3: Deploy Backend (5 минут)

### 3.1 Push на GitHub

```bash
cd /path/to/willow-miniapp
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3.2 Deploy на Render

1. Откройте [render.com](https://render.com)
2. Sign up / Log in (можно через GitHub)
3. **New +** → **Web Service**
4. Подключите GitHub репозиторий
5. Заполните:
   ```
   Name: willow-backend
   Region: Frankfurt (EU Central)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
6. **Environment Variables** (нажмите Add):
   ```
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY = eyJhbG...
   TELEGRAM_BOT_TOKEN = 123456789:ABC...
   GROUP_CHAT_ID = -1234567890
   NODE_ENV = production
   ```
7. **Create Web Service**
8. Подождите 3 минуты
9. Скопируйте URL: `https://willow-backend-xxx.onrender.com`

### 3.3 Настройте Webhook

```bash
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook" \
  -d "url=https://willow-backend-xxx.onrender.com/webhook"
```

Должен вернуться: `{"ok":true}`

✅ **Backend работает!**

---

## 🎨 Шаг 4: Deploy Frontend (3 минуты)

### Вариант A: Render Static Site

1. В Render → **New +** → **Static Site**
2. Выберите тот же репозиторий
3. Заполните:
   ```
   Name: willow-frontend
   Branch: main
   Build Command: npm run build
   Publish Directory: dist
   ```
4. **Environment Variables**:
   ```
   VITE_API_URL = https://willow-backend-xxx.onrender.com
   ```
5. **Create Static Site**
6. Скопируйте URL: `https://willow-frontend-xxx.onrender.com`

### Вариант B: Vercel (быстрее)

```bash
npm install -g vercel
vercel
# Follow the prompts
# Add env var: VITE_API_URL=https://willow-backend-xxx.onrender.com
```

✅ **Frontend работает!**

---

## 📱 Шаг 5: Настройте Mini App (2 минуты)

### 5.1 Установите кнопку меню

```bash
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "☕ Заказать",
      "web_app": {
        "url": "https://willow-frontend-xxx.onrender.com"
      }
    }
  }'
```

### 5.2 Протестируйте

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. Должно прийти: "Hi! Добро пожаловать... Карта: #1234 ⭐ 0"
4. Нажмите кнопку **☕ Заказать** внизу
5. Откроется Mini App с меню!

✅ **Готово!**

---

## 🎉 Всё работает!

Теперь:
- ✅ Пользователи могут делать заказы
- ✅ Вы получаете уведомления в Telegram
- ✅ Система лояльности работает
- ✅ Всё бесплатно!

---

## 🐛 Что-то не работает?

### Backend не стартует
- Проверьте Root Directory = `backend`
- Проверьте логи в Render Dashboard

### Уведомления не приходят
- Проверьте `TELEGRAM_BOT_TOKEN`
- Проверьте webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Frontend показывает ошибку
- Проверьте `VITE_API_URL`
- Откройте `https://willow-backend-xxx.onrender.com/health` - должно вернуть `{"ok":true}`

### Меню пустое
- Проверьте что SQL schema применилась в Supabase
- Проверьте Table Editor → menu_items (должно быть 6 товаров)

---

## 📚 Полная документация

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Подробное руководство
- [README_V2.md](./README_V2.md) - Обзор проекта

---

## 💬 Нужна помощь?

Создайте [Issue](https://github.com/your-username/willow-miniapp/issues) или напишите в Telegram!

**Приятного использования! ☕**
