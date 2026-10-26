import { logo, OFFICIAL_SITE, venue } from '../content/venue'
import type { Copy } from '../i18n/copy'

export function Footer({ t }: { t: Copy }) {
  return (
    <footer className="site-footer">
      <section className="container site-footer__grid" id="visita" aria-labelledby="visit-title">
        <div className="site-footer__brand">
          <img src={logo.light} width={88} height={86} alt={venue.name} loading="lazy" />
          <p className="site-footer__motto">Sagarretik txotxera.</p>
        </div>

        <div>
          <h2 className="site-footer__heading" id="visit-title">{t.footer.address}</h2>
          <address className="site-footer__text">{venue.address}</address>
          <a className="text-link" href={venue.mapsHref} target="_blank" rel="noreferrer">
            {t.footer.directions} ↗
          </a>
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
        <p>
          {t.footer.photoNote}{' '}
          <a className="text-link" href={OFFICIAL_SITE} target="_blank" rel="noreferrer">
            {t.footer.officialSite} ↗
          </a>
        </p>
        <p>© {venue.name}</p>
      </div>
    </footer>
  )
}
