import React from 'react';
import { BRAND } from '../../constants';
import { toNumber } from '../../utils';
import type { Lang } from '../../types';
import { LangPicker } from './LangPicker';

interface HeaderProps {
  cardNumber: string;
  isLoadingCard: boolean;
  lang: Lang;
  setLang: (lang: Lang) => void;
  stars: number;
  cartCount: number;
  onOpenCart: () => void;
  onLogoTap: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cardNumber,
  isLoadingCard,
  lang,
  setLang,
  stars,
  cartCount,
  onOpenCart,
  onLogoTap,
}) => {
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

  return (
    <div className="sticky top-0 z-20">
      <div className="max-w-md mx-auto px-4 pt-3">
        <div className="glass-panel rounded-3xl px-3 py-2 flex items-center gap-2">
        <button
          onClick={onLogoTap}
          className="font-semibold text-lg tracking-wide active:opacity-70 text-white"
          aria-label="Toggle debug"
        >
          {BRAND.name}
        </button>

        {/* 💳 Card */}
        <div className="ml-1 text-[11px] px-2 py-1.5 rounded-2xl bg-black/40 border border-white/10 text-white flex items-center gap-1.5">
          <span>💳</span>
          <b>{cardBadge}</b>
        </div>

        {/* ⭐ Stars */}
        <div className="ml-1 px-2 py-1.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-amber-200 flex items-center gap-1.5">
          <span>⭐</span>
          <span className="font-semibold">{toNumber(stars, 0)}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenCart}
            className="relative w-9 h-9 rounded-full border border-white/20 bg-black/30 flex items-center justify-center text-lg text-white active:scale-[0.96] transition-transform"
            aria-label="Open cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-black text-[10px] leading-none px-1.5 py-1 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <LangPicker value={lang} onChange={setLang} />
        </div>
      </div>
      </div>
    </div>
  );
};