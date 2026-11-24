'use client'
import { useState } from 'react'

/** Copies a card's link, which is what gets pasted into a message. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }
  return (
    <button type="button" onClick={copy} className="min-h-11 rounded-[10px] border border-edge px-3 font-bold">
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}
