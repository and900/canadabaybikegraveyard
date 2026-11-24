import { createHash } from 'node:crypto'
import { parseRecipients } from '@iwb/shared'
import {
  addRecipients,
  allowLoginTry,
  deleteRecipient,
  forgetOpens,
  saveCardSettings,
  updateRecipient,
} from '@iwb/server'
import { ADMIN_COOKIE, ADMIN_PATH, adminOpen, ownOrigin, same, sessionValue, signedIn } from '@/lib/cards-admin'
import { cardsAdminPassword, onVercel } from '@/lib/env'

const back = (notice?: string, headers: HeadersInit = {}) =>
  new Response(null, {
    status: 303,
    headers: { Location: notice ? `${ADMIN_PATH}?notice=${encodeURIComponent(notice)}` : ADMIN_PATH, ...headers },
  })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The Christmas cards admin's form posts: signing in and out, the shared words, and the recipients. */
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!ownOrigin(request)) return new Response("Only this site's own forms can post here.", { status: 403 })
  if (!adminOpen()) return new Response('Not found.', { status: 404 })
  const { action } = await params
  const form = await request.formData()
  const text = (name: string) => (typeof form.get(name) === 'string' ? (form.get(name) as string) : '')

  if (action === 'login') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
    if (!(await allowLoginTry(createHash('sha256').update(ip).digest('hex'))))
      return back('Too many tries. Wait an hour and try again.')
    if (!same(text('password'), cardsAdminPassword())) return back('That password is not right.')
    const secure = new URL(request.url).protocol === 'https:' || onVercel
    return back(undefined, {
      'Set-Cookie': `${ADMIN_COOKIE}=${sessionValue()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${30 * 86400}${secure ? '; Secure' : ''}`,
    })
  }

  if (!(await signedIn())) return back('Sign in first.')

  switch (action) {
    case 'logout':
      return back(undefined, { 'Set-Cookie': `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` })
    case 'settings':
      return back(
        (await saveCardSettings({ message: text('message'), signoff: text('signoff'), theme: text('theme') }))
          ? 'Card saved.'
          : 'The message and sign-off can not be empty.',
      )
    case 'add': {
      const list = parseRecipients(text('names'))
      if (!list.length) return back('Nothing to add: type a name on each line.')
      await addRecipients(list)
      return back(list.length === 1 ? 'Added 1 person.' : `Added ${list.length} people.`)
    }
    case 'update':
      return back(
        UUID.test(text('id')) &&
          (await updateRecipient(text('id'), {
            name: text('name'),
            greeting: text('greeting'),
            message: text('message'),
          }))
          ? 'Saved.'
          : 'Could not save: a name is needed.',
      )
    case 'delete':
      return back(UUID.test(text('id')) && (await deleteRecipient(text('id'))) ? 'Deleted.' : 'Not found.')
    case 'forget-opens':
      await forgetOpens()
      return back('Cleared who has opened their card.')
    default:
      return new Response('Not found.', { status: 404 })
  }
}
