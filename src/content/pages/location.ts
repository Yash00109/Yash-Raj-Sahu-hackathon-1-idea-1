import type { Lang } from '../../i18n/copy'
import { venue } from '../venue'

export interface DirectionsRoute {
  from: string
  /** The official page gives no road description for Bilbao, only a map link. */
  directions?: string
  href: string
}

export interface LocationContent {
  eyebrow: string
  title: string
  lede: string
  heroAlt: string
  contact: { title: string; address: string; bookings: string; email: string; instagram: string; whatsapp: string; emailNote: string }
  hours: { title: string; summary: string; rows: [string, string][]; closures: string[] }
  directions: { title: string; intro: string; warning: string; coordinatesLabel: string; routes: DirectionsRoute[] }
  bus: { eyebrow: string; title: string; lede: string; items: string[]; note: string; groups: string }
  valley: { title: string; body: string }
}

export const locationContent: Record<Lang, LocationContent> = {
  es: {
    eyebrow: 'Kontaktua · Contacto',
    title: 'Contacto y reservas',
    lede: 'Reserva tu mesa o tu celebración. Estaremos encantados de recibirte en Aramaio.',
    heroAlt: 'El caserío Iturrieta en verano, entre prados y montes',
    contact: {
      title: 'Iturrieta Sagardotegia',
      address: 'Dirección',
      bookings: 'Reservas',
      email: 'Email',
      instagram: 'Instagram',
      whatsapp: 'Escríbenos por WhatsApp',
      emailNote: 'Si lo prefieres, escríbenos a info@iturrieta.eus',
    },
    hours: {
      title: 'Horario',
      summary: 'Comidas de jueves a domingo, de 13:00 a 16:00. Cenas y días de diario, solo por encargo.',
      rows: [
        ['Jueves', '13:00–16:00'],
        ['Viernes', '13:00–16:00'],
        ['Sábado', '13:00–16:00'],
        ['Domingo', '13:00–16:00'],
        ['Cenas', 'Solo por encargo · pedidos concretos'],
        ['Lun – Mié', 'Cerrado · grupos por encargo'],
      ],
      closures: ['Cerrado por vacaciones del 24 de diciembre al 1 de enero.'],
    },
    directions: {
      title: 'Llegar a Iturrieta',
      intro: 'Arraga auzoa · 01169 Aramaio (Álava).',
      warning: 'Sigue estas carreteras aunque el navegador te proponga otro camino: en el valle hay pistas que no llegan hasta el caserío.',
      coordinatesLabel: 'Coordenadas',
      routes: [
        { from: 'Desde Vitoria-Gasteiz', directions: 'N-240 hasta Legutio. Allí, la A-2620 hasta Aramaio (Ibarra) y la A-4025 hasta el caserío Iturrieta.', href: venue.mapsRoutes.vitoria },
        { from: 'Desde Donostia', directions: 'Autopista A-8 dirección Arrasate-Mondragón y salida 130. Desde Arrasate entra a Ibarra por la primera entrada; antes de llegar a Arraga verás un cartel de madera de Iturrieta.', href: venue.mapsRoutes.donostia },
        { from: 'Desde Bilbao', href: venue.mapsRoutes.bilbao },
      ],
    },
    bus: {
      eyebrow: 'Autobusa · Autobús',
      title: 'Autobús en temporada de txotx',
      lede: 'Ofrecemos servicio de autobús desde Vitoria-Gasteiz en temporada de txotx. 16 € ida y vuelta.',
      items: [
        'Comidas: salida de Vitoria 13:30 · vuelta de Iturrieta 18:00',
        'Cenas por encargo: consúltanos los horarios del bus',
        'Mínimo 20 personas. Desde Debagoiena u otros puntos de Álava, consúltanos.',
      ],
      note: 'Indica en la reserva el nº de personas que usarán el bus. Cancelaciones con menos de una semana no se reembolsan.',
      groups: 'Servicio de bus para grupos desde Debagoiena',
    },
    valley: {
      title: 'El valle de Aramaio.',
      body: 'El valle de Aramaio —también llamado «Suiza Txiki»— está al norte de Álava, junto a Bizkaia y Gipuzkoa (Debagoiena), y forma parte de la cuadrilla de Gorbeialdea. A 485 m de altitud, con clima atlántico y temperaturas suaves.',
    },
  },
  eu: {
    eyebrow: 'Kontaktua',
    title: 'Kontaktua eta erreserbak',
    lede: 'Erreserbatu mahaia edo ospakizuna. Pozik hartuko zaitugu Aramaion.',
    heroAlt: 'Iturrieta baserria udan, belardi eta mendien artean',
    contact: {
      title: 'Iturrieta Sagardotegia',
      address: 'Helbidea',
      bookings: 'Erreserbak',
      email: 'Email',
      instagram: 'Instagram',
      whatsapp: 'Idatzi WhatsApp bidez',
      emailNote: 'Nahiago baduzu, idatzi hona: info@iturrieta.eus',
    },
    hours: {
      title: 'Ordutegia',
      summary: 'Bazkariak ostegunetik igandera, 13:00etatik 16:00etara. Afariak eta asteko egunak, enkarguz soilik.',
      rows: [
        ['Osteguna', '13:00–16:00'],
        ['Ostirala', '13:00–16:00'],
        ['Larunbata', '13:00–16:00'],
        ['Igandea', '13:00–16:00'],
        ['Afariak', 'Eskaeraz soilik · eskaera zehatzak'],
        ['Al – Az', 'Itxita · taldeak enkarguz'],
      ],
      closures: ['Oporrengatik itxita abenduaren 24tik urtarrilaren 1era.'],
    },
    directions: {
      title: 'Iturrietara iristen',
      intro: 'Arraga auzoa · 01169 Aramaio (Araba).',
      warning: 'Jarraitu errepide hauei nabigatzaileak beste bide bat proposatzen badizu ere: haranean baserrira iristen ez diren pistak daude.',
      coordinatesLabel: 'Koordenatuak',
      routes: [
        { from: 'Gasteiztik', directions: 'N-240 Legutiora arte. Han, A-2620 Aramaiora (Ibarra) eta A-4025 Iturrieta baserrira arte.', href: venue.mapsRoutes.vitoria },
        { from: 'Donostiatik', directions: 'A-8 autopista Arrasate-Mondragón norabidean eta 130. irteera. Arrasatetik sartu Ibarran lehenengo sarreratik; Arragara iritsi aurretik Iturrietaren egurrezko kartela ikusiko duzu.', href: venue.mapsRoutes.donostia },
        { from: 'Bilbotik', href: venue.mapsRoutes.bilbao },
      ],
    },
    bus: {
      eyebrow: 'Autobusa',
      title: 'Autobusa txotx garaian',
      lede: 'Gasteiztik autobus zerbitzua eskaintzen dugu txotx garaian. 16 € joan-etorria.',
      items: [
        'Bazkariak: irteera Gasteiztik 13:30 · itzulera Iturrietatik 18:00',
        'Afariak enkarguz: galdetu autobusaren ordutegiak',
        'Gutxienez 20 lagun. Debagoienatik edo Arabako beste puntu batzuetatik, galdetu.',
      ],
      note: 'Adierazi erreserban busa erabiliko duten pertsona kopurua. Astebete baino gutxiagorekin ezeztatuz gero, ez da itzuliko.',
      groups: 'Autobus zerbitzua taldeentzat Debagoienatik',
    },
    valley: {
      title: 'Aramaioko harana.',
      body: 'Aramaioko harana —«Suitza Txiki» ere deitua— Arabako iparraldean dago, Bizkaia eta Gipuzkoarekin (Debagoiena) mugakide, eta Gorbeialdeko kuadrillaren parte da. 485 m-ra, klima atlantikoarekin eta tenperatura leunekin.',
    },
  },
  fr: {
    eyebrow: 'Kontaktua · Contact',
    title: 'Contact et réservations',
    lede: 'Réservez votre table ou votre célébration. Nous serons ravis de vous accueillir à Aramaio.',
    heroAlt: 'La ferme Iturrieta en été, entre prés et collines',
    contact: {
      title: 'Iturrieta Sagardotegia',
      address: 'Adresse',
      bookings: 'Réservations',
      email: 'Email',
      instagram: 'Instagram',
      whatsapp: 'Écrivez-nous sur WhatsApp',
      emailNote: 'Si vous préférez, écrivez-nous à info@iturrieta.eus',
    },
    hours: {
      title: 'Horaires',
      summary: 'Déjeuners du jeudi au dimanche, de 13h00 à 16h00. Dîners et jours de semaine uniquement sur commande.',
      rows: [
        ['Jeudi', '13:00–16:00'],
        ['Vendredi', '13:00–16:00'],
        ['Samedi', '13:00–16:00'],
        ['Dimanche', '13:00–16:00'],
        ['Dîners', 'Uniquement sur commande'],
        ['Lun – Mer', 'Fermé · groupes sur réservation'],
      ],
      closures: [
        'Noël : fermé du 24 décembre au 1er janvier.',
        "Les dates d'ouverture peuvent varier selon la saison — appelez-nous pour assurer votre réservation.",
      ],
    },
    directions: {
      title: 'Venir à Iturrieta',
      intro: 'Arraga auzoa · 01169 Aramaio (Álava).',
      warning: 'Suivez ces routes même si le GPS vous propose un autre chemin : dans la vallée, certaines pistes ne mènent pas à la ferme.',
      coordinatesLabel: 'Coordonnées',
      routes: [
        { from: 'Depuis Vitoria-Gasteiz', directions: "N-240 jusqu'à Legutio. Là, l'A-2620 jusqu'à Aramaio (Ibarra) puis l'A-4025 jusqu'à la ferme Iturrieta.", href: venue.mapsRoutes.vitoria },
        { from: 'Depuis Donostia', directions: "Autoroute A-8 direction Arrasate-Mondragón, sortie 130. Depuis Arrasate, entrez dans Ibarra par la première entrée ; avant d'arriver à Arraga, vous verrez un panneau en bois d'Iturrieta.", href: venue.mapsRoutes.donostia },
        { from: 'Depuis Bilbao', href: venue.mapsRoutes.bilbao },
      ],
    },
    bus: {
      eyebrow: 'Autobusa · Autobus',
      title: 'Autobus en saison du txotx',
      lede: "Nous proposons un service d'autobus depuis Vitoria-Gasteiz en saison du txotx. 16 € aller-retour.",
      items: [
        "Déjeuners : départ de Vitoria 13h30 · retour d'Iturrieta 18h00",
        'Dîners sur commande : demandez-nous les horaires du bus',
        "Minimum 20 personnes. Depuis Debagoiena ou d'autres points de l'Álava, contactez-nous.",
      ],
      note: 'Indiquez dans la réservation le nombre de personnes qui utiliseront le bus. Annulation à moins d’une semaine non remboursée.',
      groups: "Service d'autobus pour groupes depuis Debagoiena",
    },
    valley: {
      title: "La vallée d'Aramaio.",
      body: "La vallée d'Aramaio —aussi appelée « Suiza Txiki »— se trouve au nord de l'Álava, près de la Biscaye et du Gipuzkoa (Debagoiena), et fait partie de la cuadrilla de Gorbeialdea. À 485 m d'altitude, climat atlantique et températures douces.",
    },
  },
  de: {
    eyebrow: 'Kontaktua · Kontakt',
    title: 'Kontakt und Reservierungen',
    lede: 'Reservieren Sie Ihren Tisch oder Ihre Feier. Wir freuen uns, Sie in Aramaio zu begrüßen.',
    heroAlt: 'Der Bauernhof Iturrieta im Sommer, zwischen Wiesen und Hügeln',
    contact: {
      title: 'Iturrieta Sagardotegia',
      address: 'Adresse',
      bookings: 'Reservierungen',
      email: 'E-Mail',
      instagram: 'Instagram',
      whatsapp: 'Per WhatsApp schreiben',
      emailNote: 'Wenn Sie möchten, schreiben Sie uns an info@iturrieta.eus',
    },
    hours: {
      title: 'Öffnungszeiten',
      summary: 'Mittagessen donnerstags bis sonntags von 13 bis 16 Uhr. Abendessen und Wochentage nur auf Vorbestellung.',
      rows: [
        ['Donnerstag', '13:00–16:00'],
        ['Freitag', '13:00–16:00'],
        ['Samstag', '13:00–16:00'],
        ['Sonntag', '13:00–16:00'],
        ['Abendessen', 'Nur auf Vorbestellung'],
        ['Mo – Mi', 'Geschlossen · Gruppen auf Anfrage'],
      ],
      closures: [
        'Weihnachten: geschlossen vom 24. Dezember bis 1. Januar.',
        'Die Öffnungstage können je nach Saison variieren – rufen Sie uns an, um Ihre Reservierung zu bestätigen.',
      ],
    },
    directions: {
      title: 'Anfahrt nach Iturrieta',
      intro: 'Arraga auzoa · 01169 Aramaio (Álava).',
      warning: 'Folgen Sie diesen Straßen, auch wenn Ihr Navi einen anderen Weg vorschlägt: Einige Wege im Tal führen nicht bis zum Hof.',
      coordinatesLabel: 'Koordinaten',
      routes: [
        { from: 'Aus Vitoria-Gasteiz', directions: 'N-240 bis Legutio. Dort die A-2620 bis Aramaio (Ibarra) und die A-4025 bis zum Hof Iturrieta.', href: venue.mapsRoutes.vitoria },
        { from: 'Aus Donostia', directions: 'Autobahn A-8 Richtung Arrasate-Mondragón, Ausfahrt 130. Von Arrasate an der ersten Einfahrt nach Ibarra fahren; vor Arraga sehen Sie ein Holzschild von Iturrieta.', href: venue.mapsRoutes.donostia },
        { from: 'Aus Bilbao', href: venue.mapsRoutes.bilbao },
      ],
    },
    bus: {
      eyebrow: 'Autobusa · Bus',
      title: 'Bus in der Txotx-Saison',
      lede: 'In der Txotx-Saison bieten wir einen Busservice ab Vitoria-Gasteiz an. 16 € hin und zurück.',
      items: [
        'Mittagessen: Abfahrt in Vitoria 13:30 · Rückfahrt von Iturrieta 18:00',
        'Abendessen auf Vorbestellung: Fragen Sie nach den Busfahrzeiten',
        'Mindestens 20 Personen. Ab Debagoiena oder anderen Orten in Álava auf Anfrage.',
      ],
      note: 'Geben Sie bei der Reservierung an, wie viele Personen den Bus nutzen. Stornierungen weniger als eine Woche vorher werden nicht erstattet.',
      groups: 'Busservice für Gruppen ab Debagoiena',
    },
    valley: {
      title: 'Das Tal von Aramaio.',
      body: 'Das Tal von Aramaio – auch „Suiza Txiki“ (kleine Schweiz) genannt – liegt im Norden der Provinz Álava, an der Grenze zu Bizkaia und Gipuzkoa (Debagoiena), und gehört zur Cuadrilla Gorbeialdea. Auf 485 m Höhe, mit atlantischem Klima und milden Temperaturen.',
    },
  },
  en: {
    eyebrow: 'Kontaktua · Contact',
    title: 'Contact & bookings',
    lede: "Book your table or celebration. We'll be delighted to welcome you in Aramaio.",
    heroAlt: 'The Iturrieta farmhouse in summer, among meadows and hills',
    contact: {
      title: 'Iturrieta Sagardotegia',
      address: 'Address',
      bookings: 'Bookings',
      email: 'Email',
      instagram: 'Instagram',
      whatsapp: 'Message us on WhatsApp',
      emailNote: 'If you prefer, email us at info@iturrieta.eus',
    },
    hours: {
      title: 'Opening hours',
      summary: 'Lunch Thursday to Sunday, 1 to 4 pm. Dinners and weekdays by arrangement only.',
      rows: [
        ['Thursday', '13:00–16:00'],
        ['Friday', '13:00–16:00'],
        ['Saturday', '13:00–16:00'],
        ['Sunday', '13:00–16:00'],
        ['Dinners', 'By arrangement only'],
        ['Mon – Wed', 'Closed · groups by arrangement'],
      ],
      closures: [
        'Christmas: closed 24 December – 1 January.',
        'Opening dates may vary by season — call us to confirm your booking.',
      ],
    },
    directions: {
      title: 'Getting to Iturrieta',
      intro: 'Arraga auzoa · 01169 Aramaio (Álava).',
      warning: 'Follow these roads even if your sat-nav suggests another way: some tracks in the valley do not reach the farmhouse.',
      coordinatesLabel: 'Coordinates',
      routes: [
        { from: 'From Vitoria-Gasteiz', directions: 'N-240 to Legutio. There, take the A-2620 to Aramaio (Ibarra) and the A-4025 up to the Iturrieta farmhouse.', href: venue.mapsRoutes.vitoria },
        { from: 'From Donostia', directions: "A-8 motorway towards Arrasate-Mondragón, exit 130. From Arrasate, enter Ibarra by the first entrance; before reaching Arraga you'll see a wooden Iturrieta sign.", href: venue.mapsRoutes.donostia },
        { from: 'From Bilbao', href: venue.mapsRoutes.bilbao },
      ],
    },
    bus: {
      eyebrow: 'Bus zerbitzua · Bus service',
      title: 'Bus during txotx season',
      lede: 'We offer a bus service from Vitoria-Gasteiz during txotx season. €16 round trip.',
      items: [
        'Lunches: departure from Vitoria 13:30 · return from Iturrieta 18:00',
        'Dinners by arrangement: ask us about bus times',
        'Minimum 20 people. From Debagoiena or other parts of Álava, ask us.',
      ],
      note: 'State in your booking how many people will use the bus. Cancellations less than a week in advance are non-refundable.',
      groups: 'Bus service for groups from Debagoiena',
    },
    valley: {
      title: 'The Aramaio valley.',
      body: 'The Aramaio valley —also called "Suiza Txiki" (little Switzerland)— lies in northern Álava, next to Bizkaia and Gipuzkoa (Debagoiena), and is part of the Gorbeialdea cuadrilla. At 485 m, with an Atlantic climate and mild temperatures.',
    },
  },
}
