import { describe, expect, it, vi } from 'vitest'
import { handleLookup, MAX_LOOKUP_BYTES, type LookupDeps } from '../../supabase/functions/lookup-reservation/handler.ts'

const ORIGIN = 'https://iturrieta.example'
const FOUND = { reference: 'IT-1A2B3C4D5E6F', date: '2030-05-02', time: '13:30', partySize: 4, status: 'pending' }

function setup(overrides: Partial<LookupDeps> = {}) {
  const log = vi.fn()
  const deps: LookupDeps = {
    allowedOrigins: [ORIGIN],
    find: vi.fn().mockResolvedValue(FOUND),
    consumeRateLimit: vi.fn().mockResolvedValue(true),
    log,
    ...overrides,
  }
  return { deps, log }
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://fn.local/lookup-reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('lookup-reservation handler', () => {
  it('normalizes the input and returns only the minimal booking fields', async () => {
    const { deps } = setup()
    const response = await handleLookup(post({ reference: ' it-1a2b3c4d5e6f ', phone: '+34 600 111 222' }), deps)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, reservation: FOUND })
    expect(deps.find).toHaveBeenCalledWith('IT-1A2B3C4D5E6F', '+34600111222')
  })

  it('answers an unknown reference and a wrong phone with the same 404', async () => {
    const { deps } = setup({ find: vi.fn().mockResolvedValue(null) })
    const a = await handleLookup(post({ reference: 'IT-1A2B3C4D5E6F', phone: '+34600111222' }), deps)
    const b = await handleLookup(post({ reference: 'IT-FFFFFFFFFFFF', phone: '+34699999999' }), deps)
    expect([a.status, b.status]).toEqual([404, 404])
    expect(await a.text()).toBe(await b.text())
  })

  it.each([
    [{ reference: 'IT-12', phone: '+34600111222' }],
    [{ reference: 'XX-1A2B3C4D5E6F', phone: '+34600111222' }],
    [{ reference: 'IT-1A2B3C4D5E6F', phone: '12' }],
    [{ reference: 'IT-1A2B3C4D5E6F' }],
    [{ reference: 'IT-1A2B3C4D5E6F', phone: '+34600111222', id: 'x' }],
    [['IT-1A2B3C4D5E6F']],
    ['{"reference":'],
  ])('rejects malformed input %j without looking anything up', async (body) => {
    const { deps } = setup()
    const response = await handleLookup(post(body), deps)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'invalid_request' })
    expect(deps.find).not.toHaveBeenCalled()
  })

  it('counts every well-formed JSON attempt against the rate limit, valid or not', async () => {
    const { deps } = setup({ consumeRateLimit: vi.fn().mockResolvedValue(false) })
    expect((await handleLookup(post({ reference: 'IT-12', phone: '1' }), deps)).status).toBe(429)
    expect((await handleLookup(post({ reference: 'IT-1A2B3C4D5E6F', phone: '+34600111222' }), deps)).status).toBe(429)
    expect(deps.find).not.toHaveBeenCalled()
  })

  it('refuses other origins, wrong methods, content types and oversized bodies', async () => {
    const { deps } = setup()
    expect((await handleLookup(post({}, { Origin: 'https://evil.example' }), deps)).status).toBe(403)
    expect((await handleLookup(new Request('https://fn.local/x', { headers: { Origin: ORIGIN } }), deps)).status).toBe(405)
    expect((await handleLookup(post({}, { 'Content-Type': 'text/plain' }), deps)).status).toBe(415)
    expect((await handleLookup(post({ reference: 'x'.repeat(MAX_LOOKUP_BYTES) }), deps)).status).toBe(413)
  })

  it('hides lookup failures behind a generic 500 and never logs the reference or phone', async () => {
    const { deps, log } = setup({ find: vi.fn().mockRejectedValue(new Error('IT-1A2B3C4D5E6F +34600111222')) })
    const response = await handleLookup(post({ reference: 'IT-1A2B3C4D5E6F', phone: '+34600111222' }), deps)
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('{"ok":false,"error":"server_error"}')
    const logged = JSON.stringify(log.mock.calls)
    expect(logged).not.toContain('1A2B3C4D5E6F')
    expect(logged).not.toContain('600111222')
  })
})
