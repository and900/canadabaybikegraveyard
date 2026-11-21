'use client'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { PRIMARY, SECONDARY } from './buttons'
import { LocateButton, type Located, type Reading } from './LocateButton'

// Loaded when it opens, out of the JavaScript before the map (§11.1).
const StreetPicker = lazy(() => import('./StreetPicker').then((module) => ({ default: module.StreetPicker })))

/**
 * A spot inside the council or its 20 m strip, with the street and suburb where() gives it. Chosen by street, it has
 * the street the visitor picked instead, and `picked`, so the tag sends it (§10.3).
 */
export type Spot = { lat: number; lng: number; street: string; suburb: string; picked?: true }

export const OUTSIDE = 'That spot is outside Canada Bay. Tap inside the gold line.'
export const pinOn = (spot: Spot) => `Pin on ${spot.street}, ${spot.suburb}`

/**
 * The way into tagging (§3): "Tag a dumped bike" with Use my location and Choose by street, on the map screen and on
 * /list. A spot found or chosen goes straight to the form. Without `onCancel` it is the start, with a line under the
 * buttons only while a location is being found. With `onCancel` tagging has begun and the spot needs placing again:
 * after Change location, or because Use my location couldn't place one. The note says why, and on the map a tap
 * places the pin (§10.3, §10.4); Cancel ends it, and Keep this spot, shown when Change location left a spot, goes
 * back to the form with it. Not a dialog: the whole map stays usable beside it.
 */
export function Placement({
  spot,
  note,
  withMap = true,
  reading,
  onLocate,
  onResult,
  onChoose,
  onKeep,
  onCancel,
}: {
  spot?: Spot
  /** Said in place of the spot: where a location read has got to, or why it placed no pin. */
  note?: string
  withMap?: boolean
  /** The screen's location read, which opening the street picker stops. */
  reading: Reading
  /** A rough reading on the way. */
  onLocate: (located: Located) => void
  /** Where the read ended. */
  onResult: (located: Located) => void
  /** A spot chosen by street, which needs no confirming on the map: the form comes next. */
  onChoose: (spot: Spot) => void
  /** Back to the form with the spot it had, for Change location. */
  onKeep?: () => void
  onCancel?: () => void
}) {
  const idle = !onCancel
  const heading = useRef<HTMLHeadingElement>(null)
  // Placing again takes the focus; the start of tagging doesn't, or the page would grab it as it loads.
  useEffect(() => {
    if (!idle) heading.current?.focus()
  }, [idle])
  const [choosing, setChoosing] = useState(false)
  const chooseButton = useRef<HTMLButtonElement>(null)
  const prompt = withMap ? 'Tap the map where the bike is.' : 'Use your location, or choose the street.'

  const stopChoosing = () => {
    flushSync(() => setChoosing(false))
    chooseButton.current?.focus()
  }

  return (
    <section aria-labelledby="placement-heading" className="flex flex-col gap-3">
      <h2 id="placement-heading" ref={heading} tabIndex={-1} className="text-lg font-bold">
        Tag a dumped bike
      </h2>
      {!idle && <p className="min-h-12">{note ?? (spot ? pinOn(spot) : prompt)}</p>}
      <div className="grid grid-cols-2 gap-2">
        <LocateButton withMap={withMap} reading={reading} onLocate={onLocate} onResult={onResult} primary={idle} />
        <button
          ref={chooseButton}
          type="button"
          className={SECONDARY}
          onClick={() => {
            reading.stop()
            setChoosing(true)
          }}
        >
          Choose by street
        </button>
      </div>
      {idle && note && <p>{note}</p>}
      {!idle && (
        <div className={spot ? 'grid grid-cols-2 gap-2' : 'flex flex-col'}>
          <button type="button" className={SECONDARY} onClick={onCancel}>
            Cancel
          </button>
          {spot && onKeep && (
            <button
              type="button"
              className={PRIMARY}
              onClick={() => {
                // A reading still on its way must not move the spot the visitor has just confirmed.
                reading.stop()
                onKeep()
              }}
            >
              Keep this spot
            </button>
          )}
        </div>
      )}
      {choosing && (
        <Suspense>
          <StreetPicker
            onUse={(chosen) => {
              setChoosing(false)
              onChoose(chosen)
            }}
            onCancel={stopChoosing}
          />
        </Suspense>
      )}
    </section>
  )
}
