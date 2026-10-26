import { useEffect, useId, useRef, useState } from 'react'
import { logo, venue } from '../content/venue'
import { languages, type Copy, type Lang } from '../i18n/copy'

interface HeaderProps {
  t: Copy
  lang: Lang
  onLangChange: (lang: Lang) => void
}

export function Header({ t, lang, onLangChange }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    // The links precede the toggle in DOM order, so move focus into the opened panel.
    navRef.current?.querySelector('a')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const links = [
    { href: '#historia', label: t.nav.story },
    { href: '#experiencias', label: t.nav.experiences },
    { href: '#visita', label: t.nav.visit },
  ]

  return (
    <header className={`site-header${scrolled || menuOpen ? ' is-solid' : ''}`}>
      <div className="site-header__inner">
        <a className="brand" href="#inicio" aria-label={venue.name}>
          <img className="brand__mark" src={logo.light} width={44} height={43} alt="" />
          <span className="brand__text" aria-hidden="true">
            <span className="brand__name">Iturrieta</span>
            <span className="brand__sub">Sagardotegia</span>
          </span>
        </a>

        <nav ref={navRef} className={`site-nav${menuOpen ? ' is-open' : ''}`} id={menuId} aria-label={t.nav.menu}>
          <ul className="site-nav__list">
            {links.map((link) => (
              <li key={link.href}>
                <a className="site-nav__link" href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <div className="lang-switch" role="group" aria-label={t.nav.language}>
            {languages.map((option) => (
              <button
                key={option.code}
                type="button"
                className="lang-switch__btn"
                aria-pressed={option.code === lang}
                lang={option.code}
                title={option.name}
                onClick={() => onLangChange(option.code)}
              >
                <span aria-hidden="true">{option.label}</span>
                <span className="visually-hidden">{option.name}</span>
              </button>
            ))}
          </div>

          <a className="btn btn--primary btn--compact" href="#reservar">
            {t.nav.reserve}
          </a>

          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-toggle__bars" aria-hidden="true" />
            <span className="visually-hidden">{menuOpen ? t.nav.close : t.nav.menu}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
