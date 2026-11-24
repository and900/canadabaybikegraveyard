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
