'use client'
import { usePathname } from 'next/navigation'

/** Keep personal cards separate from the community site's branding. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/c/')) return null
  if (pathname.startsWith('/other/')) {
    return (
      <header style={{ background: '#1f2937', color: '#fff', padding: '20px 24px', fontSize: 24, fontWeight: 700 }}>
        From Nana and Pa
      </header>
    )
  }
  return children
}
