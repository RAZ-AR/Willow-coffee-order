import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export const AdsCarousel = ({ ads }) => {
    const [idx, setIdx] = useState(0);
    if (!ads?.length)
        return null;
    const slides = ads;
    useEffect(() => {
        const interval = setInterval(() => {
            setIdx((i) => (i + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);
    useEffect(() => {
        let startX = 0;
        const el = document.getElementById("ads-slider");
        if (!el)
            return;
        const onStart = (e) => {
            startX = e.touches[0].clientX;
        };
        const onMove = (e) => {
            const dx = e.touches[0].clientX - startX;
            if (Math.abs(dx) > 50) {
                setIdx((i) => dx > 0
                    ? (i - 1 + slides.length) % slides.length
                    : (i + 1) % slides.length);
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
    return (_jsxs("div", { className: "mt-2", children: [_jsx("div", { id: "ads-slider", className: "relative w-full overflow-hidden glass-panel rounded-3xl", style: { height: 168 }, children: _jsx("div", { className: "absolute inset-0 flex transition-transform duration-500", style: { transform: `translateX(-${idx * 100}%)` }, children: slides.map((slide) => (_jsx("a", { href: slide.link || "#", className: "w-full shrink-0 h-full", "aria-label": slide.title, children: _jsxs("div", { className: "w-full h-full relative", children: [slide.image ? (_jsx("img", { src: slide.image, alt: slide.title, className: "w-full h-full object-cover opacity-90" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-black/60 via-black/40 to-black/70" })), _jsx("div", { className: "absolute inset-0 bg-black/25" }), _jsxs("div", { className: "absolute inset-0 flex flex-col justify-end p-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-accent mb-1", children: "Promo" }), _jsx("div", { className: "text-sm font-semibold text-white line-clamp-2", children: slide.title })] })] }) }, slide.id))) }) }), _jsx("div", { className: "mt-2 flex items-center justify-center gap-1.5", children: slides.map((_, i) => (_jsx("button", { onClick: () => setIdx(i), className: `h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-accent" : "w-1.5 bg-white/40"}`, "aria-label": `Go to slide ${i + 1}` }, i))) })] }));
};
