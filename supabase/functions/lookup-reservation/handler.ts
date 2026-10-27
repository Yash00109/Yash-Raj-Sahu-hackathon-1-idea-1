import { corsHeaders, json } from '../_shared/http.ts'
import { normalizePhone } from '../_shared/reservation.ts'

export const MAX_LOOKUP_BYTES = 1024
/** Old references have 8 hex characters, new ones 12. */
export const REFERENCE_RE = /^IT-[0-9A-F]{8}(?:[0-9A-F]{4})?$/

export interface TrackedReservation {
  reference: string
  date: string
  time: string
  partySize: number
  status: string
}

export interface LookupDeps {
  allowedOrigins: readonly string[]
  /** Returns the reservation only when reference AND phone match; null otherwise. */
  find: (reference: string, phone: string) => Promise<TrackedReservation | null>
  /** Returns false when the caller has exceeded the lookup budget. */
  consumeRateLimit: (request: Request) => Promise<boolean>
  log?: (event: string, detail?: Record<string, string | number | boolean>) => void
}

/**
 * Guest booking tracker. Response contract:
 *   200 { ok: true, reservation: { reference, date, time, partySize, status } }
 *   404 { ok: false, error: 'not_found' }   — same for unknown reference and wrong phone
 *   400 { ok: false, error: 'invalid_request' } · 403 · 405 · 413 · 415 · 429 rate_limited · 500 server_error
 * Every attempt, valid or not, counts against the rate limit.
 */
export async function handleLookup(req: Request, deps: LookupDeps): Promise<Response> {
  const log = deps.log ?? (() => {})
  const origin = req.headers.get('Origin')
  const cors = corsHeaders(origin, deps.allowedOrigins)
  const originAllowed = !origin || deps.allowedOrigins.includes(origin)

  if (req.method === 'OPTIONS') {
    return originAllowed ? new Response(null, { status: 204, headers: cors }) : json(403, { ok: false, error: 'origin_not_allowed' }, cors)
  }
  if (!originAllowed) return json(403, { ok: false, error: 'origin_not_allowed' }, cors)
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, { ...cors, Allow: 'POST, OPTIONS' })
  if (!(req.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false, error: 'unsupported_media_type' }, cors)
  }

  let body: unknown
  try {
    const raw = await req.text()
    if (new TextEncoder().encode(raw).length > MAX_LOOKUP_BYTES) return json(413, { ok: false, error: 'payload_too_large' }, cors)
    body = JSON.parse(raw)
  } catch {
    return json(400, { ok: false, error: 'invalid_request' }, cors)
  }

  try {
    if (!(await deps.consumeRateLimit(req))) {
      log('rejected', { reason: 'rate_limited' })
      return json(429, { ok: false, error: 'rate_limited' }, { ...cors, 'Retry-After': '600' })
    }

    const input = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
    const keys = input ? Object.keys(input).sort().join(',') : ''
    const reference = typeof input?.reference === 'string' ? input.reference.trim().toUpperCase() : ''
    const phone = typeof input?.phone === 'string' ? normalizePhone(input.phone) : null
    if (keys !== 'phone,reference' || !REFERENCE_RE.test(reference) || !phone) {
      log('rejected', { reason: 'invalid_request' })
      return json(400, { ok: false, error: 'invalid_request' }, cors)
    }

    const found = await deps.find(reference, phone)
    log(found ? 'found' : 'not_found')
    return found ? json(200, { ok: true, reservation: found }, cors) : json(404, { ok: false, error: 'not_found' }, cors)
  } catch (error) {
    log('failed', { reason: error instanceof Error ? error.name : 'unknown' })
    return json(500, { ok: false, error: 'server_error' }, cors)
  }
}
