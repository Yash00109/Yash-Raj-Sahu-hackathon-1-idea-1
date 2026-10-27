import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ConfigState } from '../config'
import { availability } from '../i18n/availability'
import { booking } from '../i18n/booking'
import { copy, type Lang } from '../i18n/copy'
import type { AvailabilityOutcome, SubmitOutcome } from '../services/reservationService'
import { Reservation } from './Reservation'

const inRouter = (ui: ReactElement) => <MemoryRouter>{ui}</MemoryRouter>
const SLOTS: AvailabilityOutcome = {
  kind: 'ok',
  slots: [
    { time: '13:30', available: true },
    { time: '14:00', available: false },
    { time: '20:30', available: true },
  ],
}
const a = availability.en.slots

const t = copy.en.reserve
const b = booking.en
const OFFLINE: ConfigState = { ok: false, problem: 'missing' }
const ONLINE: ConfigState = { ok: true, config: { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' } }
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

type Fields = Partial<Record<'date' | 'time' | 'guests' | 'name' | 'phone' | 'notes', string>>
const VALID: Fields = { date: '2030-05-02', time: '13:30', guests: '4', name: '  Rishi Test  ', phone: ' 600 000 000 ' }

function renderForm({
  lang = 'en' as Lang,
  config = OFFLINE,
  submit,
  loadAvailability = vi.fn().mockResolvedValue(SLOTS),
}: { lang?: Lang; config?: ConfigState; submit?: ReturnType<typeof vi.fn>; loadAvailability?: ReturnType<typeof vi.fn> } = {}) {
  const view = render(inRouter(<Reservation t={copy[lang]} lang={lang} config={config} submit={submit as never} loadAvailability={loadAvailability as never} />))
  const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement
  /** Online, the time is picked from the offered slots once they have loaded (if any are offered). */
  const fill = async (values: Fields) => {
    const labels = { date: t.form.date, time: t.form.time, guests: t.form.guests, name: t.form.name, phone: t.form.phone, notes: t.form.notes }
    for (const [key, value] of Object.entries(values)) {
      if (key === 'time' && config.ok) continue
      fireEvent.change(input(labels[key as keyof typeof labels]), { target: { value } })
    }
    if (values.time && config.ok) {
      const slot = await screen.findByRole('radio', { name: values.time }, { timeout: 300 }).catch(() => null)
      if (slot) fireEvent.click(slot)
    }
  }
  const submitButton = () => screen.getByRole('button', { name: config.ok ? b.submit : t.form.submit })
  const send = async () => {
    await act(async () => {
      fireEvent.click(submitButton())
    })
  }
  const preview = () => view.container.querySelector('.request-card__preview') as HTMLElement
  const seatPhoto = (alt: string) => screen.getByAltText(alt).closest('.seat-photo') as HTMLElement
  const whatsappText = () => {
    const href = screen.getByRole('link', { name: new RegExp(t.summary.whatsapp) }).getAttribute('href') ?? ''
    return decodeURIComponent(href.split('text=')[1] ?? '')
  }
  const fieldErrors = () => [...view.container.querySelectorAll('.field__error')].map((el) => el.textContent)
  return { ...view, input, fill, send, submitButton, preview, seatPhoto, whatsappText, fieldErrors }
}

describe('Reservation form without a configured backend', () => {
  it('rejects whitespace-only name and phone and keeps the other values', async () => {
    const form = renderForm()
    fireEvent.click(screen.getByRole('radio', { name: t.form.terrace }))
    await form.fill({ date: '2030-05-02', time: '13:30', guests: '5', name: '   ', phone: ' \t ', notes: 'Window seat' })

    await form.send()

    expect(screen.queryByRole('heading', { name: t.summary.title })).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain(b.errorSummary)
    expect(form.fieldErrors()).toEqual([b.errors.name_required, b.errors.phone_required])
    expect(form.input(t.form.name).getAttribute('aria-invalid')).toBe('true')
    expect(form.input(t.form.name).getAttribute('aria-describedby')).toContain('name-error')
    expect(form.input(t.form.phone).getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(form.input(t.form.name))
    expect(form.input(t.form.date).value).toBe('2030-05-02')
    expect(form.input(t.form.time).value).toBe('13:30')
    expect(form.input(t.form.guests).value).toBe('5')
    expect(form.input(t.form.notes).value).toBe('Window seat')
    expect((screen.getByRole('radio', { name: t.form.terrace }) as HTMLInputElement).checked).toBe(true)

    await form.fill({ name: 'Rishi' })
    expect(form.fieldErrors()).toEqual([b.errors.phone_required])
  })

  it('prepares a WhatsApp message from trimmed values without sending or storing anything', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const form = renderForm()
    expect(screen.getByText(b.unavailable.body)).toBeTruthy()
    await form.fill(VALID)

    await form.send()

    const summary = screen.getByRole('heading', { name: t.summary.title }).closest('.summary') as HTMLElement
    const values = [...summary.querySelectorAll('dd')].map((dd) => dd.textContent)
    expect(values).toContain('Rishi Test')
    expect(values).toContain('600 000 000')
    expect(values).toContain('English')
    expect(form.whatsappText()).toContain('· Name: Rishi Test\n· Phone: 600 000 000')
    expect(summary.textContent).toContain(t.summary.body)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(window.localStorage.length).toBe(0)
  })

  it('keeps the indoor/terrace preference and the preview image consistent', async () => {
    const form = renderForm()
    expect(form.preview().dataset.seating).toBe('indoor')
    expect(form.seatPhoto(t.form.indoorAlt).getAttribute('aria-hidden')).toBe('false')
    expect(form.seatPhoto(t.form.terraceAlt).getAttribute('aria-hidden')).toBe('true')

    fireEvent.click(screen.getByRole('radio', { name: t.form.terrace }))

    expect(form.preview().dataset.seating).toBe('terrace')
    expect(form.seatPhoto(t.form.indoorAlt).getAttribute('aria-hidden')).toBe('true')
    expect(form.seatPhoto(t.form.terraceAlt).getAttribute('aria-hidden')).toBe('false')

    await form.fill({ ...VALID, name: 'Rishi', phone: '600000000' })
    await form.send()
    expect(form.whatsappText()).toContain(`· Preference: ${t.form.terrace}`)

    fireEvent.click(screen.getByRole('button', { name: t.summary.edit }))
    expect((screen.getByRole('radio', { name: t.form.terrace }) as HTMLInputElement).checked).toBe(true)
    expect(form.preview().dataset.seating).toBe('terrace')
  })
})

describe('Reservation form with the online backend', () => {
  const created: SubmitOutcome = { kind: 'created', reference: 'IT-7K3P9Q', replayed: false }

  it('sends one sanitized request and reports it as pending, not confirmed', async () => {
    const submit = vi.fn().mockResolvedValue(created)
    const form = renderForm({ config: ONLINE, submit })
    expect(screen.getByText(b.onlineNotice)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: t.form.terrace }))
    await form.fill({ ...VALID, notes: '  Near the window ' })

    await form.send()

    expect(submit).toHaveBeenCalledTimes(1)
    const [payload, options] = submit.mock.calls[0]
    expect(payload).toEqual({
      name: '  Rishi Test  ',
      phone: ' 600 000 000 ',
      date: '2030-05-02',
      time: '13:30',
      partySize: 4,
      seating: 'terrace',
      language: 'en',
      notes: '  Near the window ',
      requestId: expect.stringMatching(UUID_RE),
    })
    expect(payload).not.toHaveProperty('status')
    expect(options).toEqual({ config: ONLINE })
    const status = screen.getByRole('status')
    expect(status.textContent).toContain(b.success.title)
    expect(status.textContent).toContain('IT-7K3P9Q')
    expect(status.textContent).toContain(b.success.body)
    expect(status.textContent).not.toMatch(/\bconfirmed booking\b(?! yet)/)
  })

  it.each([
    ['a past date', { date: '2020-01-01' }, 'date_in_past'],
    ['an invalid phone', { phone: 'call me' }, 'phone_invalid'],
    ['zero guests', { guests: '0' }, 'party_size_invalid'],
    ['a fractional guest count', { guests: '2.5' }, 'party_size_invalid'],
    ['more guests than capacity', { guests: '91' }, 'party_size_too_large'],
    ['oversized notes', { notes: 'x'.repeat(501) }, 'notes_too_long'],
  ] as const)('blocks %s before any request is sent', async (_label, override, code) => {
    const submit = vi.fn()
    const form = renderForm({ config: ONLINE, submit })
    await form.fill({ ...VALID, ...override })

    await form.send()

    expect(submit).not.toHaveBeenCalled()
    expect(form.fieldErrors()).toContain(b.errors[code])
  })

  it.each([
    [{ kind: 'server_error' } as SubmitOutcome, b.failure.server],
    [{ kind: 'network_error' } as SubmitOutcome, b.failure.network],
    [{ kind: 'rate_limited' } as SubmitOutcome, b.failure.rateLimited],
  ])('shows a truthful error for %o and keeps the form', async (outcome, message) => {
    const submit = vi.fn().mockResolvedValue(outcome)
    const form = renderForm({ config: ONLINE, submit })
    await form.fill(VALID)

    await form.send()

    expect(screen.getByRole('alert').textContent).toContain(message)
    expect(screen.getByRole('alert').textContent).toContain(b.failure.fallback)
    expect(screen.queryByText(b.success.title)).toBeNull()
    expect(form.input(t.form.name).value).toBe('  Rishi Test  ')
  })

  it('reuses the same request id when retrying after a failure, then issues a new one after success', async () => {
    const submit = vi.fn().mockResolvedValueOnce({ kind: 'network_error' }).mockResolvedValueOnce(created).mockResolvedValueOnce(created)
    const form = renderForm({ config: ONLINE, submit })
    await form.fill(VALID)

    await form.send()
    await form.send()
    expect(submit.mock.calls[1][0].requestId).toBe(submit.mock.calls[0][0].requestId)

    fireEvent.click(screen.getByRole('button', { name: b.success.another }))
    await form.fill(VALID)
    await form.send()
    expect(submit.mock.calls[2][0].requestId).not.toBe(submit.mock.calls[0][0].requestId)
  })

  it('maps field errors returned by the server', async () => {
    const submit = vi.fn().mockResolvedValue({ kind: 'invalid', errors: [{ field: 'phone', code: 'phone_invalid' }] })
    const form = renderForm({ config: ONLINE, submit })
    await form.fill(VALID)

    await form.send()

    expect(screen.getByRole('alert').textContent).toContain(b.failure.rejected)
    expect(form.fieldErrors()).toEqual([b.errors.phone_invalid])
    expect(document.activeElement).toBe(form.input(t.form.phone))
  })

  it('submits only once while a request is in flight', async () => {
    let resolve: (value: SubmitOutcome) => void = () => {}
    const submit = vi.fn().mockReturnValue(new Promise<SubmitOutcome>((r) => (resolve = r)))
    const form = renderForm({ config: ONLINE, submit })
    await form.fill(VALID)

    fireEvent.click(form.submitButton())
    const busy = screen.getByRole('button', { name: b.submitting }) as HTMLButtonElement
    expect(busy.disabled).toBe(true)
    fireEvent.click(busy)
    expect(submit).toHaveBeenCalledTimes(1)

    await act(async () => resolve(created))
    expect(screen.getByRole('status').textContent).toContain(b.success.title)
  })

  it('uses the site language as contact language until the guest picks another', () => {
    const load = vi.fn().mockResolvedValue(SLOTS)
    const submit = vi.fn()
    const view = render(inRouter(<Reservation t={copy.en} lang="en" config={ONLINE} submit={submit} loadAvailability={load} />))
    const select = () => screen.getByLabelText(b.language) as HTMLSelectElement
    expect(select().value).toBe('en')

    view.rerender(inRouter(<Reservation t={copy.fr} lang="fr" config={ONLINE} submit={submit} loadAvailability={load} />))
    expect((screen.getByLabelText(booking.fr.language) as HTMLSelectElement).value).toBe('fr')

    fireEvent.change(screen.getByLabelText(booking.fr.language), { target: { value: 'de' } })
    view.rerender(inRouter(<Reservation t={copy.es} lang="es" config={ONLINE} submit={submit} loadAvailability={load} />))
    expect((screen.getByLabelText(booking.es.language) as HTMLSelectElement).value).toBe('de')
  })
})

describe('Online availability', () => {
  const slotRadios = () => screen.queryAllByRole('radio').filter((r) => (r as HTMLInputElement).name === 'time').map((r) => r.getAttribute('value'))
  const slotStatus = () => document.querySelector('.slots__status')?.textContent

  it('asks for a date and party size first, then offers only the available slots', async () => {
    const load = vi.fn().mockResolvedValue(SLOTS)
    const form = renderForm({ config: ONLINE, submit: vi.fn(), loadAvailability: load })
    fireEvent.change(form.input(t.form.guests), { target: { value: '' } })
    expect(slotStatus()).toBe(a.idle)
    expect(load).not.toHaveBeenCalled()

    fireEvent.change(form.input(t.form.date), { target: { value: '2030-05-02' } })
    fireEvent.change(form.input(t.form.guests), { target: { value: '6' } })
    expect(slotStatus()).toBe(a.loading)
    await waitFor(() => expect(slotRadios()).toEqual(['13:30', '20:30']))
    expect(load).toHaveBeenLastCalledWith('2030-05-02', 6, { config: ONLINE })
    expect(screen.queryByRole('radio', { name: '14:00' })).toBeNull()
  })

  it('clears the chosen time when the date changes', async () => {
    const form = renderForm({ config: ONLINE, submit: vi.fn() })
    await form.fill({ date: '2030-05-02', guests: '2', time: '20:30' })
    expect((screen.getByRole('radio', { name: '20:30' }) as HTMLInputElement).checked).toBe(true)
    fireEvent.change(form.input(t.form.date), { target: { value: '2030-05-03' } })
    await waitFor(() => expect(slotRadios()).toEqual(['13:30', '20:30']))
    expect((screen.getByRole('radio', { name: '20:30' }) as HTMLInputElement).checked).toBe(false)
  })

  it('shows a clear unavailable state when no slot is left', async () => {
    const load = vi.fn().mockResolvedValue({ kind: 'ok', slots: [{ time: '13:30', available: false }] })
    const submit = vi.fn()
    const form = renderForm({ config: ONLINE, submit, loadAvailability: load })
    await form.fill({ ...VALID, time: undefined })
    await waitFor(() => expect(slotStatus()).toBe(a.none))
    expect(slotRadios()).toEqual([])
    await form.send()
    expect(submit).not.toHaveBeenCalled()
    expect(form.fieldErrors()).toContain(b.errors.time_invalid)
  })

  it('reports a failed availability check and lets the guest retry', async () => {
    const load = vi.fn().mockResolvedValueOnce({ kind: 'error' }).mockResolvedValue(SLOTS)
    const form = renderForm({ config: ONLINE, submit: vi.fn(), loadAvailability: load })
    await form.fill({ date: '2030-05-02', guests: '2' })
    await waitFor(() => expect(slotStatus()).toBe(a.error))
    fireEvent.click(screen.getByRole('button', { name: a.retry }))
    await waitFor(() => expect(slotRadios()).toEqual(['13:30', '20:30']))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('when the server says the slot just filled up, explains it and refreshes the slots', async () => {
    const load = vi.fn().mockResolvedValue(SLOTS)
    const submit = vi.fn().mockResolvedValue({ kind: 'slot_unavailable' })
    const form = renderForm({ config: ONLINE, submit, loadAvailability: load })
    await form.fill(VALID)
    load.mockResolvedValue({ kind: 'ok', slots: [{ time: '13:30', available: false }, { time: '20:30', available: true }] })
    await form.send()

    expect(screen.getByRole('alert').textContent).toContain(a.taken)
    await waitFor(() => expect(slotRadios()).toEqual(['20:30']))
    expect(slotRadios().every((v) => !(screen.getByRole('radio', { name: v! }) as HTMLInputElement).checked)).toBe(true)
    expect(form.input(t.form.name).value).toBe('  Rishi Test  ')
  })

  it('offers the booking tracker link when online', () => {
    renderForm({ config: ONLINE, submit: vi.fn() })
    expect(screen.getByRole('link', { name: availability.en.tracker.link }).getAttribute('href')).toBe('/reservations/status')
  })
})
