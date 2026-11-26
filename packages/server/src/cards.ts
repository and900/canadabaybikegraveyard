// Christmas cards: the shared words, and a recipient for each link. Owns card_settings and card_recipients.
import { randomInt } from 'node:crypto'
import {
  CARD_LIMITS,
  type CardEvent,
  type CardStyle,
  cardStyle,
  type CardTheme,
  cleanText,
  isCardCode,
  isCardTheme,
  type NewRecipient,
  newCardCode,
} from '@iwb/shared'
import { db } from './client'

export type CardSettings = { message: string; signoff: string; theme: CardTheme }
export type Recipient = {
  id: string
  code: string
  name: string
  greeting: string | null
  message: string | null
  openedAt: Date | null
  createdAt: Date
}
/** What a card page needs: the recipient's words, with the shared ones where they have none. */
export type CardView = { name: string; greeting: string | null; message: string; signoff: string; theme: CardTheme }

export async function getCardSettings(): Promise<CardSettings> {
  const [row] = await db.$queryRaw<{ message: string; signoff: string; theme: string }[]>`
    SELECT message, signoff, theme FROM card_settings WHERE id = 1`
  return { message: row!.message, signoff: row!.signoff, theme: isCardTheme(row!.theme) ? row!.theme : 'midnight' }
}

export async function saveCardSettings(input: { message: unknown; signoff: unknown; theme: unknown }) {
  const message = cleanText(input.message, CARD_LIMITS.message)
  const signoff = cleanText(input.signoff, CARD_LIMITS.signoff)
  const theme = isCardTheme(input.theme) ? input.theme : 'midnight'
  if (!message || !signoff) return false
  await db.$executeRaw`
    UPDATE card_settings SET message = ${message}, signoff = ${signoff}, theme = ${theme}, updated_at = now()
    WHERE id = 1`
  return true
}

export function listRecipients() {
  return db.$queryRaw<Recipient[]>`
    SELECT id::text, code, name, greeting, message, opened_at AS "openedAt", created_at AS "createdAt"
    FROM card_recipients ORDER BY created_at, name`
}

/** Adds each recipient with a new random code. A code already taken is tried again. */
export async function addRecipients(list: NewRecipient[]) {
  for (const { name, greeting, message } of list) {
    for (let attempt = 0; ; attempt++) {
      const code = newCardCode(randomInt)
      const added = await db.$executeRaw`
        INSERT INTO card_recipients (code, name, greeting, message)
        VALUES (${code}, ${name}, ${greeting}, ${message})
        ON CONFLICT (code) DO NOTHING`
      if (added) break
      if (attempt > 8) throw new Error('No free card code')
    }
  }
  return list.length
}

/** Changes the words only: the code, so the link, stays. */
export async function updateRecipient(id: string, input: { name: unknown; greeting: unknown; message: unknown }) {
  const name = cleanText(input.name, CARD_LIMITS.name)
  if (!name) return false
  const changed = await db.$executeRaw`
    UPDATE card_recipients
    SET name = ${name}, greeting = ${cleanText(input.greeting, CARD_LIMITS.greeting)},
        message = ${cleanText(input.message, CARD_LIMITS.message)}
    WHERE id = ${id}::uuid`
  return changed > 0
}

export async function deleteRecipient(id: string) {
  return (await db.$executeRaw`DELETE FROM card_recipients WHERE id = ${id}::uuid`) > 0
}

/** Clears when each card was opened, for a new year's send to the same list. */
export function forgetOpens() {
  return db.$executeRaw`UPDATE card_recipients SET opened_at = NULL`
}

/** The card for a code, or null when no one has it. */
export async function cardByCode(code: string): Promise<CardView | null> {
  if (!isCardCode(code)) return null
  const [row] = await db.$queryRaw<
    { name: string; greeting: string | null; message: string; signoff: string; theme: string }[]
  >`
    SELECT r.name, r.greeting, COALESCE(r.message, s.message) AS message, s.signoff, s.theme
    FROM card_recipients r, card_settings s
    WHERE r.code = ${code} AND s.id = 1`
  return row ? { ...row, theme: isCardTheme(row.theme) ? row.theme : 'midnight' } : null
}

/** Notes the first time a card's envelope is opened. False when no one has the code. */
export async function markOpened(code: string) {
  if (!isCardCode(code)) return false
  const [row] = await db.$queryRaw<{ id: string }[]>`
    UPDATE card_recipients SET opened_at = COALESCE(opened_at, now()) WHERE code = ${code} RETURNING id::text`
  return !!row
}

/**
 * Counts a try at the admin password for `who` (a hash of the address), and says whether it may go ahead: 10 an hour.
 * The counters are the ones the rate limits use, which the hourly job clears after 48 hours.
 */
export async function allowLoginTry(who: string) {
  const [counter] = await db.$queryRaw<{ count: number }[]>`
    WITH bucket AS (SELECT floor(extract(epoch FROM now()) / 3600)::bigint AS n)
    INSERT INTO rate_counters (key, count, window_start)
    SELECT 'cards-login:' || ${who}::text || ':' || n, 1, to_timestamp(n * 3600) FROM bucket
    ON CONFLICT (key) DO UPDATE SET count = rate_counters.count + 1
    RETURNING count`
  return counter!.count <= 10
}

/** Adds one to today's (Sydney's) count of an open-card event for a design. */
export async function countCardEvent(event: CardEvent, style: CardStyle) {
  await db.$executeRaw`
    INSERT INTO card_counts (day, style, event, count)
    VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date, ${style}, ${event}, 1)
    ON CONFLICT (day, style, event) DO UPDATE SET count = card_counts.count + 1`
}

export type CardCounts = { style: CardStyle; made: number; opened: number }[]

/** Totals so far for each design, in the order they are offered. */
export async function cardCounts(styles: readonly CardStyle[]): Promise<CardCounts> {
  const rows = await db.$queryRaw<{ style: string; event: string; total: bigint }[]>`
    SELECT style, event, sum(count) AS total FROM card_counts GROUP BY style, event`
  const total = (style: string, event: CardEvent) =>
    Number(rows.find((r) => r.style === style && r.event === event)?.total ?? 0)
  return styles.map((style) => ({
    style: cardStyle(style),
    made: total(style, 'made'),
    opened: total(style, 'opened'),
  }))
}

/** The last `days` days' counts, newest first, for the admin page. */
export async function cardCountsByDay(days: number) {
  const rows = await db.$queryRaw<{ day: string; event: string; total: bigint }[]>`
    SELECT to_char(day, 'YYYY-MM-DD') AS day, event, sum(count) AS total
    FROM card_counts WHERE day > (now() AT TIME ZONE 'Australia/Sydney')::date - ${days}::int
    GROUP BY day, event ORDER BY day DESC`
  const byDay = new Map<string, { day: string; made: number; opened: number }>()
  for (const r of rows) {
    const entry = byDay.get(r.day) ?? { day: r.day, made: 0, opened: 0 }
    entry[r.event === 'made' ? 'made' : 'opened'] = Number(r.total)
    byDay.set(r.day, entry)
  }
  return [...byDay.values()]
}
