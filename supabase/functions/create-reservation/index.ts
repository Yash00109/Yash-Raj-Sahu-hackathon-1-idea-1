// Deno entry point for the create-reservation Edge Function.
// The service-role key is read from the function environment only; it never leaves this runtime.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseOrigins, sha256Hex } from '../_shared/http.ts'
import { handleCreateReservation, type SlotRefusal, type StoredReservation } from './handler.ts'

// The per-client key comes from X-Forwarded-For, which a caller can partly spoof, so a
// global budget caps the total number of stored requests as well.
const RATE_LIMIT = { perClient: 5, global: 200, windowSeconds: 600 }

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT')
const allowedOrigins = parseOrigins(Deno.env.get('ALLOWED_ORIGINS'))

const admin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null

const log = (event: string, detail: Record<string, string | number | boolean> = {}) =>
  console.log(JSON.stringify({ fn: 'create-reservation', event, ...detail }))

Deno.serve((req) => {
  if (!admin || !rateLimitSalt || allowedOrigins.length === 0) {
    log('misconfigured', { hasClient: !!admin, hasSalt: !!rateLimitSalt, origins: allowedOrigins.length })
    return Response.json({ ok: false, error: 'server_error' }, { status: 500 })
  }

  return handleCreateReservation(req, {
    allowedOrigins,
    log,
    async consumeRateLimit(request) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      const consume = async (key: string, limit: number) => {
        const { data, error } = await admin.rpc('consume_rate_limit', {
          p_bucket: await sha256Hex(`${rateLimitSalt}:${key}`),
          p_limit: limit,
          p_window_seconds: RATE_LIMIT.windowSeconds,
        })
        if (error) throw new Error('rate_limit_failed')
        return data === true
      }
      return (await consume(`ip:${ip}`, RATE_LIMIT.perClient)) && (await consume('global', RATE_LIMIT.global))
    },
    // Capacity check, idempotency and insert happen atomically inside the database function.
    async store(request): Promise<StoredReservation | SlotRefusal> {
      const { data, error } = await admin.rpc('create_website_reservation', {
        p_request_id: request.requestId ?? crypto.randomUUID(),
        p_guest_name: request.name,
        p_phone: request.phone,
        p_reservation_date: request.date,
        p_reservation_time: request.time,
        p_party_size: request.partySize,
        p_seating_preference: request.seating,
        p_preferred_language: request.language,
        p_notes: request.notes,
      })
      if (error?.message === 'slot_unavailable' || error?.message === 'slot_not_offered') return error.message
      const row = Array.isArray(data) ? data[0] : null
      if (error || !row) throw new Error('insert_failed')
      return { reference: row.reference, status: row.status, replayed: row.replayed === true }
    },
  })
})
