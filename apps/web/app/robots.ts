import type { MetadataRoute } from 'next'
import { SITE } from './sitemap'

export default function robots(): MetadataRoute.Robots {
  return {
    // Open to search, except the private cards (the card maker at /c/new is the one public page under /c/), the admin page,
    // the reports themselves and the site's own API. The longer, more specific rule wins, so /c/new stays open.
    rules: [
      // The crawlers that draw the preview when a link is shared. They are not search engines, and some of them read
      // "allow inside a blocked folder" wrongly, so they get their own plain rules: the cards and the card maker are
      // open to them, the private areas are not.
      {
        userAgent: [
          'facebookexternalhit',
          'meta-externalagent',
          'Facebot',
          'Twitterbot',
          'LinkedInBot',
          'Slackbot',
          'WhatsApp',
        ],
        allow: '/',
        disallow: ['/other/', '/cards-admin', '/tag/', '/api/'],
      },
      // Everyone else: open to search, except the private cards (the card maker at /c/new is the one public page under
      // /c/), the admin page, the reports themselves and the site's own API. The longer, more specific rule wins, so
      // /c/new stays open.
      {
        userAgent: '*',
        allow: ['/', '/c/new', '/c/og-new.jpg', '/c/thumb-'],
        disallow: ['/c/', '/other/', '/cards-admin', '/tag/', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
