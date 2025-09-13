import React from 'react';
import { titleByLang, currency, selectLabel } from '../../utils';
import type { MenuItem as MenuItemType, Lang } from '../../types';

interface MenuItemProps {
  item: MenuItemType;
  lang: Lang;
  onAdd: (id: string) => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ item, lang, onAdd }) => {
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
      <button
        onClick={() => onAdd(item.id)}
        className="mt-3 w-full py-2 rounded-xl bg-black text-white text-sm font-medium"
      >
        {selectLabel(lang)}
      </button>
    </div>
  );
};