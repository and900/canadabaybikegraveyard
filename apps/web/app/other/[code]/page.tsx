import { notFound, redirect } from 'next/navigation'
import { validCode } from './access'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'A special card', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!validCode(code)) notFound()
  redirect('/other/' + encodeURIComponent(code) + '/movie')
}
