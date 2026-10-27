import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router'
import { backendConfig, type ConfigState } from '../config'
import { STAFF_HREF, STAFF_LOGIN_HREF } from '../routes'
import { createStaffApi, type StaffApi } from './staffApi'
import { STAFF_LANG_NAMES, STAFF_LANGS, staffCopy, type StaffLang } from './staffCopy'
import { readStaffLang, StaffCopyContext, useStaffCopy, writeStaffLang } from './staffLanguage'
import { StaffDashboard } from './StaffDashboard'
import './staff.css'

type Phase = 'loading' | 'signed_out' | 'checking' | 'denied' | 'staff' | 'error'

interface StaffAppProps {
  config?: ConfigState
  api?: StaffApi
}

/** Rendered by Root at /staff/*: /staff/login (sign-in) and /staff (dashboard). */
export default function StaffApp({ config = backendConfig, api: injected }: StaffAppProps) {
  const api = useMemo(() => injected ?? (config.ok ? createStaffApi(config.config) : null), [injected, config])
  const [lang, setLang] = useState<StaffLang>(readStaffLang)
  const c = staffCopy[lang]

  const changeLang = (next: StaffLang) => {
    setLang(next)
    writeStaffLang(next)
  }

  useEffect(() => {
    const previousTitle = document.title
    const previousLang = document.documentElement.lang
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.append(robots)
    return () => {
      robots.remove()
      document.title = previousTitle
      document.documentElement.lang = previousLang
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${c.title} · Iturrieta`
  }, [lang, c.title])

  return (
    <StaffCopyContext.Provider value={c}>
      <div className="staff">
        <header className="staff__bar">
          <span className="staff__brand">{c.brand}</span>
          <label className="staff-lang">
            <span className="staff-lang__label">{c.languageLabel}</span>
            <select
              className="staff-lang__control"
              value={lang}
              onChange={(event) => {
                const next = STAFF_LANGS.find((code) => code === event.target.value)
                if (next) changeLang(next)
              }}
            >
              {STAFF_LANGS.map((code) => (
                <option key={code} value={code} lang={code}>
                  {STAFF_LANG_NAMES[code]}
                </option>
              ))}
            </select>
          </label>
        </header>
        <main className="staff__main" id="contenido">
          {api ? <StaffRoutes api={api} /> : <p className="staff__notice">{c.unconfigured}</p>}
        </main>
      </div>
    </StaffCopyContext.Provider>
  )
}

/**
 * Supabase session + server-side staff check. `staff` is only ever set from the database's
 * is_current_user_staff() answer for the signed-in user, never from client data.
 */
function useStaffSession(api: StaffApi) {
  const [email, setEmail] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    let active = true
    let current: string | null | undefined
    // Auth emits repeated events (initial session, token refresh); only a change of user matters.
    const apply = (next: string | null) => {
      if (!active || next === current) return
      current = next
      setEmail(next)
      if (!next) {
        setPhase('signed_out')
        return
      }
      setPhase('checking')
      api.isStaff().then(
        (isStaff) => active && setPhase(isStaff ? 'staff' : 'denied'),
        () => active && setPhase('error'),
      )
    }
    api.getSessionEmail().then(apply, () => apply(null))
    const unsubscribe = api.onSessionChange(apply)
    return () => {
      active = false
      unsubscribe()
    }
  }, [api])

  return { email, phase }
}

function StaffRoutes({ api }: { api: StaffApi }) {
  const c = useStaffCopy()
  const navigate = useNavigate()
  const { email, phase } = useStaffSession(api)

  const signOut = async () => {
    await api.signOut()
    navigate(STAFF_LOGIN_HREF, { replace: true })
  }

  const pending =
    phase === 'loading' || phase === 'checking' ? (
      <p className="staff__notice" role="status">
        {phase === 'checking' ? c.login.verifying : c.loading}
      </p>
    ) : null

  const account = (
    <div className="staff__account">
      <span>
        {c.signedInAs} <strong>{email}</strong>
      </span>
      <button type="button" className="staff-btn staff-btn--quiet" onClick={() => void signOut()}>
        {c.signOut}
      </button>
    </div>
  )

  const denied = (
    <section className="staff-card staff-card--narrow" aria-labelledby="staff-denied">
      <h1 id="staff-denied">{phase === 'denied' ? c.denied.heading : c.errors.unknown}</h1>
      {phase === 'denied' && <p>{c.denied.body}</p>}
      {account}
    </section>
  )

  const loginRoute: ReactNode =
    pending ?? (phase === 'staff' ? <Navigate to={STAFF_HREF} replace /> : phase === 'signed_out' ? <StaffLogin api={api} /> : denied)

  // Nothing from the dashboard renders until the server has confirmed staff access.
  const dashboardRoute: ReactNode =
    pending ??
    (phase === 'staff' ? (
      <StaffDashboard api={api} account={account} onAuthLost={() => void signOut()} />
    ) : phase === 'signed_out' ? (
      <Navigate to={STAFF_LOGIN_HREF} replace />
    ) : (
      denied
    ))

  return (
    <Routes>
      <Route path="login" element={loginRoute} />
      <Route index element={dashboardRoute} />
      <Route path="*" element={<Navigate to={STAFF_HREF} replace />} />
    </Routes>
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function StaffLogin({ api }: { api: StaffApi }) {
  const c = useStaffCopy()
  const ids = useId()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<'invalid' | 'network' | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: 'emailInvalid'; password?: 'passwordRequired' }>({})
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const next = { ...(EMAIL_RE.test(email) ? {} : { email: 'emailInvalid' as const }), ...(password ? {} : { password: 'passwordRequired' as const }) }
    setFieldErrors(next)
    setError(null)
    if (next.email || next.password) {
      form.querySelector<HTMLElement>(`[name="${next.email ? 'email' : 'password'}"]`)?.focus()
      return
    }
    setSubmitting(true)
    const result = await api.signIn(email, password)
    setSubmitting(false)
    if (!result.ok) setError(result.error === 'invalid_credentials' ? 'invalid' : 'network')
  }

  const describedBy = (field: 'email' | 'password') => (fieldErrors[field] ? `${ids}-${field}-error` : undefined)

  return (
    <section className="staff-card staff-card--narrow" aria-labelledby="staff-login">
      <h1 id="staff-login">{c.login.heading}</h1>
      <p className="staff__muted">{c.login.intro}</p>
      <form className="staff-form" onSubmit={onSubmit} noValidate aria-busy={submitting}>
        <fieldset className="staff-form__fields" disabled={submitting}>
          <div className="staff-field">
            <label htmlFor={`${ids}-email`}>{c.login.email}</label>
            <input
              id={`${ids}-email`}
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              aria-invalid={Boolean(fieldErrors.email) || undefined}
              aria-describedby={describedBy('email')}
            />
            {fieldErrors.email && (
              <small className="staff-field__error" id={`${ids}-email-error`}>
                {c.login[fieldErrors.email]}
              </small>
            )}
          </div>
          <div className="staff-field">
            <label htmlFor={`${ids}-password`}>{c.login.password}</label>
            <div className="staff-password">
              <input
                id={`${ids}-password`}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password) || undefined}
                aria-describedby={describedBy('password')}
              />
              <button
                type="button"
                className="staff-btn staff-btn--quiet staff-password__toggle"
                aria-controls={`${ids}-password`}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? c.login.hidePassword : c.login.showPassword}
              </button>
            </div>
            {fieldErrors.password && (
              <small className="staff-field__error" id={`${ids}-password-error`}>
                {c.login[fieldErrors.password]}
              </small>
            )}
          </div>
          <p className="staff-alert" role="alert" hidden={!error}>
            {error && c.login[error]}
          </p>
          <button className="staff-btn" type="submit">
            {submitting ? c.login.submitting : c.login.submit}
          </button>
        </fieldset>
      </form>
      <p className="staff-login__back">
        <Link to="/">{c.login.backToSite}</Link>
      </p>
    </section>
  )
}
