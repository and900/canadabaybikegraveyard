import { describe, expect, it } from 'vitest'
import { cardUrl, cleanText, isCardCode, newCardCode, parseRecipients } from './cards'

describe('card codes', () => {
  it('makes 7 characters that pass the check, and rejects anything else', () => {
    const code = newCardCode((max) => Math.floor(Math.random() * max))
    expect(code).toHaveLength(7)
    expect(isCardCode(code)).toBe(true)
    for (const bad of ['', 'abc', 'abcdefgh', 'k7Xp2q0', 'k7Xp2l!', '../etc']) expect(isCardCode(bad)).toBe(false)
  })

  it('builds the link', () => expect(cardUrl('https://x.test', 'k7Xp2qa')).toBe('https://x.test/c/k7Xp2qa'))
})

describe('cleanText', () => {
  it('trims, cuts and says null for nothing', () => {
    expect(cleanText('  hi  ', 10)).toBe('hi')
    expect(cleanText('abcdef', 3)).toBe('abc')
    expect(cleanText('   ', 3)).toBeNull()
    expect(cleanText(undefined, 3)).toBeNull()
  })
})

describe('parseRecipients', () => {
  it('reads one to a line, with an optional greeting and message', () => {
    expect(parseRecipients('Nan\nTom and Hillary | Hope the knee is better\r\n\n Sam | Hi | Happy Xmas ')).toEqual([
      { name: 'Nan', greeting: null, message: null },
      { name: 'Tom and Hillary', greeting: 'Hope the knee is better', message: null },
      { name: 'Sam', greeting: 'Hi', message: 'Happy Xmas' },
    ])
  })
  it('skips lines with no name', () => expect(parseRecipients(' | greeting\n\n')).toEqual([]))
})
