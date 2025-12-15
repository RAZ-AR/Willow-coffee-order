import React from 'react';
import { currency } from '../../utils';

interface BottomBarProps {
  total: number;
  cartCount: number;
  onOpenCart: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  total,
  cartCount,
  onOpenCart,
}) => {
  const hasItems = cartCount > 0;
  return (
    <div className="fixed bottom-0 inset-x-0 pb-4 px-4">
      <div className="max-w-md mx-auto glass-panel rounded-3xl px-3 py-2 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs text-white/80">
          <span>Итого</span>
          <span className="font-semibold text-sm">{currency(total)}</span>
        </div>
        <div className="text-[11px] text-white/60">
          ≈ {(total > 0 ? Math.ceil(total / 350) : 0)} звёзд за этот заказ
        </div>
        <button
          onClick={onOpenCart}
          className={`mt-1 w-full rounded-2xl py-2.5 font-semibold text-sm active:scale-[0.97] transition-transform ${
            hasItems
              ? "bg-accent text-black shadow-lg shadow-accent/40"
              : "bg-white/10 text-white/70 border border-white/20"
          }`}
        >
          {hasItems ? `Оформить заказ • ${cartCount}` : "Открыть корзину"}
        </button>
      </div>
    </div>
  );
};