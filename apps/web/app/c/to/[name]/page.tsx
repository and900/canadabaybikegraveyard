import { getCardSettings } from '@iwb/server'
import { cardStyle, nameFromSlug, OPEN_MESSAGE, openSignoff } from '@iwb/shared'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CardView } from '@/components/cards/CardView'
import '../../card.css'

type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ from?: string; style?: string }> }

/** A card made by the link itself: the name is in the address, so nothing is stored. */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const name = nameFromSlug((await params).name)
  const style = cardStyle((await searchParams).style)
  // The picture shown in a message: drawn by /c/og from the name and scene, since a link carries them in its address.
  const picture = `/c/og?${new URLSearchParams({ name: name ?? '', style })}`
  return {
    title: { absolute: name ? `A Christmas card for ${name}` : 'Christmas card' },
    description: 'Tap then tap the envelope to open your Christmas card',
    openGraph: {
      title: 'Merry Christmas!',
      description: name
        ? `A Christmas card for ${name}. Tap then tap the envelope to open your Christmas card`
        : 'Tap then tap the envelope to open your Christmas card',
      type: 'website',
      images: [{ url: picture, width: 1200, height: 630, alt: 'A Christmas card' }],
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

export default async function OpenCard({ params, searchParams }: Props) {
  const name = nameFromSlug((await params).name)
  if (!name) notFound()
  const settings = await getCardSettings()
  // Who it is from, when the link says: otherwise the sign-off the card's maker set.
  const from = nameFromSlug((await searchParams).from ?? '')
  const signoff = from ? openSignoff(from) : settings.signoff
  return (
    <CardView
      name={name}
      greeting={null}
      message={OPEN_MESSAGE}
      signoff={signoff}
      theme={settings.theme}
      style={cardStyle((await searchParams).style)}
    />
  )
}
