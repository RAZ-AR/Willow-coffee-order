import React from 'react';
import { MenuItem } from './MenuItem';
import type { MenuItem as MenuItemType, Lang } from '../../types';

interface MenuGridProps {
  items: MenuItemType[];
  lang: Lang;
  onAddItem: (id: string) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, lang, onAddItem }) => {
  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          lang={lang}
          onAdd={onAddItem}
        />
      ))}
    </div>
  );
};