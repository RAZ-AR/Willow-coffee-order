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
    <div className="glass-panel rounded-3xl overflow-hidden text-center p-3 flex flex-col">
      <img
        src={item.image || ""}
        alt={titleByLang(item, lang)}
        className="w-full h-36 object-cover bg-black/20 mb-2"
      />
      <div className="text-sm font-semibold leading-tight line-clamp-2 text-white">
        {titleByLang(item, lang)}
      </div>
      {item.volume && (
        <div className="text-xs text-white/60 mt-0.5">
          {item.volume}
        </div>
      )}
      <div className="text-base font-semibold mt-1 text-accent">
        {currency(item.price)}
      </div>

      {quantity === 0 ? (
        // Показываем кнопку "Add" если товара нет в корзине
        <button
          onClick={handleIncrement}
          className="mt-3 w-full py-2.5 rounded-2xl bg-accent text-black text-sm font-semibold shadow-md shadow-accent/40 active:scale-[0.97] transition-transform"
        >
          {addLabel(lang)}
        </button>
      ) : (
        // Показываем счетчик если товар уже в корзине
        <div className="mt-3 flex items-center justify-center gap-3 bg-black/30 rounded-2xl py-2 px-3 border border-white/10">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg font-bold border border-white/20 active:scale-95 transition-transform"
          >
            −
          </button>
          <span className="text-base font-semibold min-w-[24px] text-center">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center text-lg font-bold shadow-sm shadow-accent/40 active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};