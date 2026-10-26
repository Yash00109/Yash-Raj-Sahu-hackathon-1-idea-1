import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { stubMatchMedia } from './matchMedia'

beforeEach(() => {
  stubMatchMedia()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.documentElement.lang = 'es'
})
