export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface RegisterResponse {
  ok: boolean;
  card: string;
  stars: number;
  user_id?: number;
}

export interface StarsResponse {
  ok: boolean;
  card: string;
  stars: number;
}

export interface OrderResponse {
  ok: boolean;
  order_id: string;
  card: string;
  stars: number;
  stars_earned: number;
}

export interface OrderRequest {
  action: "order";
  initData: string | null;
  user: TelegramUser | null;
  card: string | null;
  total: number;
  when: "now" | "10" | "20";
  table: number | null;
  payment: "cash" | "card" | "stars";
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  title: string;
  qty: number;
  unit_price: number;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  last_name?: string;
  language_code?: string;
}