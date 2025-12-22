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
    <div className="sticky top-0 z-20 animate-fadeIn">
      <div className="max-w-md mx-auto px-4 pt-3 pb-2">
        <div className="glass-panel rounded-3xl px-4 py-3 flex items-center gap-2 shadow-2xl">
        <button
          onClick={onLogoTap}
          className="font-bold text-lg tracking-wide active:opacity-70 text-white hover:scale-105 transition-transform"
          aria-label="Toggle debug"
        >
          {BRAND.name}
        </button>

        {/* 💳 Card */}
        <div className="ml-1 text-[11px] px-2.5 py-2 rounded-2xl bg-black/50 border border-white/15 hover:border-white/25 text-white flex items-center gap-1.5 backdrop-blur-sm transition-all">
          <span>💳</span>
          <b className="text-white">{cardBadge}</b>
        </div>

        {/* ⭐ Stars */}
        <div className="ml-1 px-2.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/30 hover:border-amber-400/50 text-[11px] text-amber-100 flex items-center gap-1.5 backdrop-blur-sm transition-all">
          <span>⭐</span>
          <span className="font-bold">{toNumber(stars, 0)}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenCart}
            className="relative w-10 h-10 rounded-full border-2 border-white/25 hover:border-white/40 bg-black/40 hover:bg-black/50 flex items-center justify-center text-lg text-white active:scale-95 hover:scale-105 transition-all backdrop-blur-sm shadow-lg"
            aria-label="Open cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-accent to-teal-400 text-black text-[10px] font-bold leading-none px-2 py-1.5 rounded-full shadow-lg shadow-accent/50 animate-scaleIn">
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