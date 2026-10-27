import { languages, type Lang } from './copy'

const locales = Object.fromEntries(languages.map(({ code, locale }) => [code, locale])) as Record<Lang, string>

const longDate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}

export const localeFor = (lang: Lang) => locales[lang]

/**
 * Formats a `yyyy-mm-dd` value for the request summary in the selected language.
 *
 * Runtimes built with reduced ICU data (some headless and embedded browsers) do not
 * ship Basque, and `toLocaleDateString` would then silently answer in the runtime's
 * default language. In that case this returns the unambiguous ISO date instead, so
 * a Basque message never contains an English or Spanish date.
 */
export function formatRequestDate(iso: string, lang: Lang): string {
  const locale = locales[lang]
  if (Intl.DateTimeFormat.supportedLocalesOf([locale]).length === 0) return iso
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(locale, longDate)
}
