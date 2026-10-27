import type { Lang } from '../i18n/copy'
import type { PageKey } from '../routes'

const base = 'https://www.iturrieta.eus'

type Sources = Record<Exclude<Lang, 'de'>, string[]>

/**
 * Official pages each route's content was taken from (read on 27 Oct 2026), per language.
 * There is no official German site, so German pages cite the English pages they were translated from.
 */
const pages: Record<PageKey, Sources> = {
  menus: {
    es: [`${base}/Castellano/MENUS/`],
    eu: [`${base}/Euskara/MENUAK/`],
    en: [`${base}/English/MENUS/`],
    fr: [`${base}/Fran-ais/MENUS/`],
  },
  about: {
    es: [`${base}/Castellano/Quienes-somos/`],
    eu: [`${base}/Euskara/Nortzuk-garen/`],
    en: [`${base}/English/About-us/`],
    fr: [`${base}/Fran-ais/Qui-sommes-nous/`],
  },
  visits: {
    es: [`${base}/Castellano/VISITAS-GUIADAS/`],
    eu: [`${base}/Euskara/BISITA-GIDATUAK/`],
    en: [`${base}/English/GUIDED-TOURS/`],
    fr: [`${base}/Fran-ais/VISITES-GUIDEE/`],
  },
  products: {
    es: [`${base}/Castellano/TIENDA/`, `${base}/Castellano/Que-elaboramos/`],
    eu: [`${base}/Euskara/DENDA/`, `${base}/Euskara/Zer-ekoizten-dugu/`],
    en: [`${base}/English/SHOP/`, `${base}/English/What-do-we-produce/`],
    fr: [`${base}/Fran-ais/BOUTIQUE/`, `${base}/Fran-ais/Ce-que-nous-faisons/`],
  },
  concerts: {
    es: [`${base}/`],
    eu: [`${base}/Euskara/`],
    en: [`${base}/English/`],
    fr: [`${base}/Fran-ais/`],
  },
  location: {
    es: [`${base}/Castellano/CONTACTO/`, `${base}/Castellano/COMO-LLEGAR/`, `${base}/Castellano/AUTOBUS/`, `${base}/Castellano/Donde-estamos/`],
    eu: [`${base}/Euskara/KONTAKTUA/`, `${base}/Euskara/Nortzuk-garen/`],
    en: [`${base}/English/CONTACT/`, `${base}/English/Where-we-are/`],
    fr: [`${base}/Fran-ais/CONTACTEZ-NOUS/`, `${base}/Fran-ais/Qui-sommes-nous/`],
  },
}

export const officialSources: Record<PageKey, Record<Lang, string[]>> = Object.fromEntries(
  Object.entries(pages).map(([key, byLang]) => [key, { ...byLang, de: byLang.en }]),
) as Record<PageKey, Record<Lang, string[]>>
