import type { MetadataRoute } from 'next'

/** The address the site is known by; the bare allmythingsonline.com is not the one to list. */
export const SITE = 'https://www.allmythingsonline.com'

/** The public pages worth finding in a search. Not the cards, the admin page or an individual report. */
const PAGES = ['/', '/list', '/why', '/accessibility', '/privacy', '/terms']

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({
    url: SITE + path,
    changeFrequency: path === '/' || path === '/list' ? 'daily' : 'yearly',
  }))
}
