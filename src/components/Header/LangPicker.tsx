import React from 'react';
import type { Lang } from '../../types';

interface LangPickerProps {
  value: Lang;
  onChange: (lang: Lang) => void;
}

export const LangPicker: React.FC<LangPickerProps> = ({ value, onChange }) => {
  return (
    <select
      className="text-sm border rounded-full px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value as Lang)}
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="sr">SR</option>
      <option value="ru">RU</option>
    </select>
  );
};