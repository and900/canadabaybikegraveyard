'use client'
import { nameFromSlug, OPEN_NAME_MAX, openCardUrl } from '@iwb/shared'
import { useState } from 'react'

/** Type a name, get the card's link. Nothing is saved: the name is the link. */
export function NewCard() {
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const clean = nameFromSlug(name.trim().replace(/\s+/g, '-'))
  const url = clean ? openCardUrl(location.origin, clean) : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The link is on screen to copy by hand.
    }
  }
  return (
    <section className="xmas-sheet" style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.2rem', color: 'var(--accent)' }}>Make a Christmas card</h1>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>Type who it is for, then copy the link and send it.</p>
      <label style={{ display: 'block', margin: '1rem 0' }}>
        <span style={{ display: 'block', marginBottom: 6 }}>Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={OPEN_NAME_MAX}
          placeholder="Tom and Hillary"
          style={{
            font: 'inherit',
            padding: '10px 12px',
            width: '100%',
            maxWidth: 360,
            borderRadius: 8,
            color: '#222',
          }}
        />
      </label>
      {name.trim() && !clean && <p>Letters and spaces only, please, up to {OPEN_NAME_MAX} of them.</p>}
      {clean && (
        <>
          <p style={{ wordBreak: 'break-all', fontSize: '0.95rem' }}>
            <a href={url}>{url}</a>
          </p>
          <button
            type="button"
            onClick={copy}
            style={{
              font: 'inherit',
              padding: '10px 22px',
              borderRadius: 8,
              background: '#c8312f',
              color: '#fff',
              border: 0,
            }}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </>
      )}
    </section>
  )
}
