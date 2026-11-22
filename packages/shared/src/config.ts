// Every list and tunable number the spec defines, in one place (plan §1.5).

/** Where reports of parking, graffiti and footpath or road damage are emailed. */
export const COUNCIL_EMAIL = 'council@canadabay.nsw.gov.au'

/**
 * Share-bike operators (§4.2). Retire one with `active: false`, never by deleting it: old tags still show it. `email`
 * is where the operator's own website asks for reports in Australia (SPEC Appendix B).
 */
export const OPERATORS = {
  lime: { label: 'Lime', letter: 'L', active: true, email: 'support-au@li.me' },
  hello: { label: 'Hello', letter: 'H', active: true, email: 'support.au@hellobike.com' },
  ario: { label: 'Ario', letter: 'A', active: true, email: 'feedback@ario.com' },
  not_sure: { label: 'Not sure', letter: '?', active: true, email: null },
  // Who the other categories' reports go to. Not a choice on the bike form, so never `active`.
  council: { label: 'Council', letter: 'C', active: false, email: COUNCIL_EMAIL },
} as const
export type Operator = keyof typeof OPERATORS

/** The problem pick-list (§4.2). The keys are the database enum `problem`. */
export const PROBLEMS = {
  blocking_footpath: 'Blocking footpath',
  knocked_over: 'Knocked over',
  blocking_ramp: 'Blocking ramp / driveway',
  in_waterway: 'In waterway',
  in_park: 'In park or reserve',
  damaged: 'Damaged',
  abandoned: 'Abandoned',
  parking_not_in_bay: 'Not parked in bay',
  parking_too_close_kerb: 'Too close to kerb',
  parking_blocking: 'Blocking footpath or driveway',
  parking_obstructing_road: 'Obstructing road',
  parking_other: 'Other',
  graffiti: 'Graffiti',
  graffiti_property: 'Damaged public property',
  graffiti_vandalism: 'Vandalism',
  graffiti_other: 'Other',
  damage_pothole: 'Pothole',
  damage_footpath: 'Broken footpath',
  damage_kerb: 'Damaged kerb',
  damage_trip: 'Trip hazard',
  damage_other: 'Other',
} as const
export type Problem = keyof typeof PROBLEMS

/**
 * The reporting categories. Adding one is an entry here and its pin in palette.ts: the database keeps the category
 * and the problem as text, so it needs no migration. `problems` are its issue buttons, in order. `lifetimeHours` is
 * how long a report lasts after its last sighting. `recipient` is who its email goes to: the bike's operator, or the
 * council. `photo` is who may see a report's photo: 'public' is on the site; 'private' stays on the visitor's phone
 * and goes only in their email (not built yet, so those reports take no photo). `several` lets one form add a pile.
 */
export const CATEGORIES = {
  bikes: {
    label: 'Abandoned Share Bikes',
    short: 'Bikes',
    noun: 'Share e-bike',
    letter: '',
    add: 'Tag a dumped bike',
    lifetimeHours: 72,
    recipient: 'operator',
    photo: 'public',
    several: true,
    problems: ['blocking_footpath', 'knocked_over', 'blocking_ramp', 'in_waterway', 'in_park', 'damaged', 'abandoned'],
  },
  parking: {
    label: 'Parking Violations and Obstructions',
    short: 'Parking',
    noun: 'Parking issue',
    letter: 'P',
    add: 'Log a parking issue',
    lifetimeHours: 168,
    recipient: 'council',
    photo: 'private',
    several: false,
    problems: [
      'parking_not_in_bay',
      'parking_too_close_kerb',
      'parking_blocking',
      'parking_obstructing_road',
      'parking_other',
    ],
  },
  graffiti: {
    label: 'Graffiti and Vandalism',
    short: 'Graffiti',
    noun: 'Graffiti or vandalism',
    letter: 'G',
    add: 'Log graffiti or vandalism',
    lifetimeHours: 168,
    recipient: 'council',
    photo: 'public',
    several: false,
    problems: ['graffiti', 'graffiti_property', 'graffiti_vandalism', 'graffiti_other'],
  },
  damage: {
    label: 'Damaged Footpaths and Roads',
    short: 'Roads',
    noun: 'Footpath or road damage',
    letter: 'D',
    add: 'Log footpath or road damage',
    lifetimeHours: 168,
    recipient: 'council',
    photo: 'public',
    several: false,
    problems: ['damage_pothole', 'damage_footpath', 'damage_kerb', 'damage_trip', 'damage_other'],
  },
} as const satisfies Record<
  string,
  {
    label: string
    short: string
    noun: string
    /** The letter on its pin; a bike's pin carries its operator's instead. */
    letter: string
    add: string
    lifetimeHours: number
    recipient: 'operator' | 'council'
    photo: 'public' | 'private'
    several: boolean
    problems: readonly Problem[]
  }
>
export type Category = keyof typeof CATEGORIES
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [Category, ...Category[]]
/** The category the site opens on, and the one every report made before categories belongs to. */
export const DEFAULT_CATEGORY: Category = 'bikes'
export const isCategory = (value: unknown): value is Category =>
  typeof value === 'string' && Object.hasOwn(CATEGORIES, value)

/** How long a report of this category lasts after its last sighting; an unknown category lasts as a bike does. */
export const lifetimeHours = (category?: string) =>
  CATEGORIES[isCategory(category) ? category : DEFAULT_CATEGORY].lifetimeHours

/** "72 hours" or "7 days": a lifetime as the site says it. */
export const lifetimeText = (category?: string) => {
  const hours = lifetimeHours(category)
  return hours % 24 === 0 && hours >= 48 ? `${hours / 24} days` : `${hours} hours`
}

/** Whether a category's photos are shown on the site. A private one's stay on the visitor's phone, never uploaded. */
export const publicPhotos = (category?: string) =>
  CATEGORIES[isCategory(category) ? category : DEFAULT_CATEGORY].photo === 'public'

/** Whether a report's fields fit its category: a bike names its operator; anything else names none. */
export function fitsCategory(tag: {
  category?: Category | undefined
  operator?: Operator | undefined
  problem: Problem
}) {
  const category = tag.category ?? DEFAULT_CATEGORY
  const problems: readonly Problem[] = CATEGORIES[category].problems
  if (!problems.includes(tag.problem)) return false
  return category === 'bikes'
    ? tag.operator !== undefined && OPERATORS[tag.operator].active
    : tag.operator === undefined
}

/** Why a photo was reported (§4.3). The keys are the database enum `report_reason`. */
export const REPORT_REASONS = {
  not_share_bike: 'Not a share bike',
  privacy: 'Shows a person, face or number plate',
  offensive: 'Offensive or inappropriate',
  other: 'Other',
} as const
export type ReportReason = keyof typeof REPORT_REASONS

type Limit = { per: 'visitor' | 'ip' | 'visitor_and_tag'; max: number; hours: number }

/**
 * Rate limits (§6): the most one visitor, one IP, or one visitor on one tag may do in a window. Tags and photos are
 * set to stop abuse, not a busy street: someone can tag 20 bikes in 5 minutes. The firewall's 20 writes a minute per
 * IP stops bursts. One photo per tag is not a counter: `photos.tag_id` is unique.
 */
export const LIMITS = {
  create: [
    { per: 'visitor', max: 100, hours: 1 },
    { per: 'visitor', max: 300, hours: 24 },
    // About 3× a visitor's, as many phones share one IP (§6).
    { per: 'ip', max: 900, hours: 24 },
  ],
  photo: [
    { per: 'visitor', max: 100, hours: 1 },
    { per: 'visitor', max: 300, hours: 24 },
    { per: 'ip', max: 900, hours: 24 },
  ],
  still_there: [
    { per: 'visitor_and_tag', max: 1, hours: 12 },
    { per: 'visitor', max: 30, hours: 24 },
    { per: 'ip', max: 60, hours: 24 },
  ],
  remove: [
    { per: 'visitor_and_tag', max: 3, hours: 24 },
    { per: 'visitor', max: 30, hours: 24 },
    { per: 'ip', max: 60, hours: 24 },
  ],
  report: [
    { per: 'visitor', max: 5, hours: 24 },
    { per: 'ip', max: 10, hours: 24 },
  ],
} as const satisfies Record<string, readonly Limit[]>

/** Street types written short, as the card and the map labels write them: "Llewellyn St" (§9). */
export const STREET_TYPES: Record<string, string> = {
  Road: 'Rd',
  Street: 'St',
  Avenue: 'Ave',
  Lane: 'La',
  Parade: 'Pde',
  Place: 'Pl',
  Crescent: 'Cres',
  Highway: 'Hwy',
  Terrace: 'Tce',
  Close: 'Cl',
}

/** Where visitors send feedback, from the footer (or a phone's menu) on every page and the privacy page (§4.7). */
export const FEEDBACK_EMAIL = 'hello@allmythingsonline.com'
/** A photo upload over this size is refused (§4.3). The browser's re-encoded photos are about 1 MB. */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024
/** Visitor and IP hashes on events and reports are cleared this long after they were stored (§6). */
export const HASH_RETENTION_DAYS = 30
/** Rate counters and IP salts are deleted this long after their window or their day starts (§6). */
export const COUNTER_RETENTION_HOURS = 48
/** Live tags this close to a new spot are offered as "Is it one of these?" (§4.2). */
export const NEARBY_METERS = 25
/** Tags are accepted this far outside the council boundary (§4.1). */
export const BOUNDARY_BUFFER_METERS = 20
/** A street picked by name (§10.3) is kept for a tag only this close to its spot; past it, the nearest one is. */
export const PICKED_STREET_METERS = 60
/** Use my location proposes a pin only when the position is at least this accurate (§4.1). */
export const LOCATION_ACCURACY_METERS = 50
/** Tapping a pin this close to another opens the "N bikes here" chooser (§4.1). */
export const CROWDED_PIN_PX = 44
/**
 * Placing a tag needs this zoom or closer (§12). It is §12's "zoom 16, about 2 m per screen pixel": §12 counts zoom
 * in 256 px tiles, and MapLibre counts it in 512 px tiles, where 2 m per pixel at Sydney's latitude is zoom 15.
 */
export const PLACEMENT_ZOOM = 15
/** On a phone, a dialog's top edge: below the header and a strip of the map, where the map shows the new pin. */
export const DIALOG_TOP_REM = 8
/** A visible page refreshes its tags this often (§11.3). */
export const REFRESH_MINUTES = 5
/** Reports emailed one by one each day, before the hourly digest takes over (§4.6). */
export const REPORT_EMAILS_PER_DAY = 10
/** More reports than this in an hour, site-wide, pause photo uploads (§4.6). */
export const CIRCUIT_BREAKER_REPORTS_PER_HOUR = 15
