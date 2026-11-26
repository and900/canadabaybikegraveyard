import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { Announcer } from '@/components/Announcer'
import { Header } from '@/components/Header'
import { SiteChrome } from '@/components/SiteChrome'
import { RESTORE_CHOICE } from '@/lib/motion'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Canada Bay Community Watch', template: '%s · Canada Bay Community Watch' },
  // What search results show under the title, and the fallback for every page that has none of its own.
  description:
    'Report and map abandoned share bikes, problem parking, graffiti and damaged footpaths and roads in the Canada Bay area. No sign-up needed.',
  // The bike's icons, named here rather than found as files, which every page, the cards' too, would list.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = { viewportFit: 'cover' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render every request: proxy.ts makes a new CSP nonce each time.
  await connection()
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    // The script below puts the visitor's Reduce motion choice on <html> before React hydrates it. The scroll padding
    // keeps whatever has the focus clear of the wide layout's pinned footer on the home page, never taller than 20dvh
    // (Footer.tsx).
    <html lang="en-AU" suppressHydrationWarning className="wide:scroll-pb-[20dvh]">
      <head>
        <link
          rel="preload"
          href="/fonts/atkinson-hyperlegible-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: RESTORE_CHOICE }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-white font-sans text-ink">
        <SiteChrome>
          <Header />
        </SiteChrome>
        {children}
        <Announcer />
      </body>
    </html>
  )
}
