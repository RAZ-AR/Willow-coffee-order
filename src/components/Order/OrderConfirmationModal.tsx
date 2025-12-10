import React from 'react';
import type { Lang } from '../../types';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  lang: Lang;
  starsEarned: number;
  orderNumber: string;
  onClose: () => void;
}

const texts = {
  en: {
    title: 'Order Placed!',
    subtitle: 'Thank you for your order',
    orderNumber: 'Order number',
    earned: 'You earned',
    stars: 'stars',
    message: 'We will notify you when your order is ready',
    close: 'Close'
  },
  ru: {
    title: 'Заказ оформлен!',
    subtitle: 'Спасибо за ваш заказ',
    orderNumber: 'Номер заказа',
    earned: 'Вы получили',
    stars: 'звёзд',
    message: 'Мы уведомим вас, когда заказ будет готов',
    close: 'Закрыть'
  },
  sr: {
    title: 'Porudžbina primljena!',
    subtitle: 'Hvala na porudžbini',
    orderNumber: 'Broj porudžbine',
    earned: 'Osvojili ste',
    stars: 'zvezda',
    message: 'Obavestićemo vas kada bude gotovo',
    close: 'Zatvori'
  }
};

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  lang,
  starsEarned,
  orderNumber,
  onClose
}) => {
  if (!isOpen) return null;

  const t = texts[lang] || texts.en;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {t.title}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-6">
          {t.subtitle}
        </p>

        {/* Order Number */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="text-sm text-gray-600 mb-1">{t.orderNumber}</div>
          <div className="text-lg font-bold font-mono">
            #{orderNumber}
          </div>
        </div>

        {/* Stars Earned */}
        {starsEarned > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="text-sm text-gray-600">{t.earned}</div>
                <div className="text-xl font-bold text-orange-600">
                  +{starsEarned} {t.stars}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        <p className="text-center text-gray-600 text-sm mb-6">
          {t.message}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-black text-white rounded-xl font-semibold"
        >
          {t.close}
        </button>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
