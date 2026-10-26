import { useEffect, useState } from 'react'
import './App.css'
import { Experiences } from './components/Experiences'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Reservation } from './components/Reservation'
import { Story } from './components/Story'
import { useFinePointer, usePrefersReducedMotion, useScrollReveal } from './hooks/useMotionPreferences'
import { copy, languages, type Lang } from './i18n/copy'

const STORAGE_KEY = 'iturrieta.lang'

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

function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const reducedMotion = usePrefersReducedMotion()
  const finePointer = useFinePointer()
  const t = copy[lang]

  useScrollReveal(!reducedMotion)

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
      <Header t={t} lang={lang} onLangChange={setLang} />
      <main id="contenido" tabIndex={-1}>
        <Hero t={t} interactive={!reducedMotion && finePointer} animateEntrance={!reducedMotion} />
        <Story t={t} />
        <Experiences t={t} />
        <Reservation t={t} lang={lang} />
      </main>
      <Footer t={t} />
    </>
  )
}

export default App
