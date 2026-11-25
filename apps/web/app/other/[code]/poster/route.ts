import { NextResponse } from 'next/server'
import { validCode } from '../access'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!validCode((await params).code)) return new NextResponse('Not found', { status: 404, headers })
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return new NextResponse('Not ready', { status: 503, headers })
  try {
    const target = new URL(process.env.OLLIE_PRIVATE_MOVIE_URL || '')
    if (target.protocol !== 'https:' || !target.hostname.endsWith('.private.blob.vercel-storage.com')) throw new Error('Invalid storage host')
    const url = new URL('/other-cards/ollie-message-preview.jpg', target.origin)
    const upstream = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store', redirect: 'error' })
    if (!upstream.ok || !upstream.body) throw new Error('Storage unavailable')
    return new NextResponse(upstream.body, { headers: { ...headers, 'Content-Type': 'image/jpeg' } })
  } catch {
    return new NextResponse('Poster unavailable', { status: 503, headers })
  }
}
