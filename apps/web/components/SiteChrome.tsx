'use client'
import { usePathname } from 'next/navigation'

/** The site's header, left off a Christmas card (/c/…), which fills the screen with its own picture. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/c/') ? null : children
}
