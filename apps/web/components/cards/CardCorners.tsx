'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function Star() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 1.8l3 6.6 7.2.8-5.4 4.8 1.6 7.1L12 17.4 5.6 21.1l1.6-7.1L1.8 9.2 9 8.4z"
        fill="#f6c343"
        stroke="#b8861b"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Two stars in the bottom corners of a card that has been opened: one to make a card of your own, and one that opens a
 * small About panel over the card, so closing it brings the card back as it was.
 */
export function CardCorners() {
  const [about, setAbout] = useState(false)
  useEffect(() => {
    if (!about) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setAbout(false)
    addEventListener('keydown', close)
    return () => removeEventListener('keydown', close)
  }, [about])
  return (
    <>
      <button type="button" className="xmas-corner xmas-corner-left" onClick={() => setAbout(true)}>
        <Star />
        About
      </button>
      <Link href="/c/new" className="xmas-corner xmas-corner-right">
        <Star />
        Create Your Own Card
      </Link>
      {about && (
        <div
          className="xmas-about"
          role="dialog"
          aria-modal="true"
          aria-labelledby="xmas-about-h"
          onClick={() => setAbout(false)}
        >
          <div className="xmas-about-box" onClick={(event) => event.stopPropagation()}>
            <h2 id="xmas-about-h">About</h2>
            <p>Christmas cards by allmythingsonline.com. Making your own is free and takes about 30 seconds.</p>
            <p>
              <Link href="/c/new">Create your own card</Link>
            </p>
            <p>
              Also from us: <Link href="/">Canada Bay Community Watch</Link>, a free map for reporting abandoned
              e-bikes, parking obstructions, graffiti and damaged roads and footpaths in the City of Canada Bay.
            </p>
            <p>
              Questions or feedback: <a href="mailto:Andrew@allmythingsonline.com">Andrew@allmythingsonline.com</a>
            </p>
            <button type="button" autoFocus onClick={() => setAbout(false)}>
              Back to my card
            </button>
          </div>
        </div>
      )}
    </>
  )
}
