'use client'
import type { CardTheme } from '@iwb/shared'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export type CardProps = {
  code: string
  name: string
  greeting: string | null
  message: string
  signoff: string
  theme: CardTheme
}

const LIGHTS = ['#ff5a5a', '#ffd36b', '#6bc7ff', '#8be28b', '#ff9be0']
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

/**
 * The card: a sealed envelope for the recipient, which opens on a tap to the card with its message, a tree that lights
 * when tapped, and Santa's sleigh crossing once with a banner. The first tap tells the site the card was opened.
 */
export function CardView({ code, name, greeting, message, signoff, theme }: CardProps) {
  const [stage, setStage] = useState<'sealed' | 'opening' | 'open'>('sealed')
  const [lit, setLit] = useState(false)
  // Each flight is a new number, so the sleigh's animation starts from the left again.
  const [flight, setFlight] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const canvas = useSnow()
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const fly = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setFlight((number) => number + 1)
  }

  const open = () => {
    if (stage !== 'sealed') return
    setStage('opening')
    void fetch(`/api/c/${code}/open`, { method: 'POST', keepalive: true }).catch(() => {})
    timers.current.push(
      setTimeout(() => {
        setStage('open')
        timers.current.push(setTimeout(fly, 500))
      }, 750),
    )
  }

  return (
    <div className="xmas" data-theme={theme}>
      <div className="xmas-bg" aria-hidden="true" />
      <canvas ref={canvas} aria-hidden="true" />
      <div className="xmas-lights" aria-hidden="true">
        {Array.from({ length: 22 }, (_, i) => (
          <i
            key={i}
            style={{ '--c': LIGHTS[i % LIGHTS.length], '--d': `${(i * 0.37) % 2.4}s` } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Keyed by the flight, so each one starts over. The banner sails across the top, the sleigh along the bottom. */}
      <div
        key={`banner-${flight}`}
        className="xmas-fly xmas-fly-banner"
        data-go={flight ? '' : undefined}
        aria-hidden="true"
      >
        <div className="xmas-banner">Merry Christmas, {name}!</div>
      </div>
      <div
        key={`sleigh-${flight}`}
        className="xmas-fly xmas-fly-sleigh"
        data-go={flight ? '' : undefined}
        aria-hidden="true"
      >
        <div className="xmas-bob">
          {/* Three poses of the team, one after another, so the reindeer gallop. Santa and the sleigh stay put. */}
          <div className="xmas-sleigh">
            {(['a', 'b', 'c'] as const).map((pose) => (
              <Image
                key={pose}
                className={`xmas-pose xmas-pose-${pose}`}
                src={`/c/sleigh-${pose}.webp`}
                alt=""
                width={760}
                height={272}
                loading="eager"
              />
            ))}
            {/* A trail of golden sparkles behind the sleigh */}
            {Array.from({ length: 9 }, (_, i) => (
              <b key={i} className="xmas-trail" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </div>

      <main>
        <button
          type="button"
          className="xmas-env"
          hidden={stage === 'open'}
          data-open={stage === 'opening' ? '' : undefined}
          aria-label={`Open your Christmas card, ${name}`}
          onClick={open}
        >
          <span className="xmas-to">For {name}</span>
          <span className="xmas-envbox">
            <span className="xmas-flap" />
            <span className="xmas-seal">★</span>
          </span>
          <span className="xmas-hint">Tap to open</span>
        </button>

        <section className="xmas-sheet xmas-card" hidden={stage !== 'open'} aria-label="Your Christmas card">
          <Image className="xmas-border" src="/c/border.webp" alt="" width={900} height={290} />
          <h2>Merry Christmas, {name}!</h2>
          {greeting && <p className="xmas-hi">{greeting}</p>}
          <p className="xmas-msg">{message}</p>
          <div className="xmas-from">{signoff}</div>
          <button
            type="button"
            className="xmas-tree"
            aria-pressed={lit}
            aria-label="Light up the tree"
            onClick={() => setLit((on) => !on)}
          >
            <Image src="/c/tree.webp" alt="" width={420} height={628} />
            {SPARKS.map(([x, y], i) => (
              <b
                key={i}
                aria-hidden="true"
                style={{ left: `${x}%`, top: `${y}%`, '--d': `${(i * 0.23) % 1.4}s` } as React.CSSProperties}
              />
            ))}
          </button>
          <div className="xmas-tap">Tap the tree</div>
        </section>

        <button type="button" className="xmas-again" hidden={stage !== 'open'} onClick={fly}>
          Watch Santa again
        </button>
      </main>
    </div>
  )
}
