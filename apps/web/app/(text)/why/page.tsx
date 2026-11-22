import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Why this page exists' }

export default function WhyPage() {
  return (
    <>
      <h1>Why this page exists</h1>
      <p>
        Shared e-bikes can be a cheap, healthy, climate-friendly way to get around. But too many end up dumped across
        footpaths, ramps and parks in Canada Bay.
      </p>
      <p>
        Dumped bikes are an accessibility problem for people using wheelchairs or mobility scooters and for parents with
        prams.
      </p>
      <p>Parked cars blocking footpaths, graffiti and damaged footpaths and roads are problems for the same people.</p>
      <p>
        Canada Bay Community Watch makes it easy to tell the businesses or the council about these problems, and to show
        the City of Canada Bay Council the scale of them.
      </p>
    </>
  )
}
