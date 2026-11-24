import { markOpened } from '@iwb/server'

/** The recipient tapped their envelope: notes the first time. Done on the tap, not the page, which link previews load too. */
export async function POST(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const found = await markOpened((await params).code)
  return new Response(null, { status: found ? 204 : 404, headers: { 'Cache-Control': 'no-store' } })
}
