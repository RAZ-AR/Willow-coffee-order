import React, { useState, useEffect } from 'react';
import type { AdItem } from '../../types';

interface AdsCarouselProps {
  ads: AdItem[];
}

export const AdsCarousel: React.FC<AdsCarouselProps> = ({ ads }) => {
  const [idx, setIdx] = useState(0);
  
  if (!ads?.length) return null;
  
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
    if (!el) return;
    
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    
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
    <div className="mt-2">
      <div
        id="ads-slider"
        className="relative w-full overflow-hidden glass-panel rounded-3xl"
        style={{ height: 168 }}
      >
        <div
          className="absolute inset-0 flex transition-transform duration-500"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {slides.map((slide) => (
            <a
              key={slide.id}
              href={slide.link || "#"}
              className="w-full shrink-0 h-full"
              aria-label={slide.title}
            >
              <div className="w-full h-full relative">
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                )}
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <div className="text-xs uppercase tracking-wide text-accent mb-1">
                    Promo
                  </div>
                  <div className="text-sm font-semibold text-white line-clamp-2">
                    {slide.title}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-4 bg-accent" : "w-1.5 bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};