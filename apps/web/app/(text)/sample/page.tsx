import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sample report', robots: { index: false, follow: true } }

/** A fixed example of what a report looks like, always here. It is not a real report and is never on the map. */
export default function SamplePage() {
  return (
    <>
      <h1>Sample report</h1>
      <p className="mt-3 inline-block rounded bg-meter px-2 py-1 text-sm font-bold">Sample: not a real report</p>
      <div className="mt-4 flex flex-wrap items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- one fixed picture, served as it is */}
        <img
          src="/sample-lime.webp"
          alt="A green Lime e-bike lying on the grass, blocking the footpath"
          width={472}
          height={418}
          className="h-auto w-full max-w-sm rounded-lg"
        />
        <div className="grow basis-48">
          <p className="!mt-0 text-lg font-bold">Lime e-bike blocking the footpath</p>
          <p className="text-muted">Near Fairwater Cl, Breakfast Point</p>
        </div>
      </div>
      <p>
        This is what a report looks like: a photo, what is wrong and where. A bike report disappears 3 days after the
        last sighting; the other problems, 7 days.
      </p>
      <p>
        <a href="/">Back to the map</a>
      </p>
    </>
  )
}
