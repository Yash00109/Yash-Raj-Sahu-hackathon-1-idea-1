import { createContext, useContext } from 'react'
import { DEFAULT_STAFF_LANG, STAFF_LANGS, staffCopy, type StaffCopy, type StaffLang } from './staffCopy'

/** Separate from the public site's `iturrieta.lang`, so neither choice changes the other. */
export const STAFF_LANG_STORAGE_KEY = 'iturrieta.staff.lang'

const isStaffLang = (value: unknown): value is StaffLang => STAFF_LANGS.some((lang) => lang === value)

export function readStaffLang(): StaffLang {
  try {
    const stored = window.localStorage.getItem(STAFF_LANG_STORAGE_KEY)
    return isStaffLang(stored) ? stored : DEFAULT_STAFF_LANG
  } catch {
    return DEFAULT_STAFF_LANG
  }
}

export function writeStaffLang(lang: StaffLang) {
  try {
    window.localStorage.setItem(STAFF_LANG_STORAGE_KEY, lang)
  } catch {
    // Storage can be unavailable (private mode); the choice simply won't persist.
  }
}

export const StaffCopyContext = createContext<StaffCopy>(staffCopy[DEFAULT_STAFF_LANG])

export const useStaffCopy = () => useContext(StaffCopyContext)
