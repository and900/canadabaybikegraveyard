'use client'
import {
  type Operator,
  OPERATORS,
  operatorEmail,
  parseTag,
  type Problem,
  PROBLEMS,
  type PublicTag,
  type TagJson,
} from '@iwb/shared'
import { useState } from 'react'
import { rememberMine } from '@/lib/mine'
import { canRetry, send, type SendError } from '@/lib/send'
import { announce } from './Announcer'
import { PRIMARY, SECONDARY, SMALL } from './buttons'
import { Chips } from './Chips'
import { Dialog } from './Dialog'
import { ErrorText } from './ErrorText'
import { PhotoInput } from './PhotoInput'
import { pinOn, type Spot } from './Placement'

/** One bike at the spot. Its id, made when the form opens, is its tag's from then on (§5.3). */
export type Draft = { id: string; operator?: Operator; problem?: Problem; photo?: Blob }

const OPERATOR_CHOICES = (Object.keys(OPERATORS) as Operator[])
  .filter((key) => OPERATORS[key].active)
  .map((key) => [key, OPERATORS[key].label] as const)
const PROBLEM_CHOICES = (Object.keys(PROBLEMS) as Problem[]).map((key) => [key, PROBLEMS[key]] as const)

/**
 * The tag form (§3), one bike at a time: whose bike and what's wrong, then the photo step, where adding a photo or
 * skipping it is what adds the bike. A photo taken before tagging started skips that step: the second answer adds the
 * bike. The tag is sent first and the photo after it, so a photo that fails leaves the tag added. Then "Bike added"
 * offers the email to the operator (waiting for the photo), another bike at the same spot, Home, and Undo. No free
 * text (§6).
 */
export function TagForm({
  spot,
  draft,
  onDraft,
  uploadsPaused,
  apply,
  onChangeLocation,
  onAnother,
  onClose,
}: {
  spot: Spot
  draft: Draft
  onDraft: (draft: Draft) => void
  uploadsPaused: boolean
  apply: (id: string, tag: TagJson | null) => void
  onChangeLocation: () => void
  /** Another bike at this spot: a new form, with the answers cleared. */
  onAnother: () => void
  onClose: () => void
}) {
  const [failure, setFailure] = useState<string>()
  const [sending, setSending] = useState(false)
  // Once the server has answered for the tag: the tag, null if it is no longer live.
  const [saved, setSaved] = useState<{ tag: PublicTag | null }>()
  const [photoStatus, setPhotoStatus] = useState<'sending' | 'done' | 'failed'>()
  const [photoError, setPhotoError] = useState<SendError>()
  const [undo, setUndo] = useState<{ sending: boolean; error?: string }>({ sending: false })

  const answered = (d: Draft) => !!d.operator && !!d.problem
  // With a photo already, or none possible, the second answer adds the bike; otherwise the photo step does.
  const answerAdds = !!draft.photo || uploadsPaused

  /** Sends the photo to the tag, which has one photo, so a repeat can't add a second (§5.3). */
  const attach = async (id: string, photo: Blob) => {
    setPhotoStatus('sending')
    setPhotoError(undefined)
    const body = new FormData()
    body.append('photo', photo, 'photo.jpg')
    const sent = await send<{ tag: TagJson | null }>(`/api/tags/${id}/photo`, body)
    if (sent.ok) {
      apply(id, sent.data.tag)
      setPhotoStatus('done')
      announce('Photo added')
    } else {
      setPhotoStatus('failed')
      setPhotoError(sent.error)
      announce(`The photo didn't upload. ${sent.error.message}`)
    }
  }

  const save = async (d: Draft) => {
    if (sending || !d.operator || !d.problem) return
    setSending(true)
    setFailure(undefined)
    const sent = await send<{ tag: TagJson | null }>('/api/tags', {
      id: d.id,
      lat: spot.lat,
      lng: spot.lng,
      operator: d.operator,
      problem: d.problem,
      ...(spot.picked && { street: spot.street }),
    })
    if (!sent.ok) {
      // The answers stay, and so does the id, so sending again can't add a tag twice.
      setSending(false)
      setFailure(sent.error.message)
      announce(sent.error.message)
      return
    }
    rememberMine(d.id)
    apply(d.id, sent.data.tag)
    setSaved({ tag: sent.data.tag && parseTag(sent.data.tag) })
    setSending(false)
    announce('Bike added')
    if (d.photo) await attach(d.id, d.photo)
  }

  const answer = (answers: Partial<Draft>) => {
    const next = { ...draft, ...answers }
    onDraft(next)
    if (!answered(next)) return
    if (answerAdds) {
      if (!failure) void save(next)
    } else if (!answered(draft)) announce('Add a photo, or skip it.')
  }

  const choosePhoto = (photo?: Blob) => {
    const next = { ...draft, photo }
    onDraft(next)
    if (photo && answered(next) && !failure) void save(next)
  }

  const undoTag = async () => {
    if (undo.sending) return
    setUndo({ sending: true })
    const sent = await send(`/api/tags/${draft.id}/gone`, { requestId: crypto.randomUUID() })
    if (sent.ok || sent.error.code === 'tag_gone') {
      apply(draft.id, null)
      announce('Bike removed')
      onClose()
    } else setUndo({ sending: false, error: sent.error.message })
  }

  if (saved) {
    const email = saved.tag && operatorEmail(saved.tag, location.origin)
    const uploading = photoStatus === 'sending'
    return (
      <Dialog key="saved" title="Bike added" showCancel={false} onCancel={onClose}>
        <div className="flex flex-col gap-3">
          <div role="status">
            {uploading && <p>Uploading your photo…</p>}
            {photoStatus === 'done' && <p>Photo added.</p>}
          </div>
          {photoStatus === 'failed' && photoError && (
            <div className="flex flex-col gap-2">
              <ErrorText>{`The photo didn't upload. ${photoError.message}`}</ErrorText>
              {canRetry(photoError) && draft.photo && (
                <button type="button" className={`${SMALL} self-start`} onClick={() => attach(draft.id, draft.photo!)}>
                  Try again
                </button>
              )}
            </div>
          )}
          {email &&
            (uploading ? (
              <button type="button" disabled className={`${PRIMARY} opacity-50`}>
                Email {OPERATORS[saved.tag!.operator].label}
              </button>
            ) : (
              <a href={email.href} className={PRIMARY}>
                Email {OPERATORS[saved.tag!.operator].label}
              </a>
            ))}
          {email && <p className="text-sm text-muted">Opens your own email app. This site sends nothing.</p>}
          <button type="button" className={SECONDARY} onClick={onAnother}>
            Add another bike here
          </button>
          <button type="button" className={SECONDARY} onClick={onClose}>
            Home
          </button>
          <button
            type="button"
            className={`${SMALL} self-start disabled:opacity-50`}
            disabled={uploading || undo.sending}
            onClick={undoTag}
          >
            Undo: remove this bike
          </button>
          {undo.error && <ErrorText>{undo.error}</ErrorText>}
        </div>
      </Dialog>
    )
  }

  const showPhoto = !uploadsPaused && (answered(draft) || !!draft.photo)
  return (
    <Dialog title="Tag a dumped bike" onCancel={onClose} busy={sending}>
      {/* Nothing changes while the bike is sent. */}
      <div inert={sending} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">{pinOn(spot)}</p>
          <button type="button" className={SMALL} onClick={onChangeLocation}>
            Change location
          </button>
        </div>
        <Chips
          legend="Whose bike?"
          name="operator"
          choices={OPERATOR_CHOICES}
          value={draft.operator}
          onChange={(operator) => answer({ operator })}
        />
        <Chips
          legend="What's wrong?"
          name="problem"
          choices={PROBLEM_CHOICES}
          value={draft.problem}
          onChange={(problem) => answer({ problem })}
        />
        {uploadsPaused && <p>Photos are switched off for now.</p>}
        {showPhoto && (
          <PhotoInput
            photo={draft.photo}
            onPhoto={choosePhoto}
            onSkip={answered(draft) && !draft.photo && !failure ? () => void save(draft) : undefined}
          />
        )}
        {failure && (
          <>
            <ErrorText>{failure}</ErrorText>
            <button type="button" className={PRIMARY} onClick={() => void save(draft)}>
              Try again
            </button>
          </>
        )}
      </div>
      {sending && <p role="status">Adding…</p>}
    </Dialog>
  )
}
