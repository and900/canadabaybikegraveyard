import type { MetadataRoute } from 'next'
import { SITE } from './sitemap'

export default function robots(): MetadataRoute.Robots {
  return {
    // Open to search, except the private cards (the card maker at /c/new is the one public page under /c/), the admin page,
    // the reports themselves and the site's own API. The longer, more specific rule wins, so /c/new stays open.
    rules: { userAgent: '*', allow: ['/', '/c/new'], disallow: ['/c/', '/other/', '/cards-admin', '/tag/', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
