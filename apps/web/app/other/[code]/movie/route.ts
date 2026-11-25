import { NextResponse } from 'next/server'
import { blobReadWriteToken, ollieMovieUrl } from '@/lib/env'
import { validCode } from '../access'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
}
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!validCode((await params).code)) return new NextResponse('Not found', { status: 404, headers })
  const url = ollieMovieUrl()
  const token = blobReadWriteToken()
  if (!url || !token) return new NextResponse('Card not ready', { status: 503, headers })
  try {
    const target = new URL(url)
    if (target.protocol !== 'https:' || !target.hostname.endsWith('.private.blob.vercel-storage.com'))
      throw new Error('Invalid storage host')
    const upstream = await fetch(target, {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
      redirect: 'error',
    })
    if (!upstream.ok || !upstream.body) throw new Error(`Storage unavailable (HTTP ${upstream.status})`)
    return new NextResponse(upstream.body, {
      headers: {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      },
    })
  } catch (error) {
    // Which step failed, for Vercel's logs. Never the settings themselves.
    console.error(`other card %s: %s`, 'movie', error instanceof Error ? error.message : 'unknown')
    return new NextResponse('Card temporarily unavailable', { status: 503, headers })
  }
}
