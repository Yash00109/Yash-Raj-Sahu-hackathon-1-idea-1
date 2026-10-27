import type { Lang } from '../../i18n/copy'
import type { VenueImageKey } from '../venue'

/** Dish names exactly as published: Basque name, then the Spanish description (all three language versions use these). */
export interface Dish {
  eu: string
  es: string
}

export const ciderMenuDishes: Dish[] = [
  { eu: 'Txorizoa sagardotan', es: 'Chorizo a la sidra' },
  { eu: 'Bakailao nahaskia', es: 'Revuelto de bacalao' },
  { eu: 'Bakailaoa piper erretan eta tipula sagardotan', es: 'Bacalao con pimientos asados y cebolla a la sidra' },
  { eu: 'Txuletoia parrillan', es: 'Chuletón a la parrilla' },
  { eu: 'Idiazabal gazta, irasagarra eta intxaurrak', es: 'Queso Idiazabal, membrillo y nueces' },
  { eu: 'Sagardo «Iturrieta» ECO', es: 'Sidra natural ecológica de la casa' },
]

export const kidsMenuDishes: Dish[] = [
  { eu: 'Makarroiak eta fritoak', es: 'Macarrones y fritos' },
  { eu: 'Oilasko paparra edo etxeko hanburgesa', es: 'Pechuga de pollo o hamburguesa casera' },
  { eu: 'Izozkia', es: 'Helado' },
  { eu: 'Sagar zuku ekologikoa eta ura', es: 'Zumo de manzana ecológico y agua' },
]

/** Gallery order and photos as on the official menus page; captions below follow the same order. */
export const grillGallery: VenueImageKey[] = [
  'cod',
  'octopus',
  'steakPlated',
  'steaksRaw',
  'grill',
  'kitchen',
  'diningRoom',
  'kupelas',
]

export interface MenusContent {
  eyebrow: string
  title: string
  lede: string
  cider: { label: string; title: string; price: string; note: string }
  grill: { title: string; body: string }
  seasonal: { label: string; title: string; price: string; note: string; body: string }
  kids: { label: string; title: string; price: string }
  galleryTitle: string
  galleryCaptions: string[]
  events: { title: string; body: string; capacity: string }
  cta: { title: string; body: string }
}

export const menusContent: Record<Lang, MenusContent> = {
  es: {
    eyebrow: 'Sagardotegiko menua',
    title: 'Nuestros menús',
    lede: 'El clásico menú de sidrería, regado con nuestra sidra natural ecológica directa del txotx.',
    cider: {
      label: 'Sagardotegiko menua',
      title: 'Menú de sidrería',
      price: '45€ por persona',
      note: 'Sidra del txotx incluida, de enero a mayo; en botella el resto del año.',
    },
    grill: { title: 'De la parrilla', body: 'Chuletón a la brasa, como manda la sidrería.' },
    seasonal: {
      label: 'Sasoiko menua · cambia a lo largo del año',
      title: 'Menú de temporada',
      price: '45€ por persona',
      note: 'Mismo precio que el menú de sidrería.',
      body: 'Los platos dependen de la temporada en la que vengas: cocinamos con el producto de cada época del año. Llámanos y te contamos qué estamos sirviendo ahora.',
    },
    kids: { label: 'Umeen menua', title: 'Menú infantil', price: '16€ por niño/a' },
    galleryTitle: 'Así sale de la parrilla',
    galleryCaptions: [
      'Bacalao con pimientos y cebolla crujiente',
      'Pulpo a la brasa',
      'Chuletón, ya en el plato',
      'Chuletones antes de la brasa',
      'La parrilla de carbón',
      'La cocina, en pleno servicio',
      'El comedor de la sidrería',
      'Las kupelas, listas para el txotx',
    ],
    events: {
      title: 'Tu evento especial, a tu medida.',
      body: 'Para celebraciones y encuentros especiales —como bodas— adaptamos el menú a tus necesidades. Diseñamos juntos un evento, gastronómico y de ambiente, para pasar un día inolvidable.',
      capacity: 'Disponemos de capacidad para 90 comensales y servicio de autobús desde Debagoiena.',
    },
    cta: {
      title: '¿Reservamos mesa?',
      body: 'Vive la experiencia del txotx en Iturrieta. Reserva tu mesa o tu visita guiada en Aramaio.',
    },
  },
  eu: {
    eyebrow: 'Sagardotegiko menua',
    title: 'Gure menuak',
    lede: 'Betiko sagardotegiko menua, gure txotxeko sagardo natural ekologikoarekin.',
    cider: {
      label: 'Sagardotegiko menua',
      title: 'Sagardotegiko menua',
      price: '45€ pertsonako',
      note: 'Txotxeko sagardoa barne, urtarriletik maiatzera; botilan urteko gainerakoan.',
    },
    grill: { title: 'Parrilatik', body: 'Txuletoia parrillan, sagardotegian bezala.' },
    seasonal: {
      label: 'Sasoiko menua · urtean zehar aldatzen da',
      title: 'Sasoiko menua',
      price: '45€ pertsonako',
      note: 'Sagardotegiko menuaren prezio berean.',
      body: 'Platerak zein sasoitan zatozen araberakoak dira: urteko garai bakoitzeko produktuarekin sukaldatzen dugu. Deitu eta esango dizugu zer ari garen orain zerbitzatzen.',
    },
    kids: { label: 'Umeen menua', title: 'Umeen menua', price: '16€ ume bakoitzeko' },
    galleryTitle: 'Horrela ateratzen da parrillatik',
    galleryCaptions: [
      'Bakailaoa piperrekin eta tipula krispatuarekin',
      'Olagarroa parrillan',
      'Txuletoia, platerean',
      'Txuletoiak, brasara joan aurretik',
      'Ikatzezko parrilla',
      'Sukaldea, zerbitzu betean',
      'Sagardotegiko jantokia',
      'Kupelak, txotxerako prest',
    ],
    events: {
      title: 'Zure ekitaldi berezia, zure neurrira.',
      body: 'Ospakizun eta topaketa berezietarako —ezkontzetarako adibidez— menua zure beharretara egokitzen dugu. Elkarrekin diseinatzen dugu ekitaldia, bai gastronomikoki bai giroaz, egun aparta pasatzeko.',
      capacity: '90 komentsalentzako edukiera dugu eta Debagoienatik autobus zerbitzua.',
    },
    cta: {
      title: 'Mahaia erreserbatu?',
      body: 'Bizi ezazu txotxaren esperientzia Iturrietan. Erreserbatu mahaia edo bisita gidatua Aramaion.',
    },
  },
  fr: {
    eyebrow: 'Sagardotegiko menua',
    title: 'Nos menus',
    lede: 'Le classique menu de cidrerie, accompagné de notre cidre naturel bio au txotx.',
    cider: {
      label: 'Sagardotegiko menua',
      title: 'Menu de cidrerie',
      price: '45€ par personne',
      note: "Cidre du txotx inclus, de janvier à mai ; en bouteille le reste de l'année.",
    },
    grill: { title: 'Du grill', body: 'Côte de bœuf à la braise, comme le veut la cidrerie.' },
    seasonal: {
      label: "Sasoiko menua · change au fil de l'année",
      title: 'Menu de saison',
      price: '45€ par personne',
      note: 'Même prix que le menu de cidrerie.',
      body: "Les plats dépendent de la saison où vous venez : nous cuisinons avec les produits de chaque époque de l'année. Appelez-nous et nous vous dirons ce que nous servons en ce moment.",
    },
    kids: { label: 'Umeen menua', title: 'Menu enfant', price: '16€ par enfant' },
    galleryTitle: 'Voilà ce qui sort du grill',
    galleryCaptions: [
      'Morue aux poivrons et oignon croustillant',
      'Poulpe grillé',
      'Côte de bœuf, dans l’assiette',
      'Côtes de bœuf avant la braise',
      'Le grill au charbon',
      'La cuisine, en plein service',
      'La salle de la cidrerie',
      'Les foudres, prêts pour le txotx',
    ],
    events: {
      title: 'Votre événement, sur mesure.',
      body: "Pour les célébrations et événements —comme les mariages— nous adaptons le menu à vos besoins. Nous concevons ensemble l'événement, gastronomie et ambiance, pour passer une journée inoubliable.",
      capacity: "Capacité de 90 couverts et service d'autobus depuis Debagoiena.",
    },
    cta: {
      title: 'On réserve une table ?',
      body: "Vivez l'expérience du txotx à Iturrieta. Réservez votre table ou votre visite guidée à Aramaio.",
    },
  },
  de: {
    eyebrow: 'Sagardotegiko menua',
    title: 'Unsere Menüs',
    lede: 'Das klassische Sidrería-Menü, begleitet von unserem naturtrüben Bio-Apfelwein direkt vom Txotx.',
    cider: {
      label: 'Sagardotegiko menua',
      title: 'Sidrería-Menü',
      price: '45€ pro Person',
      note: 'Txotx-Apfelwein inklusive, Januar bis Mai; den Rest des Jahres aus der Flasche.',
    },
    grill: { title: 'Vom Grill', body: 'Txuletón über der Glut, wie es sich für eine Sidrería gehört.' },
    seasonal: {
      label: 'Sasoiko menua · wechselt im Laufe des Jahres',
      title: 'Saisonmenü',
      price: '45€ pro Person',
      note: 'Gleicher Preis wie das Sidrería-Menü.',
      body: 'Die Gerichte richten sich nach der Jahreszeit Ihres Besuchs: Wir kochen mit den Produkten der jeweiligen Saison. Rufen Sie uns an, und wir sagen Ihnen, was wir gerade servieren.',
    },
    kids: { label: 'Umeen menua', title: 'Kindermenü', price: '16€ pro Kind' },
    galleryTitle: 'Das kommt vom Grill',
    galleryCaptions: [
      'Stockfisch mit Paprika und knusprigen Zwiebeln',
      'Gegrillter Pulpo',
      'Txuletón auf dem Teller',
      'Txuletones vor der Glut',
      'Der Holzkohlegrill',
      'Die Küche mitten im Service',
      'Der Speiseraum der Sidrería',
      'Die Kupelas, bereit für den Txotx',
    ],
    events: {
      title: 'Ihr besonderer Anlass, nach Maß.',
      body: 'Für Feiern und besondere Anlässe – etwa Hochzeiten – passen wir das Menü an Ihre Wünsche an. Gemeinsam gestalten wir Essen und Atmosphäre für einen unvergesslichen Tag.',
      capacity: 'Wir bieten Platz für 90 Gäste und einen Busservice ab Debagoiena.',
    },
    cta: {
      title: 'Sollen wir einen Tisch reservieren?',
      body: 'Erleben Sie den Txotx bei Iturrieta. Reservieren Sie Ihren Tisch oder Ihre Führung in Aramaio.',
    },
  },
  en: {
    eyebrow: 'Sagardotegiko menua',
    title: 'Our menus',
    lede: 'The classic cider house menu, with our natural organic cider from the txotx.',
    cider: {
      label: 'Sagardotegiko menua',
      title: 'Cider house menu',
      price: '45€ per person',
      note: 'Txotx cider included, January to May; bottled the rest of the year.',
    },
    grill: { title: 'From the grill', body: 'Chuletón over embers, the way a cider house does it.' },
    seasonal: {
      label: 'Sasoiko menua · changes through the year',
      title: 'Seasonal menu',
      price: '45€ per person',
      note: 'Same price as the cider house menu.',
      body: "The dishes depend on when you come: we cook with whatever each season brings. Call us and we'll tell you what we're serving right now.",
    },
    kids: { label: 'Umeen menua', title: "Children's menu", price: '16€ per child' },
    galleryTitle: 'This is what comes off the grill',
    galleryCaptions: [
      'Cod with peppers and crisp onion',
      'Grilled octopus',
      'Chuletón, plated',
      'Chuletones before the embers',
      'The charcoal grill',
      'The kitchen, mid-service',
      'The cider house dining room',
      'The barrels, ready for txotx',
    ],
    events: {
      title: 'Your special event, made to measure.',
      body: 'For celebrations and special gatherings —such as weddings— we adapt the menu to your needs. We design the event together, both food and atmosphere, for an unforgettable day.',
      capacity: 'We have capacity for 90 guests and a bus service from Debagoiena.',
    },
    cta: {
      title: 'Shall we book a table?',
      body: 'Live the txotx experience at Iturrieta. Book your table or guided visit in Aramaio.',
    },
  },
}
