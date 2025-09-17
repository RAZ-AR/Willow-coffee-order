import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { BRAND } from "./constants";
import { titleByLang } from "./utils";
// Import all custom hooks
import { useTelegramAuth, useMenu, useLanguage, useLoyalty, useCart, useApi, } from "./hooks";
// Import all components
import { Header, MenuGrid, CategoryFilter, CartSheet, AdsCarousel, BottomBar, } from "./components";
import { TestRunner } from "./components/DevTools";
/**
 * Willow Telegram Mini-App — Frontend (v7.0 - REFACTORED)
 * - Modular architecture with custom hooks and components
 * - Clean separation of concerns
 * - TypeScript typed throughout
 */
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
        hasRealTgData,
        tgWebAppData: new URLSearchParams(window.location.search).get('tgWebAppData')
    });
    // Local UI state
    const [activeCategory, setActiveCategory] = useState("All");
    const [showCart, setShowCart] = useState(false);
    const [debugTapCount, setDebugTapCount] = useState(0);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
    const [starsEarned, setStarsEarned] = useState(0);
    const [orderError, setOrderError] = useState(null);
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
    const buildOrderErrorMessage = (details) => {
        const baseMessage = lang === "ru"
            ? "Не удалось отправить заказ. Попробуйте ещё раз."
            : lang === "sr"
                ? "Slanje porudžbine nije uspelo. Pokušajte ponovo."
                : "We couldn't submit your order. Please try again.";
        return details ? `${baseMessage} ${details}` : baseMessage;
    };
    const handleOrderSubmit = async (when, table, payment) => {
        console.log('📦 handleOrderSubmit called with:', { when, table, payment, currentTgId });
        if (!currentTgId) {
            console.log('❌ handleOrderSubmit blocked - no currentTgId');
            setOrderError(buildOrderErrorMessage());
            return false;
        }
        try {
            setOrderError(null);
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
            console.log('📦 Calling submitOrder with orderLines:', orderLines);
            console.log('📦 Order details:', { card: loyalty.cardNumber, total: cart.total, when, table, payment });
            const resp = await api.submitOrder({
                card: loyalty.cardNumber || null,
                total: cart.total,
                when,
                table: when === "now" ? table : null,
                payment,
                items: orderLines,
            });
            console.log('📦 Order submit response:', resp);
            if (!(resp == null ? void 0 : resp.ok)) {
                console.warn('❌ Order submit failed:', resp);
                const detail = (resp == null ? void 0 : resp.error) ? `(${resp.error})` : void 0;
                setOrderError(buildOrderErrorMessage(detail));
                return false;
            }
            if (typeof resp.stars === "number") {
                loyalty.updateStars(resp.stars);
            }
            cart.clear();
            setStarsEarned((resp == null ? void 0 : resp.stars_earned) || 0);
            setShowOrderConfirmation(true);
            return true;
        }
        catch (error) {
            console.error("Order error:", error);
            const detail = error instanceof Error ? `(${error.message})` : void 0;
            setOrderError(buildOrderErrorMessage(detail));
            return false;
        }
    };
    const handleCloseCart = () => {
        setShowCart(false);
        setOrderError(null);
    };
    // Show loading state
    if (menuLoading) {
        return (_jsx("div", { className: "min-h-screen bg-white flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-semibold", children: BRAND.name }), _jsx("div", { className: "text-sm text-gray-500 mt-2", children: "Loading menu..." })] }) }));
    }
    // Show error state
    if (menuError) {
        return (_jsx("div", { className: "min-h-screen bg-white flex items-center justify-center", children: _jsxs("div", { className: "text-center text-red-600", children: [_jsx("div", { className: "text-lg font-semibold", children: "Error loading menu" }), _jsx("div", { className: "text-sm mt-2", children: menuError })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-white text-black", children: [_jsx(Header, { cardNumber: loyalty.cardNumber, isLoadingCard: loyalty.isLoadingCard, lang: lang, setLang: setLang, stars: loyalty.stars, cartCount: cart.cartCount, onOpenCart: () => setShowCart(true), onLogoTap: handleLogoTap }), _jsxs("div", { className: "px-4 pb-28 max-w-md mx-auto", children: [_jsx(AdsCarousel, { ads: ads }), _jsx(CategoryFilter, { categories: categories, activeCategory: activeCategory, onCategoryChange: setActiveCategory }), _jsx(MenuGrid, { items: filteredItems, lang: lang, onAddItem: (id) => cart.add(id, 1) })] }), _jsx(BottomBar, { total: cart.total, cartCount: cart.cartCount, onOpenCart: () => setShowCart(true) }), showCart && (_jsx(CartSheet, { items: menu, cart: cart.cart, lang: lang, total: cart.total, add: cart.add, remove: cart.remove, onClose: handleCloseCart, onPaid: handleOrderSubmit, errorMessage: orderError })), debugVisible && (_jsxs("div", { className: "fixed bottom-3 left-3 right-3 z-50 p-3 rounded-lg border bg-white text-xs shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("b", { children: "DEBUG" }), _jsx("button", { className: "px-2 py-1 border rounded", onClick: () => setDebugVisible(false), children: "Close" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsxs("div", { children: [_jsx("b", { children: "currentTgId:" }), " ", String(currentTgId || "null")] }), _jsxs("div", { children: [_jsx("b", { children: "cardNumber:" }), " ", String(loyalty.cardNumber || "")] }), _jsxs("div", { children: [_jsx("b", { children: "stars:" }), " ", String(loyalty.stars)] }), _jsxs("div", { children: [_jsx("b", { children: "isLoadingCard:" }), " ", String(loyalty.isLoadingCard)] })] }), _jsxs("div", { children: [_jsxs("div", { children: [_jsx("b", { children: "hasRealTgData:" }), " ", String(hasRealTgData)] }), _jsxs("div", { children: [_jsx("b", { children: "menuItems:" }), " ", menu.length] }), _jsxs("div", { children: [_jsx("b", { children: "cartItems:" }), " ", cart.cartCount] }), _jsxs("div", { children: [_jsx("b", { children: "total:" }), " ", cart.total, " RSD"] })] })] }), _jsxs("div", { className: "mt-2", children: [_jsx("div", { children: _jsx("b", { children: "Last register resp:" }) }), _jsx("pre", { className: "whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded", children: JSON.stringify(loyalty.lastRegisterResp) })] }), _jsxs("div", { className: "mt-2", children: [_jsx("div", { children: _jsx("b", { children: "Last stars resp:" }) }), _jsx("pre", { className: "whitespace-pre-wrap break-all max-h-28 overflow-auto bg-gray-50 p-2 rounded", children: JSON.stringify(loyalty.lastStarsResp) })] })] })), debugVisible && _jsx(TestRunner, {})] }));
}
// Inject styles (keeping the self-contained approach)
const style = document.createElement("style");
style.innerHTML = `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}:root{--accent:${BRAND.accent}}`;
document.head.appendChild(style);
