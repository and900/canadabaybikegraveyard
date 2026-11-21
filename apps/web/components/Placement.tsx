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
 * The placement step's bar (§3): where the pin is, the other ways to set it, and Cancel. A spot found or tapped goes
 * straight to the form, so there is no Use this spot; Keep this spot shows only when Change location comes back here
 * with a spot already chosen. Not a dialog:
 * the whole map stays usable beside it, by tap and by the keyboard crosshair (§10.3, §10.4). Without the map, as on
 * /list, the other ways are all there is.
 */
export function Placement({
  spot,
  note,
  withMap = true,
  reading,
  onLocate,
  onChoose,
  onKeep,
  onCancel,
}: {
  spot?: Spot
  /** Said in place of the spot: why the last try placed no pin, or where Use my location put it. */
  note?: string
  withMap?: boolean
  /** The screen's location read, which opening the street picker stops. */
  reading: Reading
  onLocate: (located: Located) => void
  /** A spot chosen by street, which needs no confirming on the map: the form comes next. */
  onChoose: (spot: Spot) => void
  /** Back to the form with the spot it had, for Change location. */
  onKeep: () => void
  onCancel: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
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
      <p className="min-h-12">{note ?? (spot ? pinOn(spot) : prompt)}</p>
      <div className="grid grid-cols-2 gap-2">
        <LocateButton withMap={withMap} reading={reading} onLocate={onLocate} />
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
      <div className={spot ? 'grid grid-cols-2 gap-2' : 'flex flex-col'}>
        <button type="button" className={SECONDARY} onClick={onCancel}>
          Cancel
        </button>
        {spot && (
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
