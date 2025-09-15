import React, { useEffect } from 'react';
import type { Lang } from '../../types';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  lang: Lang;
  onClose: () => void;
  starsEarned?: number;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  lang,
  onClose,
  starsEarned
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (lang) {
      case 'ru': return 'Спасибо за заказ!';
      case 'sr': return 'Hvala na porudžbini!';
      default: return 'Thank you for your order!';
    }
  };

  const getMessage = () => {
    switch (lang) {
      case 'ru': return 'Ваш заказ принят и готовится';
      case 'sr': return 'Vaša porudžbina je primljena i priprema se';
      default: return 'Your order has been received and is being prepared';
    }
  };

  const getStarsMessage = () => {
    if (!starsEarned || starsEarned === 0) return '';
    switch (lang) {
      case 'ru': return `Вы получили ${starsEarned} звезд${starsEarned > 1 ? 'ы' : 'у'}!`;
      case 'sr': return `Dobili ste ${starsEarned} zvezd${starsEarned > 1 ? 'e' : 'u'}!`;
      default: return `You earned ${starsEarned} star${starsEarned > 1 ? 's' : ''}!`;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✅</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {getTitle()}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-4">
          {getMessage()}
        </p>

        {/* Stars Earned */}
        {starsEarned && starsEarned > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="font-medium text-yellow-700">
                {getStarsMessage()}
              </span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          {lang === 'ru' ? 'Отлично' : lang === 'sr' ? 'Odlično' : 'Great'}
        </button>
      </div>
    </div>
  );
};