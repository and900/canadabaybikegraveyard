'use client'
import type { CardTheme } from '@iwb/shared'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
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

type Stage = 'sealed' | 'turning' | 'flap' | 'folded' | 'open'

/**
 * The card: a closed envelope addressed to the recipient. A tap turns it over, opens its flap, and out comes a folded
 * card with the village scene on its front, which opens to the message. The tree is always lit beside the greeting,
 * and Santa flies round the scene. The first tap tells the site the card was opened.
 */
export function CardView({ code, name, greeting, message, signoff, theme }: CardProps) {
  const [stage, setStage] = useState<Stage>('sealed')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const canvas = useSnow()
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const open = () => {
    if (stage !== 'sealed') return
    setStage('turning')
    void fetch(`/api/c/${code}/open`, { method: 'POST', keepalive: true }).catch(() => {})
    const later = (ms: number, next: Stage) => timers.current.push(setTimeout(() => setStage(next), ms))
    later(900, 'flap')
    later(1700, 'folded')
    later(3000, 'open')
  }
  const envelope = stage === 'sealed' || stage === 'turning' || stage === 'flap'

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
        <div className="xmas-tree" aria-hidden="true">
          <Image src="/c/tree.webp" alt="" width={420} height={628} />
          {SPARKS.map(([x, y], i) => (
            <b key={i} style={{ left: `${x}%`, top: `${y}%`, '--d': `${(i * 0.23) % 1.4}s` } as React.CSSProperties} />
          ))}
        </div>
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
            <span className="xmas-hint">Tap to open</span>
          </button>
        )}

        {!envelope && (
          <section className="xmas-card" data-stage={stage} aria-label="Your Christmas card">
            <div className="xmas-sheet">
              <h2>{name}</h2>
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
