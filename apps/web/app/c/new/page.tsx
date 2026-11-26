import type { Metadata } from 'next'
import { NewCard } from '@/components/cards/NewCard'
import '../card.css'

export const metadata: Metadata = {
  title: { absolute: 'Free Christmas card maker – allmythingsonline.com' },
  description:
    'Make a free personalised Christmas card in 30 seconds. Choose Traditional, Aussie or Beach, add a name, and send it by text or email. No sign-up.',
  alternates: { canonical: '/c/new' },
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
}

export default function NewCardPage() {
  return (
    <div className="xmas" data-theme="midnight">
      <div className="xmas-bg" aria-hidden="true" />
      <main className="xmas-top">
        <NewCard />
      </main>
    </div>
  )
}
