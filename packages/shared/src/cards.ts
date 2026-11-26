// Christmas cards: the words and rules both the card page and its admin share.

export const CARD_THEMES = ['midnight', 'pine', 'berry'] as const
export type CardTheme = (typeof CARD_THEMES)[number]
export const isCardTheme = (value: unknown): value is CardTheme => CARD_THEMES.includes(value as CardTheme)

/** The most each field may hold. */
export const CARD_LIMITS = { name: 60, greeting: 240, message: 900, signoff: 80 } as const

/** What a link's code is made of: 7 letters and digits, with none that look alike (no 0 O 1 l I). */
export const CARD_CODE_ALPHABET = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
export const CARD_CODE_LENGTH = 7
export const isCardCode = (value: string) => new RegExp(`^[${CARD_CODE_ALPHABET}]{${CARD_CODE_LENGTH}}$`).test(value)

/** A fresh random code. `randomInt(max)` gives a whole number from 0 up to but not including max. */
export function newCardCode(randomInt: (max: number) => number) {
  return Array.from({ length: CARD_CODE_LENGTH }, () => CARD_CODE_ALPHABET[randomInt(CARD_CODE_ALPHABET.length)]).join(
    '',
  )
}

/** Text from a form: trimmed, cut to `max`, and null when nothing is left. */
export function cleanText(value: unknown, max: number) {
  const text = typeof value === 'string' ? value.replaceAll('\r\n', '\n').trim().slice(0, max).trim() : ''
  return text || null
}

export type NewRecipient = { name: string; greeting: string | null; message: string | null }

/**
 * Recipients pasted one to a line, as "Name" or "Name | greeting" or "Name | greeting | message" (a message there
 * can't hold a line break: set longer ones by editing the recipient). Blank lines are skipped.
 */
export function parseRecipients(text: string): NewRecipient[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter(([name]) => name)
    .map(([name, greeting, message]) => ({
      name: cleanText(name, CARD_LIMITS.name)!,
      greeting: cleanText(greeting, CARD_LIMITS.greeting),
      message: cleanText(message, CARD_LIMITS.message),
    }))
}

/** The address of a recipient's card. */
export const cardUrl = (origin: string, code: string) => `${origin}/c/${code}`

/** The longest name an open card takes: it is typed into a link, so it is kept short. */
export const OPEN_NAME_MAX = 30

/** Words that never go on a card from the open page. Short on purpose: it stops the obvious, not every trick. */
const BLOCKED = [
  'fuck',
  'shit',
  'cunt',
  'bitch',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'whore',
  'slut',
  'cock',
  'dick',
  'nazi',
  'rape',
]

/**
 * The name in an open card's link (`/c/to/Tom-and-Hillary`): dashes and plus signs stand for spaces. Null when there is
 * nothing usable: empty, too long, anything but letters, spaces, apostrophes, ampersands, full stops and commas, or a blocked word.
 */
export function nameFromSlug(slug: string): string | null {
  let text: string
  try {
    text = decodeURIComponent(slug)
  } catch {
    return null
  }
  const name = text
    .replace(/[-_+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!name || name.length > OPEN_NAME_MAX) return null
  if (!/^[\p{L}][\p{L}\p{M} '’&.,]*$/u.test(name)) return null
  const squashed = name.toLowerCase().replace(/[^\p{L}]/gu, '')
  if (BLOCKED.some((word) => squashed.includes(word))) return null
  return name
}

/** The words on every open card: the same for everyone, signed with whoever it is from. */
export const OPEN_MESSAGE =
  'Merry Christmas and a Happy New Year!\n\nWishing you a wonderful festive season and a happy, healthy and prosperous New Year.'
export const openSignoff = (from: string) => `Best wishes, ${from}`

/** The scenes an open card can be made in. The first is the original, and what a link without a style gets. */
export const CARD_STYLES = ['traditional', 'aussie', 'beach'] as const
export type CardStyle = (typeof CARD_STYLES)[number]
export const cardStyle = (value: unknown): CardStyle =>
  CARD_STYLES.includes(value as CardStyle) ? (value as CardStyle) : 'traditional'

/** The link for an open card: spaces become dashes; who it is from and the scene ride along as `?from=` and `?style=`. */
export const openCardUrl = (origin: string, name: string, from?: string, style?: CardStyle) => {
  const base = `${origin}/c/to/${encodeURIComponent(name.trim().replace(/\s+/g, '-'))}`
  const query = new URLSearchParams()
  const sender = from?.trim().replace(/\s+/g, '-')
  if (sender) query.set('from', sender)
  if (style && style !== 'traditional') query.set('style', style)
  return query.size ? `${base}?${query}` : base
}
