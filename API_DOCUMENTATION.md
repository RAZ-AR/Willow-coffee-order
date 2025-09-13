# 📡 Willow Mini-App API Documentation

## 🏗️ Backend Architecture

**Google Apps Script URL:** 
```
https://script.google.com/macros/s/AKfycbw3ddpbwyCVq9F3FT18txbfivB-_5GqDZMobkOyhdQ_-bNEA93whjeCM7EphlYpjVID/exec
```

**Main File:** `gas-main.js` (32,825 bytes)
- ✅ Production-ready
- ✅ 4-digit loyalty cards (1000-9999)
- ✅ Telegram WebApp integration
- ✅ Stars management system

---

## 🔌 API Endpoints

### 1. **User Registration**
```http
POST /exec
Content-Type: text/plain

{
  "action": "register",
  "initData": "query_id=...",  // Telegram WebApp initData
  "user": {                    // Telegram user object
    "id": 128136200,
    "first_name": "Armen",
    "username": "a_razmikovich"
  },
  "ts": 1726217826123
}
```

**Response:**
```json
{
  "ok": true,
  "card": "8972",
  "stars": 0,
  "user_id": 128136200
}
```

### 2. **Get Stars Balance**
```http
POST /exec
Content-Type: text/plain

{
  "action": "stars", 
  "initData": "query_id=...",
  "user": { "id": 128136200, ... }
}
```

**Response:**
```json
{
  "ok": true,
  "card": "8972", 
  "stars": 5
}
```

### 3. **Submit Order**
```http
POST /exec
Content-Type: text/plain

{
  "action": "order",
  "initData": "query_id=...",
  "user": { "id": 128136200, ... },
  "card": "8972",
  "total": 400,
  "when": "now",           // "now" | "10" | "20"
  "table": 3,              // table number (if when="now")  
  "payment": "cash",       // "cash" | "card" | "stars"
  "items": [
    {
      "id": "espresso_s",
      "title": "Espresso S", 
      "qty": 2,
      "unit_price": 150
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "stars": 5              // Updated stars balance
}
```

---

## 🗄️ Database Schema (Google Sheets)

### Sheet: `Cards`
| Column | Type | Description |
|--------|------|-------------|
| telegram_id | Number | Telegram user ID |
| card_number | String | 4-digit loyalty card |
| username | String | Telegram username |
| first_name | String | First name |
| created_at | Date | Registration date |

### Sheet: `Users`  
| Column | Type | Description |
|--------|------|-------------|
| telegram_id | Number | Telegram user ID |
| username | String | Telegram username |
| card_number | String | 4-digit loyalty card |
| stars | Number | Current stars balance |
| created_at | Date | Registration date |

### Sheet: `Orders`
| Column | Type | Description |
|--------|------|-------------|
| telegram_id | Number | Customer Telegram ID |
| card_number | String | Customer loyalty card |
| total | Number | Order total (RSD) |
| when_ready | String | "now", "10min", "20min" |
| table_number | Number | Table number (if dine-in) |
| payment_method | String | "cash", "card", "stars" |
| items | String | JSON array of ordered items |
| created_at | Date | Order timestamp |

### Sheet: `StarsLog`
| Column | Type | Description |
|--------|------|-------------|
| card_number | String | 4-digit loyalty card |
| delta | Number | Stars change (+/-) |
| reason | String | "manual", "cashier", etc. |
| operator_id | Number | Who made the change |
| created_at | Date | Change timestamp |

---

## 📱 Telegram Integration  

### Bot Commands
- `/start` → Register user, send loyalty card number

### Cashier Commands (in CASHIER_GROUP)
```
8972 +3    // Add 3 stars to card 8972
8972 -1    // Remove 1 star from card 8972
```

### Notifications
- **Kitchen Group:** New order details
- **Customer:** Order confirmation + loyalty card info

---

## ⚙️ Environment Variables

Set in Google Apps Script → Script Properties:

```
TELEGRAM_TOKEN = your_bot_token_from_botfather
GROUP_CHAT_ID = -1001234567890        // Kitchen notifications
CASHIER_GROUP_ID = -1001234567891     // Stars management  
SPREADSHEET_ID = your_google_sheets_id
```

---

## 🔧 Error Handling

**Common Error Response:**
```json
{
  "ok": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

**Error Codes:**
- `MISSING_DATA` - Required fields missing
- `INVALID_USER` - Cannot parse Telegram user data
- `CARD_ERROR` - Issue with loyalty card generation
- `SHEETS_ERROR` - Database operation failed

---

## 📊 Status & Health

The system is **production-ready** with these features:
- ✅ Reliable 4-digit card generation
- ✅ Telegram WebApp compatibility  
- ✅ Error handling & logging
- ✅ Stars management system
- ✅ Order processing & notifications

**Last Updated:** September 13, 2025
**Version:** Final (consolidated from 9+ iterations)