import { BookingBand } from '../components/BookingBand'
import { SourceNote } from '../components/SourceNote'
import { VenuePhoto } from '../components/VenuePhoto'
import { concertsContent } from '../content/pages/concerts'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

const seasonImages = [venueImages.caserioSummer, venueImages.diningRoom] as const

export function ConcertsPage({ t, s, lang }: PageProps) {
  const c = concertsContent[lang]
  useDocumentTitle(`${s.pages.concerts} · ${venue.name}`)

  return (
    <>
      <section className="stage-hero" aria-labelledby="page-title">
        <div className="hero__glow" aria-hidden="true" />
        <div className="container stage-hero__grid">
          <div className="stage-hero__copy">
            <p className="eyebrow eyebrow--on-dark page-hero__enter">{c.eyebrow}</p>
            <h1 className="page-hero__title page-hero__enter" id="page-title">{c.title}</h1>
            <p className="page-hero__lede page-hero__enter">{c.lede}</p>
            <a className="phone-link page-hero__enter" href={venue.phoneHref}>
              <span className="phone-link__label">{c.datesNote}</span>
              <span className="phone-link__number">{venue.phoneDisplay}</span>
            </a>
          </div>
          <figure className="stage-hero__frame">
            <div className="stage__photo">
              <VenuePhoto image={venueImages.concert} alt={c.imageAlt} fallbackLabel={t.imageUnavailable} priority />
            </div>
          </figure>
        </div>
      </section>

      <section className="section seasons" aria-label={c.title}>
        <div className="container seasons__grid">
          {c.seasons.map((season, index) => (
            <article className="season reveal" key={season.title}>
              <div className="season__photo">
                <VenuePhoto image={seasonImages[index]} alt={season.alt} fallbackLabel={t.imageUnavailable} />
              </div>
              <div className="season__copy">
                <h2 className="season__title">{season.title}</h2>
                <p className="body-lg">{season.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BookingBand t={t} s={s} />
      <SourceNote page="concerts" lang={lang} s={s} />
    </>
  )
}
