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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {t.title}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-8 text-base">
          {t.subtitle}
        </p>

        {/* Order Number */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 mb-4 border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-600 mb-2">{t.orderNumber}</div>
          <div className="text-2xl font-bold font-mono bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            #{orderNumber}
          </div>
        </div>

        {/* Stars Earned */}
        {starsEarned > 0 && (
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-5 mb-6 border-2 border-amber-200 shadow-md animate-pulse-subtle">
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl animate-spin-slow">⭐</span>
              <div>
                <div className="text-sm font-medium text-gray-700">{t.earned}</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  +{starsEarned} {t.stars}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        <p className="text-center text-gray-600 mb-6 leading-relaxed">
          {t.message}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-black to-gray-800 text-white rounded-xl font-bold text-base hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all shadow-lg"
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

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
