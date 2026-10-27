import { useEffect, useState } from 'react'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')

/**
 * Fades `.reveal` elements in as they enter the viewport; content stays visible without JS or with reduced motion.
 * Pass the current route as `scope` so elements of a newly rendered page are observed too.
 */
export function useScrollReveal(enabled: boolean, scope?: string) {
  useEffect(() => {
    const root = document.documentElement
    if (!enabled || !('IntersectionObserver' in window)) {
      root.classList.remove('reveal-ready')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )

    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => observer.observe(el))
    root.classList.add('reveal-ready')

    return () => observer.disconnect()
  }, [enabled, scope])
}
