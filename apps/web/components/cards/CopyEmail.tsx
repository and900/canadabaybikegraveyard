'use client'
import { useState } from 'react'

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/**
 * Copies a card as an email to paste into Outlook.com or Gmail: a line of greeting, the card's picture as a clickable
 * link, and a button.
 */
export function CopyEmail({
  url,
  imageUrl,
  name,
  heading,
  alt,
  button = 'Open your Christmas card',
}: {
  url: string
  imageUrl: string
  /** Who the card is for; used for the greeting and the picture's description unless they are given. */
  name?: string
  heading?: string
  alt?: string
  button?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => {
    const link = escape(url)
    const greeting = heading ?? `Merry Christmas, ${name}!`
    const html = `<p style="font-size:18px">${escape(greeting)}</p>
<p><a href="${link}"><img src="${escape(imageUrl)}" width="560" alt="${escape(alt ?? `A Christmas card for ${name}`)}" style="max-width:100%;border-radius:8px"></a></p>
<p><a href="${link}" style="display:inline-block;background:#c8312f;color:#ffffff;font-weight:bold;font-size:18px;text-decoration:none;padding:12px 22px;border-radius:8px">${escape(button)}</a></p>`
    const text = `${greeting}\n${button}: ${url}`
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2400)
  }
  return (
    <button type="button" onClick={copy} className="min-h-11 rounded-[10px] border border-edge px-3 font-bold">
      {state === 'copied' ? 'Copied: paste into your email' : state === 'failed' ? 'Could not copy' : 'Copy email'}
    </button>
  )
}
