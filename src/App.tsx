import React, { useState, useMemo } from "react";
import { BRAND } from "./constants";
import { titleByLang } from "./utils";
import type { Lang } from "./types";

// Import all custom hooks
import {
  useTelegramAuth,
  useMenu,
  useLanguage,
  useLoyalty,
  useCart,
  useApi,
} from "./hooks";

// Import all components
import {
  Header,
  MenuGrid,
  CategoryFilter,
  CartSheet,
  AdsCarousel,
  BottomBar,
} from "./components";

import { OrderConfirmationModal } from "./components/Order";

import { TestRunner } from "./components/DevTools";

/**
 * Willow Telegram Mini-App — Frontend (v7.0 - REFACTORED)
 * - Modular architecture with custom hooks and components
 * - Clean separation of concerns
 * - TypeScript typed throughout
 */

type HeroCopyKey = "title" | "subtitle" | "ctaPrimary" | "ctaSecondary" | "uspFast" | "uspStars" | "uspLanguage";

const HERO_COPY: Record<Lang, Record<HeroCopyKey, string>> = {
  ru: {
    title: "Кофе Willow в один тап",
    subtitle: "Заказывайте прямо в Telegram, копите звезды за каждый заказ и забирайте любимый кофе без очереди.",
    ctaPrimary: "Выбрать кофе",
    ctaSecondary: "О программе лояльности",
    uspFast: "Быстрый заказ и выдача",
    uspStars: "Звезды за каждый заказ",
    uspLanguage: "Интерфейс на RU / SR / EN",
  },
  sr: {
    title: "Willow kafa u jednom tiku",
    subtitle: "Poručite direktno u Telegramu, skupljajte zvezdice za svaku porudžbinu i preuzmite kafu bez čekanja.",
    ctaPrimary: "Izaberi kafu",
    ctaSecondary: "Program lojalnosti",
    uspFast: "Brza porudžbina i isporuka",
    uspStars: "Zvezdice za svaku porudžbinu",
    uspLanguage: "Interfejs na SR / RU / EN",
  },
  en: {
    title: "Willow coffee in one tap",
    subtitle: "Order right inside Telegram, earn stars for every cup and pick up your coffee without waiting.",
    ctaPrimary: "Choose your coffee",
    ctaSecondary: "Loyalty program",
    uspFast: "Fast order & pickup",
    uspStars: "Stars for every order",
    uspLanguage: "Interface in EN / RU / SR",
  },
};

interface HeroSectionProps {
  lang: Lang;
  onPrimaryCta: () => void;
  cardNumber: string;
  stars: number;
  isLoadingCard: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  lang,
  onPrimaryCta,
  cardNumber,
  stars,
  isLoadingCard,
}) => {
  const t = HERO_COPY[lang];
  const hasCard = cardNumber && /^\d{4}$/.test(cardNumber);

  return (
    <section className="mb-4 mt-3">
      <div className="glass-panel px-4 py-3 rounded-3xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-xl">
            ☕
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-semibold leading-snug">
              {t.title}
            </h1>
            <p className="mt-1 text-xs text-white/80 leading-snug">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onPrimaryCta}
            className="flex-1 rounded-2xl bg-accent text-black font-semibold text-sm py-2.5 shadow-lg shadow-accent/40 active:scale-[0.97] transition-transform"
          >
            {t.ctaPrimary}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-white/80">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>{t.uspFast}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>{t.uspStars}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>{t.uspLanguage}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-black/30 border border-white/10">
            <span>💳</span>
            <span className="font-medium">
              {isLoadingCard ? "#…" : hasCard ? `#${cardNumber}` : "Нет карты"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-black/30 border border-white/10">
            <span>⭐</span>
            <span className="font-medium">
              {isLoadingCard
                ? "—"
                : hasCard
                  ? `${stars} звёзд`
                  : "Начните копить звезды"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function App() {
  // Custom hooks for all business logic
  const telegramAuth = useTelegramAuth();
  const { tg, currentTgId, hasRealTgData } = telegramAuth;
  
  const { menu, ads, loading: menuLoading, error: menuError } = useMenu();
  const { lang, setLang } = useLanguage();
  
  const loyalty = useLoyalty({
    tg,
    currentTgId,
    hasRealTgData,
    tgWebAppData: new URLSearchParams(window.location.search).get('tgWebAppData')
  });
  
  const cart = useCart(menu, currentTgId);
  const api = useApi({
    tg,
    currentTgId,
    hasRealTgData
  });

  // Local UI state
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showCart, setShowCart] = useState<boolean>(false);
  const [debugTapCount, setDebugTapCount] = useState<number>(0);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState<boolean>(false);
  const [starsEarned, setStarsEarned] = useState<number>(0);
  const [orderNumber, setOrderNumber] = useState<string>("");

  // Debug visibility
  const [debugVisible, setDebugVisible] = useState<boolean>(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      return qs.get("debug") === "1";
    } catch {
      return false;
    }
  });

  // Computed values
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(menu.map((m) => m.category)))],
    [menu],
  );
  
  const filteredItems = useMemo(
    () =>
      activeCategory === "All"
        ? menu
        : menu.filter((m) => m.category === activeCategory),
    [activeCategory, menu],
  );

  // Event handlers
  const handleLogoTap = () => {
    setDebugTapCount((c) => {
      const n = c + 1;
      if (n >= 5) {
        setDebugVisible((v) => !v);
        return 0;
      }
      return n;
    });
  };

  const handleOrderSubmit = async (
    when: "now" | "10" | "20",
    table: number | null,
    payment: "cash" | "card" | "stars"
  ) => {
    console.log('📦 handleOrderSubmit called with:', { when, table, payment, currentTgId });
    
    if (!currentTgId) {
      console.log('❌ handleOrderSubmit blocked - no currentTgId');
      return;
    }

    try {
      const orderLines = Object.entries(cart.cart)
        .filter(([_, qty]) => (qty || 0) > 0)
        .map(([id, qty]) => {
          const item = menu.find((i) => i.id === id)!;
          return {
            id,
            title: titleByLang(item, lang),
            qty,
            unit_price: item.price,
          };
        });

      console.log('📦 Calling submitOrder with orderLines:', orderLines);
      console.log('📦 Order details:', { card: loyalty.cardNumber, total: cart.total, when, table, payment });
      
      const resp = await api.submitOrder({
        total: cart.total,
        when,
        table: when === "now" ? table : null,
        payment,
        items: orderLines,
      });

      console.log('📦 Order submit response:', resp);

      if (resp && typeof resp.stars === "number") {
        loyalty.updateStars(resp.stars);
      }

      cart.clear();
      setStarsEarned(resp?.stars_earned || 0);
      setOrderNumber(resp?.order_id || "");
      setShowCart(false); // Close cart sheet
      setShowOrderConfirmation(true);
    } catch (error) {
      console.error("Order error:", error);
      // Still clear cart and show success for UX
      cart.clear();
      setStarsEarned(0);
      setShowOrderConfirmation(true);
    }
  };

  // Show loading state
  if (menuLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-lg font-semibold tracking-wide">{BRAND.name}</div>
          <div className="text-sm text-white/70 mt-2">Loading menu...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (menuError) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-center text-red-200">
          <div className="text-lg font-semibold">Error loading menu</div>
          <div className="text-sm mt-2">{menuError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient text-white">
      <Header
        cardNumber={loyalty.cardNumber}
        isLoadingCard={loyalty.isLoadingCard}
        lang={lang}
        setLang={setLang}
        stars={loyalty.stars}
        cartCount={cart.cartCount}
        onOpenCart={() => setShowCart(true)}
        onLogoTap={handleLogoTap}
      />

      <div className="px-4 pb-28 max-w-md mx-auto">
        <HeroSection
          lang={lang}
          cardNumber={loyalty.cardNumber}
          stars={loyalty.stars}
          isLoadingCard={loyalty.isLoadingCard}
          onPrimaryCta={() => {
            const el = document.getElementById("willow-menu-start");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />

        <AdsCarousel ads={ads} />

        <div id="willow-menu-start" className="mt-4">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <MenuGrid
            items={filteredItems}
            lang={lang}
            cart={cart.cart}
            onAddItem={(id) => cart.add(id, 1)}
            onRemoveItem={cart.remove}
          />
        </div>
      </div>

      <BottomBar
        total={cart.total}
        cartCount={cart.cartCount}
        onOpenCart={() => setShowCart(true)}
      />

      {showCart && (
        <CartSheet
          items={menu}
          cart={cart.cart}
          lang={lang}
          total={cart.total}
          add={cart.add}
          remove={cart.remove}
          onClose={() => setShowCart(false)}
          onPaid={handleOrderSubmit}
        />
      )}

      {debugVisible && (
        <div className="fixed bottom-3 left-3 right-3 z-50 p-3 rounded-lg border bg-white text-xs shadow">
          <div className="flex items-center justify-between mb-2">
            <b>DEBUG</b>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setDebugVisible(false)}
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div><b>currentTgId:</b> {String(currentTgId || "null")}</div>
              <div><b>cardNumber:</b> {String(loyalty.cardNumber || "")}</div>
              <div><b>stars:</b> {String(loyalty.stars)}</div>
              <div><b>isLoadingCard:</b> {String(loyalty.isLoadingCard)}</div>
            </div>
            <div>
              <div><b>hasRealTgData:</b> {String(hasRealTgData)}</div>
              <div><b>menuItems:</b> {menu.length}</div>
              <div><b>cartItems:</b> {cart.cartCount}</div>
              <div><b>total:</b> {cart.total} RSD</div>
            </div>
          </div>
          <div className="mt-2">
            <div><b>Last register resp:</b></div>
            <pre className="whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(loyalty.lastRegisterResp)}
            </pre>
          </div>
          <div className="mt-2">
            <div><b>Last stars resp:</b></div>
            <pre className="whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(loyalty.lastStarsResp)}
            </pre>
          </div>
        </div>
      )}

      {debugVisible && <TestRunner />}

      <OrderConfirmationModal
        isOpen={showOrderConfirmation}
        lang={lang}
        orderNumber={orderNumber}
        starsEarned={starsEarned}
        onClose={() => setShowOrderConfirmation(false)}
      />
    </div>
  );
}

// Inject styles (keeping the self-contained approach)
const style = document.createElement("style");
style.innerHTML = `
  .no-scrollbar::-webkit-scrollbar{display:none}
  .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
  :root{--accent:${BRAND.accent}}
`;
document.head.appendChild(style);