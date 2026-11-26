'use client'
import { CARD_STYLES, type CardStyle, nameFromSlug, OPEN_NAME_MAX, openCardUrl } from '@iwb/shared'
import { useEffect, useState } from 'react'

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

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const LABELS: Record<CardStyle, string> = { traditional: 'Traditional', aussie: 'Aussie', beach: 'Beach' }

/** Type who it is for and who it is from, then copy it for a message or an email. Nothing is saved: the names are the link. */
export function NewCard() {
  const [style, setStyle] = useState<CardStyle>('traditional')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [copied, setCopied] = useState<'message' | 'email' | 'failed' | null>(null)
  // The picture is drawn by the server, so it waits for a pause in typing.
  const [picture, setPicture] = useState('')
  const toName = nameFromSlug(to.trim().replace(/\s+/g, '-'))
  const fromName = nameFromSlug(from.trim().replace(/\s+/g, '-'))
  const url = toName && fromName ? openCardUrl(location.origin, toName, fromName, style) : ''
  const message = url ? `Merry Christmas, ${toName}! A Christmas card for you. Open it here: ${url}` : ''
  const pictureUrl = toName ? `/c/og?${new URLSearchParams({ name: toName, style })}` : ''
  useEffect(() => {
    const timer = setTimeout(() => setPicture(pictureUrl), 600)
    return () => clearTimeout(timer)
  }, [pictureUrl])
  const counted = () =>
    void fetch('/api/c/count', {
      method: 'POST',
      body: JSON.stringify({ event: 'made', style }),
      keepalive: true,
    }).catch(() => {})
  const done = (state: 'message' | 'email' | 'failed') => {
    setCopied(state)
    setTimeout(() => setCopied(null), 2200)
  }
  /** For WhatsApp, Messenger, texts and Instagram messages: plain words with the link, which they turn into a preview. */
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      counted()
      done('message')
    } catch {
      done('failed')
    }
  }
  /** For Outlook and Gmail: the card's picture as a link, and a button. No bare address to look untidy. */
  const copyEmail = async () => {
    const picture = `${location.origin}/c/og?${new URLSearchParams({ name: toName ?? '', style })}`
    const html = `<p style="font-size:18px">Merry Christmas, ${escape(toName ?? '')}!</p>
<p><a href="${escape(url)}"><img src="${escape(picture)}" width="560" alt="A Christmas card for ${escape(toName ?? '')}" style="max-width:100%;border-radius:8px"></a></p>
<p><a href="${escape(url)}" style="display:inline-block;background:#c8312f;color:#ffffff;font-weight:bold;font-size:18px;text-decoration:none;padding:12px 22px;border-radius:8px">Open your Christmas card</a></p>`
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([message], { type: 'text/plain' }),
        }),
      ])
      counted()
      done('email')
    } catch {
      done('failed')
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
          {picture === pictureUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- drawn by the server for this name
            <img
              src={picture}
              alt={`Preview of the card for ${toName}`}
              width={1200}
              height={630}
              style={{ display: 'block', margin: '0.6rem auto', width: 200, height: 'auto', borderRadius: 6 }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={copyMessage} style={button}>
              {copied === 'message' ? 'Copied!' : 'Copy for message'}
            </button>
            <button type="button" onClick={copyEmail} style={button}>
              {copied === 'email' ? 'Copied!' : 'Copy for email'}
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
            {copied === 'failed'
              ? 'Could not copy. Your browser blocked it.'
              : 'Message: WhatsApp, Messenger, texts, Instagram. Email: Outlook, Gmail.'}
          </p>
          <details style={{ fontSize: '0.85rem', marginTop: 6 }}>
            <summary style={{ cursor: 'pointer' }}>Show link</summary>
            <p style={{ wordBreak: 'break-all', margin: '4px 0 0' }}>
              <a href={url}>{url}</a>
            </p>
          </details>
        </>
      )}
    </section>
  )
}
