import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BRAND } from '../../constants';
import { toNumber } from '../../utils';
import { LangPicker } from './LangPicker';
export const Header = ({ cardNumber, isLoadingCard, lang, setLang, stars, cartCount, onOpenCart, onLogoTap, }) => {
    const showCard = cardNumber && /^\d{4}$/.test(cardNumber);
    const cardBadge = showCard ? `#${cardNumber}` : isLoadingCard ? "#…" : "—";
    // Логирование для отладки
    console.log('🎨 Header render:', {
        cardNumber,
        cardNumberType: typeof cardNumber,
        cardNumberLength: cardNumber?.length,
        regexTest: cardNumber ? /^\d{4}$/.test(cardNumber) : false,
        showCard,
        isLoadingCard,
        cardBadge
    });
    console.log('🔥 VERSION CHECK: Header.tsx updated at 15.09.2025 17:25');
    return (_jsx("div", { className: "sticky top-0 z-20 animate-fadeIn", children: _jsx("div", { className: "max-w-md mx-auto px-4 pt-3 pb-2", children: _jsxs("div", { className: "glass-panel rounded-3xl px-4 py-3 flex items-center gap-2 shadow-2xl", children: [_jsx("button", { onClick: onLogoTap, className: "font-bold text-lg tracking-wide active:opacity-70 text-gray-800 hover:scale-105 transition-transform", "aria-label": "Toggle debug", children: BRAND.name }), _jsxs("div", { className: "ml-1 text-[11px] px-2.5 py-2 rounded-2xl bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-700 flex items-center gap-1.5 transition-all", children: [_jsx("span", { children: "\uD83D\uDCB3" }), _jsx("b", { className: "text-gray-800", children: cardBadge })] }), _jsxs("div", { className: "ml-1 px-2.5 py-2 rounded-2xl bg-amber-100 border border-amber-300 hover:border-amber-400 text-[11px] text-amber-800 flex items-center gap-1.5 transition-all", children: [_jsx("span", { children: "\u2B50" }), _jsx("span", { className: "font-bold", children: toNumber(stars, 0) })] }), _jsxs("div", { className: "ml-auto flex items-center gap-2", children: [_jsxs("button", { onClick: onOpenCart, className: "relative w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 flex items-center justify-center text-lg text-gray-700 active:scale-95 hover:scale-105 transition-all shadow-lg", "aria-label": "Open cart", children: ["\uD83D\uDED2", cartCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 bg-gradient-to-r from-accent to-teal-400 text-black text-[10px] font-bold leading-none px-2 py-1.5 rounded-full shadow-lg shadow-accent/50 animate-scaleIn", children: cartCount }))] }), _jsx(LangPicker, { value: lang, onChange: setLang })] })] }) }) }));
};
