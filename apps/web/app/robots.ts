import type { MetadataRoute } from 'next'
import { SITE } from './sitemap'

export default function robots(): MetadataRoute.Robots {
  return {
    // Open to search, except the private cards, the admin page, the reports themselves and the site's own API.
    rules: { userAgent: '*', allow: '/', disallow: ['/c/', '/other/', '/cards-admin', '/tag/', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
