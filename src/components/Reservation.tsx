import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  isCalendarDate,
  LIMITS,
  validateReservationRequest,
  venueNow,
  type FieldError,
  type PublicField,
  type Seating,
  type ValidationCode,
} from '../../supabase/functions/_shared/reservation.ts'
import { backendConfig, type ConfigState } from '../config'
import { venue, venueImages } from '../content/venue'
import { availability } from '../i18n/availability'
import { booking } from '../i18n/booking'
import { languages, type Copy, type Lang, type RequestDetails } from '../i18n/copy'
import { formatRequestDate } from '../i18n/formatDate'
import { TRACKER_HREF } from '../routes'
import { fetchAvailability, submitReservationRequest, type AvailabilityOutcome, type SubmitOutcome } from '../services/reservationService'
import { VenuePhoto } from './VenuePhoto'

interface FormState {
  date: string
  time: string
  guests: string
  seating: Seating
  name: string
  phone: string
  notes: string
}

type Phase = 'editing' | 'submitting' | 'created' | 'prepared'
type Failure = 'network' | 'server' | 'rateLimited' | 'rejected' | 'slotTaken' | null
type FormField = Exclude<PublicField, 'requestId'>

/** Field order on screen, used to focus the first invalid field. */
const FIELD_ORDER: FormField[] = ['date', 'time', 'partySize', 'seating', 'name', 'phone', 'language', 'notes']

const newRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))

const emptyForm: FormState = { date: '', time: '', guests: '2', seating: 'indoor', name: '', phone: '', notes: '' }

interface ReservationProps {
  t: Copy
  lang: Lang
  /** Injected in tests; the app uses the build-time configuration and the real service. */
  config?: ConfigState
  submit?: typeof submitReservationRequest
  loadAvailability?: typeof fetchAvailability
}

/** Availability is only asked for once date and party size are plausible. */
function availabilityQuery(form: FormState, refresh: number): { key: string; date: string; partySize: number } | null {
  const guests = form.guests.trim()
  if (!isCalendarDate(form.date) || !/^\d+$/.test(guests)) return null
  const partySize = Number(guests)
  if (partySize < LIMITS.partySizeMin || partySize > LIMITS.partySizeMax) return null
  return { key: `${form.date}|${partySize}|${refresh}`, date: form.date, partySize }
}

export function Reservation({ t, lang, config = backendConfig, submit = submitReservationRequest, loadAvailability = fetchAvailability }: ReservationProps) {
  const f = t.reserve.form
  const b = booking[lang]
  const a = availability[lang]
  const online = config.ok
  const ids = useId()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [contactLanguage, setContactLanguage] = useState<Lang | null>(null)
  const [phase, setPhase] = useState<Phase>('editing')
  const [errors, setErrors] = useState<Partial<Record<FormField, ValidationCode>>>({})
  const [failure, setFailure] = useState<Failure>(null)
  const [reference, setReference] = useState('')
  const [requestId, setRequestId] = useState(newRequestId)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [refresh, setRefresh] = useState(0)
  const [slotResult, setSlotResult] = useState<{ key: string; outcome: AvailabilityOutcome } | null>(null)

  const language = contactLanguage ?? lang
  const field = (name: string) => `${ids}-${name}`

  useEffect(() => {
    if (phase === 'created' || phase === 'prepared') resultHeadingRef.current?.focus()
  }, [phase])

  const query = online ? availabilityQuery(form, refresh) : null
  const queryKey = query?.key ?? null
  const queryDate = query?.date ?? null
  const queryParty = query?.partySize ?? null
  useEffect(() => {
    if (queryKey === null || queryDate === null || queryParty === null) return
    let active = true
    loadAvailability(queryDate, queryParty, { config }).then((outcome) => {
      if (active) setSlotResult({ key: queryKey, outcome })
    })
    return () => {
      active = false
    }
  }, [queryKey, queryDate, queryParty, config, loadAvailability])

  const slotState: 'idle' | 'loading' | 'error' | 'ready' = !query
    ? 'idle'
    : slotResult?.key !== query.key
      ? 'loading'
      : slotResult.outcome.kind === 'ok'
        ? 'ready'
        : 'error'
  const openSlots = slotState === 'ready' && slotResult?.outcome.kind === 'ok' ? slotResult.outcome.slots.filter((s) => s.available).map((s) => s.time) : []

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    // A new date means a new slot list: never carry a time over from another day.
    setForm((current) => ({ ...current, [key]: value, ...(key === 'date' && online && value !== current.date ? { time: '' } : {}) }))
    const errorKey: FormField = key === 'guests' ? 'partySize' : (key as FormField)
    if (errors[errorKey]) setErrors((current) => ({ ...current, [errorKey]: undefined }))
  }

  const payload = () => ({
    name: form.name,
    phone: form.phone,
    date: form.date,
    time: form.time,
    partySize: /^\d+$/.test(form.guests.trim()) ? Number(form.guests) : Number.NaN,
    seating: form.seating,
    language,
    notes: form.notes,
    requestId,
  })

  const showErrors = (list: FieldError[]) => {
    const next: Partial<Record<FormField, ValidationCode>> = {}
    for (const error of list) {
      const key = error.field as FormField
      if (FIELD_ORDER.includes(key) && !next[key]) next[key] = error.code
    }
    setErrors(next)
    const first = FIELD_ORDER.find((key) => next[key])
    const target = first && formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)
    target?.focus()
  }

  const handleOutcome = (outcome: SubmitOutcome) => {
    if (outcome.kind === 'created') {
      setReference(outcome.reference)
      setRequestId(newRequestId())
      setPhase('created')
      return
    }
    setPhase('editing')
    if (outcome.kind === 'invalid') {
      setFailure('rejected')
      showErrors(outcome.errors)
    } else if (outcome.kind === 'slot_unavailable') {
      setFailure('slotTaken')
      setForm((current) => ({ ...current, time: '' }))
      setRefresh((n) => n + 1)
    } else if (outcome.kind === 'rate_limited') setFailure('rateLimited')
    else if (outcome.kind === 'network_error') setFailure('network')
    else if (outcome.kind === 'unavailable') setPhase('prepared')
    else setFailure('server')
    alertRef.current?.focus()
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase === 'submitting') return
    setFailure(null)
    const body = payload()
    const result = validateReservationRequest(body)
    // Online, the time must be one of the slots the server just offered.
    const slotError: FieldError[] =
      online && !openSlots.includes(form.time) && !(result.ok === false && result.errors.some((e) => e.field === 'time'))
        ? [{ field: 'time', code: form.time ? 'slot_not_offered' : 'time_invalid' }]
        : []
    if (!result.ok || slotError.length) {
      showErrors([...(result.ok ? [] : result.errors), ...slotError])
      return
    }
    setErrors({})
    if (!online) {
      setPhase('prepared')
      return
    }
    setPhase('submitting')
    handleOutcome(await submit(body, { config }))
  }

  const startAgain = () => {
    setForm(emptyForm)
    setErrors({})
    setFailure(null)
    setReference('')
    setPhase('editing')
  }

  const details: RequestDetails = {
    date: form.date ? formatRequestDate(form.date, lang) : '',
    time: form.time,
    guests: form.guests,
    seating: form.seating === 'indoor' ? f.indoor : f.terrace,
    name: form.name.replace(/\s+/g, ' ').trim(),
    phone: form.phone.trim(),
    notes: form.notes.trim(),
  }
  const whatsappUrl = `${venue.whatsappHref}?text=${encodeURIComponent(t.reserve.whatsappMessage(details))}`
  const languageName = languages.find((option) => option.code === language)?.name ?? language

  const describedBy = (name: FormField, hint?: string) =>
    [hint && field(hint), errors[name] && field(`${name}-error`)].filter(Boolean).join(' ') || undefined
  const errorText = (name: FormField) =>
    errors[name] && (
      <p className="field__error" id={field(`${name}-error`)}>
        {b.errors[errors[name]!]}
      </p>
    )
  const hasErrors = Object.values(errors).some(Boolean)
  const alertMessage = failure === 'slotTaken' ? a.slots.taken : failure ? b.failure[failure] : hasErrors ? b.errorSummary : null

  const summaryList = (
    <dl className="summary__list">
      <div><dt>{f.date}</dt><dd>{details.date}</dd></div>
      <div><dt>{f.time}</dt><dd>{details.time}</dd></div>
      <div><dt>{f.guests}</dt><dd>{details.guests}</dd></div>
      <div><dt>{f.seating}</dt><dd>{details.seating}</dd></div>
      <div><dt>{b.language}</dt><dd>{languageName}</dd></div>
      <div><dt>{f.name}</dt><dd>{details.name}</dd></div>
      <div><dt>{f.phone}</dt><dd>{details.phone}</dd></div>
      {details.notes && <div><dt>{f.notes}</dt><dd>{details.notes}</dd></div>}
    </dl>
  )

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
            {!online && <span className="badge badge--prototype">{b.unavailable.badge}</span>}
          </div>

          <div className="request-card__body">
            <p className="prototype-note" id={field('note')}>
              {online ? b.onlineNotice : b.unavailable.body}
            </p>
            {online && (
              <p className="tracker-link">
                <Link to={TRACKER_HREF}>{a.tracker.link}</Link>
              </p>
            )}

            {phase === 'created' ? (
              <div className="summary summary--success" role="status">
                <h3 className="summary__title" ref={resultHeadingRef} tabIndex={-1}>
                  {b.success.title}
                </h3>
                <p className="summary__reference">
                  {b.success.reference}: <strong>{reference}</strong>
                </p>
                {summaryList}
                <p className="summary__body">{b.success.body}</p>
                <div className="summary__actions">
                  <a className="btn btn--ghost-dark" href={venue.phoneHref}>
                    {t.reserve.call} {venue.phoneDisplay}
                  </a>
                  <button type="button" className="btn btn--dark" onClick={startAgain}>
                    {b.success.another}
                  </button>
                </div>
              </div>
            ) : phase === 'prepared' ? (
              <div className="summary" role="status">
                <h3 className="summary__title" ref={resultHeadingRef} tabIndex={-1}>
                  {t.reserve.summary.title}
                </h3>
                {summaryList}
                <p className="summary__body">{t.reserve.summary.body}</p>
                <div className="summary__actions">
                  <a className="btn btn--primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                    {t.reserve.summary.whatsapp}
                    <span className="btn__arrow" aria-hidden="true">↗</span>
                  </a>
                  <button type="button" className="btn btn--ghost-dark" onClick={() => setPhase('editing')}>
                    {t.reserve.summary.edit}
                  </button>
                </div>
              </div>
            ) : (
              <form
                ref={formRef}
                className="request-form"
                onSubmit={onSubmit}
                noValidate
                aria-describedby={field('note')}
                aria-busy={phase === 'submitting'}
              >
                <h3 className="request-form__legend">{f.legend}</h3>

                <div className="form-alert" role="alert" ref={alertRef} tabIndex={-1} hidden={!alertMessage}>
                  {alertMessage && (
                    <>
                      <p>{alertMessage}</p>
                      {failure && failure !== 'rejected' && failure !== 'slotTaken' && <p className="form-alert__fallback">{b.failure.fallback}</p>}
                    </>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={field('date')}>{f.date}</label>
                  <input
                    id={field('date')}
                    data-field="date"
                    type="date"
                    aria-required="true"
                    min={venueNow().date}
                    value={form.date}
                    aria-invalid={Boolean(errors.date) || undefined}
                    aria-describedby={describedBy('date', 'date-hint')}
                    onChange={(e) => update('date', e.target.value)}
                  />
                  <p className="field__hint" id={field('date-hint')}>{f.dateHint}</p>
                  {errorText('date')}
                </div>

                {online ? (
                  <fieldset
                    className="field field--full slots"
                    data-field="time"
                    tabIndex={-1}
                    aria-invalid={Boolean(errors.time) || undefined}
                    aria-describedby={describedBy('time', 'slots-hint')}
                  >
                    <legend>{a.slots.legend}</legend>
                    <p className="slots__status" role="status" aria-live="polite">
                      {slotState === 'idle'
                        ? a.slots.idle
                        : slotState === 'loading'
                          ? a.slots.loading
                          : slotState === 'error'
                            ? a.slots.error
                            : openSlots.length === 0
                              ? a.slots.none
                              : ''}
                    </p>
                    {openSlots.length > 0 && (
                      <div className="slots__options">
                        {openSlots.map((slot) => (
                          <label className="slot" key={slot}>
                            <input type="radio" name="time" value={slot} checked={form.time === slot} onChange={() => update('time', slot)} />
                            <span>{slot}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {slotState === 'error' && (
                      <button type="button" className="btn btn--ghost-dark btn--compact" onClick={() => setRefresh((n) => n + 1)}>
                        {a.slots.retry}
                      </button>
                    )}
                    <p className="field__hint" id={field('slots-hint')}>{a.slots.hint}</p>
                    {errorText('time')}
                  </fieldset>
                ) : (
                  <div className="field">
                    <label htmlFor={field('time')}>{f.time}</label>
                    <input
                      id={field('time')}
                      data-field="time"
                      type="time"
                      aria-required="true"
                      value={form.time}
                      aria-invalid={Boolean(errors.time) || undefined}
                      aria-describedby={describedBy('time', 'time-hint')}
                      onChange={(e) => update('time', e.target.value)}
                    />
                    <p className="field__hint" id={field('time-hint')}>{f.timeHint}</p>
                    {errorText('time')}
                  </div>
                )}

                <div className="field">
                  <label htmlFor={field('guests')}>{f.guests}</label>
                  <input
                    id={field('guests')}
                    data-field="partySize"
                    type="number"
                    inputMode="numeric"
                    aria-required="true"
                    min={LIMITS.partySizeMin}
                    max={LIMITS.partySizeMax}
                    step={1}
                    value={form.guests}
                    aria-invalid={Boolean(errors.partySize) || undefined}
                    aria-describedby={describedBy('partySize', 'guests-hint')}
                    onChange={(e) => update('guests', e.target.value)}
                  />
                  <p className="field__hint" id={field('guests-hint')}>{b.guestsHint}</p>
                  {errorText('partySize')}
                </div>

                <fieldset className="field seating" aria-describedby={describedBy('seating', 'seating-hint')}>
                  <legend>{f.seating}</legend>
                  <div className="seating__options">
                    {(['indoor', 'terrace'] as const).map((option) => (
                      <label className="seating__option" key={option}>
                        <input
                          type="radio"
                          name="seating"
                          value={option}
                          data-field={option === 'indoor' ? 'seating' : undefined}
                          checked={form.seating === option}
                          onChange={() => update('seating', option)}
                        />
                        <span>{option === 'indoor' ? f.indoor : f.terrace}</span>
                      </label>
                    ))}
                  </div>
                  <p className="field__hint" id={field('seating-hint')}>{f.seatingHint}</p>
                  {errorText('seating')}
                </fieldset>

                <div className="field">
                  <label htmlFor={field('name')}>{f.name}</label>
                  <input
                    id={field('name')}
                    data-field="name"
                    type="text"
                    autoComplete="name"
                    aria-required="true"
                    maxLength={LIMITS.nameMax + 20}
                    value={form.name}
                    aria-invalid={Boolean(errors.name) || undefined}
                    aria-describedby={describedBy('name')}
                    onChange={(e) => update('name', e.target.value)}
                  />
                  {errorText('name')}
                </div>

                <div className="field">
                  <label htmlFor={field('phone')}>{f.phone}</label>
                  <input
                    id={field('phone')}
                    data-field="phone"
                    type="tel"
                    autoComplete="tel"
                    aria-required="true"
                    maxLength={LIMITS.phoneCharsMax}
                    value={form.phone}
                    aria-invalid={Boolean(errors.phone) || undefined}
                    aria-describedby={describedBy('phone')}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                  {errorText('phone')}
                </div>

                <div className="field">
                  <label htmlFor={field('language')}>{b.language}</label>
                  <select
                    id={field('language')}
                    data-field="language"
                    value={language}
                    aria-invalid={Boolean(errors.language) || undefined}
                    aria-describedby={describedBy('language', 'language-hint')}
                    onChange={(e) => {
                      const next = languages.find((option) => option.code === e.target.value)
                      if (next) setContactLanguage(next.code)
                    }}
                  >
                    {languages.map((option) => (
                      <option key={option.code} value={option.code} lang={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <p className="field__hint" id={field('language-hint')}>{b.languageHint}</p>
                  {errorText('language')}
                </div>

                <div className="field field--full">
                  <label htmlFor={field('notes')}>{f.notes}</label>
                  <textarea
                    id={field('notes')}
                    data-field="notes"
                    rows={3}
                    maxLength={LIMITS.notesMax + 50}
                    value={form.notes}
                    aria-invalid={Boolean(errors.notes) || undefined}
                    aria-describedby={describedBy('notes')}
                    onChange={(e) => update('notes', e.target.value)}
                  />
                  {errorText('notes')}
                </div>

                <button type="submit" className="btn btn--dark btn--block" disabled={phase === 'submitting'}>
                  {phase === 'submitting' ? b.submitting : online ? b.submit : f.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
