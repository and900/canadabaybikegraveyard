'use client'
import { CARD_STYLES, type CardStyle, nameFromSlug, OPEN_NAME_MAX, openCardUrl } from '@iwb/shared'
import { useState } from 'react'

const field = {
  font: 'inherit',
  padding: '10px 12px',
  flex: 1,
  minWidth: 0,
  borderRadius: 8,
  color: '#222',
  border: '1px solid #b9b0a0',
} as const
const button = {
  font: 'inherit',
  padding: '10px 22px',
  borderRadius: 8,
  background: '#c8312f',
  color: '#fff',
  border: 0,
} as const

/** Type who it is for and who it is from, get the link and a message to send. Nothing is saved: the names are the link. */
const LABELS: Record<CardStyle, string> = { traditional: 'Traditional', aussie: 'Aussie', beach: 'Beach' }

export function NewCard() {
  const [style, setStyle] = useState<CardStyle>('traditional')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [copied, setCopied] = useState(false)
  const toName = nameFromSlug(to.trim().replace(/\s+/g, '-'))
  const fromName = nameFromSlug(from.trim().replace(/\s+/g, '-'))
  const url = toName && fromName ? openCardUrl(location.origin, toName, fromName, style) : ''
  const message = url ? `Merry Christmas, ${toName}! A Christmas card for you. Open it here: ${url}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      void fetch('/api/c/count', {
        method: 'POST',
        body: JSON.stringify({ event: 'made', style }),
        keepalive: true,
      }).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The text is on screen to copy by hand.
    }
  }
  const bad = (value: string, clean: string | null) => value.trim() && !clean
  return (
    <section className="xmas-sheet" style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.8rem', lineHeight: 1.1, color: 'var(--accent)' }}>Make a Christmas card</h1>
      <div style={{ margin: '0.6rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {CARD_STYLES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStyle(option)}
              aria-pressed={style === option}
              style={{
                font: 'inherit',
                fontSize: '0.9rem',
                padding: 4,
                flex: '1 1 0',
                maxWidth: 120,
                borderRadius: 10,
                background: style === option ? '#c8312f' : 'transparent',
                color: style === option ? '#fff' : 'inherit',
                border: '2px solid ' + (style === option ? '#c8312f' : '#b9b0a0'),
                cursor: 'pointer',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a small fixed picture */}
              <img
                src={`/c/thumb-${option}.webp`}
                alt=""
                width={75}
                height={134}
                style={{ display: 'block', borderRadius: 6, width: '100%', height: 'auto' }}
              />
              {LABELS[option]}
            </button>
          ))}
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.6rem 0' }}>
        <span style={{ width: 52, textAlign: 'right' }}>To</span>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          maxLength={OPEN_NAME_MAX}
          placeholder="Josh and Maddie"
          style={field}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.6rem 0' }}>
        <span style={{ width: 52, textAlign: 'right' }}>From</span>
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          maxLength={OPEN_NAME_MAX}
          placeholder="Bec"
          style={field}
        />
      </label>
      {(bad(to, toName) || bad(from, fromName)) && (
        <p>Letters and spaces only, please, up to {OPEN_NAME_MAX} of them.</p>
      )}
      {url && (
        <>
          <p style={{ marginTop: '1.4rem' }}>Copy this and paste it into a message:</p>
          <p
            style={{
              wordBreak: 'break-word',
              fontSize: '0.95rem',
              textAlign: 'left',
              background: '#fff',
              color: '#222',
              padding: 12,
              borderRadius: 8,
            }}
          >
            {message}
          </p>
          <button type="button" onClick={copy} style={button}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </>
      )}
    </section>
  )
}
