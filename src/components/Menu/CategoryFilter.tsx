import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-3 py-2 rounded-full border text-sm whitespace-nowrap ${
            category === activeCategory
              ? "bg-teal-500 text-white border-teal-500"
              : "border-gray-200"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};