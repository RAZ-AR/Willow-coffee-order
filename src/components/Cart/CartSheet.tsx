import React from 'react';
import { CartItem } from './CartItem';
import { OrderForm } from './OrderForm';
import type { MenuItem, Lang } from '../../types';

interface CartSheetProps {
  items: MenuItem[];
  cart: Record<string, number>;
  lang: Lang;
  total: number;
  add: (id: string, n?: number) => void;
  remove: (id: string) => void;
  onClose: () => void;
  onPaid: (
    when: "now" | "10" | "20",
    table: number | null,
    payment: "cash" | "card" | "stars",
  ) => void | Promise<void>;
}

export const CartSheet: React.FC<CartSheetProps> = ({
  items,
  cart,
  lang,
  total,
  add,
  remove,
  onClose,
  onPaid,
}) => {
  const cartLines = Object.entries(cart)
    .filter(([_, qty]) => (qty || 0) > 0)
    .map(([id, qty]) => ({ item: items.find((i) => i.id === id), qty }))
    .filter((x): x is { item: MenuItem; qty: number } => Boolean(x.item));

  const handleOrderSubmit = async (
    when: "now" | "10" | "20",
    table: number | null,
    payment: "cash" | "card" | "stars"
  ) => {
    await onPaid(when, table, payment);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-end sm:items-center sm:justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="font-bold text-lg text-gray-800">
            {lang === "ru" ? "🛒 Корзина" : lang === "sr" ? "🛒 Korpa" : "🛒 Cart"}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700 active:scale-95 transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 divide-y divide-gray-100">
          {cartLines.length === 0 && (
            <div className="py-16 text-center animate-scaleIn">
              <div className="text-6xl mb-4 opacity-20">🛒</div>
              <div className="text-gray-400 font-medium mb-1">
                {lang === "ru"
                  ? "Корзина пуста"
                  : lang === "sr"
                    ? "Korpa je prazna"
                    : "Cart is empty"}
              </div>
              <div className="text-sm text-gray-400">
                {lang === "ru"
                  ? "Добавьте товары из меню"
                  : lang === "sr"
                    ? "Dodajte proizvode iz menija"
                    : "Add items from the menu"}
              </div>
            </div>
          )}
          {cartLines.map(({ item, qty }, index) => (
            <div key={item.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
              <CartItem
                item={item}
                qty={qty}
                lang={lang}
                onAdd={add}
                onRemove={remove}
              />
            </div>
          ))}
        </div>

        {/* Order Form */}
        {cartLines.length > 0 && (
          <div className="border-t border-gray-100">
            <OrderForm
              lang={lang}
              total={total}
              onSubmit={handleOrderSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
};