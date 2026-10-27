/**
 * Reservation domain rules: the single source of truth shared by the browser
 * (imported from src/) and the Supabase Edge Functions (Deno). Keep this file
 * free of runtime-specific APIs and imports so both environments can load it.
 */

export const LANGUAGES = ['eu', 'es', 'fr', 'en', 'de'] as const
export const SEATING = ['indoor', 'terrace'] as const
export const STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled'] as const
export const SOURCES = ['website', 'phone'] as const

export type ReservationLanguage = (typeof LANGUAGES)[number]
export type Seating = (typeof SEATING)[number]
export type ReservationStatus = (typeof STATUSES)[number]
export type ReservationSource = (typeof SOURCES)[number]

/** Requests are judged against the venue's local time, not the visitor's clock. */
export const VENUE_TIMEZONE = 'Europe/Madrid'

/**
 * Validation limits. `partySizeMax` is the venue's published capacity ("capacidad
 * para 90 comensales", official menus page); the others are technical bounds.
 * Opening hours, time slots, holidays and per-day capacity are NOT enforced: the
 * venue publishes dinners and weekday groups "by arrangement", so those rules must
 * be configured by the business before they can be validated.
 */
export const LIMITS = {
  // Matches the hosted reservations_guest_name_length constraint (2–100 trimmed characters).
  nameMin: 2,
  nameMax: 100,
  phoneDigitsMin: 7,
  phoneDigitsMax: 15,
  phoneCharsMax: 32,
  notesMax: 500,
  partySizeMin: 1,
  partySizeMax: 90,
} as const

/** Publicly writable fields. Anything else (status, source, staff ids, timestamps...) is rejected. */
export const PUBLIC_FIELDS = ['name', 'phone', 'date', 'time', 'partySize', 'seating', 'language', 'notes', 'requestId'] as const
export type PublicField = (typeof PUBLIC_FIELDS)[number]

export type ValidationCode =
  | 'not_an_object'
  | 'unknown_field'
  | 'name_required'
  | 'name_too_short'
  | 'name_too_long'
  | 'phone_required'
  | 'phone_invalid'
  | 'date_invalid'
  | 'time_invalid'
  /** Server-only: the time is not an offered slot on that date (or is too soon / too far ahead). */
  | 'slot_not_offered'
  | 'date_in_past'
  | 'party_size_invalid'
  | 'party_size_too_large'
  | 'seating_invalid'
  | 'language_invalid'
  | 'notes_too_long'
  | 'notes_invalid'
  | 'request_id_invalid'

export interface FieldError {
  field: PublicField | '_request'
  code: ValidationCode
}

export interface ReservationRequest {
  name: string
  phone: string
  date: string
  time: string
  partySize: number
  seating: Seating
  language: ReservationLanguage
  notes: string | null
  requestId: string | null
}

export type ValidationResult = { ok: true; value: ReservationRequest } | { ok: false; errors: FieldError[] }

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/
const PHONE_CHARS_RE = /^\+?[\d\s().-]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Control characters other than tab/newline/carriage return.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value)

export const isLanguage = (value: unknown): value is ReservationLanguage => isOneOf(LANGUAGES, value)
export const isSeating = (value: unknown): value is Seating => isOneOf(SEATING, value)

/** Collapses runs of whitespace and trims. */
export const normalizeName = (value: string) => value.replace(/\s+/g, ' ').trim()

/** Keeps a leading "+" and the digits: "+34 685 72 15 93" becomes "+34685721593". */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > LIMITS.phoneCharsMax || !PHONE_CHARS_RE.test(trimmed)) return null
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < LIMITS.phoneDigitsMin || digits.length > LIMITS.phoneDigitsMax) return null
  return (trimmed.startsWith('+') ? '+' : '') + digits
}

export function isCalendarDate(value: string): boolean {
  const match = DATE_RE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export const isClockTime = (value: string) => TIME_RE.test(value)

/** The current date and minute in the venue's timezone, as `yyyy-mm-dd` and `HH:MM`. */
export function venueNow(now: Date = new Date()): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: VENUE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

/** A request for a date and time at or before the current venue minute is in the past. */
export function isInPast(date: string, time: string, now: Date = new Date()): boolean {
  const current = venueNow(now)
  return `${date}T${time}` <= `${current.date}T${current.time}`
}

/**
 * Validates an untrusted public reservation payload. Used unchanged by the browser
 * (for instant feedback) and the Edge Function (as the authoritative check).
 */
export function validateReservationRequest(input: unknown, now: Date = new Date()): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: [{ field: '_request', code: 'not_an_object' }] }
  }
  const raw = input as Record<string, unknown>
  const errors: FieldError[] = []

  for (const key of Object.keys(raw)) {
    if (!(PUBLIC_FIELDS as readonly string[]).includes(key)) errors.push({ field: '_request', code: 'unknown_field' })
  }

  const name = typeof raw.name === 'string' ? normalizeName(raw.name) : ''
  if (!name || !/[\p{L}\p{N}]/u.test(name)) errors.push({ field: 'name', code: 'name_required' })
  else if (name.length < LIMITS.nameMin) errors.push({ field: 'name', code: 'name_too_short' })
  else if (name.length > LIMITS.nameMax || CONTROL_RE.test(name)) errors.push({ field: 'name', code: 'name_too_long' })

  const phoneRaw = typeof raw.phone === 'string' ? raw.phone : ''
  const phone = normalizePhone(phoneRaw)
  if (!phoneRaw.trim()) errors.push({ field: 'phone', code: 'phone_required' })
  else if (!phone) errors.push({ field: 'phone', code: 'phone_invalid' })

  const date = typeof raw.date === 'string' ? raw.date : ''
  const time = typeof raw.time === 'string' ? raw.time : ''
  const dateOk = isCalendarDate(date)
  const timeOk = isClockTime(time)
  if (!dateOk) errors.push({ field: 'date', code: 'date_invalid' })
  if (!timeOk) errors.push({ field: 'time', code: 'time_invalid' })
  if (dateOk && timeOk && isInPast(date, time, now)) errors.push({ field: 'date', code: 'date_in_past' })

  const partySize = raw.partySize
  if (typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < LIMITS.partySizeMin) {
    errors.push({ field: 'partySize', code: 'party_size_invalid' })
  } else if (partySize > LIMITS.partySizeMax) {
    errors.push({ field: 'partySize', code: 'party_size_too_large' })
  }

  if (!isSeating(raw.seating)) errors.push({ field: 'seating', code: 'seating_invalid' })
  if (!isLanguage(raw.language)) errors.push({ field: 'language', code: 'language_invalid' })

  let notes: string | null = null
  if (raw.notes !== undefined && raw.notes !== null) {
    if (typeof raw.notes !== 'string' || CONTROL_RE.test(raw.notes)) errors.push({ field: 'notes', code: 'notes_invalid' })
    else {
      const trimmed = raw.notes.trim()
      if (trimmed.length > LIMITS.notesMax) errors.push({ field: 'notes', code: 'notes_too_long' })
      notes = trimmed || null
    }
  }

  let requestId: string | null = null
  if (raw.requestId !== undefined && raw.requestId !== null) {
    if (typeof raw.requestId !== 'string' || !UUID_RE.test(raw.requestId)) errors.push({ field: 'requestId', code: 'request_id_invalid' })
    else requestId = raw.requestId.toLowerCase()
  }

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      name,
      phone: phone!,
      date,
      time,
      partySize: partySize as number,
      seating: raw.seating as Seating,
      language: raw.language as ReservationLanguage,
      notes,
      requestId,
    },
  }
}

/** Status changes staff may make. Everything else (including any change to a closed booking) is refused. */
export const STATUS_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled'],
  rejected: [],
  cancelled: [],
}

export const canTransition = (from: ReservationStatus, to: ReservationStatus) => STATUS_TRANSITIONS[from].includes(to)
