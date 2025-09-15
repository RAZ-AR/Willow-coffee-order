import { jsx as _jsx } from "react/jsx-runtime";
import { MenuItem } from './MenuItem';
export const MenuGrid = ({ items, lang, onAddItem }) => {
    return (_jsx("div", { className: "grid grid-cols-2 gap-3 mt-3", children: items.map((item) => (_jsx(MenuItem, { item: item, lang: lang, onAdd: onAddItem }, item.id))) }));
};
