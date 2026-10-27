import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { aboutContent } from '../content/pages/about'
import { concertsContent } from '../content/pages/concerts'
import { locationContent } from '../content/pages/location'
import { menusContent } from '../content/pages/menus'
import { productsContent } from '../content/pages/products'
import { visitsContent } from '../content/pages/visits'
import { pageRoutes } from '../routes'
import { chooseLanguage, languageSelect, renderApp } from '../test/renderApp'
import { copy, languages, type Lang } from './copy'
import { formatRequestDate } from './formatDate'
import { site } from './site'

const codes = languages.map((l) => l.code)

/** Every leaf path of a content object, with array lengths, so structural gaps show up as diffs. */
function shape(value: unknown, path = ''): string[] {
  if (typeof value === 'function') return [`${path}:fn`]
  if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((item, i) => shape(item, `${path}[${i}]`))]
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
  return [path]
}

function emptyStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path]
  if (Array.isArray(value)) return value.flatMap((item, i) => emptyStrings(item, `${path}[${i}]`))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, `${path}.${k}`))
  return []
}

const byLang = <T,>(map: (lang: Lang) => T) => Object.fromEntries(codes.map((c) => [c, map(c)])) as Record<Lang, T>

/**
 * Two published lists legitimately differ in length between languages and are checked separately:
 * the German-only translation notice, and the extra closure sentence that only the French and
 * English official contact pages publish ("opening dates may vary by season").
 */
const bundles: Record<string, Record<Lang, unknown>> = {
  copy,
  site: byLang((c) => ({ ...site[c], translationNotice: 'checked separately' })),
  menus: menusContent,
  about: aboutContent,
  visits: visitsContent,
  products: productsContent,
  concerts: concertsContent,
  location: byLang((c) => ({ ...locationContent[c], hours: { ...locationContent[c].hours, closures: 'checked separately' } })),
}

describe('translation completeness', () => {
  it('supports exactly eu, es, fr, en and de', () => {
    expect(codes).toEqual(['eu', 'es', 'fr', 'en', 'de'])
  })

  it.each(Object.keys(bundles))('%s has the same structure in every language as Spanish', (name) => {
    const reference = shape(bundles[name].es)
    for (const lang of codes) expect(shape(bundles[name][lang]), `${name}.${lang}`).toEqual(reference)
  })

  it.each(Object.keys(bundles))('%s has no empty strings in any language', (name) => {
    for (const lang of codes) expect(emptyStrings(bundles[name][lang]), `${name}.${lang}`).toEqual([])
  })

  it('marks only German as an unofficial translation', () => {
    expect(codes.filter((c) => site[c].translationNotice)).toEqual(['de'])
  })

  it('publishes the Christmas closure in every language', () => {
    for (const lang of codes) {
      expect(locationContent[lang].hours.closures.length).toBeGreaterThan(0)
      expect(locationContent[lang].hours.closures.join(' ')).toMatch(/24/)
    }
  })
})

describe('switching among all five languages', () => {
  it('translates heading, navigation, booking labels and document language', () => {
    renderApp('/reservations')
    for (const lang of codes) {
      chooseLanguage(lang)
      expect(languageSelect().value).toBe(lang)
      expect(document.documentElement.lang).toBe(lang)
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(site[lang].reservationsPage.title)
      const nav = screen.getByRole('navigation', { name: site[lang].primaryNav })
      for (const route of pageRoutes) expect(within(nav).getByRole('link', { name: site[lang].pages[route.key] })).toBeTruthy()
      expect(screen.getByRole('link', { name: copy[lang].nav.reserve })).toBeTruthy()
      expect(screen.getByLabelText(copy[lang].reserve.form.name)).toBeTruthy()
      expect(screen.getByLabelText(copy[lang].reserve.form.phone)).toBeTruthy()
      expect(screen.getByRole('button', { name: copy[lang].reserve.form.submit })).toBeTruthy()
    }
  })

  it('shows the German translation notice only in German', () => {
    renderApp('/')
    chooseLanguage('de')
    expect(screen.getByText(site.de.translationNotice!)).toBeTruthy()
    chooseLanguage('fr')
    expect(screen.queryByText(site.de.translationNotice!)).toBeNull()
  })
})

describe('language persistence and fallback', () => {
  it('keeps French and German across a reload', () => {
    for (const lang of ['fr', 'de'] as const) {
      const first = renderApp('/menus')
      chooseLanguage(lang)
      first.unmount()
      const reloaded = renderApp('/menus')
      expect(languageSelect().value).toBe(lang)
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(menusContent[lang].title)
      reloaded.unmount()
    }
  })

  it('falls back to the browser language, then Spanish, when the stored value is invalid', () => {
    window.localStorage.setItem('iturrieta.lang', 'xx')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-AT')
    const view = renderApp('/')
    expect(languageSelect().value).toBe('de')
    view.unmount()

    window.localStorage.setItem('iturrieta.lang', 'xx')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('pt-BR')
    renderApp('/')
    expect(languageSelect().value).toBe('es')
  })
})

describe('form state across language changes', () => {
  it('keeps an in-progress request when the language changes', () => {
    renderApp('/reservations')
    fireEvent.change(screen.getByLabelText(copy.en.reserve.form.name), { target: { value: 'Miren' } })
    fireEvent.change(screen.getByLabelText(copy.en.reserve.form.notes), { target: { value: 'Mahai bat leiho ondoan' } })
    fireEvent.click(screen.getByRole('radio', { name: copy.en.reserve.form.terrace }))

    chooseLanguage('fr')

    expect((screen.getByLabelText(copy.fr.reserve.form.name) as HTMLInputElement).value).toBe('Miren')
    expect((screen.getByLabelText(copy.fr.reserve.form.notes) as HTMLTextAreaElement).value).toBe('Mahai bat leiho ondoan')
    expect((screen.getByRole('radio', { name: copy.fr.reserve.form.terrace }) as HTMLInputElement).checked).toBe(true)
  })
})

describe('locale date formatting', () => {
  it('formats French and German dates in their own language', () => {
    expect(formatRequestDate('2030-05-02', 'fr')).toContain('jeudi 2 mai 2030')
    expect(formatRequestDate('2030-05-02', 'de')).toContain('Donnerstag, 2. Mai 2030')
  })
})
