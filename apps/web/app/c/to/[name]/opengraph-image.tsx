import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { nameFromSlug } from '@iwb/shared'
import { ImageResponse } from 'next/og'

export const alt = 'A Christmas card'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** The picture a link to a card shows in WhatsApp, iMessage and email: the winter village, and "A Christmas card for Nan". */
export default async function Image({ params }: { params: Promise<{ name: string }> }) {
  const name = nameFromSlug((await params).name)
  const [background, font] = await Promise.all([
    readFile(join(process.cwd(), 'lib/cards-assets/og-base.jpg')),
    readFile(join(process.cwd(), 'lib/cards-assets/mountains-of-christmas-latin-700-normal.woff')),
  ])
  const to = name ?? 'you'
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- drawn into the image, not a page */}
      <img
        src={`data:image/jpeg;base64,${background.toString('base64')}`}
        width={1200}
        height={630}
        alt=""
        style={{ position: 'absolute', inset: 0 }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          left: 70,
          bottom: 60,
          padding: '26px 44px',
          borderRadius: 14,
          background: 'rgba(255, 248, 236, 0.94)',
          color: '#c8312f',
          fontFamily: 'Mountains',
          maxWidth: 780,
        }}
      >
        <div style={{ fontSize: 40, color: '#2a2233' }}>A Christmas card</div>
        <div style={{ fontSize: to.length > 18 ? 64 : 84, lineHeight: 1.05, display: 'flex' }}>for {to}</div>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Mountains', data: font, weight: 700, style: 'normal' }] },
  )
}
