import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { copy } from './i18n/copy'
import { stubMatchMedia } from './test/matchMedia'
import { chooseLanguage, languageSelect, renderApp } from './test/renderApp'

const heading = () => screen.getByRole('heading', { level: 1 })

describe('language switching', () => {
  it('translates the interface and keeps the selected language across reloads', () => {
    const first = renderApp()
    expect(heading().textContent).toBe(copy.en.hero.titleLead + copy.en.hero.titleAccent)

    chooseLanguage('eu')

    expect(heading().textContent).toBe(copy.eu.hero.titleLead + copy.eu.hero.titleAccent)
    expect(languageSelect().value).toBe('eu')
    expect(screen.getByRole('link', { name: copy.eu.nav.reserve })).toBeTruthy()
    expect(document.documentElement.lang).toBe('eu')

    first.unmount()
    renderApp()
    expect(heading().textContent).toBe(copy.eu.hero.titleLead + copy.eu.hero.titleAccent)
    expect(document.documentElement.lang).toBe('eu')
  })
})

describe('hero entrance animation', () => {
  it('staggers the hero entrance when motion is allowed', () => {
    const { container } = renderApp()
    const entering = container.querySelectorAll<HTMLElement>('.hero .hero__enter')
    expect(entering.length).toBeGreaterThan(0)
    expect([...entering].every((el) => el.style.getPropertyValue('--i') !== '')).toBe(true)
  })

  it('shows the hero copy without entrance delays when reduced motion is requested', () => {
    stubMatchMedia(['(prefers-reduced-motion: reduce)'])
    const { container } = renderApp()
    expect(container.querySelectorAll('.hero .hero__enter')).toHaveLength(0)
    expect(container.querySelectorAll('.hero__copy [style*="--i"]')).toHaveLength(0)
    expect(heading().textContent).toBe(copy.en.hero.titleLead + copy.en.hero.titleAccent)
    expect(screen.getByRole('link', { name: new RegExp(copy.en.hero.primaryCta) })).toBeTruthy()
  })
})

describe('hero cursor parallax', () => {
  const FINE_POINTER = '(hover: hover) and (pointer: fine)'
  const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

  /** Queues animation frames so they run only when flushed, as in a real browser. */
  function stubAnimationFrames() {
    const queued: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queued.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    return {
      pending: () => queued.length,
      flush: () => queued.splice(0).forEach((cb) => cb(performance.now())),
    }
  }

  function renderHero() {
    const frames = stubAnimationFrames()
    const { container } = renderApp()
    const hero = container.querySelector('.hero') as HTMLElement
    const stage = container.querySelector('.stage') as HTMLElement
    vi.spyOn(hero, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 0, width: 1000, height: 800 }))
    const move = (clientX: number, clientY: number) =>
      hero.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX, clientY }))
    const offset = () => [stage.style.getPropertyValue('--px'), stage.style.getPropertyValue('--py')]
    return { hero, frames, move, offset }
  }

  it('moves the depth stage toward a fine pointer and recentres when it leaves', () => {
    stubMatchMedia([FINE_POINTER])
    const { hero, frames, move, offset } = renderHero()

    move(950, 120)
    move(900, 80)
    expect(frames.pending()).toBe(1)
    frames.flush()
    expect(offset()).toEqual(['0.800', '-0.800'])

    hero.dispatchEvent(new MouseEvent('pointerleave'))
    frames.flush()
    expect(offset()).toEqual(['0.000', '0.000'])
  })

  it('stays still when reduced motion is requested', () => {
    stubMatchMedia([FINE_POINTER, REDUCED_MOTION])
    const { frames, move, offset } = renderHero()

    move(950, 120)
    frames.flush()
    expect(frames.pending()).toBe(0)
    expect(offset()).toEqual(['', ''])
  })

  it('does not attach pointer tracking on touch-only devices', () => {
    stubMatchMedia([])
    const { frames, move, offset } = renderHero()

    move(950, 120)
    frames.flush()
    expect(offset()).toEqual(['', ''])
  })
})
