import type { Metadata } from 'next'
import { NewCard } from '@/components/cards/NewCard'
import '../card.css'

export const metadata: Metadata = {
  title: { absolute: 'Make a Christmas card' },
  description: 'Type a name, copy the link, and send a Christmas card.',
  icons: {
    icon: [
      { url: '/c/star.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/c/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/c/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Make a Christmas card',
    description: 'Choose a design, type a name, and send a Christmas card.',
    type: 'website',
    images: [{ url: '/c/og-new.jpg', width: 1200, height: 630, alt: 'Three Christmas card designs' }],
  },
  robots: { index: false, follow: false },
}

export default function NewCardPage() {
  return (
    <div className="xmas" data-theme="midnight">
      <div className="xmas-bg" aria-hidden="true" />
      <main>
        <NewCard />
      </main>
    </div>
  )
}
