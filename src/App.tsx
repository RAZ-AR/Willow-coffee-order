import React, { useEffect, useMemo, useState } from "react";

/**
 * Willow Telegram Mini-App — Frontend (v6.4)
 * - Мгновенное отображение card/stars из LS + подтверждение с бэка
 * - Сброс LS при смене владельца (owner_tg_id)
 * - Агрессивный register (3 ретрая по 1s), далее пуллинг stars каждые 15s
 * - Google Drive images → direct links
 * - Заказы без авто-начисления звёзд
 */

const BRAND = { name: "Willow", accent: "#14b8a6" } as const;
const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbwr0bM8DoA18dVNzZQrMxivYWyXXcUyW_cm-QwWxgNgMi4y-mqgZWUM9XPujuIksRfy/exec";

const SHEET_JSON_URLS = {
  menu: "https://opensheet.elk.sh/1DQ00jxOF5QnIxNnYhnRdOqB9DXeRLB65L3eF6pSQMHw/MENU",
  ads: "https://opensheet.elk.sh/1DQ00jxOF5QnIxNnYhnRdOqB9DXeRLB65L3eF6pSQMHw/ADS",
} as const;

const LANGS = ["en", "sr", "ru"] as const;
export type Lang = (typeof LANGS)[number];

export interface MenuItem {
  id: string;
  category: string;
  title_en: string;
  title_sr: string;
  title_ru: string;
  volume?: string;
  price: number;
  composition_en?: string;
  composition_sr?: string;
  composition_ru?: string;
  image?: string;
}
export interface AdItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
}

// ===== utils
const toNumber = (v: any, def = 0): number => {
  if (v == null) return def;
  const n = Number(
    String(v)
      .replace(/[^0-9.,-]/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) ? n : def;
};
const currency = (v: any) => `${toNumber(v, 0).toFixed(0)} RSD`;

const selectLabel = (lang: Lang) =>
  lang === "ru" ? "Выбрать" : lang === "sr" ? "Izaberi" : "Select";
const titleByLang = (item: Partial<MenuItem>, lang: Lang): string => {
  const pick =
    lang === "en"
      ? item.title_en
      : lang === "sr"
        ? item.title_sr
        : item.title_ru;
  return pick || item.title_en || item.title_sr || item.title_ru || "Item";
};

// Google Drive → direct image
const driveToDirect = (url: string): string => {
  if (!url) return url;
  const m1 = url.match(/\/d\/([A-Za-z0-9_-]{10,})/);
  if (m1) return `https://lh3.googleusercontent.com/d/${m1[1]}=w1200`;
  const m2 = url.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (m2) return `https://lh3.googleusercontent.com/d/${m2[1]}=w1200`;
  return url;
};

const pickFrom = (row: Record<string, any>, keys: string[], fallback = "") => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
};

const mapMenu = (rows: any[]): MenuItem[] =>
  (rows || []).map((r: any, i: number) => {
    const id = String(pickFrom(r, ["id", "ID", "Id"], `m_${i}`));
    const category = String(pickFrom(r, ["Category"], "Other"));
    const title_en = String(pickFrom(r, ["English"], ""));
    const title_ru = String(pickFrom(r, ["Russian"], title_en));
    const title_sr = String(pickFrom(r, ["Serbian"], title_en));
    const volume = String(pickFrom(r, ["Volume"], ""));
    const price = toNumber(pickFrom(r, ["Price (RSD)", "Price", "RSD"], 0), 0);
    const comp = String(pickFrom(r, ["Ingredients"], ""));
    const image = driveToDirect(
      String(pickFrom(r, ["images", "image", "Image"], "")),
    );
    return {
      id,
      category,
      title_en,
      title_ru,
      title_sr,
      volume,
      price,
      composition_en: comp,
      composition_ru: comp,
      composition_sr: comp,
      image,
    } as MenuItem;
  });

const mapAds = (rows: any[]): AdItem[] =>
  (rows || []).map((r: any, i: number) => ({
    id: String(pickFrom(r, ["id", "ID", "ADS"], `a_${i}`)),
    title: String(pickFrom(r, ["ADS", "Title"], "")),
    subtitle: String(pickFrom(r, ["description", "Subtitle"], "")),
    image: driveToDirect(
      String(pickFrom(r, ["image_ads", "image", "Image"], "")),
    ),
    link: String(pickFrom(r, ["link", "Link"], "")),
  }));

async function postJSON<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const text = await res.text();
  // Если GAS возвращает HTML с JSON внутри, извлекаем его
  const jsonMatch = text.match(/<pre id="json">(.*?)<\/pre>/s);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  
  // Иначе пытаемся парсить как обычный JSON
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}...`);
  }
}

// Telegram WebApp (fallback в браузере)
const isDev = (import.meta as any)?.env?.MODE === "development";
const generateTestUserId = () => {
  const key = "test_user_id";
  try {
    const stored = localStorage.getItem(key);
    if (stored) return parseInt(stored);
    const newId = (Math.random() * 1_000_000) | 0;
    localStorage.setItem(key, String(newId));
    return newId;
  } catch {
    return (Math.random() * 1_000_000) | 0;
  }
};
const tg = (typeof window !== "undefined" &&
  (window as any).Telegram?.WebApp) || {
  initDataUnsafe: {
    user: isDev
      ? {
          id: generateTestUserId(),
          first_name: "TestUser",
          username: "testuser",
        }
      : null,
  },
  initData: null,
};

// Storage keys
const LS_KEYS = {
  cart: "willow_cart",
  lang: "willow_lang",
  stars: "willow_stars",
  card: "willow_card",
  owner: "willow_owner_tg_id",
} as const;

function cartAdd(prev: Record<string, number>, id: string, n = 1) {
  const next: Record<string, number> = { ...prev };
  const q = (next[id] || 0) + n;
  if (q <= 0) delete next[id];
  else next[id] = q;
  return next;
}

export default function App() {
  const currentTgId: string | null = tg?.initDataUnsafe?.user?.id
    ? String(tg.initDataUnsafe.user.id)
    : null;

  // Показываем из LS сразу — UI мгновенно с номером/звёздами
  const [cardNumber, setCardNumber] = useState<string>(
    () => localStorage.getItem(LS_KEYS.card) || "",
  );
  const [stars, setStars] = useState<number>(() =>
    toNumber(localStorage.getItem(LS_KEYS.stars), 0),
  );
  const [isLoadingCard, setIsLoadingCard] = useState<boolean>(
    !!currentTgId || !!(tg as any)?.initData,
  );
  const [debugVisible, setDebugVisible] = useState<boolean>(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      return qs.get("debug") === "1";
    } catch {
      return false;
    }
  });
  const [debugTapCount, setDebugTapCount] = useState<number>(0);
  const [lastRegisterResp, setLastRegisterResp] = useState<any>(null);
  const [lastStarsResp, setLastStarsResp] = useState<any>(null);

  // Одноразовый сброс локального состояния по флагу ?reset=1 (помогает после миграций)
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const shouldReset = qs.has("reset") && qs.get("reset") === "1";
      if (shouldReset) {
        localStorage.removeItem(LS_KEYS.card);
        localStorage.removeItem(LS_KEYS.stars);
        localStorage.removeItem(LS_KEYS.cart);
        setCardNumber("");
        setStars(0);
      }
    } catch {}
  }, []);

  // Смена владельца → сброс локалки
  useEffect(() => {
    const owner = localStorage.getItem(LS_KEYS.owner);
    if (currentTgId && owner && owner !== currentTgId) {
      localStorage.removeItem(LS_KEYS.card);
      localStorage.removeItem(LS_KEYS.stars);
      localStorage.removeItem(LS_KEYS.cart);
      setCardNumber("");
      setStars(0);
      setCart({});
      localStorage.setItem(LS_KEYS.owner, currentTgId);
    } else if (currentTgId && !owner) {
      localStorage.setItem(LS_KEYS.owner, currentTgId);
    }
  }, [currentTgId]);

  const initialLang = (() => {
    const v = localStorage.getItem(LS_KEYS.lang) as Lang | null;
    return v && (LANGS as readonly string[]).includes(v) ? (v as Lang) : "en";
  })();

  const [lang, setLang] = useState<Lang>(initialLang);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEYS.cart) || "{}");
    } catch {
      return {};
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showCart, setShowCart] = useState<boolean>(false);

  // Загрузка меню/рекламы
  useEffect(() => {
    Promise.all([
      fetch(SHEET_JSON_URLS.menu)
        .then((r) => r.json())
        .catch(() => []),
      fetch(SHEET_JSON_URLS.ads)
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([menuJson, adsJson]) => {
      setMenu(mapMenu(Array.isArray(menuJson) ? menuJson : []));
      setAds(mapAds(Array.isArray(adsJson) ? adsJson : []));
    });
  }, []);

  // Persist cart/lang
  useEffect(() => {
    localStorage.setItem(LS_KEYS.cart, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.lang, lang);
  }, [lang]);

  // Агрессивный register (3 быстрых попытки), потом уже пуллинг
  useEffect(() => {
    let aborted = false;
    let currentCard = "";

    const tryOnce = async () => {
      if (!BACKEND_URL) return null;
      // Разрешаем вызов даже при отсутствии user.id, если есть initData —
      // бэкенд сам распарсит initData → user
      if (!currentTgId && !(tg as any)?.initData) return null;
      try {
        const resp = await postJSON(BACKEND_URL, {
          action: "register",
          initData: (tg as any)?.initData || null,
          user: (tg as any)?.initDataUnsafe?.user || null,
          ts: Date.now(),
        });
        setLastRegisterResp(resp);
        if (aborted) return null;
        if (resp?.card) {
          const cardStr = String(resp.card);
          setCardNumber(cardStr);
          localStorage.setItem(LS_KEYS.card, cardStr);
          currentCard = cardStr;
        }
        if (typeof resp?.stars === "number") {
          setStars(resp.stars);
          localStorage.setItem(LS_KEYS.stars, String(resp.stars));
        }
        return resp?.card || null;
      } catch {
        setLastRegisterResp({ error: "network_or_cors" });
        return null;
      } finally {
        if (!aborted) setIsLoadingCard(false);
      }
    };

    (async () => {
      const firstCard = await tryOnce();
      if (firstCard && /^\d{4}$/.test(String(firstCard))) {
        return; // Успешно получили карту с первого раза
      }

      for (let i = 0; i < 3; i++) {
        if (aborted) break;
        if (currentCard && /^\d{4}$/.test(currentCard)) break;
        await new Promise((r) => setTimeout(r, 1000));
        const card = await tryOnce();
        if (card && /^\d{4}$/.test(String(card))) {
          break;
        }
      }
    })();

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTgId]);

  // Пуллинг card/stars каждые 15s
  useEffect(() => {
    if (!BACKEND_URL) return;
    if (!currentTgId && !(tg as any)?.initData) return;
    const t = setInterval(async () => {
      try {
        const resp = await postJSON(BACKEND_URL, {
          action: "stars",
          initData: (tg as any)?.initData || null,
          user: (tg as any)?.initDataUnsafe?.user || null,
        });
        setLastStarsResp(resp);
        if (resp?.card && resp.card !== cardNumber) {
          setCardNumber(String(resp.card));
          localStorage.setItem(LS_KEYS.card, String(resp.card));
        }
        if (typeof resp?.stars === "number" && resp.stars !== stars) {
          setStars(resp.stars);
          localStorage.setItem(LS_KEYS.stars, String(resp.stars));
        }
      } catch {
        setLastStarsResp({ error: "network_or_cors" });
      }
    }, 15000);
    return () => clearInterval(t);
  }, [currentTgId, cardNumber, stars]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(menu.map((m) => m.category)))],
    [menu],
  );
  const items = useMemo(
    () =>
      activeCategory === "All"
        ? menu
        : menu.filter((m) => m.category === activeCategory),
    [activeCategory, menu],
  );
  const total = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = menu.find((i) => i.id === id);
        return sum + (item ? toNumber(item.price, 0) * qty : 0);
      }, 0),
    [cart, menu],
  );

  const add = (id: string, n = 1) => setCart((prev) => cartAdd(prev, id, n));
  const remove = (id: string) =>
    setCart((prev) => {
      const p = { ...prev };
      delete p[id];
      return p;
    });

  const cartCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + (b || 0), 0),
    [cart],
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        cardNumber={cardNumber}
        isLoadingCard={isLoadingCard}
        lang={lang}
        setLang={setLang}
        stars={stars}
        cartCount={cartCount}
        onOpenCart={() => setShowCart(true)}
        onLogoTap={() => {
          setDebugTapCount((c) => {
            const n = c + 1;
            if (n >= 5) {
              setDebugVisible((v) => !v);
              return 0;
            }
            return n;
          });
        }}
      />

      <div className="px-4 pb-28 max-w-md mx-auto">
        <AdsCarousel ads={ads} />

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-2 rounded-full border text-sm whitespace-nowrap ${
                c === activeCategory
                  ? "bg-teal-500 text-white border-teal-500"
                  : "border-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center p-3"
            >
              <img
                src={item.image || ""}
                alt={titleByLang(item, lang)}
                className="w-full h-36 object-cover bg-gray-100 mb-2"
              />
              <div className="text-sm font-medium leading-tight truncate">
                {titleByLang(item, lang)}
              </div>
              {item.volume && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.volume}
                </div>
              )}
              <div className="text-base font-semibold mt-1">
                {currency(item.price)}
              </div>
              <button
                onClick={() => add(item.id, 1)}
                className="mt-3 w-full py-2 rounded-xl bg-black text-white text-sm font-medium"
              >
                {selectLabel(lang)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* bottom bar */}
      <div className="fixed bottom-0 inset-x-0 border-t bg-white p-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="text-sm text-gray-600 flex-1">
            Total: <span className="font-semibold">{currency(total)}</span>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="flex-1 bg-black text-white rounded-xl py-3 font-medium"
          >
            {cartCount ? `Cart • ${cartCount}` : "Cart"}
          </button>
        </div>
      </div>

      {showCart && (
        <CartSheet
          items={menu}
          cart={cart}
          lang={lang}
          total={total}
          add={add}
          remove={remove}
          onClose={() => setShowCart(false)}
          onPaid={async (when, table, payment) => {
            if (BACKEND_URL && currentTgId) {
              try {
                const orderLines = Object.entries(cart)
                  .filter(([_, qty]) => (qty || 0) > 0)
                  .map(([id, qty]) => {
                    const item = menu.find((i) => i.id === id)!;
                    return {
                      id,
                      title: titleByLang(item, lang),
                      qty,
                      unit_price: toNumber(item.price, 0),
                    };
                  });

                const resp = await postJSON(BACKEND_URL, {
                  action: "order",
                  initData: (tg as any)?.initData || null,
                  user: (tg as any)?.initDataUnsafe?.user || null,
                  card: cardNumber || null,
                  total,
                  when,
                  table: when === "now" ? table : null,
                  payment,
                  items: orderLines,
                });

                if (typeof resp?.stars === "number") {
                  setStars(resp.stars);
                  localStorage.setItem(LS_KEYS.stars, String(resp.stars));
                }
                setCart({});
                alert(
                  lang === "ru"
                    ? "Спасибо! Заказ принят."
                    : lang === "sr"
                      ? "Hvala! Porudžbina je primljena."
                      : "Thanks! Order received.",
                );
                return;
              } catch (e) {
                console.error("order error", e);
              }
            }
            setCart({});
            alert(
              lang === "ru"
                ? "Спасибо! Заказ принят."
                : lang === "sr"
                  ? "Hvala! Porudžbina je primljena."
                  : "Thanks! Order received.",
            );
          }}
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
              <div>
                <b>currentTgId:</b> {String(currentTgId || "null")}
              </div>
              <div>
                <b>BACKEND_URL:</b> {BACKEND_URL}
              </div>
              <div>
                <b>cardNumber:</b> {String(cardNumber || "")}
              </div>
              <div>
                <b>stars:</b> {String(stars)}
              </div>
              <div>
                <b>isLoadingCard:</b> {String(isLoadingCard)}
              </div>
            </div>
            <div>
              <div>
                <b>LS card:</b>{" "}
                {String(localStorage.getItem(LS_KEYS.card) || "")}
              </div>
              <div>
                <b>LS stars:</b>{" "}
                {String(localStorage.getItem(LS_KEYS.stars) || "")}
              </div>
              <div>
                <b>LS owner:</b>{" "}
                {String(localStorage.getItem(LS_KEYS.owner) || "")}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div>
              <b>Last register resp:</b>
            </div>
            <pre className="whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(lastRegisterResp)}
            </pre>
          </div>
          <div className="mt-2">
            <div>
              <b>Last stars resp:</b>
            </div>
            <pre className="whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(lastStarsResp)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Header ===== */
function Header({
  cardNumber,
  isLoadingCard,
  lang,
  setLang,
  stars,
  cartCount,
  onOpenCart,
  onLogoTap,
}: {
  cardNumber: string;
  isLoadingCard: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  stars: number;
  cartCount: number;
  onOpenCart: () => void;
  onLogoTap: () => void;
}) {
  const showCard = cardNumber && /^\d{4}$/.test(cardNumber);
  const cardBadge = showCard ? `#${cardNumber}` : isLoadingCard ? "#…" : "—";

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
        <button
          onClick={onLogoTap}
          className="font-semibold text-lg active:opacity-60"
          aria-label="Toggle debug"
        >
          {BRAND.name}
        </button>

        {/* 💳 Card */}
        <div className="ml-1 text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-700">
          💳 <b>{cardBadge}</b>
        </div>

        {/* ⭐ Stars */}
        <div className="ml-1 px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-sm">
          ⭐ {toNumber(stars, 0)}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenCart}
            className="relative w-9 h-9 rounded-full border flex items-center justify-center"
            aria-label="Open cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] leading-none px-1.5 py-1 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <LangPicker value={lang} onChange={setLang} />
        </div>
      </div>
    </div>
  );
}

function LangPicker({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <select
      className="text-sm border rounded-full px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value as Lang)}
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="sr">SR</option>
      <option value="ru">RU</option>
    </select>
  );
}

/* ===== Ads Carousel ===== */
function AdsCarousel({ ads }: { ads: AdItem[] }) {
  if (!ads?.length) return null;
  const [idx, setIdx] = useState(0);
  const slides = ads;

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    let startX = 0;
    const el = document.getElementById("ads-slider");
    if (!el) return;
    const onStart = (e: TouchEvent) => (startX = e.touches[0].clientX);
    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        setIdx((i) =>
          dx > 0
            ? (i - 1 + slides.length) % slides.length
            : (i + 1) % slides.length,
        );
        startX = e.touches[0].clientX;
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [slides.length]);

  return (
    <div className="mt-3">
      <div
        id="ads-slider"
        className="relative w-full overflow-hidden rounded-3xl border border-gray-100 shadow-sm"
        style={{ height: 168 }}
      >
        <div
          className="absolute inset-0 flex transition-transform duration-500"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {slides.map((s) => (
            <a
              key={s.id}
              href={s.link || "#"}
              className="w-full shrink-0 h-full"
              aria-label={s.title}
            >
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center bg-gray-50">
                  {s.title}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full ${i === idx ? "bg-black" : "bg-gray-300"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== Cart Sheet ===== */
function CartSheet({
  items,
  cart,
  lang,
  total,
  add,
  remove,
  onClose,
  onPaid,
}: {
  items: MenuItem[];
  cart: Record<string, number>;
  lang: Lang;
  total: number;
  add: (id: string, n?: number) => void;
  remove: (id: string) => void;
  onClose: () => void;
  onPaid: (
    when: "now" | "10" | "20",
    table: number | null,
    payment: "cash" | "card" | "stars",
  ) => void | Promise<void>;
}) {
  const [when, setWhen] = useState<"now" | "10" | "20">("now");
  const [table, setTable] = useState<number | null>(1);
  const [payment, setPayment] = useState<"cash" | "card" | "stars">("cash");

  const cartLines = Object.entries(cart)
    .filter(([_, qty]) => (qty || 0) > 0)
    .map(([id, qty]) => ({ item: items.find((i) => i.id === id), qty }))
    .filter((x): x is { item: MenuItem; qty: number } => Boolean(x.item));

  const payDisabled =
    cartLines.length === 0 || (when === "now" && table == null);

  const submit = async () => {
    if (payDisabled) return;
    await onPaid(when, table, payment);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-30 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            {lang === "ru" ? "Корзина" : lang === "sr" ? "Korpa" : "Cart"}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-3 divide-y">
          {cartLines.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              {lang === "ru"
                ? "Пусто"
                : lang === "sr"
                  ? "Prazno"
                  : "Cart is empty"}
            </div>
          )}
          {cartLines.map(({ item, qty }) => (
            <div key={item.id} className="py-3 flex gap-3 items-center">
              <img
                src={item.image || ""}
                alt={titleByLang(item, lang)}
                className="w-16 h-16 rounded-xl object-cover bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {titleByLang(item, lang)}
                </div>
                <div className="text-xs text-gray-500">
                  {currency(item.price)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => add(item.id, -1)}
                    className="w-7 h-7 rounded-full border"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm">{qty}</span>
                  <button
                    onClick={() => add(item.id, 1)}
                    className="w-7 h-7 rounded-full border"
                    aria-label="Increase"
                  >
                    +
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="ml-3 text-xs text-gray-500 underline"
                  >
                    {lang === "ru"
                      ? "Удалить"
                      : lang === "sr"
                        ? "Obriši"
                        : "Remove"}
                  </button>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {currency(item.price * qty)}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
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
                  label:
                    lang === "ru" ? "Сейчас" : lang === "sr" ? "Sada" : "Now",
                },
                { v: "10" as const, label: "+10 min" },
                { v: "20" as const, label: "+20 min" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setWhen(o.v)}
                  className={`px-3 py-2 rounded-full text-sm border ${when === o.v ? "bg-teal-500 text-white border-teal-500" : "border-gray-200"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>

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
                        className={`py-2 rounded-xl border text-sm ${table === n ? "bg-teal-500 text-white border-teal-500" : "border-gray-200"}`}
                      >
                        {n}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 p-3 rounded-2xl bg-gray-50 border">
            <div className="text-sm font-medium mb-2">
              {lang === "ru"
                ? "Оплата"
                : lang === "sr"
                  ? "Plaćanje"
                  : "Payment"}
            </div>
            <div className="flex gap-2">
              {[
                {
                  v: "cash" as const,
                  label:
                    lang === "ru" ? "Наличные" : lang === "sr" ? "Keš" : "Cash",
                },
                {
                  v: "card" as const,
                  label:
                    lang === "ru"
                      ? "Карта"
                      : lang === "sr"
                        ? "Kartica"
                        : "Card",
                },
                {
                  v: "stars" as const,
                  label:
                    lang === "ru"
                      ? "Звезды"
                      : lang === "sr"
                        ? "Zvezdice"
                        : "Stars",
                },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setPayment(o.v)}
                  className={`px-3 py-2 rounded-full text-sm border ${payment === o.v ? "bg-teal-500 text-white border-teal-500" : "border-gray-200"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-base text-gray-600">
              {lang === "ru" ? "Итого" : lang === "sr" ? "Ukupno" : "Total"}
            </div>
            <div className="text-xl font-semibold">{currency(total)}</div>
          </div>

          <button
            onClick={submit}
            disabled={payDisabled}
            className={`mt-3 w-full py-3 rounded-xl font-semibold ${payDisabled ? "bg-gray-200 text-gray-500" : "bg-black text-white"}`}
          >
            {lang === "ru" ? "Оплатить" : lang === "sr" ? "Plati" : "Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}

// self-tests
(function runSelfTests() {
  try {
    console.assert(
      currency(undefined as any) === "0 RSD",
      "currency(undefined) should be 0 RSD",
    );
    console.assert(currency("1,200 RSD") === "1200 RSD", "currency parse");
    const m = mapMenu([
      {
        English: "Test",
        Category: "Coffee",
        "Price (RSD)": "1,200",
        Ingredients: "Water + Coffee",
        images: "https://drive.google.com/file/d/1AbCdEfGhIj/view?usp=sharing",
      },
    ]);
    console.assert(m[0].price === 1200, "menu price parse");
    console.assert(
      m[0].image.includes("lh3.googleusercontent.com"),
      "drive->direct",
    );
    let c: Record<string, number> = {};
    c = cartAdd(c, "x", 1);
    console.assert(c["x"] === 1, "cart +1");
    c = cartAdd(c, "x", -1);
    console.assert(!("x" in c), "cart remove 0");
    console.log("[SelfTests] OK");
  } catch (e) {
    console.error("[SelfTests] failed", e);
  }
})();

// tiny CSS
const style = document.createElement("style");
style.innerHTML = `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}:root{--accent:${BRAND.accent}}`;
document.head.appendChild(style);
