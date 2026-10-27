import { BookingBand } from '../components/BookingBand'
import { PageHero } from '../components/PageHero'
import { SourceNote } from '../components/SourceNote'
import { VenuePhoto } from '../components/VenuePhoto'
import { aboutContent } from '../content/pages/about'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

export function AboutPage({ t, s, lang }: PageProps) {
  const c = aboutContent[lang]
  useDocumentTitle(`${s.pages.about} · ${venue.name}`)

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
        image={venueImages.caserioStone}
        alt={t.hero.captionStone}
        fallbackLabel={t.imageUnavailable}
        objectPosition="55% 45%"
      />

      <section className="section about-story" aria-labelledby="about-story-title">
        <div className="container about-story__grid">
          <div className="about-story__copy">
            <h2 className="display display--lg reveal" id="about-story-title">{c.story.title}</h2>
            {c.story.paragraphs.map((paragraph) => (
              <p className="body-lg reveal" key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl className="figures">
            {c.figures.map((figure) => (
              <div className="figure reveal" key={figure.value}>
                <dt className="figure__value">{figure.value}</dt>
                <dd className="figure__label">{figure.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="panorama" aria-labelledby="valley-title">
        <div className="panorama__media">
          <VenuePhoto image={venueImages.valley} alt={c.valley.title} fallbackLabel={t.imageUnavailable} />
        </div>
        <div className="panorama__shade" aria-hidden="true" />
        <div className="container panorama__inner">
          <div className="panorama__copy reveal">
            <p className="eyebrow eyebrow--on-dark">{c.valley.eyebrow}</p>
            <h2 className="display display--lg display--on-dark" id="valley-title">{c.valley.title}</h2>
            {c.valley.paragraphs.map((paragraph) => (
              <p className="body-lg body--on-dark" key={paragraph}>{paragraph}</p>
            ))}
            <p className="panorama__credit">{venueImages.valley.credit}</p>
          </div>
        </div>
      </section>

      <section className="section harvest" aria-labelledby="harvest-title">
        <div className="container harvest__grid">
          <article className="harvest-note reveal">
            <p className="harvest-note__date">{c.harvest.updated}</p>
            <h2 className="display display--lg" id="harvest-title">{c.harvest.title}</h2>
            {c.harvest.paragraphs.map((paragraph) => (
              <p className="body-lg" key={paragraph}>{paragraph}</p>
            ))}
          </article>
          <figure className="harvest__figure reveal">
            <div className="harvest__photo">
              <VenuePhoto image={venueImages.fermenting} alt={c.barrel.caption} fallbackLabel={t.imageUnavailable} />
            </div>
            <figcaption className="caption">
              <strong lang="eu">{c.barrel.label}</strong> — {c.barrel.caption}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section care" aria-labelledby="care-title">
        <div className="container">
          <header className="care__head">
            <h2 className="display display--lg reveal" id="care-title">{c.care.title}</h2>
            <p className="body-lg reveal">{c.care.lede}</p>
          </header>
          <ol className="care__list">
            {c.care.items.map((item, index) => (
              <li className="care-item reveal" key={item.title}>
                <span className="care-item__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="care-item__title">{item.title}</h3>
                <p className="care-item__body">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <BookingBand t={t} s={s} title={c.cta.title} />
      <SourceNote page="about" lang={lang} s={s} />
    </>
  )
}
