/**
 * Venue facts and imagery for Sidrería Iturrieta.
 *
 * Everything here was read from the official website (https://www.iturrieta.eus/,
 * plus its /Euskara/ and /English/ versions) on 26–27 Oct 2026. Prices, hours and
 * seasons must be re-confirmed with the venue before launch; they are kept here
 * rather than inside components so they can be replaced by configuration later.
 */

export const VERIFIED_ON = '2026-10-27'
export const OFFICIAL_SITE = 'https://www.iturrieta.eus/'

export const venue = {
  name: 'Iturrieta Sagardotegia',
  address: 'Arraga auzoa, 2 · 01169 Aramaio (Álava)',
  coordinates: '43º03\'08"N 2º34\'30"O',
  phoneDisplay: '685 72 15 93',
  phoneHref: 'tel:+34685721593',
  whatsappHref: 'https://wa.me/34685721593',
  email: 'info@iturrieta.eus',
  shopEmail: 'denda@iturrieta.eus',
  instagramHandle: '@iturrietasagardotegia',
  instagramHref: 'https://www.instagram.com/iturrietasagardotegia/',
  mapsHref:
    'https://www.google.com/maps/search/?api=1&query=Iturrieta+Sagardotegia+Arraga+Aramaio',
  /** Route links published on the official contact page, in the order shown there. */
  mapsRoutes: {
    vitoria: 'https://maps.app.goo.gl/6z9seQtXJCRoN2EN7?g_st=awb',
    donostia: 'https://maps.app.goo.gl/iA1ouxB4eVfCW6Mi6',
    bilbao: 'https://maps.app.goo.gl/qLRioT1N9eYtKQ9BA',
  },
  hours: { opens: '13:00', closes: '16:00' },
  appleTrees: '1.400',
  founded: 1998,
  menuPrice: 45,
  kidsMenuPrice: 16,
} as const

export interface VenueImage {
  src: string
  width: number
  height: number
  /** Original file on the official website. */
  sourceUrl: string
  /** Photographer credit when one is visible on the image itself. */
  credit?: string
  /** The file carries a social-media carousel counter along its top edge, so crop it away. */
  trim?: 'top'
}

const official = (file: string, width: number, height: number, extra: Partial<VenueImage> = {}): VenueImage => ({
  src: `/images/venue/${file}`,
  width,
  height,
  sourceUrl: `https://www.iturrieta.eus/assets/${file}`,
  ...extra,
})

const eneko = { credit: 'Enekografía' }

/**
 * Authentic venue photographs, copied unmodified from the official website's
 * /assets/ folder. Replace with client-approved originals (higher resolution)
 * before launch; keep `sourceUrl` up to date when swapping files.
 *
 * Deliberately not used: `botellas-gama.jpg` (shows other producers' brands),
 * `mapa.jpg` (Google Maps imagery) and `atardecer.jpg` (burned-in timestamp).
 */
export const venueImages = {
  caserioStone: official('caserio-piedra.jpg', 1500, 1000, eneko),
  caserioValley: official('caserio.jpg', 1024, 609),
  caserioSummer: official('caserio-verano.jpg', 1170, 779),
  kupelas: official('kupelas.jpg', 1170, 1076, { trim: 'top' }),
  terrace: official('terraza.jpg', 1500, 1125),
  snowTerrace: official('nevada.jpg', 1350, 1800),
  apple: official('manzana-negro.jpg', 1600, 1599, eneko),
  harvest: official('v-manzanas.jpg', 1728, 730),
  valley: official('aramaio.jpg', 1600, 1067, eneko),
  valleyPortrait: official('valle-aramaio.jpg', 1000, 1500, eneko),
  snowTree: official('manzano-nieve.jpg', 1125, 1500),
  press: official('prensa.jpg', 1125, 1500),
  fermenting: official('v-kupela.jpg', 720, 1170),
  concert: official('v-conciertos.jpg', 750, 1284),
  cod: official('bacalao.jpg', 1280, 1600, eneko),
  octopus: official('pulpo.jpg', 1600, 1066, eneko),
  steakPlated: official('chuleton-plato.jpg', 1080, 1350, eneko),
  steaksRaw: official('chuleton.jpg', 1500, 1201, eneko),
  grill: official('parrilla.jpg', 1202, 1500, eneko),
  kitchen: official('cocina.jpg', 1600, 1278, eneko),
  diningRoom: official('comedor.jpg', 1170, 1065, { trim: 'top' }),
  ciderBottle: official('sidra-botella.jpg', 439, 802),
  juiceBottles: official('botellas-zumo.jpg', 1170, 1160),
  sparklingBottles: official('botellas-brut.jpg', 586, 765),
  ciderAndJuice: official('producto-manzanas.jpg', 1330, 1480),
  hamper: official('cesta-productos.jpg', 1170, 919, { trim: 'top' }),
} satisfies Record<string, VenueImage>

export type VenueImageKey = keyof typeof venueImages

export const logo = {
  light: '/images/venue/logo-blanco.png',
  dark: '/images/venue/logo.png',
  sourceUrl: 'https://www.iturrieta.eus/assets/logo-blanco.png',
}
