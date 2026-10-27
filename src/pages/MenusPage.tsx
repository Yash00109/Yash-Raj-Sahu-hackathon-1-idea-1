import { BookingBand } from '../components/BookingBand'
import { PageHero } from '../components/PageHero'
import { SourceNote } from '../components/SourceNote'
import { VenuePhoto } from '../components/VenuePhoto'
import { ciderMenuDishes, grillGallery, kidsMenuDishes, menusContent, type Dish } from '../content/pages/menus'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

function DishList({ dishes }: { dishes: Dish[] }) {
  return (
    <ol className="dish-list">
      {dishes.map((dish) => (
        <li className="dish" key={dish.eu}>
          <span className="dish__eu" lang="eu">{dish.eu}</span>
          <span className="dish__es" lang="es">{dish.es}</span>
        </li>
      ))}
    </ol>
  )
}

export function MenusPage({ t, s, lang }: PageProps) {
  const c = menusContent[lang]
  useDocumentTitle(`${s.pages.menus} · ${venue.name}`)

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
        image={venueImages.steakPlated}
        alt={c.galleryCaptions[2]}
        fallbackLabel={t.imageUnavailable}
        objectPosition="50% 55%"
      />

      <section className="section menu-sheet" aria-labelledby="cider-menu-title">
        <div className="container menu-sheet__grid">
          <article className="menu-card reveal">
            <p className="menu-card__label" lang="eu">{c.cider.label}</p>
            <h2 className="menu-card__title" id="cider-menu-title">{c.cider.title}</h2>
            <p className="menu-card__price">{c.cider.price}</p>
            <p className="menu-card__note">{c.cider.note}</p>
            <DishList dishes={ciderMenuDishes} />
          </article>

          <div className="menu-sheet__aside">
            <figure className="menu-sheet__photo reveal">
              <VenuePhoto image={venueImages.cod} alt={c.galleryCaptions[0]} fallbackLabel={t.imageUnavailable} />
              <figcaption className="caption">
                {c.galleryCaptions[0]} · {venueImages.cod.credit}
              </figcaption>
            </figure>
            <div className="menu-sheet__grill reveal">
              <h3 className="menu-sheet__subtitle">{c.grill.title}</h3>
              <p className="body-lg">{c.grill.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section menu-extras" aria-label={`${c.seasonal.title} · ${c.kids.title}`}>
        <div className="container menu-extras__grid">
          <article className="menu-panel menu-panel--dark reveal">
            <p className="menu-card__label" lang="eu">{c.seasonal.label}</p>
            <h2 className="menu-panel__title">{c.seasonal.title}</h2>
            <p className="menu-card__price menu-card__price--light">{c.seasonal.price}</p>
            <p className="menu-panel__note">{c.seasonal.note}</p>
            <p className="body-lg body--on-dark">{c.seasonal.body}</p>
            <a className="text-link" href={venue.phoneHref}>
              {t.reserve.call} {venue.phoneDisplay}
            </a>
          </article>
          <article className="menu-panel reveal">
            <p className="menu-card__label" lang="eu">{c.kids.label}</p>
            <h2 className="menu-panel__title">{c.kids.title}</h2>
            <p className="menu-card__price">{c.kids.price}</p>
            <DishList dishes={kidsMenuDishes} />
          </article>
        </div>
      </section>

      <section className="section gallery-section" aria-labelledby="grill-gallery-title">
        <div className="container">
          <h2 className="display display--lg reveal" id="grill-gallery-title">{c.galleryTitle}</h2>
          <ul className="grill-gallery">
            {grillGallery.map((key, index) => {
              const image = venueImages[key]
              return (
                <li className={`grill-gallery__item grill-gallery__item--${index + 1} reveal`} key={key}>
                  <figure>
                    <div className="grill-gallery__photo">
                      <VenuePhoto image={image} alt={c.galleryCaptions[index]} fallbackLabel={t.imageUnavailable} />
                    </div>
                    <figcaption className="caption">
                      {c.galleryCaptions[index]}
                      {image.credit && <span className="caption__credit"> · {image.credit}</span>}
                    </figcaption>
                  </figure>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="events-band" aria-labelledby="events-title">
        <div className="events-band__media">
          <VenuePhoto image={venueImages.diningRoom} alt={c.galleryCaptions[6]} fallbackLabel={t.imageUnavailable} />
        </div>
        <div className="container events-band__inner">
          <div className="events-band__copy reveal">
            <h2 className="display display--lg display--on-dark" id="events-title">{c.events.title}</h2>
            <p className="body-lg body--on-dark">{c.events.body}</p>
            <p className="events-band__capacity">{c.events.capacity}</p>
          </div>
        </div>
      </section>

      <BookingBand t={t} s={s} title={c.cta.title} body={c.cta.body} />
      <SourceNote page="menus" lang={lang} s={s} />
    </>
  )
}
