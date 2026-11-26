import { countCardEvent } from '@iwb/server'
import { cardStyle, isCardEvent } from '@iwb/shared'

/** Counts one open-card event (`made` or `opened`) for a design. Nothing about who is kept. */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  const { event, style } = (body ?? {}) as { event?: unknown; style?: unknown }
  if (!isCardEvent(event)) return new Response(null, { status: 400 })
  await countCardEvent(event, cardStyle(style))
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
