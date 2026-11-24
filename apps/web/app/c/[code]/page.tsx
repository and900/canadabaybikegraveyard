import { cardByCode } from '@iwb/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CardView } from '@/components/cards/CardView'
import '../card.css'

type Props = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await cardByCode((await params).code)
  return {
    title: { absolute: card ? `A Christmas card for ${card.name}` : 'Christmas card' },
    description: 'Tap then tap the envelope to open your Christmas card',
    // What WhatsApp and Messenger show under the picture: three short lines and no sales pitch.
    openGraph: {
      title: 'Merry Christmas!',
      description: card
        ? `A Christmas card for ${card.name}. Tap then tap the envelope to open your Christmas card`
        : 'Tap then tap the envelope to open your Christmas card',
      type: 'website',
    },
    // Only the people sent the link need it: it stays out of search results.
    robots: { index: false, follow: false },
  }
}

export default async function Card({ params }: Props) {
  const { code } = await params
  const card = await cardByCode(code)
  if (!card) notFound()
  return <CardView code={code} {...card} />
}
