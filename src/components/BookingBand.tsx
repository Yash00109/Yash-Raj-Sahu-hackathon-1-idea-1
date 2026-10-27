import { Link } from 'react-router'
import { venue } from '../content/venue'
import type { Copy } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'
import { RESERVATION_HREF } from '../routes'

interface BookingBandProps {
  t: Copy
  s: SiteCopy
  title?: string
  body?: string
}

/** Booking is by phone or WhatsApp (as published); the link leads to the home-page prototype form, which sends nothing. */
export function BookingBand({ t, s, title = t.reserve.title, body = t.reserve.body }: BookingBandProps) {
  return (
    <section className="booking-band" aria-labelledby="booking-band-title">
      <div className="container booking-band__inner">
        <div className="booking-band__copy reveal">
          <p className="eyebrow eyebrow--on-dark">{t.reserve.eyebrow}</p>
          <h2 className="display display--lg display--on-dark" id="booking-band-title">
            {title}
          </h2>
          <p className="body-lg body--on-dark">{body}</p>
        </div>
        <div className="booking-band__actions reveal">
          <a className="phone-link" href={venue.phoneHref}>
            <span className="phone-link__label">{t.reserve.call}</span>
            <span className="phone-link__number">{venue.phoneDisplay}</span>
          </a>
          <div className="booking-band__buttons">
            <a className="btn btn--primary btn--large" href={venue.whatsappHref} target="_blank" rel="noreferrer">
              {t.reserve.whatsapp}
              <span className="btn__arrow" aria-hidden="true">↗</span>
            </a>
            <Link className="btn btn--ghost-light" to={RESERVATION_HREF}>
              {s.prepareRequest}
            </Link>
          </div>
          <p className="fine-print fine-print--on-dark">{t.reserve.hoursValue} · {t.reserve.holidays}</p>
        </div>
      </div>
    </section>
  )
}
