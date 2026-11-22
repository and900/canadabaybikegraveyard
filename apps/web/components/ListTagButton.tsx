'use client'
import type { Category, PublicTag } from '@iwb/shared'
import { useRouter } from 'next/navigation'
import { lazy, Suspense, useState } from 'react'
import { flushSync } from 'react-dom'
import { type Located, unlessFinding, useReading } from './LocateButton'
import { Placement, type Spot } from './Placement'

// The dialogs load when tagging starts (§11.1).
const TagFlow = lazy(() => import('./TagFlow').then((module) => ({ default: module.TagFlow })))

/**
 * Tagging on /list (§10.3): Use my location and Choose by street, as on the map screen but without the map, then the
 * usual dialogs. The page never loads MapLibre. A new tag shows once the page refreshes from the server.
 */
export function ListTagButton({
  category,
  tags,
  now,
  uploadsPaused,
}: {
  category: Category
  tags: PublicTag[]
  now: Date
  uploadsPaused: boolean
}) {
  const router = useRouter()
  const [tagging, setTagging] = useState<'place' | 'describe'>()
  const [spot, setSpot] = useState<Spot>()
  const [note, setNote] = useState<string>()
  // Finding where the visitor is. Stopped early, it no longer says it is finding them.
  const reading = useReading(() => setNote(unlessFinding))

  const end = () => {
    reading.stop()
    flushSync(() => {
      setTagging(undefined)
      setSpot(undefined)
      setNote(undefined)
    })
    // Back at the start of tagging, which takes the focus.
    document.getElementById('placement-heading')?.focus()
  }

  /** Where the read ended: a spot goes straight to the form; without one the note says why, and a street can be chosen. */
  const located = (result: Located) => {
    setNote(result.note)
    setSpot(result.spot)
    if (result.spot) setTagging('describe')
  }

  return (
    <div className="basis-full">
      {/* Tagging needs JavaScript; without it the buttons would do nothing, so they make way for a line saying so. */}
      <p className="hidden noscript:block">Turn on JavaScript to add to the list.</p>
      <div className="noscript:hidden">
        <Placement
          category={category}
          spot={spot}
          note={note}
          withMap={false}
          reading={reading}
          onLocate={(progress) => setNote(progress.note)}
          onResult={located}
          onChoose={(chosen) => {
            reading.stop()
            setSpot(chosen)
            setNote(undefined)
            setTagging('describe')
          }}
          onKeep={() => setTagging('describe')}
          onCancel={tagging ? end : undefined}
        />
      </div>
      {tagging && (
        <Suspense>
          <TagFlow
            category={category}
            spot={tagging === 'describe' ? spot : undefined}
            tags={tags}
            now={now}
            uploadsPaused={uploadsPaused}
            apply={() => router.refresh()}
            onChangeLocation={() => {
              // The dialog has to close first: until then the bar is inert and can't take the focus.
              flushSync(() => setTagging('place'))
              document.getElementById('placement-heading')?.focus()
            }}
            onClose={end}
          />
        </Suspense>
      )}
    </div>
  )
}
