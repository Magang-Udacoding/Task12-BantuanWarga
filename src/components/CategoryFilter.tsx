import React from 'react';
import { CATEGORIES } from '@/types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const allCategories = ['Semua', ...CATEGORIES];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {allCategories.map((category) => {
        const isSelected = selectedCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`whitespace-nowrap px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
              isSelected
                ? 'bg-text-primary text-background border-border-custom shadow-[2px_2px_0px_0px_var(--border)]'
                : 'bg-card text-text-primary border-border-custom hover:bg-bg-slate-gray'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
