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
    <div className="px-4 pb-4">
      {/* When to prepare */}
      <div className="mt-2 p-3 rounded-2xl bg-gray-50 border">
        <div className="text-sm font-medium mb-2">
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
              className={`px-3 py-2 rounded-full text-sm border ${
                when === option.v
                  ? "bg-teal-500 text-white border-teal-500"
                  : "border-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Table selection */}
        {when === "now" && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-1">
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
                    className={`py-2 rounded-xl border text-sm ${
                      table === n
                        ? "bg-teal-500 text-white border-teal-500"
                        : "border-gray-200"
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
      <div className="mt-3 p-3 rounded-2xl bg-gray-50 border">
        <div className="text-sm font-medium mb-2">
          {lang === "ru" ? "Оплата" : lang === "sr" ? "Plaćanje" : "Payment"}
        </div>
        <div className="flex gap-2">
          {[
            {
              v: "cash" as const,
              label: lang === "ru" ? "Наличные" : lang === "sr" ? "Keš" : "Cash",
            },
            {
              v: "card" as const,
              label:
                lang === "ru" ? "Карта" : lang === "sr" ? "Kartica" : "Card",
            },
            {
              v: "stars" as const,
              label:
                lang === "ru" ? "Звезды" : lang === "sr" ? "Zvezdice" : "Stars",
            },
          ].map((option) => (
            <button
              key={option.v}
              onClick={() => setPayment(option.v)}
              className={`px-3 py-2 rounded-full text-sm border ${
                payment === option.v
                  ? "bg-teal-500 text-white border-teal-500"
                  : "border-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total and checkout */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-base text-gray-600">
          {lang === "ru" ? "Итого" : lang === "sr" ? "Ukupno" : "Total"}
        </div>
        <div className="text-xl font-semibold">{currency(total)}</div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={payDisabled}
        className={`mt-3 w-full py-3 rounded-xl font-semibold ${
          payDisabled
            ? "bg-gray-200 text-gray-500"
            : "bg-black text-white"
        }`}
      >
        {lang === "ru" ? "Оплатить" : lang === "sr" ? "Plati" : "Checkout"}
      </button>
    </div>
  );
};