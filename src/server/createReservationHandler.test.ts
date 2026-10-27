import { describe, expect, it, vi } from 'vitest'
import { handleCreateReservation, MAX_BODY_BYTES, type CreateReservationDeps } from '../../supabase/functions/create-reservation/handler.ts'

const ORIGIN = 'https://iturrieta.example'
const NOW = new Date('2026-05-01T10:00:00Z')

const validBody = {
  name: '  Miren   Etxeberria ',
  phone: '+34 600 000 000',
  date: '2026-05-02',
  time: '13:30',
  partySize: 4,
  seating: 'terrace',
  language: 'eu',
  notes: '',
  requestId: '3f1c2b9e-8a4d-4c3b-9e2f-1a2b3c4d5e6f',
}

function setup(overrides: Partial<CreateReservationDeps> = {}) {
  const log = vi.fn()
  const deps: CreateReservationDeps = {
    allowedOrigins: [ORIGIN],
    store: vi.fn().mockResolvedValue({ reference: 'IT-0A1B2C3D', status: 'pending', replayed: false }),
    consumeRateLimit: vi.fn().mockResolvedValue(true),
    now: () => NOW,
    log,
    ...overrides,
  }
  return { deps, log }
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://fn.local/create-reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('create-reservation handler', () => {
  it('stores a normalized pending website request and returns only the reference', async () => {
    const { deps } = setup()
    const response = await handleCreateReservation(post(validBody), deps)
    expect(response.status).toBe(201)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ ok: true, reservation: { reference: 'IT-0A1B2C3D', status: 'pending' }, replayed: false })
    expect(deps.store).toHaveBeenCalledWith({
      name: 'Miren Etxeberria',
      phone: '+34600000000',
      date: '2026-05-02',
      time: '13:30',
      partySize: 4,
      seating: 'terrace',
      language: 'eu',
      notes: null,
      requestId: validBody.requestId,
    })
  })

  it('answers a replayed requestId with 200 and the original reference', async () => {
    const { deps } = setup({ store: vi.fn().mockResolvedValue({ reference: 'IT-0A1B2C3D', status: 'pending', replayed: true }) })
    const response = await handleCreateReservation(post(validBody), deps)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, replayed: true })
  })

  it.each([
    ['status', 'confirmed'],
    ['source', 'phone'],
    ['created_by', '00000000-0000-0000-0000-000000000000'],
    ['id', '00000000-0000-0000-0000-000000000000'],
  ])('refuses a client-supplied %s field', async (field, value) => {
    const { deps } = setup()
    const response = await handleCreateReservation(post({ ...validBody, [field]: value }), deps)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ ok: false, error: 'validation_failed', fields: [{ field: '_request', code: 'unknown_field' }] })
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('returns field errors for invalid input without storing anything', async () => {
    const { deps } = setup()
    const response = await handleCreateReservation(post({ ...validBody, date: '2026-04-30', partySize: 91, phone: '12' }), deps)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.fields.map((f: { code: string }) => f.code).sort()).toEqual(['date_in_past', 'party_size_too_large', 'phone_invalid'])
    expect(deps.store).not.toHaveBeenCalled()
    expect(deps.consumeRateLimit).not.toHaveBeenCalled()
  })

  it('handles malformed JSON, wrong content type, oversized bodies and wrong methods', async () => {
    const { deps } = setup()
    expect((await handleCreateReservation(post('{"name":'), deps)).status).toBe(400)
    expect(await (await handleCreateReservation(post('[]'), deps)).json()).toMatchObject({ error: 'validation_failed' })
    expect((await handleCreateReservation(post(validBody, { 'Content-Type': 'text/plain' }), deps)).status).toBe(415)
    expect((await handleCreateReservation(post({ ...validBody, notes: 'x'.repeat(MAX_BODY_BYTES) }), deps)).status).toBe(413)
    const get = await handleCreateReservation(new Request('https://fn.local/create-reservation', { headers: { Origin: ORIGIN } }), deps)
    expect(get.status).toBe(405)
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('answers CORS preflight only for allowed origins and refuses other origins', async () => {
    const { deps } = setup()
    const preflight = await handleCreateReservation(new Request('https://fn.local/x', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), deps)
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(preflight.headers.get('Access-Control-Allow-Headers')).toContain('apikey')

    const evil = 'https://evil.example'
    const badPreflight = await handleCreateReservation(new Request('https://fn.local/x', { method: 'OPTIONS', headers: { Origin: evil } }), deps)
    expect(badPreflight.status).toBe(403)
    expect(badPreflight.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect((await handleCreateReservation(post(validBody, { Origin: evil }), deps)).status).toBe(403)
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('answers 409 when the database refuses a full slot', async () => {
    const { deps } = setup({ store: vi.fn().mockResolvedValue('slot_unavailable') })
    const response = await handleCreateReservation(post(validBody), deps)
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ ok: false, error: 'slot_unavailable' })
  })

  it('reports a time that is not an offered slot as a field error on time', async () => {
    const { deps } = setup({ store: vi.fn().mockResolvedValue('slot_not_offered') })
    const response = await handleCreateReservation(post(validBody), deps)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'validation_failed', fields: [{ field: 'time', code: 'slot_not_offered' }] })
  })

  it('returns 429 when the rate limit is exhausted', async () => {
    const { deps } = setup({ consumeRateLimit: vi.fn().mockResolvedValue(false) })
    const response = await handleCreateReservation(post(validBody), deps)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('600')
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('hides storage failures behind a generic 500', async () => {
    const { deps } = setup({ store: vi.fn().mockRejectedValue(new Error('duplicate key value violates "reservations_pkey" +34600000000')) })
    const response = await handleCreateReservation(post(validBody), deps)
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('{"ok":false,"error":"server_error"}')
  })

  it('never writes guest personal data to logs', async () => {
    const { deps, log } = setup()
    await handleCreateReservation(post(validBody), deps)
    await handleCreateReservation(post({ ...validBody, phone: '12', notes: 'allergic to nuts' }), deps)
    const logged = JSON.stringify(log.mock.calls)
    for (const secret of ['Miren', 'Etxeberria', '600000000', '600 000 000', 'allergic', validBody.requestId]) {
      expect(logged).not.toContain(secret)
    }
    expect(log).toHaveBeenCalledWith('created', expect.any(Object))
  })
})
