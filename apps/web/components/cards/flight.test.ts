import { describe, expect, it } from 'vitest'
import { bandOf, catmullRom, createFlight, flightSpeed } from './flight'

const view = { width: 1000, height: 700, sleighWidth: 300, sleighHeight: 108 }

/** A repeatable run of numbers between 0 and 1. */
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

describe('catmullRom', () => {
  it('runs through the middle two points', () => {
    const [a, b, c, d] = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
      { x: 30, y: 5 },
    ] as const
    expect(catmullRom(a, b, c, d, 0)).toEqual(b)
    expect(catmullRom(a, b, c, d, 1)).toEqual(c)
  })
})

describe('createFlight in a band', () => {
  it('stays between the banner and the card', () => {
    const banded = { ...view, top: 120, bottom: 360 }
    const flight = createFlight(banded, seeded(11))
    const { low, high } = bandOf(banded)
    expect(low).toBe(120 + 54)
    expect(high).toBe(360 - 54)
    for (let i = 0; i < 60 * 120; i++) {
      const { y } = flight.step(1 / 60)
      // The curve can overshoot a little between waypoints; the card clamps it, so the waypoints themselves stay in.
      expect(y).toBeGreaterThan(low - 60)
      expect(y).toBeLessThan(high + 60)
    }
  })

  it('gives a band too thin for the sleigh a single height', () => {
    expect(bandOf({ ...view, top: 100, bottom: 110 }).high).toBe(bandOf({ ...view, top: 100, bottom: 110 }).low)
  })
})

describe('createFlight', () => {
  it('flies at 60% of the old speed: the screen and the sleigh in 16.7 seconds', () => {
    expect(flightSpeed(view)).toBeCloseTo(78)
  })

  it('never jumps, and turns round at the edges', () => {
    const flight = createFlight(view, seeded(7))
    let last = flight.step(0)
    let turns = 0
    let onScreen = 0
    const frames = 60 * 120
    for (let i = 0; i < frames; i++) {
      const frame = flight.step(1 / 60)
      // At most a few px between frames, even at his quickest.
      expect(Math.hypot(frame.x - last.x, frame.y - last.y)).toBeLessThan(4)
      if (frame.turned) turns++
      if (frame.x > -150 && frame.x < view.width + 150) onScreen++
      last = frame
    }
    expect(turns).toBeGreaterThan(3)
    expect(onScreen / frames).toBeGreaterThan(0.9)
  })

  it('keeps him at heights the sleigh fits', () => {
    const flight = createFlight(view, seeded(3))
    for (let i = 0; i < 60 * 120; i++) {
      const { y } = flight.step(1 / 60)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(view.height)
    }
  })
})
