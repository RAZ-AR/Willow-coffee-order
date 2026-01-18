import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { BRAND } from "./constants";
import { titleByLang } from "./utils";
// Import all custom hooks
import { useTelegramAuth, useMenu, useLanguage, useLoyalty, useCart, useApi, } from "./hooks";
// Import all components
import { Header, MenuGrid, CategoryFilter, CartSheet, AdsCarousel, BottomBar, } from "./components";
import { OrderConfirmationModal } from "./components/Order";
import { TestRunner } from "./components/DevTools";
const HERO_COPY = {
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
const HeroSection = ({ lang, onPrimaryCta, cardNumber, stars, isLoadingCard, }) => {
    const t = HERO_COPY[lang];
    const hasCard = cardNumber && /^\d{4}$/.test(cardNumber);
    return (_jsx("section", { className: "mb-5 mt-4 animate-slideUp", children: _jsxs("div", { className: "glass-panel px-5 py-4 rounded-3xl", children: [_jsxs("div", { className: "flex items-start gap-3 mb-4", children: [_jsx("div", { className: "shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/40 flex items-center justify-center text-2xl shadow-lg shadow-accent/20 animate-scaleIn", children: "\u2615" }), _jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: "text-[21px] font-bold leading-snug text-white bg-gradient-to-r from-white to-white/90 bg-clip-text", children: t.title }), _jsx("p", { className: "mt-1.5 text-xs text-white/85 leading-relaxed", children: t.subtitle })] })] }), _jsx("button", { onClick: onPrimaryCta, className: "w-full rounded-2xl bg-gradient-to-r from-accent to-teal-400 text-black font-bold text-sm py-3 shadow-lg shadow-accent/50 hover:shadow-xl hover:shadow-accent/60 active:scale-[0.98] transition-all duration-200 hover:-translate-y-0.5", children: t.ctaPrimary }), _jsxs("div", { className: "mt-4 flex flex-col gap-2 text-xs text-white/90", children: [_jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-accent shadow-sm shadow-accent/50 group-hover:scale-125 transition-transform" }), _jsx("span", { className: "group-hover:text-white transition-colors", children: t.uspFast })] }), _jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-accent shadow-sm shadow-accent/50 group-hover:scale-125 transition-transform" }), _jsx("span", { className: "group-hover:text-white transition-colors", children: t.uspStars })] }), _jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-accent shadow-sm shadow-accent/50 group-hover:scale-125 transition-transform" }), _jsx("span", { className: "group-hover:text-white transition-colors", children: t.uspLanguage })] })] }), _jsxs("div", { className: "mt-4 flex items-center gap-2 text-xs", children: [_jsxs("div", { className: "flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/40 border border-white/15 hover:border-white/25 transition-colors backdrop-blur-sm", children: [_jsx("span", { children: "\uD83D\uDCB3" }), _jsx("span", { className: "font-semibold text-white", children: isLoadingCard ? "#…" : hasCard ? `#${cardNumber}` : "Нет карты" })] }), _jsxs("div", { className: "flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 hover:border-amber-400/50 transition-colors backdrop-blur-sm", children: [_jsx("span", { children: "\u2B50" }), _jsx("span", { className: "font-semibold text-amber-100", children: isLoadingCard
                                        ? "—"
                                        : hasCard
                                            ? `${stars} звёзд`
                                            : "Начните копить" })] })] })] }) }));
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
    const [activeCategory, setActiveCategory] = useState("All");
    const [showCart, setShowCart] = useState(false);
    const [debugTapCount, setDebugTapCount] = useState(0);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const [starsEarned, setStarsEarned] = useState(0);
    const [orderNumber, setOrderNumber] = useState("");
    // Order details for confirmation modal
    const [orderDetails, setOrderDetails] = useState(null);
    // Debug visibility
    const [debugVisible, setDebugVisible] = useState(() => {
        try {
            const qs = new URLSearchParams(window.location.search);
            return qs.get("debug") === "1";
        }
        catch {
            return false;
        }
    });
    // Computed values
    const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map((m) => m.category)))], [menu]);
    const filteredItems = useMemo(() => activeCategory === "All"
        ? menu
        : menu.filter((m) => m.category === activeCategory), [activeCategory, menu]);
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
    const handleOrderSubmit = async (when, table, payment) => {
        console.log('📦 handleOrderSubmit called with:', { when, table, payment, currentTgId });
        if (!currentTgId) {
            console.log('❌ handleOrderSubmit blocked - no currentTgId');
            return;
        }
        // Build order lines before try/catch so it's available in both blocks
        const orderLines = Object.entries(cart.cart)
            .filter(([_, qty]) => (qty || 0) > 0)
            .map(([id, qty]) => {
            const item = menu.find((i) => i.id === id);
            return {
                id,
                title: titleByLang(item, lang),
                qty,
                unit_price: item.price,
            };
        });
        try {
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
            // Save order details for confirmation modal
            setOrderDetails({
                items: orderLines,
                total: cart.total,
                payment,
                when,
                table: when === "now" ? table : null,
                cardNumber: resp?.card || loyalty.cardNumber
            });
            cart.clear();
            setStarsEarned(resp?.stars_earned || 0);
            setOrderNumber(resp?.order_id || "");
            setShowCart(false); // Close cart sheet
            setShowOrderConfirmation(true);
        }
        catch (error) {
            console.error("Order error:", error);
            // Save order details even on error for UX
            setOrderDetails({
                items: orderLines,
                total: cart.total,
                payment,
                when,
                table: when === "now" ? table : null,
                cardNumber: loyalty.cardNumber
            });
            cart.clear();
            setStarsEarned(0);
            setShowOrderConfirmation(true);
        }
    };
    // Show loading state
    if (menuLoading) {
        return (_jsx("div", { className: "min-h-screen bg-app-gradient flex items-center justify-center text-white", children: _jsxs("div", { className: "text-center animate-fadeIn", children: [_jsx("div", { className: "mb-6 inline-block", children: _jsx("div", { className: "w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent/40 flex items-center justify-center text-4xl shadow-2xl shadow-accent/30 animate-bounce", children: "\u2615" }) }), _jsx("div", { className: "text-2xl font-bold tracking-wide mb-2 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent", children: BRAND.name }), _jsxs("div", { className: "text-sm text-white/80 mt-2 flex items-center justify-center gap-2", children: [_jsxs("div", { className: "flex gap-1", children: [_jsx("span", { className: "w-2 h-2 bg-accent rounded-full animate-pulse", style: { animationDelay: '0ms' } }), _jsx("span", { className: "w-2 h-2 bg-accent rounded-full animate-pulse", style: { animationDelay: '150ms' } }), _jsx("span", { className: "w-2 h-2 bg-accent rounded-full animate-pulse", style: { animationDelay: '300ms' } })] }), _jsx("span", { children: "Loading menu" })] })] }) }));
    }
    // Show error state
    if (menuError) {
        return (_jsx("div", { className: "min-h-screen bg-app-gradient flex items-center justify-center p-6", children: _jsxs("div", { className: "max-w-md text-center animate-fadeIn", children: [_jsx("div", { className: "mb-6 inline-block", children: _jsx("div", { className: "w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-400/40 flex items-center justify-center text-4xl shadow-2xl shadow-red-500/20", children: "\u26A0\uFE0F" }) }), _jsx("div", { className: "text-2xl font-bold mb-3 text-red-200", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438" }), _jsx("div", { className: "text-sm text-red-200/80 bg-red-500/10 border border-red-400/30 rounded-2xl p-4 backdrop-blur-sm", children: menuError }), _jsx("button", { onClick: () => window.location.reload(), className: "mt-6 px-6 py-3 bg-gradient-to-r from-accent to-teal-400 text-black font-bold rounded-xl shadow-lg shadow-accent/40 hover:shadow-xl hover:shadow-accent/60 active:scale-98 transition-all", children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-app-gradient text-white", children: [_jsx(Header, { cardNumber: loyalty.cardNumber, isLoadingCard: loyalty.isLoadingCard, lang: lang, setLang: setLang, stars: loyalty.stars, cartCount: cart.cartCount, onOpenCart: () => setShowCart(true), onLogoTap: handleLogoTap }), _jsxs("div", { className: "px-4 pb-28 max-w-md mx-auto", children: [_jsx(HeroSection, { lang: lang, cardNumber: loyalty.cardNumber, stars: loyalty.stars, isLoadingCard: loyalty.isLoadingCard, onPrimaryCta: () => {
                            const el = document.getElementById("willow-menu-start");
                            if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                        } }), _jsx(AdsCarousel, { ads: ads }), _jsxs("div", { id: "willow-menu-start", className: "mt-4", children: [_jsx(CategoryFilter, { categories: categories, activeCategory: activeCategory, onCategoryChange: setActiveCategory }), _jsx(MenuGrid, { items: filteredItems, lang: lang, cart: cart.cart, onAddItem: (id) => cart.add(id, 1), onRemoveItem: cart.remove })] })] }), _jsx(BottomBar, { total: cart.total, cartCount: cart.cartCount, onOpenCart: () => setShowCart(true) }), showCart && (_jsx(CartSheet, { items: menu, cart: cart.cart, lang: lang, total: cart.total, add: cart.add, remove: cart.remove, onClose: () => setShowCart(false), onPaid: handleOrderSubmit })), debugVisible && (_jsxs("div", { className: "fixed bottom-3 left-3 right-3 z-50 p-3 rounded-lg border bg-white text-xs shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("b", { children: "DEBUG" }), _jsx("button", { className: "px-2 py-1 border rounded", onClick: () => setDebugVisible(false), children: "Close" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsxs("div", { children: [_jsx("b", { children: "currentTgId:" }), " ", String(currentTgId || "null")] }), _jsxs("div", { children: [_jsx("b", { children: "cardNumber:" }), " ", String(loyalty.cardNumber || "")] }), _jsxs("div", { children: [_jsx("b", { children: "stars:" }), " ", String(loyalty.stars)] }), _jsxs("div", { children: [_jsx("b", { children: "isLoadingCard:" }), " ", String(loyalty.isLoadingCard)] })] }), _jsxs("div", { children: [_jsxs("div", { children: [_jsx("b", { children: "hasRealTgData:" }), " ", String(hasRealTgData)] }), _jsxs("div", { children: [_jsx("b", { children: "menuItems:" }), " ", menu.length] }), _jsxs("div", { children: [_jsx("b", { children: "cartItems:" }), " ", cart.cartCount] }), _jsxs("div", { children: [_jsx("b", { children: "total:" }), " ", cart.total, " RSD"] })] })] }), _jsxs("div", { className: "mt-2", children: [_jsx("div", { children: _jsx("b", { children: "Last register resp:" }) }), _jsx("pre", { className: "whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded", children: JSON.stringify(loyalty.lastRegisterResp) })] }), _jsxs("div", { className: "mt-2", children: [_jsx("div", { children: _jsx("b", { children: "Last stars resp:" }) }), _jsx("pre", { className: "whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded", children: JSON.stringify(loyalty.lastStarsResp) })] })] })), debugVisible && _jsx(TestRunner, {}), _jsx(OrderConfirmationModal, { isOpen: showOrderConfirmation, lang: lang, orderNumber: orderNumber, starsEarned: starsEarned, onClose: () => {
                    setShowOrderConfirmation(false);
                    setOrderDetails(null);
                }, items: orderDetails?.items, total: orderDetails?.total, payment: orderDetails?.payment, when: orderDetails?.when, table: orderDetails?.table, cardNumber: orderDetails?.cardNumber })] }));
}
// Inject styles (keeping the self-contained approach)
const style = document.createElement("style");
style.innerHTML = `
  .no-scrollbar::-webkit-scrollbar{display:none}
  .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
  :root{--accent:${BRAND.accent}}
`;
document.head.appendChild(style);
