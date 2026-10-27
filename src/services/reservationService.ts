import { STATUSES, type FieldError, type ReservationStatus } from '../../supabase/functions/_shared/reservation.ts'
import type { ConfigState } from '../config'

export const CREATE_RESERVATION_PATH = '/functions/v1/create-reservation'

export type SubmitOutcome =
  | { kind: 'created'; reference: string; replayed: boolean }
  | { kind: 'invalid'; errors: FieldError[] }
  | { kind: 'slot_unavailable' }
  | { kind: 'rate_limited' }
  | { kind: 'server_error' }
  | { kind: 'network_error' }
  | { kind: 'unavailable' }

interface SubmitOptions {
  config: ConfigState
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

/**
 * Sends a public reservation request to the create-reservation Edge Function.
 * The server re-validates everything and alone decides status and source; a
 * "created" outcome means the server confirmed the row was persisted as pending.
 */
export async function submitReservationRequest(payload: unknown, { config, fetchImpl = fetch, timeoutMs = 12_000 }: SubmitOptions): Promise<SubmitOutcome> {
  if (!config.ok) return { kind: 'unavailable' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetchImpl(config.config.url + CREATE_RESERVATION_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.config.publishableKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch {
    return { kind: 'network_error' }
  } finally {
    clearTimeout(timer)
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Non-JSON bodies (gateway errors, HTML) are treated by status code alone.
  }
  const data = (body ?? {}) as { ok?: boolean; reservation?: { reference?: unknown }; replayed?: boolean; fields?: FieldError[] }

  if ((response.status === 201 || response.status === 200) && data.ok && typeof data.reservation?.reference === 'string') {
    return { kind: 'created', reference: data.reservation.reference, replayed: Boolean(data.replayed) }
  }
  if (response.status === 400 && Array.isArray(data.fields)) return { kind: 'invalid', errors: data.fields }
  if (response.status === 409) return { kind: 'slot_unavailable' }
  if (response.status === 429) return { kind: 'rate_limited' }
  return { kind: 'server_error' }
}

async function postJson(config: ConfigState & { ok: true }, path: string, body: unknown, fetchImpl: typeof fetch, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(config.config.url + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.config.publishableKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    let data: unknown = null
    try {
      data = await response.json()
    } catch {
      // Non-JSON bodies are judged by status code alone.
    }
    return { status: response.status, data }
  } finally {
    clearTimeout(timer)
  }
}

export const AVAILABILITY_PATH = '/rest/v1/rpc/get_availability'

export interface Slot {
  time: string
  available: boolean
}

export type AvailabilityOutcome = { kind: 'ok'; slots: Slot[] } | { kind: 'error' } | { kind: 'unavailable' }

/**
 * Asks the database which configured slots can still take the party. The answer is only a
 * guide: the final capacity check happens atomically when the request is stored.
 */
export async function fetchAvailability(
  date: string,
  partySize: number,
  { config, fetchImpl = fetch, timeoutMs = 10_000 }: SubmitOptions,
): Promise<AvailabilityOutcome> {
  if (!config.ok) return { kind: 'unavailable' }
  try {
    const { status, data } = await postJson(config, AVAILABILITY_PATH, { p_date: date, p_party_size: partySize }, fetchImpl, timeoutMs)
    if (status !== 200 || !Array.isArray(data)) return { kind: 'error' }
    const slots = data.flatMap((row: { slot_time?: unknown; available?: unknown }) =>
      typeof row.slot_time === 'string' && /^\d{2}:\d{2}$/.test(row.slot_time) ? [{ time: row.slot_time, available: row.available === true }] : [],
    )
    return { kind: 'ok', slots }
  } catch {
    return { kind: 'error' }
  }
}

export const LOOKUP_RESERVATION_PATH = '/functions/v1/lookup-reservation'

export interface TrackedReservation {
  reference: string
  date: string
  time: string
  partySize: number
  status: ReservationStatus
}

export type LookupOutcome =
  | { kind: 'found'; reservation: TrackedReservation }
  | { kind: 'not_found' }
  | { kind: 'invalid' }
  | { kind: 'rate_limited' }
  | { kind: 'error' }
  | { kind: 'unavailable' }

export async function lookupReservation(
  reference: string,
  phone: string,
  { config, fetchImpl = fetch, timeoutMs = 10_000 }: SubmitOptions,
): Promise<LookupOutcome> {
  if (!config.ok) return { kind: 'unavailable' }
  try {
    const { status, data } = await postJson(config, LOOKUP_RESERVATION_PATH, { reference, phone }, fetchImpl, timeoutMs)
    const body = (data ?? {}) as { ok?: boolean; reservation?: Partial<TrackedReservation> }
    const r = body.reservation
    if (
      status === 200 && body.ok && r &&
      typeof r.reference === 'string' && typeof r.date === 'string' && typeof r.time === 'string' &&
      typeof r.partySize === 'number' && isStatus(r.status)
    ) {
      return { kind: 'found', reservation: { reference: r.reference, date: r.date, time: r.time, partySize: r.partySize, status: r.status } }
    }
    if (status === 404) return { kind: 'not_found' }
    if (status === 400) return { kind: 'invalid' }
    if (status === 429) return { kind: 'rate_limited' }
    return { kind: 'error' }
  } catch {
    return { kind: 'error' }
  }
}

const isStatus = (value: unknown): value is ReservationStatus => STATUSES.some((s) => s === value)
