import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { currency } from '../../utils';
export const OrderForm = ({ lang, total, onSubmit }) => {
    const [when, setWhen] = useState("now");
    const [table, setTable] = useState(1);
    const [payment, setPayment] = useState("cash");
    const payDisabled = when === "now" && table == null;
    const handleSubmit = async () => {
        if (payDisabled)
            return;
        await onSubmit(when, table, payment);
    };
    return (_jsxs("div", { className: "px-5 pb-5 pt-4", children: [_jsxs("div", { className: "p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm", children: [_jsxs("div", { className: "text-sm font-bold mb-3 text-gray-700 flex items-center gap-2", children: [_jsx("span", { children: "\u23F0" }), lang === "ru"
                                ? "Когда приготовить"
                                : lang === "sr"
                                    ? "Kada pripremiti"
                                    : "When to prepare"] }), _jsx("div", { className: "flex gap-2", children: [
                            {
                                v: "now",
                                label: lang === "ru" ? "Сейчас" : lang === "sr" ? "Sada" : "Now",
                            },
                            { v: "10", label: "+10 min" },
                            { v: "20", label: "+20 min" },
                        ].map((option) => (_jsx("button", { onClick: () => setWhen(option.v), className: `flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${when === option.v
                                ? "bg-gradient-to-r from-teal-500 to-teal-400 text-white border-teal-500 shadow-md shadow-teal-500/30 scale-105"
                                : "bg-white !text-black border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"}`, children: option.label }, option.v))) }), when === "now" && (_jsxs("div", { className: "mt-4 animate-slideUp", children: [_jsx("div", { className: "text-sm font-semibold text-gray-700 mb-2", children: lang === "ru"
                                    ? "Номер стола"
                                    : lang === "sr"
                                        ? "Broj stola"
                                        : "Table number" }), _jsx("div", { className: "grid grid-cols-6 gap-2", children: Array.from({ length: 12 })
                                    .map((_, i) => i + 1)
                                    .map((n) => (_jsx("button", { onClick: () => setTable(n), className: `py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${table === n
                                        ? "bg-gradient-to-r from-teal-500 to-teal-400 text-white border-teal-500 shadow-md shadow-teal-500/30 scale-110"
                                        : "bg-white !text-black border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"}`, children: n }, n))) })] }))] }), _jsxs("div", { className: "mt-3 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm", children: [_jsxs("div", { className: "text-sm font-bold mb-3 text-gray-700 flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDCB3" }), lang === "ru" ? "Оплата" : lang === "sr" ? "Plaćanje" : "Payment"] }), _jsx("div", { className: "flex gap-2", children: [
                            {
                                v: "cash",
                                label: lang === "ru" ? "💵 Наличные" : lang === "sr" ? "💵 Keš" : "💵 Cash",
                            },
                            {
                                v: "card",
                                label: lang === "ru" ? "💳 Карта" : lang === "sr" ? "💳 Kartica" : "💳 Card",
                            },
                            {
                                v: "stars",
                                label: lang === "ru" ? "⭐ Звезды" : lang === "sr" ? "⭐ Zvezdice" : "⭐ Stars",
                            },
                        ].map((option) => (_jsx("button", { onClick: () => setPayment(option.v), className: `flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${payment === option.v
                                ? "bg-gradient-to-r from-teal-500 to-teal-400 text-white border-teal-500 shadow-md shadow-teal-500/30 scale-105"
                                : "bg-white !text-black border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"}`, children: option.label }, option.v))) })] }), _jsxs("div", { className: "mt-4 p-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "text-base font-semibold text-gray-600", children: lang === "ru" ? "Итого" : lang === "sr" ? "Ukupno" : "Total" }), _jsx("div", { className: "text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent", children: currency(total) })] }), _jsx("button", { onClick: handleSubmit, disabled: payDisabled, className: `w-full py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-lg ${payDisabled
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-black to-gray-800 text-white hover:shadow-xl hover:-translate-y-0.5 active:scale-98"}`, children: lang === "ru" ? "✓ Оплатить" : lang === "sr" ? "✓ Plati" : "✓ Checkout" })] })] }));
};
