import { listLiveTags, uploadsPaused } from '@iwb/server'
import type { Metadata } from 'next'
import { ListScreen } from '@/components/ListScreen'

export const metadata: Metadata = { title: 'List' }

/**
 * Every live tag, rendered on the server: reading it needs neither the map nor JavaScript. Tagging from here needs no
 * map either (§10.3).
 */
export default async function ListPage() {
  const [tags, paused] = await Promise.all([listLiveTags(), uploadsPaused()])
  const now = new Date()

  return (
    <main className="mx-auto flex w-full max-w-[70ch] flex-1 flex-col gap-3 p-4">
      <ListScreen tags={tags} now={now} uploadsPaused={paused} />
    </main>
  )
}
