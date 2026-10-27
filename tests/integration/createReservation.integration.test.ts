import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { madridDate } from './localDb'
import { readLocalStack, rest, type LocalStack } from './localStack'

const ORIGIN = 'http://localhost:5180'
let stack: LocalStack
let endpoint: string

// A bookable slot inside the configured booking window; spread across dates so repeated
// runs never fill one slot.
let requestDate: string
// Wide random range so repeated runs never share a rate-limit bucket.
const octet = () => Math.floor(Math.random() * 250) + 1
const randomIp = () => `${100 + octet() % 50}.${octet()}.${octet()}.${octet()}`
const body = (overrides: Record<string, unknown> = {}) => ({
  name: 'Integration Guest',
  phone: '+34 600 111 222',
  date: requestDate,
  time: '20:30',
  partySize: 2,
  seating: 'indoor',
  language: 'de',
  notes: 'Integration test',
  requestId: randomUUID(),
  ...overrides,
})

/** Each call gets its own client address so tests do not share a rate-limit bucket. */
const submit = (payload: unknown, headers: Record<string, string> = {}) =>
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      apikey: stack.anonKey,
      'X-Forwarded-For': `${randomIp()}, 10.0.0.${Math.floor(Math.random() * 250)}`,
      ...headers,
    },
    body: JSON.stringify(payload),
  })

const rowsFor = async (requestId: string) =>
  (await rest(stack, `reservations?request_id=eq.${requestId}&select=reference,status,source,created_by,guest_name,phone,preferred_language,notes`, stack.serviceRoleKey)).body

beforeAll(() => {
  stack = readLocalStack()
  endpoint = `${stack.url}/functions/v1/create-reservation`
  requestDate = madridDate(90 + Math.floor(Math.random() * 60))
})

describe('create-reservation on the local stack', () => {
  // The local API gateway answers preflight requests itself (with "*"), so the function's own
  // preflight handling is covered by unit tests and the hosted smoke test, not here.
  it('accepts a browser preflight from the site origin', async () => {
    const allowed = await fetch(endpoint, { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST' } })
    expect(allowed.ok).toBe(true)
  })

  it('stores nothing for a POST from a disallowed origin', async () => {
    const payload = body()
    const response = await submit(payload, { Origin: 'https://evil.example' })
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ ok: false, error: 'origin_not_allowed' })
    expect(await rowsFor(payload.requestId)).toEqual([])
  })

  it('stores a valid request as a pending website reservation', async () => {
    const payload = body()
    const response = await submit(payload)
    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result).toMatchObject({ ok: true, replayed: false, reservation: { status: 'pending' } })
    expect(result.reservation.reference).toMatch(/^IT-[0-9A-F]{12}$/)
    expect(await rowsFor(payload.requestId)).toEqual([
      {
        reference: result.reservation.reference,
        status: 'pending',
        source: 'website',
        created_by: null,
        guest_name: 'Integration Guest',
        phone: '+34600111222',
        preferred_language: 'de',
        notes: 'Integration test',
      },
    ])
  })

  it('refuses a time that is not an offered slot, as a field error on time', async () => {
    const payload = body({ time: '16:15' })
    const response = await submit(payload)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'validation_failed', fields: [{ field: 'time', code: 'slot_not_offered' }] })
    expect(await rowsFor(payload.requestId)).toEqual([])
  })

  it('replays a retried requestId instead of creating a duplicate', async () => {
    const payload = body()
    const first = await (await submit(payload)).json()
    const retry = await submit(payload)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toMatchObject({ ok: true, replayed: true, reservation: { reference: first.reservation.reference } })
    expect(await rowsFor(payload.requestId)).toHaveLength(1)
  })

  it('refuses client-chosen status and invalid fields without storing anything', async () => {
    const forged = body({ status: 'confirmed' })
    expect((await submit(forged)).status).toBe(400)
    const invalid = body({ partySize: 91, phone: 'abc' })
    const response = await submit(invalid)
    expect(response.status).toBe(400)
    expect((await response.json()).fields.map((f: { code: string }) => f.code).sort()).toEqual(['party_size_too_large', 'phone_invalid'])
    expect(await rowsFor(forged.requestId)).toEqual([])
    expect(await rowsFor(invalid.requestId)).toEqual([])
  })

  it('rejects disallowed origins and malformed JSON', async () => {
    expect((await submit(body(), { Origin: 'https://evil.example' })).status).toBe(403)
    const malformed = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN }, body: '{"name":' })
    expect(malformed.status).toBe(400)
    expect(await malformed.json()).toEqual({ ok: false, error: 'invalid_json' })
  })

  it('rate-limits repeated requests from one client', async () => {
    const client = { 'X-Forwarded-For': randomIp() }
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) statuses.push((await submit(body(), client)).status)
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429])
  })
})

describe('direct database access with the public key', () => {
  it('cannot read reservations', async () => {
    const response = await rest(stack, 'reservations?select=id', stack.anonKey)
    expect(response.status === 401 || response.status === 403 || (response.status === 200 && response.body.length === 0)).toBe(true)
  })

  it('cannot insert, update or delete reservations', async () => {
    const insert = await rest(stack, 'reservations', stack.anonKey, {
      method: 'POST',
      body: JSON.stringify({ guest_name: 'Xa', phone: '+34600000000', reservation_date: '2030-01-01', reservation_time: '13:00', party_size: 2, seating_preference: 'indoor', preferred_language: 'es', status: 'confirmed' }),
    })
    expect([401, 403]).toContain(insert.status)
    const update = await rest(stack, 'reservations?id=not.is.null', stack.anonKey, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })
    expect([401, 403]).toContain(update.status)
    const remove = await rest(stack, 'reservations?id=not.is.null', stack.anonKey, { method: 'DELETE' })
    expect([401, 403]).toContain(remove.status)
  })

  it('cannot call the rate-limit or staff functions', async () => {
    const rateLimit = await rest(stack, 'rpc/consume_rate_limit', stack.anonKey, { method: 'POST', body: JSON.stringify({ p_bucket: 'x'.repeat(64), p_limit: 1, p_window_seconds: 1 }) })
    expect([401, 403, 404]).toContain(rateLimit.status)
    const status = await rest(stack, 'rpc/staff_set_reservation_status', stack.anonKey, { method: 'POST', body: JSON.stringify({ p_reservation_id: randomUUID(), p_status: 'confirmed' }) })
    expect([401, 403, 404]).toContain(status.status)
  })
})
