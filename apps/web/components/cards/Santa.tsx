'use client'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { bandOf, createFlight } from './flight'

/**
 * Santa's sleigh, flying round the scene for as long as the card is open. The flight is drawn here, a frame at a time,
 * and the gallop is a CSS loop on the pictures inside, so changing course never restarts the legs. He flies in the
 * band between the garland along the top and the top of the card or envelope, so he is always above the card.
 */
export function Santa({ name, run }: { name: string; run: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const lean = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = root.current
    const tilt = lean.current
    if (!run || !element || !tilt) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const size = () => {
      const banner = document.querySelector('.xmas-holly')?.getBoundingClientRect().bottom ?? 0
      const card = document.querySelector('.xmas-card, .xmas-env')?.getBoundingClientRect().top ?? innerHeight * 0.6
      return {
        width: innerWidth,
        height: innerHeight,
        sleighWidth: element.offsetWidth,
        sleighHeight: element.offsetHeight,
        top: banner,
        // A thin band, as on a short phone, is given room for the sleigh rather than sending him off the screen.
        bottom: Math.max(card, banner + element.offsetHeight * 1.1),
      }
    }
    let view = size()
    const flight = createFlight(view)
    const resize = () => flight.resize((view = size()))
    addEventListener('resize', resize)
    let angle = 0
    let last = 0
    let frame = 0
    let turns = 0
    let measured = 0
    element.dataset.tow = ''
    const draw = (now: number) => {
      const seconds = Math.min(0.05, (now - last) / 1000 || 0)
      last = now
      // The card moves while it opens, so the band is measured again a few times a second.
      if (now - measured > 250) {
        measured = now
        flight.resize((view = size()))
      }
      const step = flight.step(seconds)
      const { x, vx, vy, turned } = step
      // Whatever the curve does, he never dips below the band's lowest line or rises above its highest.
      const { low, high } = bandOf(view)
      const y = Math.max(low, Math.min(high, step.y))
      element.dataset.layer = 'front'
      if (turned) {
        // The banner and its rope are for the first two passes only.
        if (++turns === 2) delete element.dataset.tow
        if (flight.direction < 0) element.dataset.left = ''
        else delete element.dataset.left
      }
      // Nose up or down a little with the climb, and level again as he turns.
      const target = Math.max(-0.2, Math.min(0.2, Math.atan2(vy, Math.max(Math.abs(vx), 1)) * flight.direction))
      angle += (target - angle) * Math.min(1, seconds * 2)
      element.style.transform = `translate3d(${x - element.offsetWidth / 2}px, ${y - element.offsetHeight / 2}px, 0)`
      tilt.style.transform = `rotate(${angle}rad)`
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('resize', resize)
      delete element.dataset.layer
      delete element.dataset.tow
    }
  }, [run])

  return (
    <div ref={root} className="xmas-santa" data-run={run ? '' : undefined} aria-hidden="true">
      <div ref={lean} className="xmas-lean">
        {/* Turned to face the way he flies (the reindeer lead); the banner stays outside so its words never mirror. */}
        <div className="xmas-flip">
          <div className="xmas-bob">
            {/* Four steps of the gallop from three poses of the team; Santa and the sleigh stay put. */}
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
              {Array.from({ length: 9 }, (_, i) => (
                <b key={i} className="xmas-trail" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          </div>
        </div>
        <div className="xmas-tow">
          <span>Merry Christmas, {name}!</span>
          <i className="xmas-rope" />
        </div>
      </div>
    </div>
  )
}
