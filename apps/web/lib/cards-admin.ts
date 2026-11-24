import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { cardsAdminPassword } from './env'

export const ADMIN_COOKIE = 'cards_admin'
export const ADMIN_PATH = '/cards-admin'

/** What the cookie holds: a keyed hash that only the password's owner could have, so it changes when the password does. */
export const sessionValue = () => createHmac('sha256', cardsAdminPassword()).update('cards-admin:v1').digest('hex')

const sha256 = (text: string) => createHash('sha256').update(text).digest()
/** Whether two strings are equal, without telling a guess how much of it was right. */
export const same = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b))

/** Whether the admin has a password at all. Without one the page stays closed. */
export const adminOpen = () => cardsAdminPassword() !== ''

export async function signedIn() {
  if (!adminOpen()) return false
  const sent = (await cookies()).get(ADMIN_COOKIE)?.value
  return !!sent && same(sent, sessionValue())
}

/** Whether a post came from this site's own pages: HTTPS on its host, or HTTP on localhost. */
export function ownOrigin(request: Request) {
  const host = request.headers.get('host')
  const origin = request.headers.get('origin')
  return !!host && (origin === `https://${host}` || (origin === `http://${host}` && /^localhost(:\d+)?$/.test(host)))
}
