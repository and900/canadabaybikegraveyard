import { CATEGORIES, type Category, OPERATORS, type Operator, type PublicTag } from '@iwb/shared'
import { PinIcon } from './PinIcon'

/**
 * The key: for bikes each operator's pin and how many of its bikes are live; for any other category its one pin and
 * how many are live. `tags` are already the category's, once they have arrived.
 */
export function Legend({ tags, category }: { tags?: PublicTag[]; category: Category }) {
  if (category !== 'bikes')
    return (
      <ul aria-label="Key" className="flex flex-wrap gap-x-3.5 gap-y-1 text-sm">
        <li className="flex items-center gap-1.5">
          <PinIcon pin={category} scale={1} />
          {CATEGORIES[category].noun} <span className="min-w-[2ch]">{tags?.length}</span>
        </li>
      </ul>
    )
  return (
    <ul aria-label="Key" className="flex flex-wrap gap-x-3.5 gap-y-1 text-sm">
      {(Object.keys(OPERATORS) as Operator[])
        .filter((operator) => OPERATORS[operator].active)
        .map((operator) => (
          <li key={operator} className="flex items-center gap-1.5">
            <PinIcon pin={operator as Exclude<Operator, 'council'>} scale={1} />
            {OPERATORS[operator].label}{' '}
            {/* As wide before the count arrives as after, so the key can't rewrap when it does. */}
            <span className="min-w-[2ch]">{tags?.filter((tag) => tag.operator === operator).length}</span>
          </li>
        ))}
    </ul>
  )
}
