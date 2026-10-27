import { Link } from 'react-router'
import { venue, venueImages } from '../content/venue'
import type { Copy } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'
import { pathFor } from '../routes'
import { VenuePhoto } from './VenuePhoto'

export function Story({ t, s }: { t: Copy; s: SiteCopy }) {
  return (
    <section className="story section" id="historia" aria-labelledby="story-title">
      <div className="container story__grid">
        <figure className="story__figure reveal">
          <div className="story__photo">
            <VenuePhoto
              image={venueImages.caserioValley}
              alt={t.story.caption}
              fallbackLabel={t.imageUnavailable}
              sizes="(max-width: 900px) 100vw, 55vw"
            />
          </div>
          <figcaption className="caption">{t.story.caption}</figcaption>
        </figure>

        <div className="story__copy">
          <p className="eyebrow reveal">{t.story.eyebrow}</p>
          <h2 className="display display--lg reveal" id="story-title">
            {t.story.title}
          </h2>
          <p className="body-lg reveal">{t.story.body}</p>
          <blockquote className="story__motto reveal">
            <p>{t.story.motto}</p>
          </blockquote>
          <Link className="btn btn--ghost-dark story__link reveal" to={pathFor('about')}>
            {s.pages.about}
            <span className="btn__arrow" aria-hidden="true">→</span>
          </Link>
          <p className="story__year reveal" aria-hidden="true">
            {venue.founded}
          </p>
        </div>
      </div>
    </section>
  )
}
