import { withBotId } from 'botid/next/config'
import type { NextConfig } from 'next'
// Validates the public settings when the app builds or starts.
import './lib/public-env'

// BotID's challenge and its proxy are served from paths on this site, which withBotId sends on to Vercel (§6).
export default withBotId({
  // The workspace packages are TypeScript source; Next compiles them with the app.
  transpilePackages: ['@iwb/server', '@iwb/shared'],
  // Photos are served exactly as stored (§4.3), and this leaves no image-resizing endpoint to abuse.
  images: { unoptimized: true },
  poweredByHeader: false,
  // The Christmas card's link preview reads its picture and font from disk.
  outputFileTracingIncludes: {
    '/c/[code]/opengraph-image': ['./lib/cards-assets/**'],
    '/c/og': ['./lib/cards-assets/**'],
  },
  // pmtiles' fallback inflater, which no supported browser needs (see map/no-fflate.ts).
  turbopack: { resolveAlias: { fflate: { browser: './map/no-fflate.ts' } } },
} satisfies NextConfig)
