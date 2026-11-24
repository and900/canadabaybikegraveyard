import type { Metadata } from 'next'
import '../card.css'

export const metadata: Metadata = { title: { absolute: 'This card isn’t here' }, robots: { index: false } }

export default function CardNotFound() {
  return (
    <div className="xmas" data-theme="midnight">
      <div className="xmas-bg" aria-hidden="true" />
      <main>
        <section className="xmas-sheet" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--accent)' }}>This card isn’t here</h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>
            The link may have a typo in it. Please check it, or ask whoever sent it for the link again.
          </p>
        </section>
      </main>
    </div>
  )
}
