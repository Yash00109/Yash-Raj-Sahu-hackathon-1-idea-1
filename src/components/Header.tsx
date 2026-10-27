import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { logo, venue } from '../content/venue'
import { languages, type Copy, type Lang } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'
import { pageRoutes, RESERVATION_HREF } from '../routes'

interface HeaderProps {
  t: Copy
  s: SiteCopy
  lang: Lang
  onLangChange: (lang: Lang) => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) => `site-nav__link${isActive ? ' is-active' : ''}`

export function Header({ t, s, lang, onLangChange }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  // Remembering the path the menu was opened on closes it automatically after any navigation.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const menuOpen = openedOn === pathname
  const setMenuOpen = (open: boolean | ((current: boolean) => boolean)) =>
    setOpenedOn((current) => {
      const next = typeof open === 'function' ? open(current === pathname) : open
      return next ? pathname : null
    })
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
        setOpenedOn(null)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className={`site-header${scrolled || menuOpen || pathname !== '/' ? ' is-solid' : ''}`}>
      <div className="site-header__inner">
        <Link className="brand" to="/" aria-label={`${venue.name} · ${s.home}`}>
          <img className="brand__mark" src={logo.light} width={44} height={43} alt="" />
          <span className="brand__text" aria-hidden="true">
            <span className="brand__name">Iturrieta</span>
            <span className="brand__sub">Sagardotegia</span>
          </span>
        </Link>

        <nav ref={navRef} className={`site-nav${menuOpen ? ' is-open' : ''}`} id={menuId} aria-label={s.primaryNav}>
          <ul className="site-nav__list">
            <li className="site-nav__item--home">
              <NavLink className={navLinkClass} to="/" end onClick={() => setMenuOpen(false)}>
                {s.home}
              </NavLink>
            </li>
            {pageRoutes.map((route) => (
              <li key={route.key}>
                <NavLink className={navLinkClass} to={route.path} onClick={() => setMenuOpen(false)}>
                  {s.pages[route.key]}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <label className="lang-select">
            <span className="visually-hidden">{t.nav.language}</span>
            <select
              className="lang-select__control"
              value={lang}
              onChange={(event) => {
                const next = languages.find((option) => option.code === event.target.value)
                if (next) onLangChange(next.code)
              }}
            >
              {languages.map((option) => (
                <option key={option.code} value={option.code} lang={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <NavLink className="btn btn--primary btn--compact" to={RESERVATION_HREF}>
            {t.nav.reserve}
          </NavLink>

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
