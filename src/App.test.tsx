import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { copy } from './i18n/copy'
import { stubMatchMedia } from './test/matchMedia'

const heading = () => screen.getByRole('heading', { level: 1 })

describe('language switching', () => {
  it('translates the interface and keeps the selected language across reloads', () => {
    const first = render(<App />)
    expect(heading().textContent).toBe(copy.en.hero.titleLead + copy.en.hero.titleAccent)

    fireEvent.click(screen.getByRole('button', { name: 'Euskara' }))

    expect(heading().textContent).toBe(copy.eu.hero.titleLead + copy.eu.hero.titleAccent)
    expect(screen.getByRole('button', { name: 'Euskara' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByLabelText(copy.eu.reserve.form.name)).toBeTruthy()
    expect(document.documentElement.lang).toBe('eu')

    first.unmount()
    render(<App />)
    expect(heading().textContent).toBe(copy.eu.hero.titleLead + copy.eu.hero.titleAccent)
    expect(document.documentElement.lang).toBe('eu')
  })
})

describe('hero entrance animation', () => {
  it('staggers the hero entrance when motion is allowed', () => {
    const { container } = render(<App />)
    const entering = container.querySelectorAll<HTMLElement>('.hero .hero__enter')
    expect(entering.length).toBeGreaterThan(0)
    expect([...entering].every((el) => el.style.getPropertyValue('--i') !== '')).toBe(true)
  })

  it('shows the hero copy without entrance delays when reduced motion is requested', () => {
    stubMatchMedia(['(prefers-reduced-motion: reduce)'])
    const { container } = render(<App />)
    expect(container.querySelectorAll('.hero .hero__enter')).toHaveLength(0)
    expect(container.querySelectorAll('.hero__copy [style*="--i"]')).toHaveLength(0)
    expect(heading().textContent).toBe(copy.en.hero.titleLead + copy.en.hero.titleAccent)
    expect(screen.getByRole('link', { name: new RegExp(copy.en.hero.primaryCta) })).toBeTruthy()
  })
})
