import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { aboutContent } from './content/pages/about'
import { concertsContent } from './content/pages/concerts'
import { locationContent } from './content/pages/location'
import { menusContent } from './content/pages/menus'
import { productsContent } from './content/pages/products'
import { visitsContent } from './content/pages/visits'
import { officialSources } from './content/sources'
import { copy } from './i18n/copy'
import { site } from './i18n/site'
import Root from './Root'
import { pageRoutes, type PageKey } from './routes'
import { staffCopy } from './staff/staffCopy'
import { chooseLanguage, renderApp } from './test/renderApp'

const en = site.en
const pageTitles: Record<PageKey, string> = {
  menus: menusContent.en.title,
  about: aboutContent.en.title,
  visits: visitsContent.en.title,
  products: productsContent.en.title,
  concerts: concertsContent.en.title,
  location: locationContent.en.title,
}

const heading = () => screen.getByRole('heading', { level: 1 })
const primaryNav = () => screen.getByRole('navigation', { name: en.primaryNav })

/** Stands in for the browser's back/forward buttons inside MemoryRouter. */
function HistoryControls() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div>
      <button type="button" onClick={() => navigate(-1)}>history-back</button>
      <button type="button" onClick={() => navigate(1)}>history-forward</button>
      <output data-testid="pathname">{pathname}</output>
    </div>
  )
}

describe('routing', () => {
  it.each(pageRoutes.map((route) => [route.path, route.key] as const))('renders %s directly with its own heading and title', (path, key) => {
    renderApp(path)
    expect(heading().textContent).toBe(pageTitles[key])
    expect(document.title).toContain(en.pages[key])
    const active = within(primaryNav()).getByRole('link', { name: en.pages[key] })
    expect(active.getAttribute('aria-current')).toBe('page')
  })

  it('opens pages from the navigation and supports back and forward', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
        <HistoryControls />
      </MemoryRouter>,
    )
    expect(heading().textContent).toBe(copy.en.hero.titleLead + copy.en.hero.titleAccent)

    fireEvent.click(within(primaryNav()).getByRole('link', { name: en.pages.menus }))
    expect(screen.getByTestId('pathname').textContent).toBe('/menus')
    expect(heading().textContent).toBe(pageTitles.menus)

    fireEvent.click(within(primaryNav()).getByRole('link', { name: en.pages.location }))
    expect(heading().textContent).toBe(pageTitles.location)
    expect(within(primaryNav()).getByRole('link', { name: en.pages.menus }).getAttribute('aria-current')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'history-back' }))
    expect(screen.getByTestId('pathname').textContent).toBe('/menus')
    expect(heading().textContent).toBe(pageTitles.menus)

    fireEvent.click(screen.getByRole('button', { name: 'history-forward' }))
    expect(screen.getByTestId('pathname').textContent).toBe('/location')
    expect(heading().textContent).toBe(pageTitles.location)
  })

  it('keeps the reservations page one click away from interior pages', () => {
    renderApp('/visits')
    const book = screen.getByRole('link', { name: copy.en.nav.reserve })
    expect(book.getAttribute('href')).toBe('/reservations')

    fireEvent.click(book)
    expect(heading().textContent).toBe(en.reservationsPage.title)
    expect(screen.getByRole('link', { name: copy.en.nav.reserve }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: copy.en.reserve.form.submit })).toBeTruthy()
  })

  it('loads /reservations directly and keeps the form off the home page', () => {
    renderApp('/reservations')
    expect(heading().textContent).toBe(en.reservationsPage.title)
    expect(document.title).toContain(en.reservationsPage.title)
    expect(screen.getByLabelText(copy.en.reserve.form.name)).toBeTruthy()
  })

  it('sends the home hero and booking band to /reservations instead of an in-page anchor', () => {
    renderApp('/')
    expect(screen.queryByLabelText(copy.en.reserve.form.name)).toBeNull()
    expect(screen.getByRole('link', { name: new RegExp(copy.en.hero.primaryCta) }).getAttribute('href')).toBe('/reservations')
    expect(screen.getByRole('link', { name: en.prepareRequest }).getAttribute('href')).toBe('/reservations')
  })

  it('shows a useful not-found page for unknown paths', () => {
    renderApp('/does-not-exist')
    expect(heading().textContent).toBe(en.notFound.title)
    expect(screen.getByRole('link', { name: en.notFound.back }).getAttribute('href')).toBe('/')
  })

  it('links each home experience card to its page', () => {
    renderApp('/')
    const menuLink = screen.getByRole('link', { name: `${en.learnMore}: ${en.pages.menus}` })
    fireEvent.click(menuLink)
    expect(heading().textContent).toBe(pageTitles.menus)
  })
})

describe('interior page content', () => {
  it('switches an interior page to Basque and keeps the route', () => {
    renderApp('/menus')
    chooseLanguage('eu')
    expect(heading().textContent).toBe(menusContent.eu.title)
    const nav = screen.getByRole('navigation', { name: site.eu.primaryNav })
    expect(within(nav).getByRole('link', { name: site.eu.pages.menus }).getAttribute('aria-current')).toBe('page')
  })

  it('shows the published menu with official dish names and prices', () => {
    renderApp('/menus')
    expect(screen.getByText('Txuletoia parrillan')).toBeTruthy()
    expect(screen.getByText('Chuletón a la parrilla')).toBeTruthy()
    expect(screen.getAllByText(menusContent.en.cider.price).length).toBeGreaterThan(0)
    expect(screen.getByText(menusContent.en.kids.price)).toBeTruthy()
  })

  it('links every interior page to its official source for the current language', () => {
    for (const { path, key } of pageRoutes) {
      const view = renderApp(path)
      const hrefs = within(view.container.querySelector('.source-note') as HTMLElement)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
      expect(hrefs).toEqual(officialSources[key].en)
      view.unmount()
    }
  })
})

describe('staff login entry point', () => {
  it('links from the footer to /staff/login, which opens the separate staff area', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Root />
      </MemoryRouter>,
    )
    const footer = screen.getByRole('contentinfo')
    const link = within(footer).getByRole('link', { name: en.staffLogin })
    expect(link.getAttribute('href')).toBe('/staff/login')
    expect(screen.getByRole('navigation', { name: en.primaryNav }).textContent).not.toContain(en.staffLogin)

    fireEvent.click(link)
    // Unit tests run without Supabase settings, so the staff area explains it is not configured.
    await screen.findByText(staffCopy.en.unconfigured)
    expect(document.querySelector('.site-footer')).toBeNull()
  })

  it.each(['es', 'eu', 'fr', 'en', 'de'] as const)('labels the footer link in %s', (lang) => {
    renderApp('/')
    chooseLanguage(lang)
    within(screen.getByRole('contentinfo')).getByRole('link', { name: site[lang].staffLogin })
  })
})
