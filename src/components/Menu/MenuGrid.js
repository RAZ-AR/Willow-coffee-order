import { jsx as _jsx } from "react/jsx-runtime";
import { MenuItem } from './MenuItem';
export const MenuGrid = ({ items, lang, cart, onAddItem, onRemoveItem }) => {
    return (_jsx("div", { className: "grid grid-cols-2 gap-3 mt-3", children: items.map((item) => (_jsx(MenuItem, { item: item, lang: lang, quantity: cart[item.id] || 0, onAdd: onAddItem, onRemove: onRemoveItem }, item.id))) }));
};
