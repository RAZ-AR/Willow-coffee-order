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
  ) => boolean | Promise<boolean>;
  errorMessage?: string | null;
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
  errorMessage,
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
    const success = await onPaid(when, table, payment);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-30 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            {lang === "ru" ? "Корзина" : lang === "sr" ? "Korpa" : "Cart"}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="px-4 pt-3" role="alert">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3 divide-y">
          {cartLines.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              {lang === "ru"
                ? "Пусто"
                : lang === "sr"
                  ? "Prazno"
                  : "Cart is empty"}
            </div>
          )}
          {cartLines.map(({ item, qty }) => (
            <CartItem
              key={item.id}
              item={item}
              qty={qty}
              lang={lang}
              onAdd={add}
              onRemove={remove}
            />
          ))}
        </div>

        {/* Order Form */}
        {cartLines.length > 0 && (
          <OrderForm
            lang={lang}
            total={total}
            onSubmit={handleOrderSubmit}
          />
        )}
      </div>
    </div>
  );
};