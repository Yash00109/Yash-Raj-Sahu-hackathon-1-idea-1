import { Link } from 'react-router'
import { BookingBand } from '../components/BookingBand'
import { PageHero } from '../components/PageHero'
import { SourceNote } from '../components/SourceNote'
import { VenuePhoto } from '../components/VenuePhoto'
import { visitsContent } from '../content/pages/visits'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import { pathFor } from '../routes'
import type { PageProps } from './types'

export function VisitsPage({ t, s, lang }: PageProps) {
  const c = visitsContent[lang]
  useDocumentTitle(`${s.pages.visits} · ${venue.name}`)

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
        image={venueImages.press}
        alt={c.intro.title}
        fallbackLabel={t.imageUnavailable}
        objectPosition="50% 60%"
      />

      <section className="section visit-intro" aria-labelledby="visit-intro-title">
        <div className="container visit-intro__grid">
          <h2 className="display display--lg reveal" id="visit-intro-title">{c.intro.title}</h2>
          <div className="visit-intro__copy">
            {c.intro.paragraphs.map((paragraph) => (
              <p className="body-lg reveal" key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="section journey" aria-label={c.intro.title}>
        <div className="container">
          <ol className="journey__steps">
            {c.steps.map((step, index) => (
              <li className="journey-step reveal" key={step.title}>
                <div className="journey-step__photo">
                  <VenuePhoto image={venueImages[step.image]} alt={step.alt} fallbackLabel={t.imageUnavailable} />
                </div>
                <p className="journey-step__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="journey-step__title">{step.title}</h3>
                <p className="journey-step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section nature" aria-labelledby="nature-title">
        <div className="container">
          <h2 className="display display--lg reveal" id="nature-title">{c.nature.title}</h2>
          <div className="nature__pair">
            <figure className="nature__photo nature__photo--tall reveal">
              <VenuePhoto image={venueImages.valleyPortrait} alt={c.nature.alts[0]} fallbackLabel={t.imageUnavailable} />
              <figcaption className="caption">{venueImages.valleyPortrait.credit}</figcaption>
            </figure>
            <figure className="nature__photo reveal">
              <VenuePhoto image={venueImages.snowTerrace} alt={c.nature.alts[1]} fallbackLabel={t.imageUnavailable} />
            </figure>
            <div className="nature__aside reveal">
              <div className="info-card">
                <h3 className="info-card__title">{c.bus.title}</h3>
                <p>{c.bus.body}</p>
                <p className="info-card__muted">{c.bus.location}</p>
              </div>
              <div className="info-card info-card--accent">
                <h3 className="info-card__title">{c.products.title}</h3>
                <p>{c.products.body}</p>
                <Link className="text-link text-link--dark" to={pathFor('products')}>
                  {s.pages.products} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BookingBand t={t} s={s} title={c.cta.title} body={c.cta.body} />
      <SourceNote page="visits" lang={lang} s={s} />
    </>
  )
}
