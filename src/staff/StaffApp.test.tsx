import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import Root from '../Root'
import { chooseLanguage } from '../test/renderApp'
import StaffApp from './StaffApp'
import { searchFilter, StaffApiError, type StaffApi, type StaffReservation } from './staffApi'
import { STAFF_LANG_NAMES, STAFF_LANGS, staffCopy, type StaffCopy, type StaffLang } from './staffCopy'
import { STAFF_LANG_STORAGE_KEY } from './staffLanguage'

const row = (overrides: Partial<StaffReservation> = {}): StaffReservation => ({
  id: crypto.randomUUID(),
  reference: 'IT-AAAA0001',
  guest_name: 'Miren Etxeberria',
  phone: '+34600000000',
  reservation_date: '2031-05-02',
  reservation_time: '13:30',
  party_size: 4,
  seating_preference: 'terrace',
  preferred_language: 'eu',
  notes: null,
  status: 'pending',
  source: 'website',
  created_at: '2031-04-01T10:00:00Z',
  ...overrides,
})

function fakeApi(options: { email?: string | null; staff?: boolean; rows?: StaffReservation[] } = {}) {
  let listener: (email: string | null) => void = () => {}
  const api = {
    getSessionEmail: vi.fn().mockResolvedValue(options.email === undefined ? 'staff@iturrieta.test' : options.email),
    onSessionChange: vi.fn((next: (email: string | null) => void) => {
      listener = next
      return () => {}
    }),
    signIn: vi.fn().mockResolvedValue({ ok: false, error: 'invalid_credentials' }),
    signOut: vi.fn(async () => listener(null)),
    isStaff: vi.fn().mockResolvedValue(options.staff ?? true),
    listReservations: vi.fn().mockResolvedValue(options.rows ?? []),
    setStatus: vi.fn(),
    createPhoneReservation: vi.fn(),
  } satisfies StaffApi
  return { api, emit: (email: string | null) => act(() => listener(email)) }
}

function CurrentPath() {
  return <span data-testid="path">{useLocation().pathname}</span>
}
const currentPath = () => screen.getByTestId('path').textContent

/** Mounted like Root does: the staff app owns /staff/*. */
const renderStaff = (api: StaffApi, lang?: StaffLang, path = '/staff') => {
  if (lang) window.localStorage.setItem(STAFF_LANG_STORAGE_KEY, lang)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/staff/*" element={<StaffApp api={api} />} />
        <Route path="*" element={<p>public site</p>} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  )
}
const buttonLabels = (scope: HTMLElement) => within(scope).queryAllByRole('button').map((b) => b.textContent)
const staffLanguageSelect = (c: StaffCopy) => screen.getByRole('combobox', { name: c.languageLabel }) as HTMLSelectElement
const switchStaffLanguage = (from: StaffCopy, to: StaffLang) => fireEvent.change(staffLanguageSelect(from), { target: { value: to } })

describe.each(STAFF_LANGS)('staff workflow in %s', (lang) => {
  const c = staffCopy[lang]

  it('signs in: no sign-up option, bad credentials reported', async () => {
    const { api } = fakeApi({ email: null })
    renderStaff(api, lang)
    await screen.findByRole('heading', { name: c.login.heading })
    expect(screen.queryByText(/sign up|regístrate|erregistratu/i)).toBeNull()

    fireEvent.change(screen.getByLabelText(c.login.email), { target: { value: ' staff@iturrieta.test ' } })
    fireEvent.change(screen.getByLabelText(c.login.password), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: c.login.submit }))

    expect((await screen.findByRole('alert')).textContent).toBe(c.login.invalid)
    expect(api.signIn).toHaveBeenCalledWith('staff@iturrieta.test', 'wrong')
    expect(api.listReservations).not.toHaveBeenCalled()
  })

  it('opens the dashboard when a staff session appears', async () => {
    const { api, emit } = fakeApi({ email: null })
    renderStaff(api, lang)
    await screen.findByRole('heading', { name: c.login.heading })
    emit('staff@iturrieta.test')
    await screen.findByRole('heading', { name: c.title })
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
    expect(document.title).toBe(`${c.title} · Iturrieta`)
  })

  it('denies signed-in accounts that are not staff and signs them out', async () => {
    const { api } = fakeApi({ staff: false })
    renderStaff(api, lang)
    await screen.findByRole('heading', { name: c.denied.heading })
    expect(api.listReservations).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: c.signOut }))
    await screen.findByRole('heading', { name: c.login.heading })
  })

  it('lists reservations with only the allowed actions and never a delete', async () => {
    const pending = row({ reference: 'IT-PENDING1' })
    const confirmed = row({ reference: 'IT-CONFIRM1', status: 'confirmed', source: 'phone' })
    const rejected = row({ reference: 'IT-REJECTD1', status: 'rejected', source: null })
    const { api } = fakeApi({ rows: [pending, confirmed, rejected] })
    renderStaff(api, lang)

    await screen.findByText(c.list.count(3, false))
    expect(api.listReservations).toHaveBeenCalledWith({ date: '', status: '', search: '' })
    const items = screen.getAllByRole('listitem')
    expect(buttonLabels(items[0])).toEqual([c.actions.confirmed, c.actions.rejected, c.actions.cancelled])
    within(items[0]).getByText(c.status.pending)
    within(items[0]).getByText(c.source.website)
    within(items[0]).getByText(`${c.list.reference}: IT-PENDING1`)
    expect(buttonLabels(items[1])).toEqual([c.actions.cancelled])
    within(items[1]).getByText(c.source.phone)
    expect(buttonLabels(items[2])).toEqual([])
    within(items[2]).getByText(c.sourceUnknown)
    within(items[2]).getByText(c.status.rejected)
    expect(screen.queryByRole('button', { name: /delete|eliminar|borrar|ezabatu/i })).toBeNull()
  })

  it('filters by date, status and search', async () => {
    const { api } = fakeApi()
    renderStaff(api, lang)
    await screen.findByText(c.list.empty)
    const filters = within(screen.getByRole('form', { name: c.filters.legend }))

    fireEvent.change(filters.getByLabelText(c.filters.date), { target: { value: '2031-05-02' } })
    fireEvent.change(filters.getByLabelText(c.filters.status), { target: { value: 'confirmed' } })
    fireEvent.change(filters.getByLabelText(c.filters.search), { target: { value: 'Miren' } })
    fireEvent.click(filters.getByRole('button', { name: c.filters.apply }))

    await waitFor(() => expect(api.listReservations).toHaveBeenLastCalledWith({ date: '2031-05-02', status: 'confirmed', search: 'Miren' }))
    fireEvent.click(filters.getByRole('button', { name: c.filters.clear }))
    await waitFor(() => expect(api.listReservations).toHaveBeenLastCalledWith({ date: '', status: '', search: '' }))
  })

  it('confirms a pending request and shows the new status', async () => {
    const pending = row()
    const { api } = fakeApi({ rows: [pending] })
    api.setStatus.mockResolvedValue({ ...pending, status: 'confirmed' })
    renderStaff(api, lang)

    fireEvent.click(await screen.findByRole('button', { name: `${c.actions.confirmed} IT-AAAA0001` }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(c.actions.updated('IT-AAAA0001', c.status.confirmed)))
    expect(api.setStatus).toHaveBeenCalledWith(pending.id, 'confirmed')
    expect(buttonLabels(screen.getByRole('listitem'))).toEqual([c.actions.cancelled])
  })

  it('asks, in the staff language, before rejecting or cancelling', async () => {
    const { api } = fakeApi({ rows: [row()] })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderStaff(api, lang)

    fireEvent.click(await screen.findByRole('button', { name: `${c.actions.rejected} IT-AAAA0001` }))
    fireEvent.click(screen.getByRole('button', { name: `${c.actions.cancelled} IT-AAAA0001` }))
    expect(confirm.mock.calls).toEqual([[c.actions.confirmReject('IT-AAAA0001')], [c.actions.confirmCancel('IT-AAAA0001')]])
    expect(api.setStatus).not.toHaveBeenCalled()
  })

  it('reports a refused transition from the server', async () => {
    const { api } = fakeApi({ rows: [row()] })
    api.setStatus.mockRejectedValue(new StaffApiError('invalid_transition'))
    renderStaff(api, lang)

    fireEvent.click(await screen.findByRole('button', { name: `${c.actions.confirmed} IT-AAAA0001` }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(c.errors.invalid_transition))
  })

  it('signs out when the server says the session is no longer staff', async () => {
    const { api } = fakeApi()
    api.listReservations.mockRejectedValue(new StaffApiError('not_staff'))
    renderStaff(api, lang)
    await screen.findByRole('heading', { name: c.login.heading })
    expect(api.signOut).toHaveBeenCalled()
  })

  it('validates a phone booking before saving', async () => {
    const { api } = fakeApi()
    renderStaff(api, lang)
    fireEvent.click(await screen.findByRole('button', { name: c.phone.submit }))
    const form = within(screen.getByRole('region', { name: c.phone.heading }))
    expect(form.getByText(c.phone.errorSummary).hidden).toBe(false)
    form.getByText(c.validation.name_required)
    form.getByText(c.validation.phone_required)
    expect(form.getByLabelText(c.phone.phone).getAttribute('aria-invalid')).toBe('true')
    expect(api.createPhoneReservation).not.toHaveBeenCalled()
  })

  it('saves a normalized phone booking and refreshes the list', async () => {
    const { api } = fakeApi()
    api.createPhoneReservation.mockResolvedValue(row({ reference: 'IT-PHONE001', source: 'phone', status: 'confirmed' }))
    renderStaff(api, lang)
    await screen.findByText(c.list.empty)
    const form = within(screen.getByRole('region', { name: c.phone.heading }))
    const fill = (label: string, value: string) => fireEvent.change(form.getByLabelText(label), { target: { value } })

    fill(c.phone.name, '  Ane   Zubia ')
    fill(c.phone.phone, '+34 622 333 444')
    fill(c.phone.date, '2031-06-01')
    fill(c.phone.time, '14:00')
    fill(c.phone.partySize, '12')
    fill(c.phone.language, 'fr')
    fireEvent.click(form.getByRole('button', { name: c.phone.submit }))

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(c.phone.saved('IT-PHONE001')))
    expect(api.createPhoneReservation).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ane Zubia', phone: '+34622333444', date: '2031-06-01', time: '14:00', partySize: 12, seating: 'indoor', language: 'fr', notes: null, status: 'confirmed' }),
    )
    await waitFor(() => expect(api.listReservations).toHaveBeenCalledTimes(2))
  })
})

/** Every string leaf of a copy object; functions contribute their fixed text fragments. */
function copyStrings(value: unknown, path = ''): Map<string, string[]> {
  const out = new Map<string, string[]>()
  if (typeof value === 'string') out.set(path, [value])
  else if (typeof value === 'function') {
    const sentinel = '\u0000'
    const rendered = String((value as (...args: unknown[]) => unknown)(sentinel, sentinel))
    out.set(path, rendered.split(sentinel).map((part) => part.trim()))
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) for (const [p, v] of copyStrings(child, `${path}.${key}`)) out.set(p, v)
  }
  return out
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Text and accessibility labels on screen, excluding the language selector's own option names. */
function screenText(): string {
  const clone = document.body.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.staff-lang').forEach((node) => node.remove())
  const labels = [...clone.querySelectorAll('[aria-label], [title], [placeholder]')].map((el) =>
    ['aria-label', 'title', 'placeholder'].map((name) => el.getAttribute(name) ?? '').join(' '),
  )
  // Text node by text node: textContent would glue neighbouring elements ("Sign inPendiente").
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT)
  const texts: string[] = []
  while (walker.nextNode()) texts.push(walker.currentNode.textContent ?? '')
  return `${texts.join(' ')} ${labels.join(' ')} ${document.title}`
}

/** Strings from the other staff languages that are present on screen while `lang` is active. */
function foreignStrings(lang: StaffLang): string[] {
  const own = copyStrings(staffCopy[lang])
  const text = screenText()
  const found: string[] = []
  for (const other of STAFF_LANGS.filter((l) => l !== lang)) {
    for (const [path, fragments] of copyStrings(staffCopy[other])) {
      const ownFragments = own.get(path) ?? []
      for (const fragment of fragments) {
        if (fragment.length < 4 || ownFragments.includes(fragment)) continue
        if (new RegExp(`(^|[^\\p{L}])${escapeRegExp(fragment)}($|[^\\p{L}])`, 'u').test(text)) found.push(`${other}${path}: "${fragment}"`)
      }
    }
  }
  return found
}

describe('staff interface language', () => {
  it('defaults to English with a visible selector offering English, Basque and Spanish', async () => {
    const { api } = fakeApi({ email: null })
    renderStaff(api)
    await screen.findByRole('heading', { name: staffCopy.en.login.heading })
    const select = staffLanguageSelect(staffCopy.en)
    expect(select.value).toBe('en')
    expect([...select.options].map((o) => [o.value, o.textContent])).toEqual(STAFF_LANGS.map((l) => [l, STAFF_LANG_NAMES[l]]))
    expect(document.documentElement.lang).toBe('en')
    screen.getByText(staffCopy.en.languageLabel)
  })

  it.each(STAFF_LANGS)('switching to %s retranslates login, denied and dashboard screens with nothing left over', async (target) => {
    const start: StaffLang = target === 'en' ? 'es' : 'en'
    const c = staffCopy[target]

    const login = fakeApi({ email: null })
    const loginView = renderStaff(login.api, start)
    await screen.findByRole('heading', { name: staffCopy[start].login.heading })
    switchStaffLanguage(staffCopy[start], target)
    await screen.findByRole('heading', { name: c.login.heading })
    fireEvent.change(screen.getByLabelText(c.login.email), { target: { value: 'staff@iturrieta.test' } })
    fireEvent.change(screen.getByLabelText(c.login.password), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: c.login.submit }))
    await screen.findByText(c.login.invalid)
    expect(foreignStrings(target)).toEqual([])
    loginView.unmount()

    const denied = fakeApi({ staff: false })
    const deniedView = renderStaff(denied.api, start)
    await screen.findByRole('heading', { name: staffCopy[start].denied.heading })
    switchStaffLanguage(staffCopy[start], target)
    await screen.findByRole('heading', { name: c.denied.heading })
    expect(foreignStrings(target)).toEqual([])
    deniedView.unmount()

    const pending = row({ reference: 'IT-PENDING1', notes: 'x' })
    const dash = fakeApi({ rows: [pending, row({ reference: 'IT-CONFIRM1', status: 'confirmed', source: 'phone' }), row({ reference: 'IT-LEGACY01', status: 'cancelled', source: null })] })
    dash.api.setStatus.mockResolvedValue({ ...pending, status: 'confirmed' })
    renderStaff(dash.api, start)
    const s = staffCopy[start]
    fireEvent.click(await screen.findByRole('button', { name: `${s.actions.confirmed} IT-PENDING1` }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(s.actions.updated('IT-PENDING1', s.status.confirmed)))
    fireEvent.click(screen.getByRole('button', { name: s.phone.submit }))
    await screen.findByText(s.validation.name_required)

    switchStaffLanguage(s, target)
    await screen.findByRole('heading', { name: c.title })
    expect(screen.getByRole('status').textContent).toBe(c.actions.updated('IT-PENDING1', c.status.confirmed))
    screen.getByText(c.validation.name_required)
    screen.getByText(c.list.count(3, false))
    expect(document.documentElement.lang).toBe(target)
    expect(document.title).toBe(`${c.title} · Iturrieta`)
    expect(foreignStrings(target)).toEqual([])
  })

  it('the leftover-string check really detects a string from another staff language', async () => {
    renderStaff(fakeApi({ email: null }).api)
    await screen.findByRole('heading', { name: staffCopy.en.login.heading })
    expect(foreignStrings('en')).toEqual([])
    const planted = document.createElement('p')
    planted.textContent = staffCopy.es.status.pending
    document.body.append(planted)
    expect(foreignStrings('en')).toEqual(['es.status.pending: "Pendiente"'])
    planted.remove()
  })

  it('keeps the chosen language after a refresh', async () => {
    const first = fakeApi({ email: null })
    const view = renderStaff(first.api)
    await screen.findByRole('heading', { name: staffCopy.en.login.heading })
    switchStaffLanguage(staffCopy.en, 'eu')
    await screen.findByRole('heading', { name: staffCopy.eu.login.heading })
    view.unmount()

    renderStaff(fakeApi({ email: null }).api)
    await screen.findByRole('heading', { name: staffCopy.eu.login.heading })
    expect(staffLanguageSelect(staffCopy.eu).value).toBe('eu')
  })

  it('is independent of the public website language in both directions', async () => {
    window.localStorage.setItem('iturrieta.lang', 'de')
    const staffView = renderStaff(fakeApi({ email: null }).api)
    await screen.findByRole('heading', { name: staffCopy.en.login.heading })
    switchStaffLanguage(staffCopy.en, 'es')
    await screen.findByRole('heading', { name: staffCopy.es.login.heading })
    expect(window.localStorage.getItem('iturrieta.lang')).toBe('de')
    expect(window.localStorage.getItem(STAFF_LANG_STORAGE_KEY)).toBe('es')
    staffView.unmount()

    const site = render(
      <MemoryRouter initialEntries={['/']}>
        <Root />
      </MemoryRouter>,
    )
    expect(document.documentElement.lang).toBe('de')
    chooseLanguage('fr')
    expect(window.localStorage.getItem('iturrieta.lang')).toBe('fr')
    expect(window.localStorage.getItem(STAFF_LANG_STORAGE_KEY)).toBe('es')
    site.unmount()

    renderStaff(fakeApi({ email: null }).api)
    await screen.findByRole('heading', { name: staffCopy.es.login.heading })
  })

  it('explains a missing configuration in the staff language', () => {
    window.localStorage.setItem(STAFF_LANG_STORAGE_KEY, 'eu')
    render(<StaffApp config={{ ok: false, problem: 'missing' }} />)
    screen.getByText(staffCopy.eu.unconfigured)
  })

  it('is served at /staff outside the public layout', async () => {
    render(
      <MemoryRouter initialEntries={['/staff']}>
        <Root />
      </MemoryRouter>,
    )
    await screen.findByText(staffCopy.en.unconfigured)
    expect(document.querySelector('.site-header')).toBeNull()
    expect(document.querySelector('.site-footer')).toBeNull()
  })

  it('has the same keys and no empty strings in every language', () => {
    const keys = (lang: StaffLang) => [...copyStrings(staffCopy[lang]).keys()].sort()
    for (const lang of STAFF_LANGS) {
      expect(keys(lang)).toEqual(keys('en'))
      for (const [path, fragments] of copyStrings(staffCopy[lang])) expect(fragments.join(''), `${lang}${path}`).not.toBe('')
    }
  })
})

describe('staff login route and dashboard protection (mocked StaffApi)', () => {
  const en = staffCopy.en
  /** A session-aware fake: signIn succeeds only for the given password and emits the session. */
  function sessionApi(options: { staff?: boolean; password?: string; session?: string | null } = {}) {
    const fake = fakeApi({ email: options.session ?? null, staff: options.staff ?? true })
    fake.api.signIn.mockImplementation(async (email: string, password: string) => {
      if (password !== (options.password ?? 'correct-horse')) return { ok: false, error: 'invalid_credentials' }
      await fake.emit(email)
      return { ok: true }
    })
    return fake
  }
  const signIn = async (email: string, password: string) => {
    fireEvent.change(screen.getByLabelText(en.login.email), { target: { value: email } })
    fireEvent.change(screen.getByLabelText(en.login.password), { target: { value: password } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: en.login.submit }))
    })
  }

  it('serves the login page directly at /staff/login, including after a refresh', async () => {
    const first = renderStaff(sessionApi().api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    expect(currentPath()).toBe('/staff/login')
    first.unmount()
    renderStaff(sessionApi().api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    expect(currentPath()).toBe('/staff/login')
  })

  it('redirects signed-out visitors from /staff to /staff/login without loading reservations', async () => {
    const { api } = sessionApi()
    renderStaff(api, undefined, '/staff')
    await screen.findByRole('heading', { name: en.login.heading })
    expect(currentPath()).toBe('/staff/login')
    expect(api.listReservations).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: en.title })).toBeNull()
  })

  it('never shows dashboard content while staff access is still being checked', async () => {
    const { api } = sessionApi({ session: 'staff@iturrieta.test' })
    api.isStaff.mockReturnValue(new Promise(() => {}))
    renderStaff(api, undefined, '/staff')
    await screen.findByText(en.login.verifying)
    expect(screen.queryByRole('heading', { name: en.title })).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
    expect(api.listReservations).not.toHaveBeenCalled()
  })

  it('validates the form before contacting Supabase', async () => {
    const { api } = sessionApi()
    renderStaff(api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    await signIn('not-an-email', '')
    screen.getByText(en.login.emailInvalid)
    screen.getByText(en.login.passwordRequired)
    expect(screen.getByLabelText(en.login.email).getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(screen.getByLabelText(en.login.email))
    expect(api.signIn).not.toHaveBeenCalled()
  })

  it('reports invalid credentials and connection failures', async () => {
    const { api } = sessionApi()
    renderStaff(api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    await signIn('staff@iturrieta.test', 'wrong')
    expect(screen.getByRole('alert').textContent).toBe(en.login.invalid)
    api.signIn.mockResolvedValueOnce({ ok: false, error: 'network' })
    await signIn('staff@iturrieta.test', 'whatever')
    expect(screen.getByRole('alert').textContent).toBe(en.login.network)
    expect(currentPath()).toBe('/staff/login')
  })

  it('disables the form while signing in', async () => {
    const { api } = sessionApi()
    api.signIn.mockReturnValue(new Promise(() => {}))
    renderStaff(api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    await signIn('staff@iturrieta.test', 'correct-horse')
    const button = screen.getByRole('button', { name: en.login.submitting }) as HTMLButtonElement
    expect(button.closest('fieldset')?.disabled).toBe(true)
    expect(api.signIn).toHaveBeenCalledTimes(1)
  })

  it('shows and hides the password', async () => {
    renderStaff(sessionApi().api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    const password = screen.getByLabelText(en.login.password) as HTMLInputElement
    expect(password.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: en.login.showPassword }))
    expect(password.type).toBe('text')
    expect(screen.getByRole('button', { name: en.login.hidePassword }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: en.login.hidePassword }))
    expect(password.type).toBe('password')
  })

  it('opens the dashboard after a successful login of an authorized staff member', async () => {
    const { api } = sessionApi()
    renderStaff(api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    await signIn(' staff@iturrieta.test ', 'correct-horse')
    await screen.findByRole('heading', { name: en.title })
    expect(currentPath()).toBe('/staff')
    expect(api.signIn).toHaveBeenCalledWith('staff@iturrieta.test', 'correct-horse')
    expect(api.isStaff).toHaveBeenCalled()
    expect(api.listReservations).toHaveBeenCalled()
  })

  it('denies an authenticated user who is not staff, on the login page and on /staff', async () => {
    const { api } = sessionApi({ staff: false })
    renderStaff(api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.login.heading })
    await signIn('guest@example.test', 'correct-horse')
    await screen.findByRole('heading', { name: en.denied.heading })
    expect(api.listReservations).not.toHaveBeenCalled()

    const again = sessionApi({ staff: false, session: 'guest@example.test' })
    renderStaff(again.api, undefined, '/staff')
    expect((await screen.findAllByRole('heading', { name: en.denied.heading })).length).toBeGreaterThan(0)
    expect(again.api.listReservations).not.toHaveBeenCalled()
  })

  it('keeps an existing session after a refresh: /staff and /staff/login both lead to the dashboard', async () => {
    const first = renderStaff(sessionApi({ session: 'staff@iturrieta.test' }).api, undefined, '/staff')
    await screen.findByRole('heading', { name: en.title })
    first.unmount()
    renderStaff(sessionApi({ session: 'staff@iturrieta.test' }).api, undefined, '/staff/login')
    await screen.findByRole('heading', { name: en.title })
    expect(currentPath()).toBe('/staff')
  })

  it('signs out to the login page, after which /staff is no longer reachable', async () => {
    const { api } = sessionApi({ session: 'staff@iturrieta.test' })
    const view = renderStaff(api, undefined, '/staff')
    await screen.findByRole('heading', { name: en.title })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: en.signOut }))
    })
    await screen.findByRole('heading', { name: en.login.heading })
    expect(api.signOut).toHaveBeenCalled()
    expect(currentPath()).toBe('/staff/login')
    view.unmount()

    const after = sessionApi({ session: null })
    renderStaff(after.api, undefined, '/staff')
    await screen.findByRole('heading', { name: en.login.heading })
    expect(currentPath()).toBe('/staff/login')
    expect(after.api.listReservations).not.toHaveBeenCalled()
  })

  it('sends unknown staff sub-paths back to the protected dashboard route', async () => {
    renderStaff(sessionApi().api, undefined, '/staff/anything')
    await screen.findByRole('heading', { name: en.login.heading })
    expect(currentPath()).toBe('/staff/login')
  })

  it.each(STAFF_LANGS)('translates the new login controls in %s', async (lang) => {
    const c = staffCopy[lang]
    renderStaff(sessionApi().api, lang, '/staff/login')
    await screen.findByRole('heading', { name: c.login.heading })
    screen.getByRole('button', { name: c.login.showPassword })
    screen.getByRole('link', { name: c.login.backToSite })
    fireEvent.click(screen.getByRole('button', { name: c.login.submit }))
    await screen.findByText(c.login.emailInvalid)
    screen.getByText(c.login.passwordRequired)
  })
})

describe('searchFilter', () => {
  it('drops characters that could alter the PostgREST filter', () => {
    expect(searchFilter('  ')).toBeNull()
    expect(searchFilter('Miren')).toBe('guest_name.ilike."*Miren*"')
    expect(searchFilter('a),status.eq.confirmed,(b')).toBe('guest_name.ilike."*a status eq confirmed b*"')
    expect(searchFilter('600 11')).toBe('guest_name.ilike."*600 11*",phone.ilike."*60011*"')
    expect(searchFilter('"*%\\')).toBeNull()
  })
})
