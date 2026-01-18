import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CartItem } from './CartItem';
import { OrderForm } from './OrderForm';
export const CartSheet = ({ items, cart, lang, total, add, remove, onClose, onPaid, }) => {
    const cartLines = Object.entries(cart)
        .filter(([_, qty]) => (qty || 0) > 0)
        .map(([id, qty]) => ({ item: items.find((i) => i.id === id), qty }))
        .filter((x) => Boolean(x.item));
    const handleOrderSubmit = async (when, table, payment) => {
        await onPaid(when, table, payment);
        onClose();
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-end sm:items-center sm:justify-center animate-fadeIn", onClick: onClose, children: _jsxs("div", { className: "bg-form w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slideUp", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-form", children: [_jsx("div", { className: "font-bold text-lg text-gray-800", children: lang === "ru" ? "🛒 Корзина" : lang === "sr" ? "🛒 Korpa" : "🛒 Cart" }), _jsx("button", { onClick: onClose, className: "w-10 h-10 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700 active:scale-95 transition-all", "aria-label": "Close", children: "\u2715" })] }), _jsxs("div", { className: "max-h-[60vh] overflow-y-auto px-5 py-4 divide-y divide-gray-100", children: [cartLines.length === 0 && (_jsxs("div", { className: "py-16 text-center animate-scaleIn", children: [_jsx("div", { className: "text-6xl mb-4 opacity-20", children: "\uD83D\uDED2" }), _jsx("div", { className: "text-gray-400 font-medium mb-1", children: lang === "ru"
                                        ? "Корзина пуста"
                                        : lang === "sr"
                                            ? "Korpa je prazna"
                                            : "Cart is empty" }), _jsx("div", { className: "text-sm text-gray-400", children: lang === "ru"
                                        ? "Добавьте товары из меню"
                                        : lang === "sr"
                                            ? "Dodajte proizvode iz menija"
                                            : "Add items from the menu" })] })), cartLines.map(({ item, qty }, index) => (_jsx("div", { className: "animate-fadeIn", style: { animationDelay: `${index * 50}ms` }, children: _jsx(CartItem, { item: item, qty: qty, lang: lang, onAdd: add, onRemove: remove }) }, item.id)))] }), cartLines.length > 0 && (_jsx("div", { className: "border-t border-gray-100", children: _jsx(OrderForm, { lang: lang, total: total, onSubmit: handleOrderSubmit }) }))] }) }));
};
