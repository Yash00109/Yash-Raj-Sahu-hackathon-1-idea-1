import { useId, useRef, useState, type FormEvent } from 'react'
import { normalizePhone } from '../../supabase/functions/_shared/reservation.ts'
import { backendConfig, type ConfigState } from '../config'
import { venue } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import { availability } from '../i18n/availability'
import { formatRequestDate } from '../i18n/formatDate'
import { lookupReservation, type LookupOutcome, type TrackedReservation } from '../services/reservationService'
import type { PageProps } from './types'

const REFERENCE_RE = /^IT-[0-9A-F]{8}(?:[0-9A-F]{4})?$/

interface TrackerPageProps extends PageProps {
  /** Injected in tests; the app uses the build-time configuration and the real service. */
  config?: ConfigState
  lookup?: typeof lookupReservation
}

type Problem = Exclude<LookupOutcome['kind'], 'found'> | null

export function TrackerPage({ t, lang, config = backendConfig, lookup = lookupReservation }: TrackerPageProps) {
  const c = availability[lang].tracker
  useDocumentTitle(`${c.title} · ${venue.name}`)
  const ids = useId()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<Problem>(null)
  const [result, setResult] = useState<TrackedReservation | null>(null)
  const alertRef = useRef<HTMLParagraphElement>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const reference = String(data.get('reference') ?? '').trim().toUpperCase()
    const phone = normalizePhone(String(data.get('phone') ?? ''))
    setResult(null)
    if (!REFERENCE_RE.test(reference) || !phone) {
      setProblem('invalid')
      alertRef.current?.focus()
      return
    }
    setBusy(true)
    setProblem(null)
    const outcome = await lookup(reference, phone, { config })
    setBusy(false)
    if (outcome.kind === 'found') setResult(outcome.reservation)
    else {
      setProblem(outcome.kind)
      alertRef.current?.focus()
    }
  }

  const message: Record<Exclude<Problem, null>, string> = {
    not_found: c.notFound,
    invalid: c.invalid,
    rate_limited: c.rateLimited,
    error: c.error,
    unavailable: c.unavailable,
  }

  return (
    <section className="not-found tracker" aria-labelledby="page-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container tracker__inner">
        <p className="eyebrow eyebrow--on-dark">{t.reserve.eyebrow}</p>
        <h1 className="page-hero__title" id="page-title">{c.title}</h1>
        <p className="page-hero__lede">{c.lede}</p>

        <div className="tracker__card">
          {config.ok ? (
            <form className="tracker__form" onSubmit={onSubmit} noValidate aria-busy={busy}>
              <p className="form-alert" role="alert" ref={alertRef} tabIndex={-1} hidden={!problem}>
                {problem && message[problem]}
              </p>
              <div className="field">
                <label htmlFor={`${ids}-reference`}>{c.reference}</label>
                <input
                  id={`${ids}-reference`}
                  name="reference"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={20}
                  aria-describedby={`${ids}-reference-hint`}
                />
                <p className="field__hint" id={`${ids}-reference-hint`}>{c.referenceHint}</p>
              </div>
              <div className="field">
                <label htmlFor={`${ids}-phone`}>{c.phone}</label>
                <input id={`${ids}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={32} aria-describedby={`${ids}-phone-hint`} />
                <p className="field__hint" id={`${ids}-phone-hint`}>{c.phoneHint}</p>
              </div>
              <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
                {busy ? c.submitting : c.submit}
              </button>
            </form>
          ) : (
            <p className="tracker__unavailable">
              {c.unavailable}{' '}
              <a className="text-link" href={venue.phoneHref}>
                {venue.phoneDisplay}
              </a>
            </p>
          )}

          {result && (
            <div className="summary summary--success tracker__result" role="status">
              <h2 className="summary__title">{c.resultTitle}</h2>
              <dl className="summary__list">
                <div><dt>{c.reference}</dt><dd>{result.reference}</dd></div>
                <div><dt>{c.date}</dt><dd>{formatRequestDate(result.date, lang)}</dd></div>
                <div><dt>{c.time}</dt><dd>{result.time}</dd></div>
                <div><dt>{c.guests}</dt><dd>{result.partySize}</dd></div>
                <div><dt>{c.status}</dt><dd><strong>{c.statuses[result.status]}</strong></dd></div>
              </dl>
              {result.status === 'pending' && <p className="summary__body">{c.pendingNote}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
