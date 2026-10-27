import { useEffect, useRef, useState, type ComponentType, type RefObject } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router'
import './App.css'
import './pages.css'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { useFinePointer, usePrefersReducedMotion, useScrollReveal } from './hooks/useMotionPreferences'
import { copy, languages, type Lang } from './i18n/copy'
import { site } from './i18n/site'
import { AboutPage } from './pages/AboutPage'
import { ConcertsPage } from './pages/ConcertsPage'
import { HomePage } from './pages/HomePage'
import { LocationPage } from './pages/LocationPage'
import { MenusPage } from './pages/MenusPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductsPage } from './pages/ProductsPage'
import { ReservationsPage } from './pages/ReservationsPage'
import type { PageProps } from './pages/types'
import { VisitsPage } from './pages/VisitsPage'
import { TrackerPage } from './pages/TrackerPage'
import { pageRoutes, RESERVATION_HREF, TRACKER_HREF, type PageKey } from './routes'

const STORAGE_KEY = 'iturrieta.lang'

const pageComponents: Record<PageKey, ComponentType<PageProps>> = {
  menus: MenusPage,
  about: AboutPage,
  visits: VisitsPage,
  products: ProductsPage,
  concerts: ConcertsPage,
  location: LocationPage,
}

const isLang = (value: unknown): value is Lang => languages.some((l) => l.code === value)

function readStoredLang(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function initialLang(): Lang {
  const stored = readStoredLang()
  if (isLang(stored)) return stored
  const browser = navigator.language.slice(0, 2)
  return isLang(browser) ? browser : 'es'
}

/** Scroll and focus handling for client-side navigation (BrowserRouter has no built-in scroll restoration). */
function useRouteFocusAndScroll(main: RefObject<HTMLElement | null>) {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const firstRun = useRef(true)

  useEffect(() => {
    const isFirstRun = firstRun.current
    firstRun.current = false
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.()
      return
    }
    // Back/forward keeps the browser's own scroll restoration.
    if (navigationType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' })
    if (!isFirstRun) main.current?.focus({ preventScroll: true })
  }, [pathname, hash, navigationType, main])
}

function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const reducedMotion = usePrefersReducedMotion()
  const finePointer = useFinePointer()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const t = copy[lang]
  const s = site[lang]
  const pageProps: PageProps = { t, s, lang }

  useScrollReveal(!reducedMotion, pathname)
  useRouteFocusAndScroll(mainRef)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Storage can be unavailable (private mode); the choice simply won't persist.
    }
  }, [lang])

  return (
    <>
      <a className="skip-link" href="#contenido">
        {t.skipToContent}
      </a>
      <Header t={t} s={s} lang={lang} onLangChange={setLang} />
      <main id="contenido" tabIndex={-1} ref={mainRef}>
        <div className="page-view" key={pathname}>
          <Routes>
            <Route
              path="/"
              element={<HomePage {...pageProps} interactive={!reducedMotion && finePointer} animateEntrance={!reducedMotion} />}
            />
            {pageRoutes.map(({ key, path }) => {
              const Page = pageComponents[key]
              return <Route key={key} path={path} element={<Page {...pageProps} />} />
            })}
            <Route path={RESERVATION_HREF} element={<ReservationsPage {...pageProps} />} />
            <Route path={TRACKER_HREF} element={<TrackerPage {...pageProps} />} />
            <Route path="*" element={<NotFoundPage {...pageProps} />} />
          </Routes>
        </div>
      </main>
      <Footer t={t} s={s} />
    </>
  )
}

export default App
