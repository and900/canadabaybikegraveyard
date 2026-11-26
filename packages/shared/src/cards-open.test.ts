import { describe, expect, it } from 'vitest'
import { nameFromSlug, openCardUrl } from './cards'

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

describe('openCardUrl', () => {
  it('round trips', () => {
    const url = openCardUrl('https://x.test', 'Tom and Hillary')
    expect(url).toBe('https://x.test/c/to/Tom-and-Hillary')
    expect(nameFromSlug(url.split('/').pop()!)).toBe('Tom and Hillary')
  })
})
