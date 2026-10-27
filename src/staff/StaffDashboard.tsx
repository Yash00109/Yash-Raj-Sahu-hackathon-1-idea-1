import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { STATUS_TRANSITIONS, STATUSES, type ReservationStatus } from '../../supabase/functions/_shared/reservation.ts'
import { LIST_LIMIT, StaffApiError, type ReservationFilters, type StaffApi, type StaffErrorCode, type StaffReservation } from './staffApi'
import type { StaffCopy } from './staffCopy'
import { useStaffCopy } from './staffLanguage'
import { PhoneBookingForm } from './PhoneBookingForm'

/** Kept as data, not text, so a message on screen follows a language change. */
type Message =
  | { kind: 'error'; code: StaffErrorCode }
  | { kind: 'updated'; reference: string; status: ReservationStatus }
  | { kind: 'phoneSaved'; reference: string }

function messageText(c: StaffCopy, message: Message): string {
  switch (message.kind) {
    case 'error':
      return c.errors[message.code]
    case 'updated':
      return c.actions.updated(message.reference, c.status[message.status])
    case 'phoneSaved':
      return c.phone.saved(message.reference)
  }
}

interface StaffDashboardProps {
  api: StaffApi
  account: ReactNode
  onAuthLost: () => void
}

const emptyFilters: ReservationFilters = { date: '', status: '', search: '' }

export function StaffDashboard({ api, account, onAuthLost }: StaffDashboardProps) {
  const c = useStaffCopy()
  const [filters, setFilters] = useState<ReservationFilters>(emptyFilters)
  const [searchDraft, setSearchDraft] = useState('')
  const [rows, setRows] = useState<StaffReservation[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const fail = useCallback(
    (error: unknown) => {
      const code = error instanceof StaffApiError ? error.code : 'unknown'
      setMessage({ kind: 'error', code })
      if (code === 'not_staff') onAuthLost()
    },
    [onAuthLost],
  )

  useEffect(() => {
    let active = true
    api.listReservations(filters).then(
      (result) => active && setRows(result),
      (error) => active && fail(error),
    )
    return () => {
      active = false
    }
  }, [api, filters, reloadToken, fail])

  const applySearch = (event: FormEvent) => {
    event.preventDefault()
    setFilters((current) => ({ ...current, search: searchDraft }))
  }

  const clear = () => {
    setSearchDraft('')
    setFilters(emptyFilters)
  }

  const transition = async (row: StaffReservation, next: ReservationStatus) => {
    if (next === 'rejected' && !window.confirm(c.actions.confirmReject(row.reference))) return
    if (next === 'cancelled' && !window.confirm(c.actions.confirmCancel(row.reference))) return
    setBusyId(row.id)
    setMessage(null)
    try {
      const updated = await api.setStatus(row.id, next)
      setRows((current) => current?.map((r) => (r.id === updated.id ? updated : r)) ?? null)
      setMessage({ kind: 'updated', reference: updated.reference, status: updated.status })
    } catch (error) {
      fail(error)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard__head">
        <h1>{c.title}</h1>
        {account}
      </div>

      <form className="staff-card staff-filters" onSubmit={applySearch} aria-label={c.filters.legend}>
        <div className="staff-field">
          <label htmlFor="staff-filter-date">{c.filters.date}</label>
          <input
            id="staff-filter-date"
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
            aria-describedby="staff-date-hint"
          />
          <small id="staff-date-hint">{c.filters.dateHint}</small>
        </div>
        <label className="staff-field">
          <span>{c.filters.status}</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ReservationStatus | '' }))}
          >
            <option value="">{c.filters.anyStatus}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {c.status[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="staff-field staff-field--grow">
          <span>{c.filters.search}</span>
          <input type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={60} />
        </label>
        <div className="staff-filters__actions">
          <button className="staff-btn" type="submit">
            {c.filters.apply}
          </button>
          <button className="staff-btn staff-btn--quiet" type="button" onClick={clear}>
            {c.filters.clear}
          </button>
        </div>
      </form>

      <p
        className={`staff-alert${message && message.kind !== 'error' ? ' staff-alert--ok' : ''}`}
        role={message && message.kind !== 'error' ? 'status' : 'alert'}
        hidden={!message}
      >
        {message && messageText(c, message)}
      </p>

      <section aria-labelledby="staff-list-heading">
        <div className="staff-list__head">
          <h2 id="staff-list-heading" className="staff-list__count">
            {rows ? c.list.count(rows.length, rows.length >= LIST_LIMIT) : c.loading}
          </h2>
          <button className="staff-btn staff-btn--quiet" type="button" onClick={() => setReloadToken((n) => n + 1)}>
            {c.list.reload}
          </button>
        </div>
        {rows?.length === 0 && <p className="staff__muted">{c.list.empty}</p>}
        <ul className="staff-list">
          {rows?.map((row) => (
            <li key={row.id} className="staff-card staff-row" data-status={row.status}>
              <div className="staff-row__main">
                <p className="staff-row__when">
                  <strong>{row.reservation_date}</strong> · {row.reservation_time} · {c.list.guests(row.party_size)} · {c.seating[row.seating_preference]}
                </p>
                <p className="staff-row__who">
                  {row.guest_name} · <a href={`tel:${row.phone}`}>{row.phone}</a>
                </p>
                <p className="staff-row__meta">
                  <span className={`staff-badge staff-badge--${row.status}`}>{c.status[row.status]}</span>
                  <span className="staff-badge">{row.source ? c.source[row.source] : c.sourceUnknown}</span>
                  <span>
                    {c.list.reference}: {row.reference}
                  </span>
                  <span>
                    {c.list.language}: {c.language[row.preferred_language]}
                  </span>
                </p>
                {row.notes && (
                  <p className="staff-row__notes">
                    <span>{c.list.notes}:</span> {row.notes}
                  </p>
                )}
              </div>
              {STATUS_TRANSITIONS[row.status].length > 0 && (
                <div className="staff-row__actions">
                  {STATUS_TRANSITIONS[row.status].map((next) => (
                    <button
                      key={next}
                      type="button"
                      className={`staff-btn${next === 'confirmed' ? '' : ' staff-btn--quiet'}`}
                      disabled={busyId === row.id}
                      onClick={() => transition(row, next)}
                      aria-label={`${c.actions[next as Exclude<ReservationStatus, 'pending'>]} ${row.reference}`}
                    >
                      {busyId === row.id ? c.actions.saving : c.actions[next as Exclude<ReservationStatus, 'pending'>]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <PhoneBookingForm
        api={api}
        onCreated={(created) => {
          setMessage({ kind: 'phoneSaved', reference: created.reference })
          setReloadToken((n) => n + 1)
        }}
        onError={fail}
      />
    </div>
  )
}
