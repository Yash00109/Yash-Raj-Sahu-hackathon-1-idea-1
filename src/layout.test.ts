/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// jsdom has no layout engine, so these tests guard the CSS rules behind the hero clipping
// bug (fixed viewport heights, width-only sizing, a large minimum image width, page-wide
// transforms). The rendered layout is checked in a real browser (see docs/SETUP.md).

// Read from disk: Vitest replaces CSS imports (even ?raw) with empty strings.
const files = ['src/index.css', 'src/App.css', 'src/pages.css', 'src/staff/staff.css'].map((path) => ({ path, css: readFileSync(path, 'utf8') }))

it('reads real stylesheets (guards against silently testing empty CSS)', () => {
  for (const { path, css } of files) expect(css.length, path).toBeGreaterThan(1000)
})

interface Rule {
  file: string
  media: string
  selectors: string[]
  body: string
}

/** Flat rule list; nested blocks only occur inside @media / @supports here. */
function rules(): Rule[] {
  const out: Rule[] = []
  for (const { path, css } of files) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
    let media = ''
    let depth = 0
    const re = /([^{}]*)\{|\}/g
    let match: RegExpExecArray | null
    let pending: { head: string; start: number } | null = null
    while ((match = re.exec(clean))) {
      if (match[0] === '}') {
        if (pending) {
          out.push({ file: path, media, selectors: pending.head.split(',').map((s) => s.trim()), body: clean.slice(pending.start, match.index) })
          pending = null
        } else if (--depth === 0) media = ''
        continue
      }
      const head = match[1].trim()
      if (head.startsWith('@media') || head.startsWith('@supports')) {
        depth++
        media = head
      } else if (head.startsWith('@keyframes')) {
        depth++
      } else {
        pending = { head, start: re.lastIndex }
      }
    }
  }
  return out
}

const all = rules()
const declaration = (rule: Rule, property: string) => new RegExp(`(^|[;\\s])${property}\\s*:\\s*([^;]+)`).exec(rule.body)?.[2].trim()
const find = (selector: string, media = '') => all.filter((r) => r.selectors.includes(selector) && r.media === media)

describe('layout guards against fixed-height clipping', () => {
  it('never sets an exact viewport height (min-height lets content grow; height does not)', () => {
    const offenders = all.filter((r) => /(^|[;\s])height\s*:[^;]*\b\d+(\.\d+)?(vh|svh|dvh|lvh)\b/.test(r.body)).map((r) => `${r.file} ${r.selectors.join(',')}`)
    expect(offenders).toEqual([])
  })

  it('lets the hero grow with its content', () => {
    const [hero] = find('.hero')
    expect(declaration(hero, 'min-height')).toBe('100svh')
    expect(declaration(hero, 'height')).toBeUndefined()
  })

  it('sizes the hero title by both width and height', () => {
    const [title] = find('.hero__title')
    expect(declaration(title, 'font-size')).toMatch(/min\([^)]*vw[^)]*svh/)
  })

  it('lets the hero photographs shrink with a short window', () => {
    const [stage] = find('.stage')
    expect(declaration(stage, 'width')).toMatch(/svh/)
    const minWidth = /(\d+)px/.exec(declaration(stage, 'min-width') ?? '')
    expect(Number(minWidth?.[1] ?? 0)).toBeLessThanOrEqual(300)
  })

  it('leads with the heading and booking button on short stacked screens', () => {
    const [stage] = find('.stage', '@media (max-width: 900px) and (max-height: 760px)')
    expect(declaration(stage, 'order')).toBe('0')
  })

  it('never transforms, scales or zooms the page itself', () => {
    const pageLevel = ['html', 'body', '#root', 'main', '.page-view', '.hero', '.hero__inner', '.staff', '.staff__main']
    const offenders = all
      .filter((r) => r.selectors.some((s) => pageLevel.includes(s)))
      .filter((r) => ['transform', 'scale', 'zoom', 'translate', 'rotate'].some((p) => declaration(r, p)))
      .map((r) => `${r.file} ${r.selectors.join(',')}`)
    expect(offenders).toEqual([])
    const keyframes = files.flatMap(({ css }) => [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]))
    const pageAnimations = all.filter((r) => r.selectors.some((s) => pageLevel.includes(s))).map((r) => declaration(r, 'animation') ?? '')
    for (const animation of pageAnimations.filter(Boolean)) {
      const name = keyframes.find((k) => animation.includes(k))
      const body = files.map(({ css }) => new RegExp(`@keyframes\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css)?.[1] ?? '').join('')
      expect(body, `page-level animation ${name}`).not.toMatch(/transform|scale|translate|rotate|zoom/)
    }
  })
})
