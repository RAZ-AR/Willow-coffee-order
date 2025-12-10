import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export const OrderConfirmationModal = ({ isOpen, lang, starsEarned, orderNumber, onClose }) => {
    if (!isOpen)
        return null;
    const t = texts[lang] || texts.en;
    return (_jsxs("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", onClick: onClose, children: [_jsxs("div", { className: "bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in", onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-10 h-10 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }) }), _jsx("h2", { className: "text-2xl font-bold text-center mb-2", children: t.title }), _jsx("p", { className: "text-gray-600 text-center mb-6", children: t.subtitle }), _jsxs("div", { className: "bg-gray-50 rounded-xl p-4 mb-4", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: t.orderNumber }), _jsxs("div", { className: "text-lg font-bold font-mono", children: ["#", orderNumber] })] }), starsEarned > 0 && (_jsx("div", { className: "bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("span", { className: "text-2xl", children: "\u2B50" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-600", children: t.earned }), _jsxs("div", { className: "text-xl font-bold text-orange-600", children: ["+", starsEarned, " ", t.stars] })] })] }) })), _jsx("p", { className: "text-center text-gray-600 text-sm mb-6", children: t.message }), _jsx("button", { onClick: onClose, className: "w-full py-3 bg-black text-white rounded-xl font-semibold", children: t.close })] }), _jsx("style", { children: `
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
      ` })] }));
};
