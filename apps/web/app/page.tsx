import { Footer } from '@/components/Footer'
import { MapScreen } from '@/components/MapScreen'

/** The map screen. Its shell never waits for data, so first paint is fast (§11.2). */
export default function Home() {
  return (
    <>
      {/* Size containment: the map screen is exactly the viewport under the header, however long the panel's list. */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-clip contain-size wide:flex-row-reverse">
        <h1 className="sr-only">
          Canada Bay Community Watch: a map of dumped share bikes, parking issues, graffiti and footpath or road damage
        </h1>
        <MapScreen />
      </main>
      {/* The pages about the site are linked here and nowhere else (the header's menu on a phone). */}
      <Footer />
    </>
  )
}
