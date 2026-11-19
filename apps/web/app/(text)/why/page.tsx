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
      <p>
        This site makes it easy to report nuisance e-bikes to the businesses that own them, and to show the City of
        Canada Bay Council the scale of the problem.
      </p>
    </>
  )
}
