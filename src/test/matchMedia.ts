import { vi } from 'vitest'

/** jsdom has no matchMedia; this stub reports `matches` only for the queries listed. */
export function stubMatchMedia(matchingQueries: string[] = []) {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: matchingQueries.includes(query),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}
