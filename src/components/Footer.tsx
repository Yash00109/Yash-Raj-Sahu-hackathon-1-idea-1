import { Link } from 'react-router'
import { logo, OFFICIAL_SITE, venue } from '../content/venue'
import type { Copy } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'
import { pageRoutes, pathFor, STAFF_LOGIN_HREF } from '../routes'

export function Footer({ t, s }: { t: Copy; s: SiteCopy }) {
  return (
    <footer className="site-footer">
      <section className="container site-footer__grid" id="visita" aria-labelledby="visit-title">
        <div className="site-footer__brand">
          <img src={logo.light} width={88} height={86} alt={venue.name} loading="lazy" />
          <p className="site-footer__motto">Sagarretik txotxera.</p>
        </div>

        <nav aria-labelledby="footer-nav-title">
          <h2 className="site-footer__heading" id="footer-nav-title">{s.footerNav}</h2>
          <ul className="site-footer__list">
            <li><Link className="text-link" to="/">{s.home}</Link></li>
            {pageRoutes.map((route) => (
              <li key={route.key}>
                <Link className="text-link" to={route.path}>{s.pages[route.key]}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="site-footer__heading" id="visit-title">{t.footer.address}</h2>
          <address className="site-footer__text">{venue.address}</address>
          <ul className="site-footer__list">
            <li><Link className="text-link" to={pathFor('location')}>{s.pages.location} →</Link></li>
            <li>
              <a className="text-link" href={venue.mapsHref} target="_blank" rel="noreferrer">
                {t.footer.directions} ↗
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="site-footer__heading">{t.footer.contact}</h2>
          <ul className="site-footer__list">
            <li><a className="text-link" href={venue.phoneHref}>{venue.phoneDisplay}</a></li>
            <li><a className="text-link" href={`mailto:${venue.email}`}>{venue.email}</a></li>
            <li>
              <a className="text-link" href={venue.instagramHref} target="_blank" rel="noreferrer">
                {venue.instagramHandle}
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="container site-footer__base">
        {s.translationNotice && <p className="site-footer__notice">{s.translationNotice}</p>}
        <p>
          {t.footer.photoNote}{' '}
          <a className="text-link" href={OFFICIAL_SITE} target="_blank" rel="noreferrer">
            {t.footer.officialSite} ↗
          </a>
        </p>
        <p>© {venue.name}</p>
        <p>
          <Link className="text-link site-footer__staff" to={STAFF_LOGIN_HREF} rel="nofollow">
            {s.staffLogin}
          </Link>
        </p>
      </div>
    </footer>
  )
}
