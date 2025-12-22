import React, { useState } from 'react';
import { currency } from '../../utils';
import type { Lang } from '../../types';

interface OrderFormProps {
  lang: Lang;
  total: number;
  onSubmit: (when: "now" | "10" | "20", table: number | null, payment: "cash" | "card" | "stars") => void | Promise<void>;
}

export const OrderForm: React.FC<OrderFormProps> = ({ lang, total, onSubmit }) => {
  const [when, setWhen] = useState<"now" | "10" | "20">("now");
  const [table, setTable] = useState<number | null>(1);
  const [payment, setPayment] = useState<"cash" | "card" | "stars">("cash");

  const payDisabled = when === "now" && table == null;

  const handleSubmit = async () => {
    if (payDisabled) return;
    await onSubmit(when, table, payment);
  };

  return (
    <div className="px-5 pb-5 pt-4">
      {/* When to prepare */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
        <div className="text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
          <span>⏰</span>
          {lang === "ru"
            ? "Когда приготовить"
            : lang === "sr"
              ? "Kada pripremiti"
              : "When to prepare"}
        </div>
        <div className="flex gap-2">
          {[
            {
              v: "now" as const,
              label: lang === "ru" ? "Сейчас" : lang === "sr" ? "Sada" : "Now",
            },
            { v: "10" as const, label: "+10 min" },
            { v: "20" as const, label: "+20 min" },
          ].map((option) => (
            <button
              key={option.v}
              onClick={() => setWhen(option.v)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                when === option.v
                  ? "bg-gradient-to-r from-teal-500 to-teal-400 text-white border-teal-500 shadow-md shadow-teal-500/30 scale-105"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Table selection */}
        {when === "now" && (
          <div className="mt-4 animate-slideUp">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              {lang === "ru"
                ? "Номер стола"
                : lang === "sr"
                  ? "Broj stola"
                  : "Table number"}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 12 })
                .map((_, i) => i + 1)
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => setTable(n)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      table === n
                        ? "bg-gradient-to-r from-teal-500 to-teal-400 text-white border-teal-500 shadow-md shadow-teal-500/30 scale-110"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                    }`}
                  >
                    {n}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
        <div className="text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
          <span>💳</span>
          {lang === "ru" ? "Оплата" : lang === "sr" ? "Plaćanje" : "Payment"}
        </div>
        <div className="flex gap-2">
          {[
            {
              v: "cash" as const,
              label: lang === "ru" ? "💵 Наличные" : lang === "sr" ? "💵 Keš" : "💵 Cash",
            },
            {
              v: "card" as const,
              label:
                lang === "ru" ? "💳 Карта" : lang === "sr" ? "💳 Kartica" : "💳 Card",
            },
            {
              v: "stars" as const,
              label:
                lang === "ru" ? "⭐ Звезды" : lang === "sr" ? "⭐ Zvezdice" : "⭐ Stars",
            },
          ].map((option) => (
            <button
              key={option.v}
              onClick={() => setPayment(option.v)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${
                payment === option.v
                  ? "bg-gradient-to-r from-teal-500 to-teal-400 text-white border-teal-500 shadow-md shadow-teal-500/30 scale-105"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total and checkout */}
      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-semibold text-gray-600">
            {lang === "ru" ? "Итого" : lang === "sr" ? "Ukupno" : "Total"}
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            {currency(total)}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={payDisabled}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-lg ${
            payDisabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-black to-gray-800 text-white hover:shadow-xl hover:-translate-y-0.5 active:scale-98"
          }`}
        >
          {lang === "ru" ? "✓ Оплатить" : lang === "sr" ? "✓ Plati" : "✓ Checkout"}
        </button>
      </div>
    </div>
  );
};