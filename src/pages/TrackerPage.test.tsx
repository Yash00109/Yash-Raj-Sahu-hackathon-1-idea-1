import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ConfigState } from '../config'
import { availability } from '../i18n/availability'
import { copy, languages, type Lang } from '../i18n/copy'
import { site } from '../i18n/site'
import type { LookupOutcome } from '../services/reservationService'
import { TrackerPage } from './TrackerPage'

const ONLINE: ConfigState = { ok: true, config: { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' } }
const OFFLINE: ConfigState = { ok: false, problem: 'missing' }
const FOUND: LookupOutcome = { kind: 'found', reservation: { reference: 'IT-1A2B3C4D5E6F', date: '2030-05-02', time: '13:30', partySize: 4, status: 'pending' } }

function renderTracker(lang: Lang, lookup: ReturnType<typeof vi.fn>, config: ConfigState = ONLINE) {
  render(
    <MemoryRouter>
      <TrackerPage t={copy[lang]} s={site[lang]} lang={lang} config={config} lookup={lookup as never} />
    </MemoryRouter>,
  )
  const c = availability[lang].tracker
  const check = async (reference: string, phone: string) => {
    fireEvent.change(screen.getByLabelText(c.reference), { target: { value: reference } })
    fireEvent.change(screen.getByLabelText(c.phone), { target: { value: phone } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: c.submit }))
    })
  }
  return { c, check }
}

describe.each(languages.map((l) => l.code))('booking tracker in %s', (lang) => {
  it('shows only the reference, date, time, party size and status of a match', async () => {
    const lookup = vi.fn().mockResolvedValue(FOUND)
    const { c, check } = renderTracker(lang, lookup)
    screen.getByRole('heading', { level: 1, name: c.title })
    await check(' it-1a2b3c4d5e6f ', '+34 600 111 222')

    expect(lookup).toHaveBeenCalledWith('IT-1A2B3C4D5E6F', '+34600111222', { config: ONLINE })
    const result = screen.getByRole('status')
    expect([...result.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual([c.reference, c.date, c.time, c.guests, c.status])
    expect(result.textContent).toContain('IT-1A2B3C4D5E6F')
    expect(result.textContent).toContain(c.statuses.pending)
    expect(result.textContent).toContain(c.pendingNote)
  })

  it.each([
    ['not_found', 'notFound'],
    ['rate_limited', 'rateLimited'],
    ['error', 'error'],
  ] as const)('explains a %s answer without showing any reservation', async (kind, key) => {
    const { c, check } = renderTracker(lang, vi.fn().mockResolvedValue({ kind }))
    await check('IT-1A2B3C4D5E6F', '+34600111222')
    expect(screen.getByRole('alert').textContent).toBe(c[key])
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('booking tracker input handling', () => {
  it('rejects malformed references and phones without calling the server', async () => {
    const lookup = vi.fn()
    const { c, check } = renderTracker('en', lookup)
    await check('IT-12', '+34600111222')
    expect(screen.getByRole('alert').textContent).toBe(c.invalid)
    await check('IT-1A2B3C4D5E6F', '12')
    expect(screen.getByRole('alert').textContent).toBe(c.invalid)
    expect(lookup).not.toHaveBeenCalled()
  })

  it('accepts the older 8-character references', async () => {
    const lookup = vi.fn().mockResolvedValue(FOUND)
    const { check } = renderTracker('en', lookup)
    await check('IT-1A2B3C4D', '600111222')
    expect(lookup).toHaveBeenCalledWith('IT-1A2B3C4D', '600111222', { config: ONLINE })
  })

  it('offers the phone number instead of a form when the backend is not configured', () => {
    const { c } = renderTracker('eu', vi.fn(), OFFLINE)
    expect(screen.queryByRole('button', { name: c.submit })).toBeNull()
    screen.getByText(c.unavailable, { exact: false })
  })

  it('has the same keys and no empty strings in every language', () => {
    const flatten = (value: unknown, path = ''): string[] =>
      value && typeof value === 'object' ? Object.entries(value).flatMap(([k, v]) => flatten(v, `${path}.${k}`)) : [`${path}=${String(value).length > 0}`]
    const expected = flatten(availability.en)
    for (const { code } of languages) expect(flatten(availability[code])).toEqual(expected)
    expect(expected.every((entry) => entry.endsWith('=true'))).toBe(true)
  })
})
