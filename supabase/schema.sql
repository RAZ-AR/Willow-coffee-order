-- Willow Mini App - Supabase Database Schema
-- Создано для замены Google Sheets

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Таблица пользователей
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  card_number TEXT UNIQUE NOT NULL,
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_card_number ON users(card_number);

-- ============================================
-- Таблица меню
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  title_sr TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_sr TEXT,
  available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_available ON menu_items(available);

-- ============================================
-- Таблица заказов
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  telegram_id BIGINT NOT NULL,
  card_number TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  when_time TEXT NOT NULL,
  table_number TEXT,
  payment_method TEXT NOT NULL,
  items JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_telegram_id ON orders(telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_card_number ON orders(card_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- Таблица истории звезд
-- ============================================
CREATE TABLE IF NOT EXISTS stars_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stars_log_card_number ON stars_log(card_number);
CREATE INDEX IF NOT EXISTS idx_stars_log_created_at ON stars_log(created_at DESC);

-- ============================================
-- Функция для подсчета звезд карты
-- ============================================
CREATE OR REPLACE FUNCTION get_card_stars(card TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(delta), 0)::INTEGER
  FROM stars_log
  WHERE card_number = card;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Функция для автообновления updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автообновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) - для безопасности
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars_log ENABLE ROW LEVEL SECURITY;

-- Политики доступа (пока разрешаем все для service_role)
-- В продакшене можно настроить более детальные политики

-- Меню доступно всем для чтения
CREATE POLICY "Menu items are viewable by everyone" ON menu_items
  FOR SELECT USING (true);

-- Для остальных таблиц - только через service_role ключ
CREATE POLICY "Enable all for service role" ON users
  FOR ALL USING (true);

CREATE POLICY "Enable all for service role" ON orders
  FOR ALL USING (true);

CREATE POLICY "Enable all for service role" ON stars_log
  FOR ALL USING (true);

-- ============================================
-- Начальные данные для меню (примеры)
-- ============================================
INSERT INTO menu_items (title_en, title_ru, title_sr, category, price, image_url, description_en, description_ru, description_sr) VALUES
  ('Espresso', 'Эспрессо', 'Espreso', 'coffee', 150.00, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400', 'Classic Italian espresso', 'Классический итальянский эспрессо', 'Klasični italijanski espreso'),
  ('Cappuccino', 'Капучино', 'Kapućino', 'coffee', 200.00, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', 'Espresso with steamed milk and foam', 'Эспрессо с молоком и пенкой', 'Espreso sa mlekom i penom'),
  ('Latte', 'Латте', 'Latte', 'coffee', 220.00, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400', 'Smooth coffee with milk', 'Мягкий кофе с молоком', 'Mekana kafa sa mlekom'),
  ('Americano', 'Американо', 'Amerikano', 'coffee', 180.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', 'Espresso with hot water', 'Эспрессо с горячей водой', 'Espreso sa vrućom vodom'),
  ('Croissant', 'Круассан', 'Kroasan', 'food', 120.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', 'Fresh butter croissant', 'Свежий круассан с маслом', 'Svež kroasan sa puterom'),
  ('Chocolate Cake', 'Шоколадный торт', 'Čokoladna torta', 'food', 250.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 'Rich chocolate cake slice', 'Кусочек насыщенного шоколадного торта', 'Parče bogate čokoladne torte')
ON CONFLICT DO NOTHING;

-- ============================================
-- Полезные представления (Views)
-- ============================================

-- Представление для получения заказов с подсчетом звезд
CREATE OR REPLACE VIEW orders_with_stars AS
SELECT
  o.*,
  u.username,
  u.first_name,
  get_card_stars(o.card_number) as current_stars
FROM orders o
LEFT JOIN users u ON o.telegram_id = u.telegram_id
ORDER BY o.created_at DESC;

-- Представление для статистики по картам
CREATE OR REPLACE VIEW cards_stats AS
SELECT
  u.card_number,
  u.telegram_id,
  u.username,
  u.first_name,
  get_card_stars(u.card_number) as total_stars,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_spent,
  MAX(o.created_at) as last_order_at,
  u.created_at as registered_at
FROM users u
LEFT JOIN orders o ON u.telegram_id = o.telegram_id
GROUP BY u.card_number, u.telegram_id, u.username, u.first_name, u.created_at
ORDER BY total_spent DESC;

COMMENT ON TABLE users IS 'Пользователи Telegram Mini App с картами лояльности';
COMMENT ON TABLE menu_items IS 'Меню кофейни с многоязычной поддержкой';
COMMENT ON TABLE orders IS 'История заказов клиентов';
COMMENT ON TABLE stars_log IS 'История начисления и списания звезд лояльности';
COMMENT ON FUNCTION get_card_stars IS 'Функция для быстрого подсчета текущего баланса звезд по номеру карты';
