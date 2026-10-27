import { officialSources } from '../content/sources'
import type { Lang } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'
import type { PageKey } from '../routes'

export function SourceNote({ page, lang, s }: { page: PageKey; lang: Lang; s: SiteCopy }) {
  const urls = officialSources[page][lang]
  return (
    <aside className="source-note container">
      <p>
        {s.sourceNote}{' '}
        {urls.map((url, index) => (
          <span key={url}>
            {index > 0 && ' · '}
            <a href={url} target="_blank" rel="noreferrer">
              {s.sourceLink}
              {urls.length > 1 ? ` ${index + 1}` : ''} ↗
            </a>
          </span>
        ))}
      </p>
    </aside>
  )
}
