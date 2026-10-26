import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { venue, venueImages } from '../content/venue'
import type { Copy, Lang, RequestDetails } from '../i18n/copy'
import { formatRequestDate } from '../i18n/formatDate'
import { VenuePhoto } from './VenuePhoto'

type Seating = 'indoor' | 'terrace'

type RequiredText = 'name' | 'phone'

interface FormState {
  date: string
  time: string
  guests: string
  seating: Seating
  name: string
  phone: string
  notes: string
}

const todayIso = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

interface ReservationProps {
  t: Copy
  lang: Lang
}

export function Reservation({ t, lang }: ReservationProps) {
  const f = t.reserve.form
  const ids = useId()
  const [form, setForm] = useState<FormState>({
    date: '',
    time: '',
    guests: '2',
    seating: 'indoor',
    name: '',
    phone: '',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [blank, setBlank] = useState<Record<RequiredText, boolean>>({ name: false, phone: false })
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (submitted) summaryHeadingRef.current?.focus()
  }, [submitted])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const updateRequiredText = (key: RequiredText, value: string) => {
    update(key, value)
    if (blank[key] && value.trim()) setBlank((current) => ({ ...current, [key]: false }))
  }

  // Native `required` accepts whitespace-only values, so blank-after-trim is checked here.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextBlank = { name: !form.name.trim(), phone: !form.phone.trim() }
    setBlank(nextBlank)
    if (nextBlank.name || nextBlank.phone) {
      ;(nextBlank.name ? nameRef : phoneRef).current?.focus()
      return
    }
    setSubmitted(true)
  }

  const details: RequestDetails = {
    date: form.date ? formatRequestDate(form.date, lang) : '',
    time: form.time,
    guests: form.guests,
    seating: form.seating === 'indoor' ? f.indoor : f.terrace,
    name: form.name.trim(),
    phone: form.phone.trim(),
    notes: form.notes.trim(),
  }
  const whatsappUrl = `${venue.whatsappHref}?text=${encodeURIComponent(t.reserve.whatsappMessage(details))}`

  const field = (name: string) => `${ids}-${name}`

  return (
    <section className="reserve section" id="reservar" aria-labelledby="reserve-title">
      <div className="reserve__grain" aria-hidden="true" />
      <div className="container reserve__grid">
        <div className="reserve__intro">
          <p className="eyebrow eyebrow--on-dark reveal">{t.reserve.eyebrow}</p>
          <h2 className="display display--lg display--on-dark reveal" id="reserve-title">
            {t.reserve.title}
          </h2>
          <p className="body-lg body--on-dark reveal">{t.reserve.body}</p>

          <div className="reserve__channels reveal">
            <a className="phone-link" href={venue.phoneHref}>
              <span className="phone-link__label">{t.reserve.call}</span>
              <span className="phone-link__number">{venue.phoneDisplay}</span>
            </a>
            <a className="btn btn--primary btn--large" href={venue.whatsappHref} target="_blank" rel="noreferrer">
              {t.reserve.whatsapp}
              <span className="btn__arrow" aria-hidden="true">↗</span>
            </a>
          </div>

          <dl className="hours reveal">
            <div className="hours__row">
              <dt>{t.reserve.hours}</dt>
              <dd>{t.reserve.hoursValue}</dd>
            </div>
            <div className="hours__row">
              <dt>{t.reserve.dinners}</dt>
              <dd>{t.reserve.dinnersValue}</dd>
            </div>
            <div className="hours__row">
              <dt>{t.reserve.closedDays}</dt>
              <dd>{t.reserve.closedDaysValue}</dd>
            </div>
          </dl>
          <p className="fine-print fine-print--on-dark reveal">{t.reserve.holidays}</p>
        </div>

        <div className="request-card reveal">
          <div className="request-card__preview" data-seating={form.seating}>
            <div className="seat-photo seat-photo--indoor" aria-hidden={form.seating !== 'indoor'}>
              <VenuePhoto image={venueImages.kupelas} alt={f.indoorAlt} fallbackLabel={t.imageUnavailable} sizes="(max-width: 900px) 100vw, 40vw" />
            </div>
            <div className="seat-photo seat-photo--terrace" aria-hidden={form.seating !== 'terrace'}>
              <VenuePhoto image={venueImages.terrace} alt={f.terraceAlt} fallbackLabel={t.imageUnavailable} sizes="(max-width: 900px) 100vw, 40vw" objectPosition="50% 40%" />
            </div>
            <span className="badge badge--prototype">{t.reserve.prototypeBadge}</span>
          </div>

          <div className="request-card__body">
            <p className="prototype-note" id={field('note')}>
              {t.reserve.prototypeNotice}
            </p>

            {submitted ? (
              <div className="summary" role="status">
                <h3 className="summary__title" ref={summaryHeadingRef} tabIndex={-1}>
                  {t.reserve.summary.title}
                </h3>
                <dl className="summary__list">
                  <div><dt>{f.date}</dt><dd>{details.date}</dd></div>
                  <div><dt>{f.time}</dt><dd>{details.time}</dd></div>
                  <div><dt>{f.guests}</dt><dd>{details.guests}</dd></div>
                  <div><dt>{f.seating}</dt><dd>{details.seating}</dd></div>
                  <div><dt>{f.name}</dt><dd>{details.name}</dd></div>
                  <div><dt>{f.phone}</dt><dd>{details.phone}</dd></div>
                  {details.notes && <div><dt>{f.notes}</dt><dd>{details.notes}</dd></div>}
                </dl>
                <p className="summary__body">{t.reserve.summary.body}</p>
                <div className="summary__actions">
                  <a className="btn btn--primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                    {t.reserve.summary.whatsapp}
                    <span className="btn__arrow" aria-hidden="true">↗</span>
                  </a>
                  <button type="button" className="btn btn--ghost-dark" onClick={() => setSubmitted(false)}>
                    {t.reserve.summary.edit}
                  </button>
                </div>
              </div>
            ) : (
              <form className="request-form" onSubmit={onSubmit} aria-describedby={field('note')}>
                <h3 className="request-form__legend">{f.legend}</h3>

                <div className="field">
                  <label htmlFor={field('date')}>{f.date}</label>
                  <input
                    id={field('date')}
                    type="date"
                    required
                    min={todayIso()}
                    value={form.date}
                    aria-describedby={field('date-hint')}
                    onChange={(e) => update('date', e.target.value)}
                  />
                  <p className="field__hint" id={field('date-hint')}>{f.dateHint}</p>
                </div>

                <div className="field">
                  <label htmlFor={field('time')}>{f.time}</label>
                  <input
                    id={field('time')}
                    type="time"
                    required
                    value={form.time}
                    aria-describedby={field('time-hint')}
                    onChange={(e) => update('time', e.target.value)}
                  />
                  <p className="field__hint" id={field('time-hint')}>{f.timeHint}</p>
                </div>

                <div className="field">
                  <label htmlFor={field('guests')}>{f.guests}</label>
                  <input
                    id={field('guests')}
                    type="number"
                    inputMode="numeric"
                    required
                    min={1}
                    value={form.guests}
                    onChange={(e) => update('guests', e.target.value)}
                  />
                </div>

                <fieldset className="field seating" aria-describedby={field('seating-hint')}>
                  <legend>{f.seating}</legend>
                  <div className="seating__options">
                    {(['indoor', 'terrace'] as const).map((option) => (
                      <label className="seating__option" key={option}>
                        <input
                          type="radio"
                          name="seating"
                          value={option}
                          checked={form.seating === option}
                          onChange={() => update('seating', option)}
                        />
                        <span>{option === 'indoor' ? f.indoor : f.terrace}</span>
                      </label>
                    ))}
                  </div>
                  <p className="field__hint" id={field('seating-hint')}>{f.seatingHint}</p>
                </fieldset>

                <div className="field">
                  <label htmlFor={field('name')}>{f.name}</label>
                  <input
                    ref={nameRef}
                    id={field('name')}
                    type="text"
                    autoComplete="name"
                    required
                    value={form.name}
                    aria-invalid={blank.name || undefined}
                    aria-describedby={blank.name ? field('name-error') : undefined}
                    onChange={(e) => updateRequiredText('name', e.target.value)}
                  />
                  {blank.name && (
                    <p className="field__error" id={field('name-error')} role="alert">
                      {f.nameRequired}
                    </p>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={field('phone')}>{f.phone}</label>
                  <input
                    ref={phoneRef}
                    id={field('phone')}
                    type="tel"
                    autoComplete="tel"
                    required
                    value={form.phone}
                    aria-invalid={blank.phone || undefined}
                    aria-describedby={blank.phone ? field('phone-error') : undefined}
                    onChange={(e) => updateRequiredText('phone', e.target.value)}
                  />
                  {blank.phone && (
                    <p className="field__error" id={field('phone-error')} role="alert">
                      {f.phoneRequired}
                    </p>
                  )}
                </div>

                <div className="field field--full">
                  <label htmlFor={field('notes')}>{f.notes}</label>
                  <textarea
                    id={field('notes')}
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn--dark btn--block">
                  {f.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
