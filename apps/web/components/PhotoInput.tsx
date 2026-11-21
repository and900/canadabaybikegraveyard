'use client'
import { ERRORS } from '@iwb/shared'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { shrinkPhoto } from '@/lib/photo'
import { announce } from './Announcer'
import { FOCUS_RING_WITHIN, PRIMARY, SECONDARY, SMALL } from './buttons'
import { PHOTO_TYPES } from './CameraButton'
import { ErrorText } from './ErrorText'

/**
 * The tag form's optional photo (§4.3): a file input behind a button, which phones offer as the camera or the library.
 * The chosen photo is re-encoded at once and shown back, and the notice beside it says photos are public. `onSkip`
 * adds "Skip photo" beside the button, for the step where choosing or skipping is what adds the bike.
 */
export function PhotoInput({
  photo,
  onPhoto,
  onSkip,
}: {
  photo?: Blob
  onPhoto: (photo?: Blob) => void
  onSkip?: () => void
}) {
  const [error, setError] = useState<string>()
  const input = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => photo && URL.createObjectURL(photo), [photo])
  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview)
  }, [preview])

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Emptied, so the same file chosen again, after Remove photo, still counts as a choice.
    event.target.value = ''
    if (!file) return
    try {
      onPhoto(await shrinkPhoto(file))
      setError(undefined)
    } catch {
      setError(ERRORS.bad_image.message)
      announce(ERRORS.bad_image.message)
    }
  }

  const remove = () => {
    onPhoto(undefined)
    // The button has gone with the photo: the input takes the focus.
    input.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      {preview && (
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL of the visitor's own photo */}
          <img src={preview} alt="Your photo" width={96} height={72} className="h-18 w-24 rounded-lg object-cover" />
          <button type="button" className={SMALL} onClick={remove}>
            Remove photo
          </button>
        </div>
      )}
      <div className={onSkip && !photo ? 'grid grid-cols-2 gap-2' : 'flex flex-col'}>
        <label className={`${photo ? SECONDARY : PRIMARY} cursor-pointer ${FOCUS_RING_WITHIN}`}>
          <input ref={input} type="file" accept={PHOTO_TYPES} onChange={choose} className="sr-only" />
          {photo ? (
            'Change photo'
          ) : (
            <>
              <span aria-hidden="true">＋&nbsp;</span>Add a photo
            </>
          )}
        </label>
        {onSkip && !photo && (
          <button type="button" className={SECONDARY} onClick={onSkip}>
            Skip photo
          </button>
        )}
      </div>
      <div className="text-sm text-muted">
        <p>Photos are public. Leave out people, faces and number plates.</p>
        {/* A new tab, so the form keeps what is filled in. */}
        <a href="/terms" target="_blank" className="inline-flex min-h-11 items-center underline underline-offset-2">
          Read the terms<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}
