import React from 'react';
import { titleByLang, currency } from '../../utils';
import type { MenuItem as MenuItemType, Lang } from '../../types';

interface MenuItemProps {
  item: MenuItemType;
  lang: Lang;
  quantity: number;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

const addLabel = (lang: Lang) => {
  switch (lang) {
    case 'ru': return 'Добавить';
    case 'sr': return 'Dodaj';
    default: return 'Add';
  }
};

export const MenuItem: React.FC<MenuItemProps> = ({ item, lang, quantity, onAdd, onRemove }) => {
  const handleIncrement = () => {
    onAdd(item.id);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      // Если количество = 1, удаляем товар из корзины
      onRemove(item.id);
    } else {
      // Иначе уменьшаем на 1 (добавляем -1)
      onAdd(item.id);
    }
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden text-center p-3 flex flex-col animate-fadeIn hover:scale-[1.02] transition-all duration-300">
      <div className="relative overflow-hidden rounded-2xl mb-3">
        <img
          src={item.image || ""}
          alt={titleByLang(item, lang)}
          className="w-full h-36 object-cover bg-black/20 transition-transform duration-300 hover:scale-110"
        />
        {quantity > 0 && (
          <div className="absolute top-2 right-2 bg-accent text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-scaleIn">
            {quantity}
          </div>
        )}
      </div>

      <div className="text-sm font-semibold leading-tight line-clamp-2 text-white mb-1">
        {titleByLang(item, lang)}
      </div>

      {item.volume && (
        <div className="text-xs text-white/70 mt-0.5 mb-1">
          {item.volume}
        </div>
      )}

      <div className="text-lg font-bold mt-auto mb-3 bg-gradient-to-r from-accent to-teal-400 bg-clip-text text-transparent">
        {currency(item.price)}
      </div>

      {quantity === 0 ? (
        <button
          onClick={handleIncrement}
          className="w-full py-3 rounded-2xl bg-accent text-black text-sm font-bold shadow-lg shadow-accent/40 hover:shadow-xl hover:shadow-accent/50 active:scale-[0.97] transition-all duration-200 hover:-translate-y-0.5"
        >
          {addLabel(lang)}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-3 bg-black/40 rounded-2xl py-2.5 px-3 border border-white/20 backdrop-blur-sm animate-scaleIn">
          <button
            onClick={handleDecrement}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xl font-bold border border-white/30 active:scale-90 transition-all duration-200 hover:border-white/50"
          >
            −
          </button>
          <span className="text-lg font-bold min-w-[28px] text-center text-white">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="w-9 h-9 rounded-full bg-accent hover:bg-teal-400 text-black flex items-center justify-center text-xl font-bold shadow-md shadow-accent/40 active:scale-90 transition-all duration-200 hover:shadow-lg hover:shadow-accent/50"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};