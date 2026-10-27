import type { Copy, Lang } from '../i18n/copy'
import type { SiteCopy } from '../i18n/site'

export interface PageProps {
  t: Copy
  s: SiteCopy
  lang: Lang
}
