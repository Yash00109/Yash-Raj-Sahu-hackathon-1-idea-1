import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { copy, type Lang } from '../i18n/copy'
import { Reservation } from './Reservation'

const t = copy.en.reserve

function renderForm(lang: Lang = 'en') {
  const view = render(<Reservation t={copy[lang]} lang={lang} />)
  const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement
  const fill = (values: Partial<Record<'date' | 'time' | 'guests' | 'name' | 'phone' | 'notes', string>>) => {
    const labels = { date: t.form.date, time: t.form.time, guests: t.form.guests, name: t.form.name, phone: t.form.phone, notes: t.form.notes }
    for (const [key, value] of Object.entries(values)) {
      fireEvent.change(input(labels[key as keyof typeof labels]), { target: { value } })
    }
  }
  const submit = () => fireEvent.click(screen.getByRole('button', { name: t.form.submit }))
  const preview = () => view.container.querySelector('.request-card__preview') as HTMLElement
  const seatPhoto = (alt: string) => screen.getByAltText(alt).closest('.seat-photo') as HTMLElement
  const whatsappText = () => {
    const href = screen.getByRole('link', { name: new RegExp(t.summary.whatsapp) }).getAttribute('href') ?? ''
    return decodeURIComponent(href.split('text=')[1] ?? '')
  }
  return { ...view, input, fill, submit, preview, seatPhoto, whatsappText }
}

describe('Reservation prototype form', () => {
  it('rejects whitespace-only name and phone and keeps the other values', () => {
    const form = renderForm()
    fireEvent.click(screen.getByRole('radio', { name: t.form.terrace }))
    form.fill({ date: '2030-05-02', time: '13:30', guests: '5', name: '   ', phone: ' \t ', notes: 'Window seat' })

    form.submit()

    expect(screen.queryByRole('heading', { name: t.summary.title })).toBeNull()
    expect(screen.getAllByRole('alert').map((el) => el.textContent)).toEqual([t.form.nameRequired, t.form.phoneRequired])
    expect(form.input(t.form.name).getAttribute('aria-invalid')).toBe('true')
    expect(form.input(t.form.phone).getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(form.input(t.form.name))
    expect(form.input(t.form.date).value).toBe('2030-05-02')
    expect(form.input(t.form.time).value).toBe('13:30')
    expect(form.input(t.form.guests).value).toBe('5')
    expect(form.input(t.form.notes).value).toBe('Window seat')
    expect((screen.getByRole('radio', { name: t.form.terrace }) as HTMLInputElement).checked).toBe(true)

    form.fill({ name: 'Rishi' })
    expect(screen.getAllByRole('alert').map((el) => el.textContent)).toEqual([t.form.phoneRequired])
  })

  it('uses trimmed name and phone in the summary and WhatsApp message without sending anything', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const form = renderForm()
    form.fill({ date: '2030-05-02', time: '13:30', guests: '4', name: '  Rishi Test  ', phone: ' 600 000 000 ' })

    form.submit()

    const summary = screen.getByRole('heading', { name: t.summary.title }).closest('.summary') as HTMLElement
    const values = [...summary.querySelectorAll('dd')].map((dd) => dd.textContent)
    expect(values).toContain('Rishi Test')
    expect(values).toContain('600 000 000')
    expect(form.whatsappText()).toContain('· Name: Rishi Test\n· Phone: 600 000 000')
    expect(summary.textContent).toContain(t.summary.body)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(window.localStorage.length).toBe(0)
  })

  it('keeps the indoor/terrace preference and the preview image consistent', () => {
    const form = renderForm()
    expect(form.preview().dataset.seating).toBe('indoor')
    expect(form.seatPhoto(t.form.indoorAlt).getAttribute('aria-hidden')).toBe('false')
    expect(form.seatPhoto(t.form.terraceAlt).getAttribute('aria-hidden')).toBe('true')

    fireEvent.click(screen.getByRole('radio', { name: t.form.terrace }))

    expect(form.preview().dataset.seating).toBe('terrace')
    expect(form.seatPhoto(t.form.indoorAlt).getAttribute('aria-hidden')).toBe('true')
    expect(form.seatPhoto(t.form.terraceAlt).getAttribute('aria-hidden')).toBe('false')

    form.fill({ date: '2030-05-02', time: '13:30', guests: '2', name: 'Rishi', phone: '600000000' })
    form.submit()
    expect(form.whatsappText()).toContain(`· Preference: ${t.form.terrace}`)

    fireEvent.click(screen.getByRole('button', { name: t.summary.edit }))
    expect((screen.getByRole('radio', { name: t.form.terrace }) as HTMLInputElement).checked).toBe(true)
    expect(form.preview().dataset.seating).toBe('terrace')
  })
})
