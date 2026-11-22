// Names, counts and times as the site writes them. Times are always Sydney's, whatever the device's time zone.
import { CATEGORIES, type Category, OPERATORS, type Operator, PROBLEMS } from './config'
import type { PinKey } from './palette'
import type { PublicTag } from './schemas'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

const time = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long' })
const full = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Sydney',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/** "Lime e-bike", or "Share e-bike" when the visitor wasn't sure whose it is. */
export const bikeName = (operator: Operator) =>
  operator === 'not_sure' ? 'Share e-bike' : `${OPERATORS[operator].label} e-bike`

/** What a tag is called: "Lime e-bike" for a bike, otherwise its category's noun, "Parking issue". */
export const tagName = (tag: Pick<PublicTag, 'category' | 'operator'>) =>
  tag.category === 'bikes' ? bikeName(tag.operator) : CATEGORIES[tag.category].noun

/** How a tag's pin is drawn: by its operator for a bike, otherwise by its category. */
export const pinOf = (tag: Pick<PublicTag, 'category' | 'operator'>): PinKey =>
  tag.category === 'bikes' ? (tag.operator as Exclude<Operator, 'council'>) : tag.category

/** "1 bike" or "14 bikes". */
export const bikes = (n: number) => `${n} ${n === 1 ? 'bike' : 'bikes'}`

/** "1 parking issue", "14 bikes": a count of one category's tags. */
const NAMES: Record<Category, string> = {
  bikes: 'bike',
  parking: 'parking issue',
  graffiti: 'graffiti or vandalism issue',
  damage: 'footpath or road issue',
}
export const categoryCount = (category: Category, n: number) => `${n} ${NAMES[category]}${n === 1 ? '' : 's'}`

/** The heading over a category's tags: "14 bikes in the graveyard", "3 parking issues logged", or none. */
export const categoryHeading = (category: Category, n: number) =>
  category === 'bikes'
    ? n
      ? bikeCount(n)
      : 'No bikes in the graveyard right now.'
    : n
      ? `${categoryCount(category, n)} logged`
      : `No ${NAMES[category]}s right now.`

/** "14 bikes in the graveyard". */
export const bikeCount = (n: number) => `${bikes(n)} in the graveyard`

/** The time from one moment to another, rounded down: "31 h", or "40 min" under an hour; in `words`, "31 hours". */
export function duration(from: Date, to: Date, words = false) {
  const ms = to.getTime() - from.getTime()
  const [n, short, long] =
    ms < HOUR ? [Math.max(1, Math.floor(ms / MINUTE)), 'min', 'minute'] : [Math.floor(ms / HOUR), 'h', 'hour']
  return words ? `${n} ${long}${n === 1 ? '' : 's'}` : `${n} ${short}`
}

/** "3:40 pm Tuesday", in Sydney. */
export const clockTime = (date: Date) => `${time.format(date)} ${weekday.format(date)}`

/** "Tue, 10 Nov, 3:40 pm", in Sydney. */
export const dateTime = (date: Date) => full.format(date)

/** The API returns live tags only, so the browser just drops tags whose time has passed since. */
export const isExpired = (tag: { expiresAt: Date }, now = new Date()) => tag.expiresAt <= now

/** A tag as the API sends it: JSON makes its two times strings. */
export type TagJson = Omit<PublicTag, 'lastConfirmedAt' | 'expiresAt'> & Record<'lastConfirmedAt' | 'expiresAt', string>

/** Makes a tag's times dates again. */
export const parseTag = (json: TagJson): PublicTag => ({
  ...json,
  lastConfirmedAt: new Date(json.lastConfirmedAt),
  expiresAt: new Date(json.expiresAt),
})

/** The order of the list, and of the pins for Tab: by suburb, then street. */
export const byPlace = (a: Pick<PublicTag, 'suburb' | 'street'>, b: Pick<PublicTag, 'suburb' | 'street'>) =>
  a.suburb.localeCompare(b.suburb) || a.street.localeCompare(b.street)

/** A pin's accessible name: "Lime e-bike, blocking footpath, Denison St, Newtown, disappears in 31 hours, at …". */
export const pinLabel = (tag: PublicTag, now: Date) =>
  `${tagName(tag)}, ${PROBLEMS[tag.problem].toLowerCase()}, ${tag.street}, ${tag.suburb}, ` +
  `disappears in ${duration(now, tag.expiresAt, true)}, at ${clockTime(tag.expiresAt)}`

/** "a Lime e-bike", or "an Ario e-bike". */
export const withArticle = (noun: string) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`

/** A photo's text alternative, from its tag's fields (§10.4): "Photo of a Lime e-bike reported as blocking footpath". */
export function photoAlt(tag: Pick<PublicTag, 'category' | 'operator' | 'problem'>) {
  const what =
    tag.category === 'bikes'
      ? withArticle(tag.operator === 'not_sure' ? 'share e-bike' : bikeName(tag.operator))
      : tagName(tag).toLowerCase()
  return `Photo of ${what} reported as ${PROBLEMS[tag.problem].toLowerCase()}`
}
