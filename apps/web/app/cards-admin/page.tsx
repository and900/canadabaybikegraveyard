import { CARD_LIMITS, CARD_STYLES, CARD_THEMES, cardUrl } from '@iwb/shared'
import { cardCounts, cardCountsByDay, getCardSettings, listRecipients } from '@iwb/server'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { CopyEmail } from '@/components/cards/CopyEmail'
import { CopyLink } from '@/components/cards/CopyLink'
import { adminOpen, signedIn } from '@/lib/cards-admin'

export const metadata: Metadata = { title: 'Christmas cards', robots: { index: false, follow: false } }

const FIELD = 'min-h-11 w-full rounded-[10px] border border-edge px-3 py-2'
const BUTTON = 'min-h-11 rounded-[10px] bg-night px-4 font-bold text-white'
const when = (date: Date) =>
  date.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

export default async function CardsAdmin({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams
  const page = (children: React.ReactNode) => (
    <main className="mx-auto w-full max-w-[70ch] px-4 py-6">
      <h1 className="text-2xl font-bold">Christmas cards</h1>
      {notice && (
        <p role="status" className="mt-3 rounded-[10px] bg-tint px-3 py-2 font-bold">
          {notice}
        </p>
      )}
      {children}
    </main>
  )

  if (!adminOpen())
    return page(<p className="mt-3">This page is closed: set CARDS_ADMIN_PASSWORD in Vercel to open it.</p>)

  if (!(await signedIn()))
    return page(
      <form method="post" action="/cards-admin/api/login" className="mt-4 flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1 font-bold">
          Password
          <input type="password" name="password" autoComplete="current-password" required className={FIELD} />
        </label>
        <button className={BUTTON}>Sign in</button>
      </form>,
    )

  const [settings, recipients, counts, days] = await Promise.all([
    getCardSettings(),
    listRecipients(),
    cardCounts(CARD_STYLES),
    cardCountsByDay(14),
  ])
  const host = (await headers()).get('host') ?? 'localhost:3000'
  const origin = `${/^localhost/.test(host) ? 'http' : 'https'}://${host}`
  const opened = recipients.filter((r) => r.openedAt).length

  return page(
    <>
      <form method="post" action="/cards-admin/api/logout" className="mt-1">
        <button className="underline">Sign out</button>
      </form>

      <section className="mt-6" aria-labelledby="count-h">
        <h2 id="count-h" className="text-lg font-bold">
          Open cards (from /c/new)
        </h2>
        <p className="text-muted">
          Made = link copied to send. Opened = envelope tapped. Counts only; no names are kept.
        </p>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr>
              <th>Design</th>
              <th>Made</th>
              <th>Opened</th>
            </tr>
          </thead>
          <tbody>
            {counts.map((row) => (
              <tr key={row.style}>
                <td className="capitalize">{row.style}</td>
                <td>{row.made}</td>
                <td>{row.opened}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td>All</td>
              <td>{counts.reduce((sum, row) => sum + row.made, 0)}</td>
              <td>{counts.reduce((sum, row) => sum + row.opened, 0)}</td>
            </tr>
          </tbody>
        </table>
        {days.length > 0 && (
          <p className="mt-2 text-muted">
            By day: {days.map((d) => `${d.day.slice(5)} made ${d.made}, opened ${d.opened}`).join(' · ')}
          </p>
        )}
      </section>

      <section className="mt-6" aria-labelledby="card-h">
        <h2 id="card-h" className="text-lg font-bold">
          The card everyone gets
        </h2>
        <form method="post" action="/cards-admin/api/settings" className="mt-2 flex flex-col gap-3">
          <label className="flex flex-col gap-1 font-bold">
            Message
            <textarea
              name="message"
              rows={6}
              maxLength={CARD_LIMITS.message}
              defaultValue={settings.message}
              required
              className={FIELD}
            />
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Sign-off
            <input
              name="signoff"
              maxLength={CARD_LIMITS.signoff}
              defaultValue={settings.signoff}
              required
              className={FIELD}
            />
          </label>
          <label className="flex flex-col gap-1 font-bold">
            Colours
            <select name="theme" defaultValue={settings.theme} className={FIELD}>
              {CARD_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme[0]!.toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <button className={`${BUTTON} self-start`}>Save the card</button>
        </form>
        <p className="mt-2 text-sm text-muted">
          A person can have their own message instead: set it on their line below.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="add-h">
        <h2 id="add-h" className="text-lg font-bold">
          Add people
        </h2>
        <form method="post" action="/cards-admin/api/add" className="mt-2 flex flex-col gap-3">
          <label className="flex flex-col gap-1 font-bold">
            One person on each line
            <textarea
              name="names"
              rows={5}
              placeholder={'Nan\nTom and Hillary | Hope the knee is better\nTech Shed'}
              className={FIELD}
            />
          </label>
          <p className="text-sm text-muted">Just a name, or a name then | then a greeting. You can paste a list.</p>
          <button className={`${BUTTON} self-start`}>Add them</button>
        </form>
      </section>

      <section className="mt-8" aria-labelledby="people-h">
        <h2 id="people-h" className="text-lg font-bold">
          People ({recipients.length}) · opened {opened}
        </h2>
        <ul className="mt-2 flex flex-col gap-3">
          {recipients.map((person) => {
            const url = cardUrl(origin, person.code)
            return (
              <li key={person.id} className="rounded-[10px] border border-edge p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <strong className="text-lg">{person.name}</strong>
                  <span className={person.openedAt ? 'font-bold text-green-800' : 'text-muted'}>
                    {person.openedAt ? `Opened ${when(person.openedAt)}` : 'Not opened yet'}
                  </span>
                </div>
                <p className="mt-1 text-sm break-all">{url}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <CopyLink url={url} />
                  <CopyEmail url={url} imageUrl={`${origin}/c/${person.code}/opengraph-image`} name={person.name} />
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(url)}`}
                    className="inline-flex min-h-11 items-center rounded-[10px] border border-edge px-3 font-bold"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={url}
                    className="inline-flex min-h-11 items-center rounded-[10px] border border-edge px-3 font-bold"
                  >
                    Preview
                  </a>
                </div>
                <details className="mt-2">
                  <summary className="min-h-11 cursor-pointer py-2 font-bold">Edit</summary>
                  <form method="post" action="/cards-admin/api/update" className="flex flex-col gap-2">
                    <input type="hidden" name="id" value={person.id} />
                    <label className="flex flex-col gap-1">
                      Name
                      <input
                        name="name"
                        defaultValue={person.name}
                        maxLength={CARD_LIMITS.name}
                        required
                        className={FIELD}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Greeting
                      <input
                        name="greeting"
                        defaultValue={person.greeting ?? ''}
                        maxLength={CARD_LIMITS.greeting}
                        className={FIELD}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Their own message (blank uses the shared one)
                      <textarea
                        name="message"
                        rows={4}
                        defaultValue={person.message ?? ''}
                        maxLength={CARD_LIMITS.message}
                        className={FIELD}
                      />
                    </label>
                    <button className={`${BUTTON} self-start`}>Save</button>
                  </form>
                  <form method="post" action="/cards-admin/api/delete" className="mt-2">
                    <input type="hidden" name="id" value={person.id} />
                    <button className="min-h-11 text-red-800 underline">Delete {person.name}</button>
                  </form>
                </details>
              </li>
            )
          })}
        </ul>
        {opened > 0 && (
          <form method="post" action="/cards-admin/api/forget-opens" className="mt-4">
            <button className="min-h-11 underline">Clear who has opened (for next year)</button>
          </form>
        )}
      </section>
    </>,
  )
}
