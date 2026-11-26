'use client'
import { nameFromSlug, OPEN_NAME_MAX, openCardUrl } from '@iwb/shared'
import { useState } from 'react'

const field = {
  font: 'inherit',
  padding: '10px 12px',
  width: '100%',
  maxWidth: 360,
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
export function NewCard() {
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [copied, setCopied] = useState(false)
  const toName = nameFromSlug(to.trim().replace(/\s+/g, '-'))
  const fromName = nameFromSlug(from.trim().replace(/\s+/g, '-'))
  const url = toName && fromName ? openCardUrl(location.origin, toName, fromName) : ''
  const message = url ? `Merry Christmas, ${toName}! I made you a Christmas card. Open it here: ${url}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The text is on screen to copy by hand.
    }
  }
  const bad = (value: string, clean: string | null) => value.trim() && !clean
  return (
    <section className="xmas-sheet" style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.2rem', color: 'var(--accent)' }}>Make a Christmas card</h1>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>Type who it is for and who it is from.</p>
      <label style={{ display: 'block', margin: '1rem 0' }}>
        <span style={{ display: 'block', marginBottom: 6 }}>To</span>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          maxLength={OPEN_NAME_MAX}
          placeholder="Josh and Maddie"
          style={field}
        />
      </label>
      <label style={{ display: 'block', margin: '1rem 0' }}>
        <span style={{ display: 'block', marginBottom: 6 }}>From</span>
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
          <p style={{ marginTop: '1.4rem' }}>Copy this, then paste it into an email or message:</p>
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
