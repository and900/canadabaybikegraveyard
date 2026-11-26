import { describe, expect, it } from 'vitest'
import { cardStyle, nameFromSlug, openCardUrl } from './cards'

describe('nameFromSlug', () => {
  it('turns dashes into spaces', () => {
    expect(nameFromSlug('Tom-and-Hillary')).toBe('Tom and Hillary')
    expect(nameFromSlug('Tom%20and%20Hillary')).toBe('Tom and Hillary')
  })
  it('keeps accents and apostrophes', () => {
    expect(nameFromSlug('Zo%C3%AB')).toBe('Zoë')
    expect(nameFromSlug("O'Brien-family")).toBe("O'Brien family")
  })
  it('refuses empty, long, odd and rude names', () => {
    expect(nameFromSlug('---')).toBeNull()
    expect(nameFromSlug('a'.repeat(31))).toBeNull()
    expect(nameFromSlug('<script>')).toBeNull()
    expect(nameFromSlug('%E0%A4%A')).toBeNull()
    expect(nameFromSlug('Mr-Sh1t')).toBeNull()
    expect(nameFromSlug('Mr-Shit')).toBeNull()
    expect(nameFromSlug('Big-Dick')).toBeNull()
  })
})

describe('cardStyle', () => {
  it('falls back to the original', () => {
    expect(cardStyle('aussie')).toBe('aussie')
    expect(cardStyle('nonsense')).toBe('traditional')
    expect(cardStyle(undefined)).toBe('traditional')
  })
})

describe('openCardUrl', () => {
  it('adds the scene unless it is the original', () => {
    expect(openCardUrl('https://x.test', 'Nan', 'Bec', 'beach')).toBe('https://x.test/c/to/Nan?from=Bec&style=beach')
    expect(openCardUrl('https://x.test', 'Nan', 'Bec', 'traditional')).toBe('https://x.test/c/to/Nan?from=Bec')
  })
  it('round trips', () => {
    const url = openCardUrl('https://x.test', 'Tom and Hillary')
    expect(url).toBe('https://x.test/c/to/Tom-and-Hillary')
    expect(nameFromSlug(url.split('/').pop()!)).toBe('Tom and Hillary')
  })
  it('carries who it is from', () => {
    expect(openCardUrl('https://x.test', 'Nan', 'Sam and Jo')).toBe('https://x.test/c/to/Nan?from=Sam-and-Jo')
  })
})
