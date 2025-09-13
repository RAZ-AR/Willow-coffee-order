import React from 'react';
import { titleByLang, currency } from '../../utils';
import type { MenuItem, Lang } from '../../types';

interface CartItemProps {
  item: MenuItem;
  qty: number;
  lang: Lang;
  onAdd: (id: string, n?: number) => void;
  onRemove: (id: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  qty,
  lang,
  onAdd,
  onRemove,
}) => {
  return (
    <div className="py-3 flex gap-3 items-center">
      <img
        src={item.image || ""}
        alt={titleByLang(item, lang)}
        className="w-16 h-16 rounded-xl object-cover bg-gray-100"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {titleByLang(item, lang)}
        </div>
        <div className="text-xs text-gray-500">
          {currency(item.price)}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => onAdd(item.id, -1)}
            className="w-7 h-7 rounded-full border"
            aria-label="Decrease"
          >
            −
          </button>
          <span className="min-w-6 text-center text-sm">{qty}</span>
          <button
            onClick={() => onAdd(item.id, 1)}
            className="w-7 h-7 rounded-full border"
            aria-label="Increase"
          >
            +
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="ml-3 text-xs text-gray-500 underline"
          >
            {lang === "ru"
              ? "Удалить"
              : lang === "sr"
                ? "Obriši"
                : "Remove"}
          </button>
        </div>
      </div>
      <div className="text-sm font-semibold">
        {currency(item.price * qty)}
      </div>
    </div>
  );
};