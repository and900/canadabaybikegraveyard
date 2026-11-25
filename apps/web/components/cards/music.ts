/**
 * Jingle Bells, played as soft bells with the Web Audio API: no sound file, no controls. It starts on the first real tap
 * or click on the card, since browsers (iPhones above all) keep a page silent until the person has touched it, and it
 * repeats until the card is closed.
 */
const NOTE: Record<string, number> = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0 }

// [note, seconds]
export const MELODY: [string, number][] = [
  ['E4', 0.3],
  ['E4', 0.3],
  ['E4', 0.6],
  ['E4', 0.3],
  ['E4', 0.3],
  ['E4', 0.6],
  ['E4', 0.3],
  ['G4', 0.3],
  ['C4', 0.4],
  ['D4', 0.2],
  ['E4', 0.9],

  ['F4', 0.3],
  ['F4', 0.3],
  ['F4', 0.3],
  ['F4', 0.3],
  ['F4', 0.3],
  ['E4', 0.3],
  ['E4', 0.3],
  ['E4', 0.3],
  ['E4', 0.3],
  ['D4', 0.3],
  ['D4', 0.3],
  ['E4', 0.3],
  ['D4', 0.6],
  ['G4', 0.6],
]

/** How loud the bells are: soft enough to sit under the card. */
const VOLUME = 0.6

let context: AudioContext | undefined
let master: GainNode | undefined
let started = false
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * One bell: the note, then higher partials that are quieter and die away sooner. Phone speakers give out little below
 * 400 Hz, so the partials are what make it audible there.
 */
function playBell(frequency: number, start: number, seconds: number) {
  if (!context || !master) return
  for (const [multiple, level, ring] of [
    [1, 0.3, 1.6],
    [2, 0.14, 1.2],
    [3, 0.08, 0.9],
    [4.1, 0.03, 0.6],
  ] as const) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency * multiple
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(level, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds * ring)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(start)
    oscillator.stop(start + seconds * ring + 0.05)
  }
}

function playMelody() {
  if (!started || !context) return
  const total = MELODY.reduce((sum, [, seconds]) => sum + seconds, 0)
  // While the page is hidden the clock stops, so the next round waits rather than piling up behind it.
  if (context.state === 'running') {
    let time = context.currentTime + 0.1
    for (const [note, seconds] of MELODY) {
      playBell(NOTE[note]!, time, seconds)
      time += seconds
    }
  }
  timer = setTimeout(playMelody, total * 1000 + 300)
}

/** Starts the tune the first time it's called from a tap, and does nothing after that. */
export async function startChristmasMusic() {
  if (started) return
  const Context =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return
  try {
    // An iPhone keeps web audio silent while its ring/silent switch is on, unless the page says it is playing media.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
    context ??= new Context()
    if (!master) {
      master = context.createGain()
      master.gain.value = VOLUME
      master.connect(context.destination)
    }
    await context.resume()
    // A tap that didn't count as one (some browsers) leaves it suspended: wait for the next.
    if (context?.state !== 'running' || started) return
    started = true
    playMelody()
  } catch {
    // No sound is better than an error on the card.
  }
}

/** Stops the tune, for when the card is closed. */
export function stopChristmasMusic() {
  started = false
  clearTimeout(timer)
  void context?.close().catch(() => {})
  context = undefined
  master = undefined
}

/** Mutes the tune while the page is hidden and brings it back when it's shown again. */
export function pauseChristmasMusic(paused: boolean) {
  if (!context) return
  void (paused ? context.suspend() : context.resume()).catch(() => {})
}
