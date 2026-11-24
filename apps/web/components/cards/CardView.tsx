'use client'
import type { CardTheme } from '@iwb/shared'
import Image from 'next/image'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pauseChristmasMusic, startChristmasMusic, stopChristmasMusic } from './music'
import { Santa } from './Santa'

export type CardProps = {
  code: string
  name: string
  greeting: string | null
  message: string
  signoff: string
  theme: CardTheme
}

/** Where the tree's baubles twinkle, as a percentage of its picture. */
const SPARKS = [
  [50, 5],
  [40, 24],
  [60, 31],
  [35, 45],
  [64, 50],
  [48, 60],
  [28, 70],
  [70, 72],
  [42, 82],
  [58, 88],
]

/** A falling snow, drawn on a canvas behind the card. With reduced motion it is drawn once and stays still. */
function useSnow() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    const size = () => {
      width = element.width = innerWidth
      height = element.height = innerHeight
    }
    size()
    addEventListener('resize', size)
    const flakes = Array.from({ length: innerWidth < 600 ? 70 : 130 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.6 + 0.8,
      s: Math.random() * 0.9 + 0.35,
      p: Math.random() * 6,
    }))
    let frame = 0
    const draw = () => {
      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgba(255,255,255,.85)'
      for (const flake of flakes) {
        if (!reduce) {
          flake.y += flake.s
          flake.p += 0.012
          flake.x += Math.sin(flake.p) * 0.45
          if (flake.y > height + 5) {
            flake.y = -5
            flake.x = Math.random() * width
          }
        }
        context.beginPath()
        context.arc(flake.x, flake.y, flake.r, 0, 6.3)
        context.fill()
      }
      if (!reduce) frame = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('resize', size)
    }
  }, [])
  return canvas
}

type Stage = 'sealed' | 'turning' | 'flap' | 'rising' | 'leaving' | 'open'

/**
 * The card: a closed envelope addressed to the recipient. A tap turns it over, opens its flap, and out comes a folded
 * card with the village scene on its front, which opens to the message. Santa flies round the scene, towing a banner for his first two passes. Tapping the open card starts it all again. The first tap tells the site the card was opened.
 */
export function CardView({ code, name, greeting, message, signoff, theme }: CardProps) {
  const [stage, setStage] = useState<Stage>('sealed')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const canvas = useSnow()
  const peek = useRef<HTMLSpanElement>(null)
  const card = useRef<HTMLElement>(null)
  /** Where the card was, peeking from the envelope, when it set off for its place. */
  const from = useRef<DOMRect | null>(null)
  /** The envelope has drifted off the screen. */
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  // The first tap or click anywhere on the card starts Jingle Bells (a touch counts as a tap only once the finger is up,
  // which is when iPhones allow sound), and it plays until the card is closed. No controls, and nothing on page load.
  useEffect(() => {
    const events = ['pointerup', 'click', 'touchend', 'keydown'] as const
    const start = () => {
      void startChristmasMusic()
    }
    const hide = () => pauseChristmasMusic(document.hidden)
    events.forEach((event) => addEventListener(event, start, { passive: true }))
    document.addEventListener('visibilitychange', hide)
    return () => {
      events.forEach((event) => removeEventListener(event, start))
      document.removeEventListener('visibilitychange', hide)
      stopChristmasMusic()
    }
  }, [])

  const open = () => {
    if (stage !== 'sealed') return
    setStage('turning')
    void fetch(`/api/c/${code}/open`, { method: 'POST', keepalive: true }).catch(() => {})
    const later = (ms: number, run: () => void) => timers.current.push(setTimeout(run, ms))
    // A slow dance: the flap opens; the card rises until it is clear of the envelope (and a little more) while the
    // envelope sinks; then the card descends to its place while the envelope drifts off to the lower right, its flap the
    // last of it to go; then the card opens.
    later(900, () => setStage('flap'))
    later(1800, () => setStage('rising'))
    later(4800, () => {
      from.current = peek.current?.getBoundingClientRect() ?? null
      setStage('leaving')
    })
    later(7600, () => setStage('open'))
    later(8800, () => setGone(true))
  }
  /** Back to the closed envelope, and Santa starts his flight again. */
  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setGone(false)
    setStage('sealed')
  }
  const envelope = !gone
  const cardShown = stage === 'leaving' || stage === 'open'

  // The card sets off from where it peeked out of the envelope and settles in its place at the bottom.
  useLayoutEffect(() => {
    const element = card.current
    const start = from.current
    if (stage !== 'leaving' || !element || !start) return
    from.current = null
    const end = element.getBoundingClientRect()
    const dx = start.left + start.width / 2 - (end.left + end.width / 2)
    const dy = start.top + start.height / 2 - (end.top + end.height / 2)
    element.style.transition = 'none'
    element.style.transform = `translate(${dx}px, ${dy}px) scale(${start.width / end.width})`
    void element.offsetWidth
    element.style.transition = 'transform 2.6s ease-in-out'
    element.style.transform = ''
  }, [stage])

  return (
    <div className="xmas" data-theme={theme}>
      <div className="xmas-bg" aria-hidden="true" />
      <canvas ref={canvas} aria-hidden="true" />

      {/* The garland along the top, its pictures turned over alternately so they join up at any width. */}
      <div className="xmas-holly" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Image key={i} src="/c/border.webp" alt="" width={900} height={202} data-flip={i % 2 ? '' : undefined} />
        ))}
      </div>
      <div className="xmas-head">
        <h1>Merry Christmas!</h1>
      </div>

      <Santa name={name} run={stage !== 'sealed'} />

      <main>
        {envelope && (
          <button
            type="button"
            className="xmas-env"
            data-stage={stage}
            aria-label={`Open your Christmas card, ${name}`}
            onClick={open}
          >
            {/* The card, behind the envelope, slides up out of it once the flap is open. */}
            {/* The flap, standing open above the envelope, behind the card. */}
            <span className="xmas-flap-up" aria-hidden="true" />
            <span ref={peek} className="xmas-peek" aria-hidden="true" />
            <span className="xmas-turn">
              <span className="xmas-face xmas-front">
                <span className="xmas-stamp">★</span>
                <span className="xmas-label">To: {name}</span>
              </span>
              <span className="xmas-face xmas-back">
                <span className="xmas-flap" />
                <span className="xmas-seal">★</span>
              </span>
            </span>
            {stage === 'sealed' && <span className="xmas-hint">Tap to open</span>}
          </button>
        )}

        {cardShown && (
          <section
            ref={card}
            className="xmas-card"
            data-stage={stage}
            aria-label="Your Christmas card"
            onClick={stage === 'open' ? restart : undefined}
          >
            <div className="xmas-sheet">
              <div className="xmas-sheet-head">
                <div className="xmas-tree" aria-hidden="true">
                  <Image src="/c/tree.webp" alt="" width={420} height={628} />
                  {SPARKS.map(([x, y], i) => (
                    <b
                      key={i}
                      style={{ left: `${x}%`, top: `${y}%`, '--d': `${(i * 0.23) % 1.4}s` } as React.CSSProperties}
                    />
                  ))}
                </div>
                <h2>{name}</h2>
              </div>
              {greeting && <p className="xmas-hi">{greeting}</p>}
              <p className="xmas-msg">{message}</p>
              <div className="xmas-from">{signoff}</div>
            </div>
            <div className="xmas-cover" aria-hidden="true" />
          </section>
        )}
      </main>
    </div>
  )
}
