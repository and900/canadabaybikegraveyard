import { getCardSettings } from '@iwb/server'
import { nameFromSlug } from '@iwb/shared'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CardView } from '@/components/cards/CardView'
import '../../card.css'

type Props = { params: Promise<{ name: string }> }

/** A card made by the link itself: the name is in the address, so nothing is stored. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = nameFromSlug((await params).name)
  return {
    title: { absolute: name ? `A Christmas card for ${name}` : 'Christmas card' },
    description: 'Tap then tap the envelope to open your Christmas card',
    openGraph: {
      title: 'Merry Christmas!',
      description: name
        ? `A Christmas card for ${name}. Tap then tap the envelope to open your Christmas card`
        : 'Tap then tap the envelope to open your Christmas card',
      type: 'website',
    },
    icons: {
      icon: [
        { url: '/c/star.ico', sizes: '32x32', type: 'image/x-icon' },
        { url: '/c/icon.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/c/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    robots: { index: false, follow: false },
  }
}

export default async function OpenCard({ params }: Props) {
  const name = nameFromSlug((await params).name)
  if (!name) notFound()
  const { message, signoff, theme } = await getCardSettings()
  return <CardView name={name} greeting={null} message={message} signoff={signoff} theme={theme} />
}
