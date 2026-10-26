import { describe, expect, it, vi } from 'vitest'
import { formatRequestDate } from './formatDate'

const runtimeHasBasque = Intl.DateTimeFormat.supportedLocalesOf(['eu-ES']).length > 0

describe('formatRequestDate', () => {
  it('formats Spanish and English long dates in their own language', () => {
    const es = formatRequestDate('2030-05-02', 'es')
    expect(es).toContain('jueves')
    expect(es).toContain('2 de mayo de 2030')
    const en = formatRequestDate('2030-05-02', 'en')
    expect(en).toContain('Thursday')
    expect(en).toContain('2 May 2030')
  })

  it.runIf(runtimeHasBasque)('formats Basque dates with Basque month and weekday names when the runtime supports eu', () => {
    const formatted = formatRequestDate('2030-05-02', 'eu')
    expect(formatted).toContain('maiatzaren')
    expect(formatted).toContain('osteguna')
    expect(formatted).not.toContain('Thursday')
  })

  it('falls back to the language-neutral ISO date when the locale is unsupported', () => {
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockReturnValue([])
    expect(formatRequestDate('2030-05-02', 'eu')).toBe('2030-05-02')
  })
})
