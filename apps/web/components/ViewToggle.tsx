import type { Category } from '@iwb/shared'
import Link from 'next/link'
import { withCategory } from '@/lib/use-category'

const VIEWS = [
  { href: '/', label: 'Map' },
  { href: '/list', label: 'List' },
] as const

/** Map | List as plain links, so it works while the map loads, if it fails, and without JavaScript. As tall as the button beside it. */
export function ViewToggle({ current, category }: { current: (typeof VIEWS)[number]['href']; category: Category }) {
  return (
    <nav aria-label="View" className="grid grid-cols-2 gap-2">
      {VIEWS.map(({ href, label }) => (
        <Link
          key={href}
          href={withCategory(href, category)}
          aria-current={href === current ? 'page' : undefined}
          className="flex min-h-12 items-center justify-center rounded-[10px] border border-edge font-bold aria-[current=page]:border-2 aria-[current=page]:border-brand aria-[current=page]:bg-tint"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
