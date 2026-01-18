import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { titleByLang, currency } from '../../utils';
const addLabel = (lang) => {
    switch (lang) {
        case 'ru': return 'Добавить';
        case 'sr': return 'Dodaj';
        default: return 'Add';
    }
};
export const MenuItem = ({ item, lang, quantity, onAdd, onRemove }) => {
    const handleIncrement = () => {
        onAdd(item.id);
    };
    const handleDecrement = () => {
        if (quantity === 1) {
            // Если количество = 1, удаляем товар из корзины
            onRemove(item.id);
        }
        else {
            // Иначе уменьшаем на 1 (добавляем -1)
            onAdd(item.id);
        }
    };
    return (_jsxs("div", { className: "glass-panel rounded-3xl overflow-hidden text-center p-3 flex flex-col animate-fadeIn hover:scale-[1.02] transition-all duration-300", children: [_jsxs("div", { className: "relative overflow-hidden rounded-2xl mb-3", children: [_jsx("img", { src: item.image || "", alt: titleByLang(item, lang), className: "w-full h-36 object-cover bg-black/20 transition-transform duration-300 hover:scale-110" }), quantity > 0 && (_jsx("div", { className: "absolute top-2 right-2 bg-accent text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-scaleIn", children: quantity }))] }), _jsx("div", { className: "text-sm font-semibold leading-tight line-clamp-2 text-gray-800 mb-1", children: titleByLang(item, lang) }), item.volume && (_jsx("div", { className: "text-xs text-gray-600 mt-0.5 mb-1", children: item.volume })), _jsx("div", { className: "text-lg font-bold mt-auto mb-3 bg-gradient-to-r from-accent to-teal-400 bg-clip-text text-transparent", children: currency(item.price) }), quantity === 0 ? (_jsx("button", { onClick: handleIncrement, className: "w-full py-3 rounded-2xl bg-accent text-black text-sm font-bold shadow-lg shadow-accent/40 hover:shadow-xl hover:shadow-accent/50 active:scale-[0.97] transition-all duration-200 hover:-translate-y-0.5", children: addLabel(lang) })) : (_jsxs("div", { className: "flex items-center justify-center gap-3 bg-gray-100 rounded-2xl py-2.5 px-3 border border-gray-300 animate-scaleIn", children: [_jsx("button", { onClick: handleDecrement, className: "w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xl font-bold border border-gray-400 active:scale-90 transition-all duration-200 hover:border-gray-500", children: "\u2212" }), _jsx("span", { className: "text-lg font-bold min-w-[28px] text-center text-gray-800", children: quantity }), _jsx("button", { onClick: handleIncrement, className: "w-9 h-9 rounded-full bg-accent hover:bg-teal-400 text-black flex items-center justify-center text-xl font-bold shadow-md shadow-accent/40 active:scale-90 transition-all duration-200 hover:shadow-lg hover:shadow-accent/50", children: "+" })] }))] }));
};
