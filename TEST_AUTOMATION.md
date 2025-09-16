# 🤖 Автоматизированное тестирование Willow Coffee

## 📁 Структура тестов

```
src/
├── test/
│   ├── setup.ts                 # Настройка тестовой среды
│   ├── integration/
│   │   └── order-flow.test.ts   # Интеграционные тесты
│   └── e2e/
│       └── order-flow.spec.ts   # End-to-End тесты
├── hooks/
│   ├── useTelegramAuth.test.ts  # Тесты аутентификации
│   ├── useLoyalty.test.ts       # Тесты лояльности
│   └── useApi.test.ts           # Тесты API
```

## 🛠️ Установленные инструменты

### Vitest (Unit & Integration тесты)
- **@testing-library/react** - тестирование React компонентов
- **@testing-library/jest-dom** - дополнительные матчеры
- **@testing-library/user-event** - симуляция действий пользователя
- **jsdom** - DOM окружение для тестов

### Playwright (E2E тесты)
- **@playwright/test** - браузерные тесты
- **playwright** - браузерные движки

## 🚀 Команды для запуска

```bash
# Unit и интеграционные тесты
npm run test              # Запуск в watch режиме
npm run test:run          # Разовый запуск
npm run test:ui           # Интерфейс Vitest
npm run test:coverage     # С покрытием кода

# E2E тесты
npm run test:e2e          # Браузерные тесты
npm run test:e2e:ui       # Интерфейс Playwright
npm run test:e2e:report   # Отчет о результатах

# Все тесты
npm run test:all          # Unit + E2E
```

## 📋 Покрытие тестами

### ✅ Unit тесты

#### useTelegramAuth.test.ts
- [x] Возврат тестового ID "0000" без Telegram данных
- [x] Получение реального ID из Telegram WebApp
- [x] Извлечение ID из URL параметров
- [x] Определение Telegram окружения
- [x] Обработка debug/force режимов
- [x] Создание валидного tg объекта
- [x] Проверка отсутствия хардкода 128136200
- [x] Версионирование кода

#### useLoyalty.test.ts
- [x] Тестовый режим с фиксированными значениями
- [x] Проверка существующей карты без авто-регистрации
- [x] Обработка отсутствующей карты
- [x] Обработка ошибок API
- [x] Управление localStorage
- [x] Очистка кеша при смене пользователя
- [x] Восстановление данных для того же пользователя
- [x] Функция сброса reset=1
- [x] Опрос обновлений каждые 15 секунд
- [x] Обновление данных карты и звезд
- [x] Функция updateStars

#### useApi.test.ts
- [x] Тестовый режим с мок-данными
- [x] Реальные API вызовы
- [x] Регистрация с корректными пользовательскими данными
- [x] Получение звезд
- [x] Отправка заказов с правильными данными
- [x] Обработка сетевых ошибок
- [x] Обработка HTTP ошибок
- [x] Обработка некорректного JSON
- [x] Создание объекта пользователя
- [x] Использование tgWebAppData

### ✅ Интеграционные тесты

#### order-flow.test.ts
- [x] Полный флоу заказа в тестовом режиме
- [x] Полный флоу заказа для реального пользователя
- [x] Переключение между пользователями
- [x] Обработка ошибок API
- [x] Расчет и начисление звезд

### ✅ E2E тесты

#### order-flow.spec.ts
- [x] Отображение тестовой карты в заголовке
- [x] Полный флоу заказа в браузере
- [x] Обработка пустой корзины
- [x] Корректный расчет общей суммы
- [x] Отображение начисленных звезд
- [x] Различные способы оплаты
- [x] Различное время выполнения заказа
- [x] Валидация обязательных полей
- [x] Сохранение корзины при навигации
- [x] Сброс localStorage

## 🎯 Критические проверки

### Антирегрессия
- ❌ **Хардкод ID 128136200** - проверяется в useTelegramAuth.test.ts
- ✅ **Автоматическая регистрация** - отключена в useLoyalty.test.ts
- ✅ **Тестовый режим ID 0000** - работает в всех тестах
- ✅ **Изоляция пользователей** - проверяется в интеграционных тестах

### Флоу системы
- ✅ **Регистрация только через /start** - не происходит авто-регистрации
- ✅ **Автоматические звезды** - начисляются за заказы
- ✅ **Уведомления с звездами** - тестируется API response
- ✅ **Тестовый режим** - изолирован от реальных данных

## 🔧 Настройка тестовой среды

### vitest.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

### playwright.config.ts
```typescript
export default defineConfig({
  testDir: './src/test/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173'
  }
})
```

### src/test/setup.ts
- Мокирование Telegram WebApp API
- Мокирование localStorage
- Настройка window.location
- Сброс моков перед каждым тестом

## 🚨 Добавление новых тестов

### Для нового хука:
```typescript
// src/hooks/newHook.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { newHook } from './newHook'

describe('newHook', () => {
  it('should do something', () => {
    const { result } = renderHook(() => newHook())
    expect(result.current).toBeDefined()
  })
})
```

### Для нового компонента:
```typescript
// src/components/NewComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewComponent } from './NewComponent'

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Для нового E2E сценария:
```typescript
// src/test/e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test'

test('should test new feature', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-testid="feature"]')).toBeVisible()
})
```

## 📊 Отчеты

### Vitest Coverage
```bash
npm run test:coverage
# Генерирует coverage/ папку с HTML отчетом
```

### Playwright Report
```bash
npm run test:e2e:report
# Открывает HTML отчет в браузере
```

## ⚡ CI/CD интеграция

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

## 🎭 Мокирование для тестов

### Telegram WebApp
```typescript
window.Telegram = {
  WebApp: {
    initDataUnsafe: { user: { id: 123456 } }
  }
}
```

### API ответы
```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ card: '1234', stars: 5 })
})
```

### localStorage
```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
```

## 📈 Метрики качества

### Покрытие кода: Цель >80%
- Хуки: 95%+
- Компоненты: 85%+
- Утилиты: 90%+

### E2E покрытие: Все основные флоу
- ✅ Регистрация пользователя
- ✅ Создание заказа
- ✅ Начисление звезд
- ✅ Переключение пользователей
- ✅ Обработка ошибок

Автоматизированное тестирование обеспечивает надежность системы и предотвращает регрессии!