import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const texts = {
    en: {
        title: 'Order Placed!',
        subtitle: 'Thank you for your order',
        orderNumber: 'Order number',
        earned: 'You earned',
        stars: 'stars',
        message: 'We will notify you when your order is ready',
        close: 'Close',
        items: 'Your order',
        total: 'Total',
        payment: 'Payment',
        paymentCash: 'Cash',
        paymentCard: 'Card',
        paymentStars: 'Stars',
        when: 'When',
        whenNow: 'Now',
        whenTable: 'table',
        whenMinutes: 'min',
        card: 'Loyalty card',
        getNotifications: 'Get notifications',
        openBot: 'Open bot to receive order updates'
    },
    ru: {
        title: 'Заказ оформлен!',
        subtitle: 'Спасибо за ваш заказ',
        orderNumber: 'Номер заказа',
        earned: 'Вы получили',
        stars: 'звёзд',
        message: 'Мы уведомим вас, когда заказ будет готов',
        close: 'Закрыть',
        items: 'Ваш заказ',
        total: 'Итого',
        payment: 'Оплата',
        paymentCash: 'Наличные',
        paymentCard: 'Карта',
        paymentStars: 'Звёзды',
        when: 'Когда',
        whenNow: 'Сейчас',
        whenTable: 'столик',
        whenMinutes: 'мин',
        card: 'Карта лояльности',
        getNotifications: 'Получать уведомления',
        openBot: 'Откройте бота для получения обновлений'
    },
    sr: {
        title: 'Porudžbina primljena!',
        subtitle: 'Hvala na porudžbini',
        orderNumber: 'Broj porudžbine',
        earned: 'Osvojili ste',
        stars: 'zvezda',
        message: 'Obavestićemo vas kada bude gotovo',
        close: 'Zatvori',
        items: 'Vaša porudžbina',
        total: 'Ukupno',
        payment: 'Plaćanje',
        paymentCash: 'Gotovina',
        paymentCard: 'Kartica',
        paymentStars: 'Zvezdice',
        when: 'Kada',
        whenNow: 'Sada',
        whenTable: 'sto',
        whenMinutes: 'min',
        card: 'Kartica lojalnosti',
        getNotifications: 'Primaj obaveštenja',
        openBot: 'Otvorite bota za ažuriranja'
    }
};
export const OrderConfirmationModal = ({ isOpen, lang, starsEarned, orderNumber, onClose, items = [], total = 0, payment, when, table, cardNumber, botUsername = 'Willow_coffee_bot' }) => {
    if (!isOpen)
        return null;
    const t = texts[lang] || texts.en;
    const getPaymentLabel = () => {
        switch (payment) {
            case 'cash': return t.paymentCash;
            case 'card': return t.paymentCard;
            case 'stars': return t.paymentStars;
            default: return '';
        }
    };
    const getWhenLabel = () => {
        if (when === 'now') {
            return table ? `${t.whenNow}, ${t.whenTable} ${table}` : t.whenNow;
        }
        return `+${when} ${t.whenMinutes}`;
    };
    const handleOpenBot = () => {
        window.open(`https://t.me/${botUsername}?start=order`, '_blank');
    };
    return (_jsxs("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn", onClick: onClose, children: [_jsxs("div", { className: "bg-form rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg animate-bounce-in", children: _jsx("svg", { className: "w-10 h-10 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }) }) }) }), _jsx("h2", { className: "text-2xl font-bold text-center mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent", children: t.title }), _jsx("p", { className: "text-gray-600 text-center mb-4 text-sm", children: t.subtitle }), _jsx("div", { className: "bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-gray-500", children: t.orderNumber }), _jsxs("div", { className: "text-lg font-bold font-mono text-teal-600", children: ["#", orderNumber] })] }), cardNumber && (_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-xs font-medium text-gray-500", children: t.card }), _jsxs("div", { className: "text-lg font-bold font-mono text-gray-700", children: ["#", cardNumber] })] }))] }) }), (when || payment) && (_jsxs("div", { className: "flex gap-2 mb-3", children: [when && (_jsxs("div", { className: "flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100", children: [_jsx("div", { className: "text-xs font-medium text-blue-600", children: t.when }), _jsx("div", { className: "text-sm font-bold text-blue-800", children: getWhenLabel() })] })), payment && (_jsxs("div", { className: "flex-1 bg-purple-50 rounded-xl p-3 border border-purple-100", children: [_jsx("div", { className: "text-xs font-medium text-purple-600", children: t.payment }), _jsx("div", { className: "text-sm font-bold text-purple-800", children: getPaymentLabel() })] }))] })), items.length > 0 && (_jsxs("div", { className: "bg-white rounded-2xl p-4 mb-3 border border-gray-200", children: [_jsx("div", { className: "text-xs font-medium text-gray-500 mb-2", children: t.items }), _jsx("div", { className: "space-y-2", children: items.map((item, idx) => (_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-800", children: item.title }), _jsxs("span", { className: "text-gray-400", children: ["\u00D7", item.qty] })] }), _jsxs("span", { className: "font-medium text-gray-700", children: [item.unit_price * item.qty, " RSD"] })] }, idx))) }), _jsxs("div", { className: "border-t border-gray-200 mt-3 pt-3 flex justify-between items-center", children: [_jsx("span", { className: "font-bold text-gray-700", children: t.total }), _jsxs("span", { className: "font-bold text-lg text-teal-600", children: [total, " RSD"] })] })] })), starsEarned > 0 && (_jsx("div", { className: "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-4 mb-3 border-2 border-amber-200 shadow-md animate-pulse-subtle", children: _jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx("span", { className: "text-3xl animate-spin-slow", children: "\u2B50" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-gray-700", children: t.earned }), _jsxs("div", { className: "text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent", children: ["+", starsEarned, " ", t.stars] })] })] }) })), _jsxs("button", { onClick: handleOpenBot, className: "w-full py-3 mb-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2", children: [_jsx("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" }) }), t.getNotifications] }), _jsx("p", { className: "text-xs text-gray-500 text-center mb-4", children: t.openBot }), _jsx("button", { onClick: onClose, className: "w-full py-3 bg-gradient-to-r from-black to-gray-800 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all shadow-lg", children: t.close })] }), _jsx("style", { children: `
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
      ` })] }));
};
