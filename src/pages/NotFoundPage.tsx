import { Link } from 'react-router'
import { venue } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import { pageRoutes } from '../routes'
import type { PageProps } from './types'

export function NotFoundPage({ s }: PageProps) {
  useDocumentTitle(`${s.notFound.title} · ${venue.name}`)

  return (
    <section className="not-found" aria-labelledby="page-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container not-found__inner">
        <p className="eyebrow eyebrow--on-dark">404</p>
        <h1 className="page-hero__title" id="page-title">{s.notFound.title}</h1>
        <p className="page-hero__lede">{s.notFound.body}</p>
        <Link className="btn btn--primary btn--large" to="/">
          {s.notFound.back}
        </Link>
        <ul className="not-found__links">
          {pageRoutes.map((route) => (
            <li key={route.key}>
              <Link className="text-link" to={route.path}>{s.pages[route.key]}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
