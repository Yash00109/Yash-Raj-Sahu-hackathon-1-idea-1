import { useState, type FormEvent, type ReactElement } from 'react'
import { LANGUAGES, LIMITS, SEATING, validateReservationRequest, type FieldError } from '../../supabase/functions/_shared/reservation.ts'
import type { StaffApi, StaffReservation } from './staffApi'
import { useStaffCopy } from './staffLanguage'

interface PhoneBookingFormProps {
  api: StaffApi
  onCreated: (reservation: StaffReservation) => void
  onError: (error: unknown) => void
}

type FieldName = 'name' | 'phone' | 'date' | 'time' | 'partySize' | 'seating' | 'language' | 'status' | 'notes'

const idFor = (field: FieldName) => `phone-${field}`

export function PhoneBookingForm({ api, onCreated, onError }: PhoneBookingFormProps) {
  const c = useStaffCopy()
  const [errors, setErrors] = useState<FieldError[]>([])
  const [saving, setSaving] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const data = new FormData(form)
    const text = (name: string) => String(data.get(name) ?? '')
    const guests = text('partySize').trim()
    const result = validateReservationRequest({
      name: text('name'),
      phone: text('phone'),
      date: text('date'),
      time: text('time'),
      partySize: /^\d+$/.test(guests) ? Number(guests) : Number.NaN,
      seating: text('seating'),
      language: text('language'),
      notes: text('notes'),
    })
    if (!result.ok) {
      setErrors(result.errors)
      form.querySelector<HTMLElement>(`[name="${result.errors[0].field}"]`)?.focus()
      return
    }
    setErrors([])
    setSaving(true)
    try {
      const created = await api.createPhoneReservation({ ...result.value, status: text('status') === 'pending' ? 'pending' : 'confirmed' })
      form.reset()
      onCreated(created)
    } catch (error) {
      onError(error)
    } finally {
      setSaving(false)
    }
  }

  /** Label, control and error are siblings so the error is announced once, as a description. */
  const field = (name: FieldName, label: string, control: ReactElement, wide = false) => {
    const error = errors.find((e) => e.field === name)
    return (
      <div className={`staff-field${wide ? ' staff-field--wide' : ''}`}>
        <label htmlFor={idFor(name)}>{label}</label>
        {control}
        {error && (
          <small className="staff-field__error" id={`${idFor(name)}-error`}>
            {c.validation[error.code]}
          </small>
        )}
      </div>
    )
  }
  const a11y = (name: FieldName) => {
    const invalid = errors.some((e) => e.field === name)
    return { id: idFor(name), name, 'aria-invalid': invalid, 'aria-describedby': invalid ? `${idFor(name)}-error` : undefined }
  }

  return (
    <section className="staff-card staff-phone" aria-labelledby="staff-phone-heading">
      <h2 id="staff-phone-heading">{c.phone.heading}</h2>
      <p className="staff__muted">{c.phone.intro}</p>
      <form className="staff-phone__grid" onSubmit={onSubmit} noValidate>
        <p className="staff-alert" role="alert" hidden={errors.length === 0}>
          {c.phone.errorSummary}
        </p>
        {field('name', c.phone.name, <input {...a11y('name')} autoComplete="off" maxLength={LIMITS.nameMax} />)}
        {field('phone', c.phone.phone, <input {...a11y('phone')} type="tel" autoComplete="off" maxLength={LIMITS.phoneCharsMax} />)}
        {field('date', c.phone.date, <input {...a11y('date')} type="date" />)}
        {field('time', c.phone.time, <input {...a11y('time')} type="time" />)}
        {field(
          'partySize',
          c.phone.partySize,
          <input {...a11y('partySize')} type="number" inputMode="numeric" min={LIMITS.partySizeMin} max={LIMITS.partySizeMax} />,
        )}
        {field(
          'seating',
          c.phone.seating,
          <select {...a11y('seating')} defaultValue="indoor">
            {SEATING.map((s) => (
              <option key={s} value={s}>
                {c.seating[s]}
              </option>
            ))}
          </select>,
        )}
        {field(
          'language',
          c.phone.language,
          <select {...a11y('language')} defaultValue="es">
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {c.language[l]}
              </option>
            ))}
          </select>,
        )}
        {field(
          'status',
          c.phone.status,
          <select {...a11y('status')} defaultValue="confirmed">
            <option value="confirmed">{c.status.confirmed}</option>
            <option value="pending">{c.status.pending}</option>
          </select>,
        )}
        {field('notes', c.phone.notes, <textarea {...a11y('notes')} rows={2} maxLength={LIMITS.notesMax} />, true)}
        <div className="staff-field--wide">
          <button className="staff-btn" type="submit" disabled={saving}>
            {saving ? c.phone.saving : c.phone.submit}
          </button>
        </div>
      </form>
    </section>
  )
}
