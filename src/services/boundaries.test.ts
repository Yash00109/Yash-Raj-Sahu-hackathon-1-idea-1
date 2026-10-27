import { describe, expect, it, vi } from 'vitest'
import { readBackendConfig, type ConfigState } from '../config'
import {
  AVAILABILITY_PATH,
  CREATE_RESERVATION_PATH,
  fetchAvailability,
  LOOKUP_RESERVATION_PATH,
  lookupReservation,
  submitReservationRequest,
} from './reservationService'

const fakeJwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`

describe('readBackendConfig', () => {
  it('treats absent configuration as "online requests unavailable"', () => {
    expect(readBackendConfig({})).toEqual({ ok: false, problem: 'missing' })
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co' })).toEqual({ ok: false, problem: 'missing' })
  })

  it('accepts a publishable key and normalizes the URL', () => {
    expect(readBackendConfig({ PROD: true, VITE_SUPABASE_URL: 'https://abc.supabase.co/', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' })).toEqual({
      ok: true,
      config: { url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_abc' },
    })
  })

  it('accepts a legacy anon JWT', () => {
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: fakeJwt('anon') }).ok).toBe(true)
  })

  it.each([
    ['an sb_secret key', { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc' }],
    ['a service_role JWT', { VITE_SUPABASE_ANON_KEY: fakeJwt('service_role') }],
  ])('refuses %s in the browser', (_label, key) => {
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co', ...key })).toEqual({ ok: false, problem: 'secret_key_in_browser' })
  })

  it('refuses localhost in a production build and plain http to a remote host', () => {
    expect(readBackendConfig({ PROD: true, VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toEqual({
      ok: false,
      problem: 'localhost_in_production',
    })
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'http://abc.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toEqual({ ok: false, problem: 'invalid_url' })
    expect(readBackendConfig({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }).ok).toBe(true)
  })
})

describe('submitReservationRequest', () => {
  const config: ConfigState = { ok: true, config: { url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_x' } }
  const respond = (status: number, body?: unknown) =>
    vi.fn().mockResolvedValue(new Response(body === undefined ? 'gateway error' : JSON.stringify(body), { status }))

  it('posts JSON with only the publishable key to the create-reservation function', async () => {
    const fetchImpl = respond(201, { ok: true, reservation: { reference: 'IT-ABC123', status: 'pending' } })
    const outcome = await submitReservationRequest({ name: 'A' }, { config, fetchImpl })
    expect(outcome).toEqual({ kind: 'created', reference: 'IT-ABC123', replayed: false })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://abc.supabase.co' + CREATE_RESERVATION_PATH)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', apikey: 'sb_publishable_x' })
    expect(JSON.parse(init.body)).toEqual({ name: 'A' })
  })

  it.each([
    [200, { ok: true, reservation: { reference: 'IT-ABC123' }, replayed: true }, { kind: 'created', reference: 'IT-ABC123', replayed: true }],
    [400, { ok: false, error: 'validation_failed', fields: [{ field: 'phone', code: 'phone_invalid' }] }, { kind: 'invalid', errors: [{ field: 'phone', code: 'phone_invalid' }] }],
    [400, { ok: false, error: 'invalid_json' }, { kind: 'server_error' }],
    [429, { ok: false, error: 'rate_limited' }, { kind: 'rate_limited' }],
    [500, { ok: false, error: 'server_error' }, { kind: 'server_error' }],
    [502, undefined, { kind: 'server_error' }],
    [201, { ok: true }, { kind: 'server_error' }],
  ])('maps HTTP %i responses', async (status, body, expected) => {
    expect(await submitReservationRequest({}, { config, fetchImpl: respond(status, body) })).toEqual(expected)
  })

  it('reports network failures and timeouts as network errors', async () => {
    expect(await submitReservationRequest({}, { config, fetchImpl: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) })).toEqual({ kind: 'network_error' })
    const hanging = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))))
    expect(await submitReservationRequest({}, { config, fetchImpl: hanging as never, timeoutMs: 10 })).toEqual({ kind: 'network_error' })
  })

  it('does not call the network when the backend is not configured', async () => {
    const fetchImpl = vi.fn()
    expect(await submitReservationRequest({}, { config: { ok: false, problem: 'missing' }, fetchImpl })).toEqual({ kind: 'unavailable' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('fetchAvailability', () => {
  const config: ConfigState = { ok: true, config: { url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_x' } }
  const respond = (status: number, body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

  it('asks the availability function with the publishable key only and keeps well-formed slots', async () => {
    const fetchImpl = respond(200, [{ slot_time: '13:30', available: true }, { slot_time: '14:00', available: false }, { slot_time: 'bad' }])
    expect(await fetchAvailability('2030-05-02', 4, { config, fetchImpl })).toEqual({
      kind: 'ok',
      slots: [{ time: '13:30', available: true }, { time: '14:00', available: false }],
    })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://abc.supabase.co' + AVAILABILITY_PATH)
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', apikey: 'sb_publishable_x' })
    expect(JSON.parse(init.body)).toEqual({ p_date: '2030-05-02', p_party_size: 4 })
  })

  it('treats errors and odd bodies as an error, and an unconfigured backend as unavailable', async () => {
    expect(await fetchAvailability('2030-05-02', 4, { config, fetchImpl: respond(400, { code: '22023' }) })).toEqual({ kind: 'error' })
    expect(await fetchAvailability('2030-05-02', 4, { config, fetchImpl: respond(200, { not: 'a list' }) })).toEqual({ kind: 'error' })
    expect(await fetchAvailability('2030-05-02', 4, { config, fetchImpl: vi.fn().mockRejectedValue(new TypeError('offline')) })).toEqual({ kind: 'error' })
    const fetchImpl = vi.fn()
    expect(await fetchAvailability('2030-05-02', 4, { config: { ok: false, problem: 'missing' }, fetchImpl })).toEqual({ kind: 'unavailable' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('maps a 409 from create-reservation to slot_unavailable', async () => {
    expect(await submitReservationRequest({}, { config, fetchImpl: respond(409, { ok: false, error: 'slot_unavailable' }) })).toEqual({ kind: 'slot_unavailable' })
  })
})

describe('lookupReservation', () => {
  const config: ConfigState = { ok: true, config: { url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_x' } }
  const respond = (status: number, body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  const found = { reference: 'IT-1A2B3C4D5E6F', date: '2030-05-02', time: '13:30', partySize: 4, status: 'confirmed' }

  it('posts reference and phone to the lookup function and keeps only the expected fields', async () => {
    const fetchImpl = respond(200, { ok: true, reservation: { ...found, notes: 'should not pass through' } })
    expect(await lookupReservation('IT-1A2B3C4D5E6F', '+34600111222', { config, fetchImpl })).toEqual({ kind: 'found', reservation: found })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://abc.supabase.co' + LOOKUP_RESERVATION_PATH)
    expect(JSON.parse(init.body)).toEqual({ reference: 'IT-1A2B3C4D5E6F', phone: '+34600111222' })
  })

  it.each([
    [404, { ok: false, error: 'not_found' }, 'not_found'],
    [400, { ok: false, error: 'invalid_request' }, 'invalid'],
    [429, { ok: false, error: 'rate_limited' }, 'rate_limited'],
    [500, { ok: false, error: 'server_error' }, 'error'],
    [200, { ok: true, reservation: { ...found, status: 'archived' } }, 'error'],
  ])('maps HTTP %i to %s', async (status, body, kind) => {
    expect(await lookupReservation('IT-1A2B3C4D5E6F', '+34600111222', { config, fetchImpl: respond(status, body) })).toEqual({ kind })
  })
})
