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
    <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center p-3">
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

      {quantity === 0 ? (
        // Показываем кнопку "Add" если товара нет в корзине
        <button
          onClick={handleIncrement}
          className="mt-3 w-full py-2 rounded-xl bg-black text-white text-sm font-medium"
        >
          {addLabel(lang)}
        </button>
      ) : (
        // Показываем счетчик если товар уже в корзине
        <div className="mt-3 flex items-center justify-center gap-3 bg-gray-100 rounded-xl py-2 px-3">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold"
          >
            −
          </button>
          <span className="text-base font-semibold min-w-[24px] text-center">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};