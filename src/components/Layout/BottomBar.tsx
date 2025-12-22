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
  const starsToEarn = total > 0 ? Math.ceil(total / 350) : 0;

  return (
    <div className="fixed bottom-0 inset-x-0 pb-4 px-4 pointer-events-none">
      <div className="max-w-md mx-auto glass-panel rounded-3xl px-5 py-4 flex flex-col gap-2 shadow-2xl pointer-events-auto animate-slideUp">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-white/80 font-medium">Итого</span>
            {total > 0 && (
              <div className="text-[11px] text-white/70 flex items-center gap-1">
                <span>⭐</span>
                <span>+{starsToEarn} звёзд за заказ</span>
              </div>
            )}
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-accent to-teal-400 bg-clip-text text-transparent">
            {currency(total)}
          </span>
        </div>

        <button
          onClick={onOpenCart}
          className={`w-full rounded-2xl py-3.5 font-bold text-sm transition-all duration-200 ${
            hasItems
              ? "bg-gradient-to-r from-accent to-teal-400 text-black shadow-lg shadow-accent/50 hover:shadow-xl hover:shadow-accent/60 hover:-translate-y-0.5 active:scale-[0.98]"
              : "bg-white/10 text-white/70 border-2 border-white/20 hover:border-white/30 hover:bg-white/15 active:scale-[0.97]"
          }`}
        >
          {hasItems ? (
            <span className="flex items-center justify-center gap-2">
              <span>🛒</span>
              <span>Оформить заказ • {cartCount}</span>
            </span>
          ) : (
            <span>Открыть корзину</span>
          )}
        </button>
      </div>
    </div>
  );
};