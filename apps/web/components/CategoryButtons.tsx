'use client'
import { CATEGORIES, CATEGORY_KEYS, type Category } from '@iwb/shared'

/** The four categories as a 2 × 2 grid: the one chosen is what the map, the list and the key show, and what is added. */
export function CategoryButtons({ current, onChange }: { current: Category; onChange: (category: Category) => void }) {
  return (
    <div role="group" aria-label="Category" className="grid grid-cols-2 gap-2">
      {CATEGORY_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === current}
          onClick={() => onChange(key)}
          className="flex min-h-12 items-center justify-center rounded-[10px] border border-edge px-2 py-1 text-center text-sm leading-tight font-bold aria-pressed:border-2 aria-pressed:border-brand aria-pressed:bg-tint"
        >
          {CATEGORIES[key].label}
        </button>
      ))}
    </div>
  )
}
