'use client';
import { CATEGORIES } from '@/categories/config';

type CategoriesSidebarProps = {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
};

export default function CategoriesSidebar({ selectedCategory, onCategorySelect }: CategoriesSidebarProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-neutral-400">Categories</div>
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-2 rounded-xl border text-sm ${
            !selectedCategory
              ? 'border-gold text-gold'
              : 'border-border text-neutral-300 hover:bg-neutral-900'
          }`}
          onClick={() => onCategorySelect(null)}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`px-3 py-2 rounded-xl border text-sm inline-flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'border-gold text-gold'
                : 'border-border text-neutral-300 hover:bg-neutral-900'
            }`}
            onClick={() => onCategorySelect(cat.id)}
          >
            <span>{cat.emoji ?? '•'}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
