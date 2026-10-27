import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { copy, languages, type Lang } from '../i18n/copy'

const headerSelectNames = new Set(languages.map(({ code }) => copy[code].nav.language))

/** Renders the full app at `path`; MemoryRouter keeps history in memory so back/forward can be exercised. */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/** The site language selector in the header, labelled "Language" in whichever language is active. */
export const languageSelect = () =>
  screen.getByRole('combobox', { name: (accessibleName) => headerSelectNames.has(accessibleName) }) as HTMLSelectElement

export function chooseLanguage(lang: Lang) {
  fireEvent.change(languageSelect(), { target: { value: lang } })
}
