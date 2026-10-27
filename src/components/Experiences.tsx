import { Link } from 'react-router'
import { venueImages, type VenueImageKey } from '../content/venue'
import type { Copy, ExperienceKey } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'
import { pathFor, type PageKey } from '../routes'
import { VenuePhoto } from './VenuePhoto'

const imageFor: Record<ExperienceKey, VenueImageKey> = {
  txotx: 'kupelas',
  menu: 'apple',
  music: 'terrace',
  visit: 'harvest',
}

const pageFor: Record<ExperienceKey, PageKey> = {
  txotx: 'products',
  menu: 'menus',
  music: 'concerts',
  visit: 'visits',
}

export function Experiences({ t, s }: { t: Copy; s: SiteCopy }) {
  return (
    <section className="experiences section" id="experiencias" aria-labelledby="experiences-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow reveal">{t.experiences.eyebrow}</p>
          <h2 className="display display--lg reveal" id="experiences-title">
            {t.experiences.title}
          </h2>
          <p className="body-lg section-head__intro reveal">{t.experiences.intro}</p>
        </header>

        <ol className="experience-grid">
          {t.experiences.items.map((item, index) => {
            const image = venueImages[imageFor[item.key]]
            return (
              <li className="experience reveal" key={item.key}>
                <div className="experience__photo">
                  <VenuePhoto
                    image={image}
                    alt={item.alt}
                    fallbackLabel={t.imageUnavailable}
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  />
                </div>
                <div className="experience__byline">
                  <p className="experience__index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  {image.credit && (
                    <p className="experience__credit">
                      {t.photoCredit} · {image.credit}
                    </p>
                  )}
                </div>
                <h3 className="experience__title">{item.title}</h3>
                <p className="experience__meta">{item.meta}</p>
                <p className="experience__body">{item.body}</p>
                <Link className="experience__link" to={pathFor(pageFor[item.key])}>
                  {s.learnMore}
                  <span className="visually-hidden">: {s.pages[pageFor[item.key]]}</span>
                  <span className="btn__arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            )
          })}
        </ol>

        <p className="fine-print reveal">{t.experiences.priceNote}</p>
      </div>
    </section>
  )
}
