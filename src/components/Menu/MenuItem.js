import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { titleByLang, currency, selectLabel } from '../../utils';
export const MenuItem = ({ item, lang, onAdd }) => {
    return (_jsxs("div", { className: "rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center p-3", children: [_jsx("img", { src: item.image || "", alt: titleByLang(item, lang), className: "w-full h-36 object-cover bg-gray-100 mb-2" }), _jsx("div", { className: "text-sm font-medium leading-tight truncate", children: titleByLang(item, lang) }), item.volume && (_jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: item.volume })), _jsx("div", { className: "text-base font-semibold mt-1", children: currency(item.price) }), _jsx("button", { onClick: () => onAdd(item.id), className: "mt-3 w-full py-2 rounded-xl bg-black text-white text-sm font-medium", children: selectLabel(lang) })] }));
};
