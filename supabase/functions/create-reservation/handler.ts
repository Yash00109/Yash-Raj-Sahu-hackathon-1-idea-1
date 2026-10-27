import { corsHeaders, json } from '../_shared/http.ts'
import { validateReservationRequest, type ReservationRequest } from '../_shared/reservation.ts'

export const MAX_BODY_BYTES = 8 * 1024

export interface StoredReservation {
  reference: string
  status: string
  replayed: boolean
}

/** Capacity outcomes decided atomically by the database. */
export type SlotRefusal = 'slot_unavailable' | 'slot_not_offered'

export interface CreateReservationDeps {
  allowedOrigins: readonly string[]
  /** Stores a website request as pending, or returns the earlier row for a repeated requestId. */
  store: (request: ReservationRequest) => Promise<StoredReservation | SlotRefusal>
  /** Returns false when the caller has exceeded the request budget. */
  consumeRateLimit: (request: Request) => Promise<boolean>
  now?: () => Date
  /** Structured, PII-free operational log. */
  log?: (event: string, detail?: Record<string, string | number | boolean>) => void
}

/**
 * Public reservation request endpoint. Response contract:
 *   201/200 { ok: true, reservation: { reference, status }, replayed }
 *   400     { ok: false, error: 'validation_failed', fields: [{ field, code }] } | { ok: false, error: 'invalid_json' }
 *           (a time that is not an offered slot: fields [{ field: 'time', code: 'slot_not_offered' }])
 *   409     { ok: false, error: 'slot_unavailable' } — the slot is full
 *   403 origin_not_allowed · 405 method_not_allowed · 413 payload_too_large · 415 unsupported_media_type
 *   429 rate_limited · 500 server_error
 */
export async function handleCreateReservation(req: Request, deps: CreateReservationDeps): Promise<Response> {
  const log = deps.log ?? (() => {})
  const origin = req.headers.get('Origin')
  const cors = corsHeaders(origin, deps.allowedOrigins)
  const originAllowed = !origin || deps.allowedOrigins.includes(origin)

  if (req.method === 'OPTIONS') {
    return originAllowed ? new Response(null, { status: 204, headers: cors }) : json(403, { ok: false, error: 'origin_not_allowed' }, cors)
  }
  if (!originAllowed) {
    log('rejected', { reason: 'origin_not_allowed' })
    return json(403, { ok: false, error: 'origin_not_allowed' }, cors)
  }
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, { ...cors, Allow: 'POST, OPTIONS' })
  if (!(req.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false, error: 'unsupported_media_type' }, cors)
  }

  const declaredLength = Number(req.headers.get('Content-Length') ?? 0)
  if (declaredLength > MAX_BODY_BYTES) return json(413, { ok: false, error: 'payload_too_large' }, cors)

  let body: unknown
  try {
    const raw = await req.text()
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'payload_too_large' }, cors)
    body = JSON.parse(raw)
  } catch {
    return json(400, { ok: false, error: 'invalid_json' }, cors)
  }

  const result = validateReservationRequest(body, deps.now?.() ?? new Date())
  if (!result.ok) {
    log('rejected', { reason: 'validation_failed', codes: result.errors.map((e) => e.code).join(',') })
    return json(400, { ok: false, error: 'validation_failed', fields: result.errors }, cors)
  }

  try {
    if (!(await deps.consumeRateLimit(req))) {
      log('rejected', { reason: 'rate_limited' })
      return json(429, { ok: false, error: 'rate_limited' }, { ...cors, 'Retry-After': '600' })
    }
    const stored = await deps.store(result.value)
    if (stored === 'slot_unavailable') {
      log('rejected', { reason: 'slot_unavailable', partySize: result.value.partySize })
      return json(409, { ok: false, error: 'slot_unavailable' }, cors)
    }
    if (stored === 'slot_not_offered') {
      log('rejected', { reason: 'slot_not_offered' })
      return json(400, { ok: false, error: 'validation_failed', fields: [{ field: 'time', code: 'slot_not_offered' }] }, cors)
    }
    log(stored.replayed ? 'replayed' : 'created', { partySize: result.value.partySize, language: result.value.language })
    return json(
      stored.replayed ? 200 : 201,
      { ok: true, reservation: { reference: stored.reference, status: stored.status }, replayed: stored.replayed },
      cors,
    )
  } catch (error) {
    log('failed', { reason: error instanceof Error ? error.name : 'unknown' })
    return json(500, { ok: false, error: 'server_error' }, cors)
  }
}
