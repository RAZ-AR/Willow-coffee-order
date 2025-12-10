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
    return (_jsxs("div", { className: "rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center p-3", children: [_jsx("img", { src: item.image || "", alt: titleByLang(item, lang), className: "w-full h-36 object-cover bg-gray-100 mb-2" }), _jsx("div", { className: "text-sm font-medium leading-tight truncate", children: titleByLang(item, lang) }), item.volume && (_jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: item.volume })), _jsx("div", { className: "text-base font-semibold mt-1", children: currency(item.price) }), quantity === 0 ? (
            // Показываем кнопку "Add" если товара нет в корзине
            _jsx("button", { onClick: handleIncrement, className: "mt-3 w-full py-2 rounded-xl bg-black text-white text-sm font-medium", children: addLabel(lang) })) : (
            // Показываем счетчик если товар уже в корзине
            _jsxs("div", { className: "mt-3 flex items-center justify-center gap-3 bg-gray-100 rounded-xl py-2 px-3", children: [_jsx("button", { onClick: handleDecrement, className: "w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold", children: "\u2212" }), _jsx("span", { className: "text-base font-semibold min-w-[24px] text-center", children: quantity }), _jsx("button", { onClick: handleIncrement, className: "w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold", children: "+" })] }))] }));
};
