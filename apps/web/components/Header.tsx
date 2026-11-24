import Link from 'next/link'
import { SiteLinks } from './Footer'
import { HomeOnly } from './HomeOnly'
import { Menu } from './Menu'

export function Header() {
  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2.5 bg-night px-3 py-1.5 text-white">
      <svg
        width="28"
        height="28"
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          fill="#8b95a1"
          d="M1 8h3v1H1zM11 8h1v1H11zM13 8h2v1H13zM0 9h1v1H0zM5 9h1v1H5zM10 9h1v1H10zM15 9h1v1H15zM0 10h1v1H0zM10 10h1v1H10zM15 10h1v1H15zM0 11h1v1H0zM5 11h1v1H5zM10 11h1v1H10zM15 11h1v1H15zM0 12h1v1H0zM5 12h1v1H5zM10 12h1v1H10zM15 12h1v1H15zM1 13h4v1H1zM11 13h4v1H11z"
        />
        <path
          fill="#e8702a"
          d="M5 6h7v1H5zM5 7h1v1H5zM10 7h2v1H10zM4 8h1v1H4zM6 8h1v1H6zM9 8h1v1H9zM12 8h1v1H12zM4 9h1v1H4zM6 9h1v1H6zM8 9h1v1H8zM12 9h1v1H12zM3 10h5v1H3zM12 10h1v1H12z"
        />
        <path fill="#6b7683" d="M10 4h3v1H10zM4 5h3v1H4zM11 5h1v1H11z" />
      </svg>
      <Link href="/" className="flex min-h-11 flex-1 items-center leading-tight font-bold">
        <span>
          Canada Bay <span className="whitespace-nowrap">Community Watch</span>
        </span>
      </Link>
      {/* The pages about the site are linked from the home page only, so the other pages stay uncluttered. */}
      <HomeOnly>
        <Menu>
          <SiteLinks />
        </Menu>
      </HomeOnly>
    </header>
  )
}
