/**
 * Santa's flight: a smooth curve through waypoints that swing from one side of the screen to the other, so he crosses
 * high, low and on the diagonal, turns round partly off the edge, and never stops moving. Pure arithmetic, so it can be
 * tested without a browser; the card draws whatever position it returns.
 */
export type Point = { x: number; y: number }
export type View = {
  /** The screen, in px. */
  width: number
  height: number
  /** The sleigh, in px. */
  sleighWidth: number
  sleighHeight: number
}
export type Frame = Point & {
  /** Velocity, px a second. */
  vx: number
  vy: number
  /** True on the frame he starts a leg the other way, which is when he turns round. */
  turned: boolean
}

/** A point of the Catmull-Rom curve through `p1` and `p2`, `t` of the way (0 to 1): smooth where the curves join. */
export function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t
  const t3 = t2 * t
  const at = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
  return { x: at(p0.x, p1.x, p2.x, p3.x), y: at(p0.y, p1.y, p2.y, p3.y) }
}

/**
 * His speed: 60% of the old crossing, which took 10 seconds to go the width of the screen and the sleigh.
 */
export const flightSpeed = (view: View) => 0.6 * ((view.width + view.sleighWidth) / 10)

export function createFlight(initial: View, random: () => number = Math.random) {
  let view = initial
  /** A height he can fly at, keeping the sleigh on the screen. */
  const height = (from: number, to: number) => {
    const low = view.sleighHeight * 0.7
    // On a phone the card fills the bottom third, so he keeps to the sky above it.
    const high = Math.max(
      low,
      Math.min(view.height - view.sleighHeight * 0.7, view.height * (view.width < 600 ? 0.64 : 0.85)),
    )
    return low + (high - low) * (from + (to - from) * random())
  }
  // The next waypoint alternates between a turning point at an edge, where he is half off the screen, and a point
  // across the middle, which gives each crossing its own arc or slope.
  let right = false
  let middle = false
  const next = (): Point => {
    if (!middle) {
      middle = true
      right = !right
      const x = right
        ? view.width * (0.9 + 0.08 * random()) + view.sleighWidth * 0.1
        : view.width * (0.1 - 0.08 * random()) - view.sleighWidth * 0.1
      return { x, y: height(0, 1) }
    }
    middle = false
    return { x: view.width * (0.3 + 0.4 * random()), y: height(0, 1) }
  }

  const startY = height(0.05, 0.35)
  // He enters from off the left edge, so the first waypoints are off the screen.
  const points: Point[] = [
    { x: -view.sleighWidth * 1.4, y: startY },
    { x: -view.sleighWidth * 0.9, y: startY },
    { x: view.width * 0.35, y: height(0.1, 0.5) },
  ]
  right = false
  middle = true // the next is a turning point on the right
  points.push(next())

  let t = 0
  let speed = flightSpeed(view)
  let target = speed
  let length = 1
  let direction = 1
  let previous = points[1]!
  const measure = () => {
    length = Math.max(1, Math.hypot(points[2]!.x - points[1]!.x, points[2]!.y - points[1]!.y) * 1.15)
    // Each leg a little quicker or slower than the last.
    target = flightSpeed(view) * (0.8 + 0.4 * random())
  }
  measure()

  return {
    /** The screen or the sleigh changed size. */
    resize(next: View) {
      view = next
    },
    /** Moves `seconds` along the curve. */
    step(seconds: number): Frame {
      speed += (target - speed) * Math.min(1, seconds * 0.8)
      t += (speed * seconds) / length
      while (t >= 1) {
        t -= 1
        points.shift()
        points.push(next())
        measure()
      }
      const position = catmullRom(points[0]!, points[1]!, points[2]!, points[3]!, t)
      const vx = seconds > 0 ? (position.x - previous.x) / seconds : 0
      const vy = seconds > 0 ? (position.y - previous.y) / seconds : 0
      previous = position
      // A small margin, so a hairpin's moment of no sideways speed doesn't flip him back and forth.
      const turned = Math.abs(vx) > 4 && Math.sign(vx) !== direction
      if (turned) direction = Math.sign(vx)
      return { ...position, vx, vy, turned }
    },
    get direction() {
      return direction
    },
  }
}
