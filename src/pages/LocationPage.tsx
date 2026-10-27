import { BookingBand } from '../components/BookingBand'
import { PageHero } from '../components/PageHero'
import { SourceNote } from '../components/SourceNote'
import { locationContent } from '../content/pages/location'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

export function LocationPage({ t, s, lang }: PageProps) {
  const c = locationContent[lang]
  useDocumentTitle(`${s.pages.location} · ${venue.name}`)

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
        image={venueImages.caserioSummer}
        alt={c.heroAlt}
        fallbackLabel={t.imageUnavailable}
        objectPosition="70% 60%"
      >
        <a className="btn btn--primary btn--large" href={venue.phoneHref}>
          {t.reserve.call} {venue.phoneDisplay}
        </a>
        <a className="btn btn--ghost-light" href={venue.whatsappHref} target="_blank" rel="noreferrer">
          {c.contact.whatsapp} ↗
        </a>
      </PageHero>

      <section className="section visit-info" aria-labelledby="contact-title">
        <div className="container visit-info__grid">
          <div className="info-card info-card--paper reveal">
            <h2 className="info-card__title info-card__title--lg" id="contact-title">{c.contact.title}</h2>
            <dl className="contact-list">
              <div>
                <dt>{c.contact.address}</dt>
                <dd><address>{venue.address}</address></dd>
              </div>
              <div>
                <dt>{c.contact.bookings}</dt>
                <dd><a className="text-link text-link--dark" href={venue.phoneHref}>{venue.phoneDisplay}</a></dd>
              </div>
              <div>
                <dt>{c.contact.email}</dt>
                <dd><a className="text-link text-link--dark" href={`mailto:${venue.email}`}>{venue.email}</a></dd>
              </div>
              <div>
                <dt>{c.contact.instagram}</dt>
                <dd>
                  <a className="text-link text-link--dark" href={venue.instagramHref} target="_blank" rel="noreferrer">
                    {venue.instagramHandle}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="fine-print">{c.contact.emailNote}</p>
          </div>

          <section className="info-card info-card--dark reveal" aria-labelledby="hours-title">
            <h2 className="info-card__title info-card__title--lg" id="hours-title">{c.hours.title}</h2>
            <p className="body--on-dark">{c.hours.summary}</p>
            <dl className="hours-table">
              {c.hours.rows.map(([day, value]) => (
                <div className="hours-table__row" key={day}>
                  <dt>{day}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {c.hours.closures.map((line) => (
              <p className="fine-print fine-print--on-dark" key={line}>{line}</p>
            ))}
          </section>
        </div>
      </section>

      <section className="section directions" aria-labelledby="directions-title">
        <div className="container">
          <header className="section-head">
            <h2 className="display display--lg reveal" id="directions-title">{c.directions.title}</h2>
            <div className="section-head__intro reveal">
              <p className="body-lg">
                {c.directions.intro} {c.directions.coordinatesLabel}: {venue.coordinates}.
              </p>
              <p className="directions__warning">{c.directions.warning}</p>
            </div>
          </header>
          <ol className="route-list">
            {c.directions.routes.map((route, index) => (
              <li className="route reveal" key={route.from}>
                <span className="route__index" aria-hidden="true">{index + 1}</span>
                <h3 className="route__from">{route.from}</h3>
                {route.directions && <p className="route__body">{route.directions}</p>}
                <a className="text-link text-link--dark" href={route.href} target="_blank" rel="noreferrer">
                  {s.routeOnMaps} ↗
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section bus" aria-labelledby="bus-title">
        <div className="container bus__grid">
          <div className="reveal">
            <p className="eyebrow">{c.bus.eyebrow}</p>
            <h2 className="display display--lg" id="bus-title">{c.bus.title}</h2>
            <p className="body-lg">{c.bus.lede}</p>
          </div>
          <div className="info-card info-card--paper reveal">
            <ul className="bus__list">
              {c.bus.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="fine-print">{c.bus.note}</p>
            <p className="info-card__muted">{c.bus.groups}</p>
          </div>
        </div>
      </section>

      <section className="section valley-note" aria-labelledby="valley-note-title">
        <div className="container valley-note__inner reveal">
          <h2 className="display display--lg" id="valley-note-title">{c.valley.title}</h2>
          <p className="body-lg">{c.valley.body}</p>
        </div>
      </section>

      <BookingBand t={t} s={s} />
      <SourceNote page="location" lang={lang} s={s} />
    </>
  )
}
