// Deno entry point for the lookup-reservation Edge Function (guest booking tracker).
// The service-role key is read from the function environment only; it never leaves this runtime.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseOrigins, sha256Hex } from '../_shared/http.ts'
import { handleLookup } from './handler.ts'

// Lookups are cheap to attempt, so the budget is per client plus a global cap that bounds
// enumeration attempts even when X-Forwarded-For is spoofed.
const RATE_LIMIT = { perClient: 10, global: 300, windowSeconds: 600 }

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT')
const allowedOrigins = parseOrigins(Deno.env.get('ALLOWED_ORIGINS'))

const admin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null

const log = (event: string, detail: Record<string, string | number | boolean> = {}) =>
  console.log(JSON.stringify({ fn: 'lookup-reservation', event, ...detail }))

Deno.serve((req) => {
  if (!admin || !rateLimitSalt || allowedOrigins.length === 0) {
    log('misconfigured', { hasClient: !!admin, hasSalt: !!rateLimitSalt, origins: allowedOrigins.length })
    return Response.json({ ok: false, error: 'server_error' }, { status: 500 })
  }

  return handleLookup(req, {
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
      return (await consume(`lookup-ip:${ip}`, RATE_LIMIT.perClient)) && (await consume('lookup-global', RATE_LIMIT.global))
    },
    async find(reference, phone) {
      const { data, error } = await admin.rpc('lookup_reservation', { p_reference: reference, p_phone: phone })
      if (error) throw new Error('lookup_failed')
      const row = Array.isArray(data) ? data[0] : null
      return row
        ? { reference: row.reference, date: row.reservation_date, time: row.reservation_time, partySize: row.party_size, status: row.status }
        : null
    },
  })
})
