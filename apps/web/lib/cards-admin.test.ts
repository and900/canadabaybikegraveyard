import { describe, expect, it } from 'vitest'
import { ownOrigin, same, sessionValue } from './cards-admin'

const post = (host: string, origin: string) =>
  new Request(`https://${host}/x`, { method: 'POST', headers: { host, origin } })

describe('cards admin', () => {
  it('compares strings of any length', () => {
    expect(same('abc', 'abc')).toBe(true)
    expect(same('abc', 'abd')).toBe(false)
    expect(same('abc', 'abcd')).toBe(false)
  })

  it('has a session value of a fixed length that is not the password', () => {
    expect(sessionValue()).toMatch(/^[0-9a-f]{64}$/)
    expect(sessionValue()).not.toContain('dev-cards-password')
  })

  it("takes a post from the site's own pages only", () => {
    expect(ownOrigin(post('example.com', 'https://example.com'))).toBe(true)
    expect(ownOrigin(post('example.com', 'https://evil.test'))).toBe(false)
    expect(ownOrigin(post('example.com', 'http://example.com'))).toBe(false)
    expect(ownOrigin(post('localhost:3000', 'http://localhost:3000'))).toBe(true)
    expect(ownOrigin(new Request('https://example.com/x', { method: 'POST', headers: { host: 'example.com' } }))).toBe(
      false,
    )
  })
})
