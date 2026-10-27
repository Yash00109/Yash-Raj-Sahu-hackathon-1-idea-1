import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { stubMatchMedia } from './matchMedia'

beforeEach(() => {
  stubMatchMedia()
  // jsdom implements neither; route changes call them.
  vi.stubGlobal('scrollTo', () => {})
  Element.prototype.scrollIntoView = () => {}
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.documentElement.lang = 'es'
})
