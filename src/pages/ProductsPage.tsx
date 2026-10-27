import { BookingBand } from '../components/BookingBand'
import { PageHero } from '../components/PageHero'
import { SourceNote } from '../components/SourceNote'
import { VenuePhoto } from '../components/VenuePhoto'
import { productsContent } from '../content/pages/products'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

export function ProductsPage({ t, s, lang }: PageProps) {
  const c = productsContent[lang]
  useDocumentTitle(`${s.pages.products} · ${venue.name}`)

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
        image={venueImages.ciderAndJuice}
        alt={c.heroAlt}
        fallbackLabel={t.imageUnavailable}
        objectPosition="50% 70%"
      />

      <section className="section care care--compact" aria-label={c.title}>
        <div className="container">
          <ol className="care__list">
            {c.care.map((item, index) => (
              <li className="care-item reveal" key={item.title}>
                <span className="care-item__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h2 className="care-item__title">{item.title}</h2>
                <p className="care-item__body">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section shop" aria-labelledby="shop-title">
        <div className="container">
          <header className="section-head">
            <p className="eyebrow reveal">{c.eyebrow}</p>
            <h2 className="display display--lg reveal" id="shop-title">{c.shop.title}</h2>
            <p className="body-lg section-head__intro reveal">{c.shop.lede}</p>
          </header>
          <ul className="product-grid">
            {c.shop.products.map((product, index) => (
              <li className={`product${product.image ? '' : ' product--text'} reveal`} key={product.name}>
                {product.image ? (
                  <div className="product__photo">
                    <VenuePhoto image={venueImages[product.image]} alt={product.alt ?? product.name} fallbackLabel={t.imageUnavailable} />
                  </div>
                ) : (
                  <div className="product__mark" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
                )}
                <h3 className="product__name">{product.name}</h3>
                <p className="product__body">{product.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section order" aria-labelledby="order-title">
        <div className="container order__grid">
          <div className="reveal">
            <h2 className="display display--lg" id="order-title">{c.order.title}</h2>
            <p className="body-lg">{c.order.body}</p>
          </div>
          <div className="order__panel reveal">
            <dl className="order__channels">
              <div className="order__channel">
                <dt>{c.order.byEmail}</dt>
                <dd><a className="text-link text-link--dark" href={`mailto:${venue.shopEmail}`}>{venue.shopEmail}</a></dd>
              </div>
              <div className="order__channel">
                <dt>{c.order.byPhone}</dt>
                <dd><a className="text-link text-link--dark" href={venue.phoneHref}>{venue.phoneDisplay}</a></dd>
              </div>
            </dl>
            <p className="fine-print">{c.order.note}</p>
          </div>
        </div>
      </section>

      <BookingBand t={t} s={s} title={c.cta.title} body={c.cta.body} />
      <SourceNote page="products" lang={lang} s={s} />
    </>
  )
}
