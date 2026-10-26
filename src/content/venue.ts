/**
 * Venue facts and imagery for Sidrería Iturrieta.
 *
 * Everything here was read from the official website (https://www.iturrieta.eus/,
 * plus its /Euskara/ and /English/ versions) on 26 Oct 2026. Prices, hours and
 * seasons must be re-confirmed with the venue before launch; they are kept here
 * rather than inside components so they can be replaced by configuration later.
 */

export const VERIFIED_ON = '2026-10-26'
export const OFFICIAL_SITE = 'https://www.iturrieta.eus/'

export const venue = {
  name: 'Iturrieta Sagardotegia',
  address: 'Arraga auzoa, 2 · 01169 Aramaio (Álava)',
  phoneDisplay: '685 72 15 93',
  phoneHref: 'tel:+34685721593',
  whatsappHref: 'https://wa.me/34685721593',
  email: 'info@iturrieta.eus',
  instagramHandle: '@iturrietasagardotegia',
  instagramHref: 'https://www.instagram.com/iturrietasagardotegia/',
  mapsHref:
    'https://www.google.com/maps/search/?api=1&query=Iturrieta+Sagardotegia+Arraga+Aramaio',
  hours: { opens: '13:00', closes: '16:00' },
  appleTrees: '1.400',
  founded: 1998,
  menuPrice: 45,
  kidsMenuPrice: 16,
} as const

export type VenueImageKey =
  | 'caserioStone'
  | 'caserioValley'
  | 'kupelas'
  | 'terrace'
  | 'apple'
  | 'harvest'

export interface VenueImage {
  src: string
  width: number
  height: number
  /** Original file on the official website. */
  sourceUrl: string
  /** Photographer credit when one is visible on the image itself. */
  credit?: string
}

/**
 * Authentic venue photographs, copied unmodified from the official website's
 * /assets/ folder. Replace with client-approved originals (higher resolution)
 * before launch; keep `sourceUrl` up to date when swapping files.
 */
export const venueImages: Record<VenueImageKey, VenueImage> = {
  caserioStone: {
    src: '/images/venue/caserio-piedra.jpg',
    width: 1500,
    height: 1000,
    sourceUrl: 'https://www.iturrieta.eus/assets/caserio-piedra.jpg',
    credit: 'Enekografía',
  },
  caserioValley: {
    src: '/images/venue/caserio.jpg',
    width: 1024,
    height: 609,
    sourceUrl: 'https://www.iturrieta.eus/assets/caserio.jpg',
  },
  kupelas: {
    src: '/images/venue/kupelas.jpg',
    width: 1170,
    height: 1076,
    sourceUrl: 'https://www.iturrieta.eus/assets/kupelas.jpg',
  },
  terrace: {
    src: '/images/venue/terraza.jpg',
    width: 1500,
    height: 1125,
    sourceUrl: 'https://www.iturrieta.eus/assets/terraza.jpg',
  },
  apple: {
    src: '/images/venue/manzana-negro.jpg',
    width: 1600,
    height: 1599,
    sourceUrl: 'https://www.iturrieta.eus/assets/manzana-negro.jpg',
    credit: 'Enekografía',
  },
  harvest: {
    src: '/images/venue/v-manzanas.jpg',
    width: 1728,
    height: 730,
    sourceUrl: 'https://www.iturrieta.eus/assets/v-manzanas.jpg',
  },
}

export const logo = {
  light: '/images/venue/logo-blanco.png',
  dark: '/images/venue/logo.png',
  sourceUrl: 'https://www.iturrieta.eus/assets/logo-blanco.png',
}
