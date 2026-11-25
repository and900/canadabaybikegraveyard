import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { validCode } from './access'
export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ code: string }> }
const title = "Ollie's Big Adventure"
const description = 'A special graduation movie from Nana & Pa.'
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const robots = { index: false, follow: false }
  if (!validCode(code)) return { title: 'A special card', robots }
  const url = 'https://www.allmythingsonline.com/other/' + encodeURIComponent(code)
  return {
    title, description, robots, referrer: 'no-referrer',
    openGraph: { title, description, url, type: 'website', images: [{ url: url + '/poster', width: 1200, height: 675, type: 'image/jpeg', alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [url + '/poster'] }
  }
}
export default async function Page({ params }: Props) {
  const { code } = await params
  if (!validCode(code)) notFound()
  const path = '/other/' + encodeURIComponent(code)
  return (
    <main style={{ minHeight: '100vh', background: '#101827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <section style={{ maxWidth: 760, width: '100%' }}>
        <h1 style={{ fontSize: 32, marginBottom: 12 }}>{title}</h1>
        <p style={{ marginBottom: 20 }}>{description}</p>
        {/* Private image must bypass public image optimization caches. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={path + '/poster'} alt={title} width={1200} height={675} style={{ width: '100%', height: 'auto', borderRadius: 16 }} />
        <p style={{ marginTop: 20 }}>Turn up the sound and enjoy!</p>
        <a href={path + '/movie'} style={{ display: 'inline-block', background: '#ffd34e', color: '#101827', padding: '14px 30px', borderRadius: 12, fontWeight: 700, marginTop: 12, textDecoration: 'none' }}>Watch Movie ▶</a>
      </section>
    </main>
  )
}
