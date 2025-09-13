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
  return (
    <div className="fixed bottom-0 inset-x-0 border-t bg-white p-3">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <div className="text-sm text-gray-600 flex-1">
          Total: <span className="font-semibold">{currency(total)}</span>
        </div>
        <button
          onClick={onOpenCart}
          className="flex-1 bg-black text-white rounded-xl py-3 font-medium"
        >
          {cartCount ? `Cart • ${cartCount}` : "Cart"}
        </button>
      </div>
    </div>
  );
};