'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Two buttons in the bottom corners of a card that has been opened: one to make a card of your own, and one that opens
 * a small About panel over the card, so closing it brings the card back as it was.
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
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed artwork */}
        <img src="/c/btn-about.webp" alt="About" width={254} height={100} />
      </button>
      <Link href="/c/new" className="xmas-corner xmas-corner-right">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed artwork */}
        <img src="/c/btn-create.webp" alt="Create Your Own Card" width={469} height={100} />
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
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed logo */}
            <img
              src="/c/logo-words.webp"
              alt="All My Things Online"
              width={230}
              height={130}
              style={{ margin: '0 auto 6px' }}
            />
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
