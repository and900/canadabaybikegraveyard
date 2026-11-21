'use client'
import { usePathname } from 'next/navigation'

/** Shows its children on the home page only: the header outlives a page change, so it asks where the visitor is. */
export function HomeOnly({ children }: { children: React.ReactNode }) {
  return usePathname() === '/' ? children : null
}
