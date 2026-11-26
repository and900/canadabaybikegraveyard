import { describe, expect, it } from 'vitest'
import robots from './robots'
import sitemap, { SITE } from './sitemap'

describe('the sitemap and robots.txt', () => {
  it('lists only public pages, on the www address', () => {
    const urls = sitemap().map((page) => page.url)
    expect(urls).toContain(`${SITE}/`)
    expect(urls).toContain(`${SITE}/c/new`)
    for (const url of urls) {
      expect(url.startsWith('https://www.allmythingsonline.com/')).toBe(true)
      // The card maker is public; the cards themselves are not.
      expect(url).not.toMatch(/\/(c(?!\/new$)|other|cards-admin|tag|api)(\/|$)/)
    }
  })

  it('points to the sitemap and keeps crawlers out of the private areas', () => {
    const { rules, sitemap: map } = robots()
    // Facebook's crawler gets its own rules, with the cards open to it.
    expect(JSON.stringify(rules)).toContain('facebookexternalhit')
    expect(map).toBe(`${SITE}/sitemap.xml`)
    expect(JSON.stringify(rules)).toContain('"/other/"')
    expect(JSON.stringify(rules)).toContain('"/c/"')
    expect(JSON.stringify(rules)).toContain('"/c/new"')
    // Facebook obeys robots.txt, so the card maker's preview picture has to be open too.
    expect(JSON.stringify(rules)).toContain('"/c/og-new.jpg"')
    expect(JSON.stringify(rules)).toContain('"/cards-admin"')
  })
})
