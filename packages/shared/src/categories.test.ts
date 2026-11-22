import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  CATEGORY_KEYS,
  COUNCIL_EMAIL,
  fitsCategory,
  lifetimeHours,
  lifetimeText,
  PROBLEMS,
  publicPhotos,
} from './config'
import { pinOf, tagName } from './format'
import { operatorEmail } from './notify'
import { PINS } from './palette'
import { CreateTagBody, type PublicTag } from './schemas'

const ID = '5eed0000-0000-4000-8000-000000000001'
const AT = { id: ID, lat: -33.85789, lng: 151.15052 }

describe('CATEGORIES', () => {
  it('gives every problem to exactly one category, and every problem a label', () => {
    const listed = CATEGORY_KEYS.flatMap((key) => [...CATEGORIES[key].problems])
    expect(listed.toSorted()).toEqual(Object.keys(PROBLEMS).toSorted())
    expect(new Set(listed).size).toBe(listed.length)
  })

  it('draws a pin for every category but bikes, whose pins are their operators', () => {
    for (const key of CATEGORY_KEYS) if (key !== 'bikes') expect(PINS).toHaveProperty(key)
  })

  it('lasts 3 days (72 hours) for a bike and 7 days for the rest, and says so', () => {
    expect(lifetimeHours('bikes')).toBe(72)
    expect(lifetimeHours('parking')).toBe(168)
    expect(lifetimeText('bikes')).toBe('3 days')
    expect(lifetimeText('damage')).toBe('7 days')
    // What predates categories, or isn't one, lasts as a bike does.
    expect(lifetimeHours(undefined)).toBe(72)
    expect(lifetimeHours('nonsense')).toBe(72)
  })
})

describe('fitsCategory', () => {
  it('wants a bike to name an operator and one of its problems', () => {
    expect(fitsCategory({ operator: 'lime', problem: 'knocked_over' })).toBe(true)
    expect(fitsCategory({ category: 'bikes', operator: 'not_sure', problem: 'abandoned' })).toBe(true)
    expect(fitsCategory({ category: 'bikes', problem: 'abandoned' })).toBe(false)
    expect(fitsCategory({ category: 'bikes', operator: 'lime', problem: 'damage_pothole' })).toBe(false)
  })

  it('wants anything else to name one of its problems and no operator', () => {
    expect(fitsCategory({ category: 'parking', problem: 'parking_not_in_bay' })).toBe(true)
    expect(fitsCategory({ category: 'damage', problem: 'damage_pothole' })).toBe(true)
    expect(fitsCategory({ category: 'parking', operator: 'lime', problem: 'parking_other' })).toBe(false)
    expect(fitsCategory({ category: 'parking', problem: 'graffiti' })).toBe(false)
    expect(fitsCategory({ category: 'graffiti', operator: 'council', problem: 'graffiti' })).toBe(false)
  })
})

describe('CreateTagBody', () => {
  const ok = (body: object) => CreateTagBody.safeParse({ ...AT, ...body }).success

  it('still takes a bike with no category, as before categories', () => {
    expect(ok({ operator: 'lime', problem: 'blocking_footpath' })).toBe(true)
  })

  it('takes a report of another category with no operator', () => {
    expect(ok({ category: 'parking', problem: 'parking_blocking' })).toBe(true)
    expect(ok({ category: 'graffiti', problem: 'graffiti_vandalism' })).toBe(true)
  })

  it('refuses a category that is not one, a bike with no operator, and a problem from another category', () => {
    expect(ok({ category: 'noise', problem: 'abandoned' })).toBe(false)
    expect(ok({ problem: 'abandoned' })).toBe(false)
    expect(ok({ category: 'parking', problem: 'abandoned' })).toBe(false)
    expect(ok({ category: 'parking', operator: 'lime', problem: 'parking_other' })).toBe(false)
  })
})

describe('a report to the council', () => {
  const tag: PublicTag = {
    ...AT,
    suburb: 'Drummoyne',
    street: 'Broughton St',
    category: 'parking',
    operator: 'council',
    problem: 'parking_too_close_kerb',
    lastConfirmedAt: new Date('2026-11-21T01:00:00Z'),
    expiresAt: new Date('2026-11-28T01:00:00Z'),
    photoId: null,
  }

  it('is named by its category and drawn by it', () => {
    expect(tagName(tag)).toBe('Parking issue')
    expect(pinOf(tag)).toBe('parking')
    expect(pinOf({ category: 'bikes', operator: 'hello' })).toBe('hello')
  })

  it('is emailed to the council, with the category, the issue and the place', () => {
    const email = operatorEmail(tag, 'https://example.test')
    expect(email).toMatchObject({
      to: COUNCIL_EMAIL,
      subject: 'Parking: Too close to kerb, Broughton St, Drummoyne',
    })
    expect(email?.message).toContain('Category: Parking Violations and Obstructions')
    expect(email?.message).toContain('Issue: Too close to kerb')
    expect(email?.message).toContain(`https://example.test/tag/${ID}`)
  })
})

describe('private photos', () => {
  it('only parking keeps its photos off the site', () => {
    expect(publicPhotos('bikes')).toBe(true)
    expect(publicPhotos('graffiti')).toBe(true)
    expect(publicPhotos('damage')).toBe(true)
    expect(publicPhotos('parking')).toBe(false)
  })
})

describe('a parking email', () => {
  const tag = {
    id: ID,
    lat: -33.85789,
    lng: 151.15052,
    category: 'parking',
    operator: 'council',
    problem: 'parking_blocking',
    street: 'Lyons Road',
    suburb: 'Drummoyne',
    photoId: null,
    lastConfirmedAt: new Date(),
    expiresAt: new Date(),
  } as unknown as PublicTag
  it('carries the registration only when given, and the tag never does', () => {
    expect(operatorEmail(tag, 'https://x.test')?.message).not.toContain('Registration')
    expect(operatorEmail(tag, 'https://x.test', 'ABC123')?.message).toContain('Registration: ABC123')
    expect(JSON.stringify(tag)).not.toContain('ABC123')
  })
})
