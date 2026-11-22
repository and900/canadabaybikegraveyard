'use client'
import {
  CATEGORIES,
  type Category,
  type Operator,
  OPERATORS,
  operatorEmail,
  parseTag,
  publicPhotos,
  type Problem,
  PROBLEMS,
  type PublicTag,
  type TagJson,
} from '@iwb/shared'
import { Fragment, useEffect, useRef, useState } from 'react'
import { rememberMine } from '@/lib/mine'
import { canRetry, send, type SendError } from '@/lib/send'
import { announce } from './Announcer'
import { PRIMARY, SECONDARY, SMALL } from './buttons'
import { Chips } from './Chips'
import { Dialog } from './Dialog'
import { ErrorText } from './ErrorText'
import { PhotoInput } from './PhotoInput'
import { pinOn, type Spot } from './Placement'

/** One bike at the spot. Its id, made when it joins the form, is its tag's from then on (§5.3). */
export type Bike = { id: string; operator?: Operator; problem?: Problem }
/**
 * What the visitor has said so far, kept across Change location: the bikes at the spot and one photo of them (§4.2).
 * `registration` is a parking issue's optional number plate: it lives on the phone, and goes only in the email.
 */
export type Draft = { bikes: Bike[]; photo?: Blob; registration?: string }

const OPERATOR_CHOICES = (Object.keys(OPERATORS) as Operator[])
  .filter((key) => OPERATORS[key].active)
  .map((key) => [key, OPERATORS[key].label] as const)
const problemChoices = (category: Category) =>
  (CATEGORIES[category].problems as readonly Problem[]).map((key) => [key, PROBLEMS[key]] as const)
/** The most bikes one form adds (§4.2): a pile, kept small enough to check at a glance. */
const MOST_BIKES = 5
/** Bike 1's radios keep the names the form has always had; each other bike's are its own. */
const nameOf = (field: 'operator' | 'problem', index: number) => (index ? `${field}-${index + 1}` : field)
const addedMessage = (category: Category, count: number) =>
  category !== 'bikes' ? 'Issue logged' : count > 1 ? `${count} bikes added` : 'Bike added'

/**
 * The tag form (§3): whose bike and what's wrong for each bike at the spot, then the photo step, where adding a photo
 * or skipping it is what adds the bikes; "Add another bike here" is also there, so one photo can cover a pile of up
 * to five (§4.2). Photos switched off make the step "Add to the map"
 * instead. Each bike is its own tag, sent one after another and the photo to each after them, so a photo that fails
 * leaves the tags added (§4.3). Then "Bike added" offers an email per bike (waiting for the photo), Home, and Undo.
 * No free text (§6).
 */
export function TagForm({
  category,
  spot,
  draft,
  onDraft,
  uploadsPaused,
  apply,
  onChangeLocation,
  onClose,
}: {
  category: Category
  spot: Spot
  draft: Draft
  onDraft: (draft: Draft) => void
  uploadsPaused: boolean
  apply: (id: string, tag: TagJson | null) => void
  onChangeLocation: () => void
  onClose: () => void
}) {
  const [failure, setFailure] = useState<string>()
  const [sending, setSending] = useState(false)
  // The bikes the server has answered for, by id: the tag, null if it is no longer live. On the map, so not to be
  // changed or sent again.
  const [results, setResults] = useState<Record<string, PublicTag | null>>({})
  const [saved, setSaved] = useState(false)
  const [photoStatus, setPhotoStatus] = useState<'sending' | 'done'>()
  // Why the photo didn't upload, and the tags, already added, still without it.
  const [photoFailure, setPhotoFailure] = useState<{ error: SendError; ids: string[] }>()
  const [undo, setUndo] = useState<{ sending: boolean; error?: string }>({ sending: false })
  // The element to focus once a bike has been added to or taken out of the form.
  const focusNext = useRef<string>(null)
  const { bikes } = draft
  const isBike = category === 'bikes'
  const config = CATEGORIES[category]
  // A private photo (parking) stays on the phone: it is chosen here, never sent, and goes in the visitor's own email.
  const isPublic = publicPhotos(category)
  const several = bikes.length > 1
  const added = Object.keys(results)
  // An added bike stays a named group even if the bikes after it are removed, to say that it is added.
  const grouped = several || added.length > 0
  const answered = (list: Bike[]) => list.every((bike) => bike.problem && (!isBike || bike.operator))
  const ready = answered(bikes)

  useEffect(() => {
    if (focusNext.current) document.getElementById(focusNext.current)?.focus()
    focusNext.current = null
  }, [bikes.length])

  const update = (index: number, answer: Partial<Bike>) => {
    const next = bikes.map((bike, i) => (i === index ? { ...bike, ...answer } : bike))
    onDraft({ ...draft, bikes: next })
    // A private category has no photo step to add it: the last answer does, and the photo and number plate come after.
    if (!isPublic && !ready && answered(next)) void save(undefined, next)
    else if (!ready && answered(next) && !draft.photo && !uploadsPaused) announce('Add a photo, or skip it.')
  }

  /** A new bike, answered as the one above it, since a pile usually shares both answers (§4.2). */
  const addBike = () => {
    const id = crypto.randomUUID()
    focusNext.current = `bike-${id}`
    onDraft({ ...draft, bikes: [...bikes, { ...bikes.at(-1), id }] })
    announce(`Bike ${bikes.length + 1} added to the form, the same as bike ${bikes.length}`)
  }

  const removeBike = (index: number) => {
    focusNext.current = 'add-bike'
    onDraft({ ...draft, bikes: bikes.filter((_, i) => i !== index) })
    announce(`Bike ${index + 1} removed`)
  }

  /** Sends the photo to each tag, one copy each. Sent again, it can't add a second: a tag has one photo (§5.3). */
  const attach = async (ids: string[], photo: Blob) => {
    setPhotoStatus('sending')
    setPhotoFailure(undefined)
    const failed: string[] = []
    let error: SendError | undefined
    for (const id of ids) {
      const body = new FormData()
      body.append('photo', photo, 'photo.jpg')
      const sent = await send<{ tag: TagJson | null }>(`/api/tags/${id}/photo`, body)
      if (sent.ok) apply(id, sent.data.tag)
      else {
        failed.push(id)
        error = sent.error
      }
    }
    if (error) {
      setPhotoStatus(undefined)
      setPhotoFailure({ error, ids: failed })
      announce(`${photoFailed(failed.length)} ${error.message}`)
    } else {
      setPhotoStatus('done')
      announce('Photo added')
    }
  }

  const photoFailed = (count: number) =>
    several
      ? `Bikes added, but the photo didn't upload for ${count} of them.`
      : "Bike added, but the photo didn't upload."

  /** Adds the bikes, then sends the photo, if there is one. */
  const save = async (photo?: Blob, list = bikes) => {
    if (sending || !answered(list)) return
    setSending(true)
    setFailure(undefined)
    if (list.length > 1) announce(`Adding ${list.length} bikes…`)
    // A photo kept on the phone is never sent.
    const upload = isPublic ? photo : undefined
    const done = { ...results }
    for (const { id, operator, problem } of list) {
      // Each is on the map as soon as it is added. The first not answered for is sent again, as its answer may have been
      // lost: the server answers a repeat with the tag as it is and counts nothing (§5.3).
      if (id in done) continue
      const sent = await send<{ tag: TagJson | null }>('/api/tags', {
        id,
        lat: spot.lat,
        lng: spot.lng,
        category,
        ...(isBike && { operator }),
        problem,
        ...(spot.picked && { street: spot.street }),
      })
      if (!sent.ok) {
        // The answers stay, and so do the ids, so sending again can't add a tag twice.
        setSending(false)
        setResults(done)
        setFailure(sent.error.message)
        announce(
          several
            ? `${Object.keys(done).length} of ${bikes.length} bikes added. ${sent.error.message}`
            : sent.error.message,
        )
        return
      }
      rememberMine(id)
      apply(id, sent.data.tag)
      done[id] = sent.data.tag && parseTag(sent.data.tag)
    }
    setResults(done)
    setSending(false)
    setSaved(true)
    announce(addedMessage(category, list.length))
    if (upload)
      await attach(
        list.map(({ id }) => id),
        upload,
      )
  }

  const choosePhoto = (photo?: Blob) => {
    onDraft({ ...draft, photo })
    // A first photo, with every question answered, adds the bikes; changing one only changes it.
    if (photo && !draft.photo && ready && !failure && isPublic) void save(photo)
  }

  /** Takes every bike of the batch off the map again; the ones already gone count as done. */
  const undoAll = async () => {
    if (undo.sending) return
    setUndo({ sending: true })
    for (const { id } of bikes) {
      const sent = await send(`/api/tags/${id}/gone`, { requestId: crypto.randomUUID() })
      if (!sent.ok && sent.error.code !== 'tag_gone') {
        setUndo({ sending: false, error: sent.error.message })
        return
      }
      apply(id, null)
    }
    announce(several ? 'Bikes removed' : 'Bike removed')
    onClose()
  }

  if (saved) {
    const uploading = photoStatus === 'sending'
    return (
      <Dialog
        key="saved"
        title={isBike ? (several ? 'Bikes added' : 'Bike added') : 'Issue logged'}
        showCancel={false}
        onCancel={onClose}
      >
        <div className="flex flex-col gap-3">
          <div role="status">
            {uploading && <p>Uploading your photo…</p>}
            {photoStatus === 'done' && <p>Photo added.</p>}
          </div>
          {photoFailure && (
            <div className="flex flex-col gap-2">
              <ErrorText>{`${photoFailed(photoFailure.ids.length)} ${photoFailure.error.message}`}</ErrorText>
              {canRetry(photoFailure.error) && draft.photo && (
                <button
                  type="button"
                  className={`${SMALL} self-start`}
                  onClick={() => attach(photoFailure.ids, draft.photo!)}
                >
                  Try again
                </button>
              )}
            </div>
          )}
          {!isPublic && (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-bold">Number plate (optional)</span>
                <input
                  type="text"
                  value={draft.registration ?? ''}
                  maxLength={10}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) =>
                    onDraft({ ...draft, registration: event.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '') })
                  }
                  className="min-h-12 rounded-[10px] border border-edge px-3 uppercase"
                />
                <span className="text-sm text-muted">Stays on your phone. Only goes in your email.</span>
              </label>
              <PhotoInput photo={draft.photo} onPhoto={(photo) => onDraft({ ...draft, photo })} isPrivate />
            </>
          )}
          {bikes.map((bike, index) => {
            const tag = results[bike.id]
            const email = tag && operatorEmail(tag, location.origin, draft.registration)
            if (!tag || !email) return null
            if (!isPublic) return <EmailWithPhoto key={bike.id} email={email} photo={draft.photo} />
            const label = isBike
              ? `Email ${OPERATORS[tag.operator].label}${several ? ` (bike ${index + 1})` : ''}`
              : 'Email the council'
            return uploading ? (
              <button key={bike.id} type="button" disabled className={`${PRIMARY} opacity-50`}>
                {label}
              </button>
            ) : (
              <a key={bike.id} href={email.href} className={PRIMARY}>
                {label}
              </a>
            )
          })}
          <p className="text-sm text-muted">
            {isPublic
              ? 'Email opens your own email app. This site sends nothing.'
              : 'Your photo and number plate go only in your own email. This site does not receive them.'}
          </p>
          <button type="button" className={SECONDARY} onClick={onClose}>
            Home
          </button>
          <button
            type="button"
            className={`${SMALL} self-start disabled:opacity-50`}
            disabled={uploading || undo.sending}
            onClick={undoAll}
          >
            {isBike ? (several ? 'Undo: remove these bikes' : 'Undo: remove this bike') : 'Undo: remove this'}
          </button>
          {undo.error && <ErrorText>{undo.error}</ErrorText>}
        </div>
      </Dialog>
    )
  }

  const addLabel = several ? `Add ${bikes.length} bikes to the map` : 'Add to the map'
  // Only a public category has a photo step: a private photo is added after, on the screen that has the email.
  const photoStep = isPublic && (ready || !!draft.photo)
  const problemChoicesHere = problemChoices(category)
  return (
    <Dialog title={config.add} onCancel={onClose} busy={sending}>
      {/* Nothing changes while the bikes are sent. */}
      <div inert={sending} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">{pinOn(spot)}</p>
          {/* Once a bike is added, the pile's spot is fixed. */}
          {!added.length && (
            <button type="button" className={SMALL} onClick={onChangeLocation}>
              Change location
            </button>
          )}
        </div>
        {bikes.map((bike, index) => {
          const questions = (
            <>
              {isBike && (
                <Chips
                  legend="Whose bike?"
                  name={nameOf('operator', index)}
                  choices={OPERATOR_CHOICES}
                  value={bike.operator}
                  onChange={(operator) => update(index, { operator })}
                />
              )}
              <Chips
                legend={isBike ? "What's wrong?" : "What's the issue?"}
                name={nameOf('problem', index)}
                choices={problemChoicesHere}
                value={bike.problem}
                onChange={(problem) => update(index, { problem })}
              />
            </>
          )
          const isAdded = added.includes(bike.id)
          // One bike is the form as it always was; with several, each is a named group (§10.4).
          return grouped ? (
            <fieldset
              key={bike.id}
              id={`bike-${bike.id}`}
              tabIndex={-1}
              disabled={isAdded}
              className="flex flex-col gap-4 rounded-[10px] border border-edge p-3"
            >
              <legend className="px-1 font-bold">
                Bike {index + 1}
                {isAdded && ', added'}
              </legend>
              {index > 0 && !isAdded && (
                <button type="button" className={`${SMALL} self-start`} onClick={() => removeBike(index)}>
                  Remove bike {index + 1}
                </button>
              )}
              {questions}
            </fieldset>
          ) : (
            <Fragment key={bike.id}>{questions}</Fragment>
          )
        })}
        {photoStep && (
          <>
            {uploadsPaused ? (
              <p>Photos are switched off for now.</p>
            ) : (
              <PhotoInput
                photo={draft.photo}
                onPhoto={choosePhoto}
                onSkip={ready && !draft.photo && !failure ? () => void save() : undefined}
              />
            )}
            {/* With a photo already, or none possible, nothing else adds the bikes. A private photo never adds them. */}
            {ready && (draft.photo || uploadsPaused) && !failure && (
              <button type="button" className={PRIMARY} onClick={() => void save(draft.photo)}>
                {addLabel}
              </button>
            )}
            {ready &&
              config.several &&
              (bikes.length < MOST_BIKES ? (
                <button id="add-bike" type="button" className={SECONDARY} onClick={addBike}>
                  Add another bike here
                </button>
              ) : (
                <p>That&apos;s the most in one go.</p>
              ))}
          </>
        )}
        {failure && several && added.length > 0 && (
          <p className="font-bold">
            {added.length} of {bikes.length} bikes added.
          </p>
        )}
        {failure && (
          <>
            <ErrorText>{failure}</ErrorText>
            <button type="button" className={PRIMARY} onClick={() => void save(draft.photo)}>
              Try again
            </button>
          </>
        )}
      </div>
      {sending && <p role="status">Adding…</p>}
    </Dialog>
  )
}

type Email = NonNullable<ReturnType<typeof operatorEmail>>

/**
 * The email for a parking issue. The photo stays on the visitor's phone, and a mailto link cannot attach one, so with a
 * photo the phone's share sheet takes it to the visitor's email app, and the council's address is copied to paste in.
 * Without a photo, or where the phone can't share one, it is the plain email.
 */
function EmailWithPhoto({ email, photo }: { email: Email; photo?: Blob }) {
  const [shared, setShared] = useState(false)
  const file = photo && new File([photo], 'photo.jpg', { type: photo.type || 'image/jpeg' })
  const canShare = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  const share = async () => {
    if (!file) return
    // Copied first, in the same tap: the share sheet's email app asks for an address the message cannot carry.
    void navigator.clipboard?.writeText(email.to).catch(() => {})
    try {
      await navigator.share({ files: [file], title: email.subject, text: email.message })
      setShared(true)
    } catch {
      // Closed without sharing: nothing to say.
    }
  }

  return (
    <>
      {canShare ? (
        <>
          <button type="button" className={PRIMARY} onClick={share}>
            Email with photo
          </button>
          <p className="text-sm text-muted">
            Opens your share sheet. The address is copied: paste it into To.{' '}
            <span className="whitespace-nowrap font-bold">{email.to}</span>
          </p>
          {shared && <p role="status">Shared.</p>}
          <a href={email.href} className={SECONDARY}>
            Email without photo
          </a>
        </>
      ) : (
        <>
          <a href={email.href} className={PRIMARY}>
            Email the council
          </a>
          {photo && (
            <p className="text-sm text-muted">
              This phone can&apos;t attach your photo for you: add it from your photos once your email app opens.
            </p>
          )}
        </>
      )}
    </>
  )
}
