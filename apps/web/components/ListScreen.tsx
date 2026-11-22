'use client'
import { categoryHeading, lifetimeText, type PublicTag } from '@iwb/shared'
import { useCategory } from '@/lib/use-category'
import { CategoryButtons } from './CategoryButtons'
import { ListTagButton } from './ListTagButton'
import { TagList } from './TagList'
import { ViewToggle } from './ViewToggle'

/** The list page's body: the chosen category's tags, from every live tag the server rendered. */
export function ListScreen({ tags, now, uploadsPaused }: { tags: PublicTag[]; now: Date; uploadsPaused: boolean }) {
  const [category, setCategory] = useCategory()
  const shown = tags.filter((tag) => tag.category === category)
  return (
    <>
      <div>
        <h1 className="text-lg font-bold">{categoryHeading(category, shown.length)}</h1>
        <p className="text-sm text-muted">Disappears {lifetimeText(category)} after the last sighting.</p>
      </div>
      <CategoryButtons current={category} onChange={setCategory} />
      <div className="flex flex-col gap-3">
        <ListTagButton category={category} tags={shown} now={now} uploadsPaused={uploadsPaused} />
        <ViewToggle current="/list" category={category} />
      </div>
      <TagList tags={shown} category={category} />
    </>
  )
}
