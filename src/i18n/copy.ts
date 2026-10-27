import { de } from './copy.de'
import { fr } from './copy.fr'

/**
 * Venue copy is taken from the official site's own language versions
 * (/, /Euskara/, /English/; French lives in copy.fr.ts, German in copy.de.ts). Interface strings that do not exist on the
 * official site (form labels, prototype notices) are drafts; the Basque ones
 * in particular need review by a native speaker before launch.
 */

/** Order and BCP 47 locales of the five supported languages. */
export const languages = [
  { code: 'eu', label: 'EU', name: 'Euskara', locale: 'eu-ES' },
  { code: 'es', label: 'ES', name: 'Español', locale: 'es-ES' },
  { code: 'fr', label: 'FR', name: 'Français', locale: 'fr-FR' },
  { code: 'en', label: 'EN', name: 'English', locale: 'en-GB' },
  { code: 'de', label: 'DE', name: 'Deutsch', locale: 'de-DE' },
] as const

export type Lang = (typeof languages)[number]['code']

export interface RequestDetails {
  date: string
  time: string
  guests: string
  seating: string
  name: string
  phone: string
  notes: string
}

export type ExperienceKey = 'txotx' | 'menu' | 'music' | 'visit'

export interface Copy {
  skipToContent: string
  nav: {
    story: string
    experiences: string
    visit: string
    reserve: string
    menu: string
    close: string
    language: string
  }
  hero: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    lede: string
    primaryCta: string
    secondaryCta: string
    facts: { label: string; value: string }[]
    captionStone: string
    captionKupelas: string
    chip: string
  }
  story: { eyebrow: string; title: string; body: string; motto: string; caption: string }
  experiences: {
    eyebrow: string
    title: string
    intro: string
    items: { key: ExperienceKey; title: string; meta: string; body: string; alt: string }[]
    priceNote: string
  }
  reserve: {
    eyebrow: string
    title: string
    body: string
    call: string
    whatsapp: string
    hours: string
    hoursValue: string
    dinners: string
    dinnersValue: string
    closedDays: string
    closedDaysValue: string
    holidays: string
    prototypeBadge: string
    prototypeNotice: string
    form: {
      legend: string
      date: string
      dateHint: string
      time: string
      timeHint: string
      guests: string
      seating: string
      seatingHint: string
      indoor: string
      terrace: string
      name: string
      nameRequired: string
      phone: string
      phoneRequired: string
      notes: string
      submit: string
      indoorAlt: string
      terraceAlt: string
    }
    summary: { title: string; body: string; whatsapp: string; edit: string }
    whatsappMessage: (details: RequestDetails) => string
  }
  footer: {
    address: string
    directions: string
    contact: string
    photoNote: string
    officialSite: string
  }
  imageUnavailable: string
  photoCredit: string
}

const lines = (...parts: (string | false)[]) => parts.filter(Boolean).join('\n')

const es: Copy = {
  skipToContent: 'Saltar al contenido',
  nav: {
    story: 'Quiénes somos',
    experiences: 'Experiencias',
    visit: 'Cómo llegar',
    reserve: 'Reservar',
    menu: 'Menú',
    close: 'Cerrar',
    language: 'Idioma',
  },
  hero: {
    eyebrow: 'Sagardotegia · Aramaio, Álava',
    titleLead: 'Del manzano',
    titleAccent: 'al txotx.',
    lede: 'Sidra natural ecológica elaborada con manzana de Aramaio. Ven a vivir la experiencia de la sidrería, entre montes y buena mesa.',
    primaryCta: 'Reservar mesa',
    secondaryCta: 'Descubrir la sidrería',
    facts: [
      { label: 'Txotx', value: 'De enero a mayo' },
      { label: 'Abierto', value: 'Jueves a domingo · 13:00–16:00' },
      { label: 'Manzanos', value: 'Cerca de 1.400' },
    ],
    captionStone: 'El caserío Iturrieta, en el barrio de Arraga',
    captionKupelas: 'Las kupelas, listas para el txotx',
    chip: 'Desde 1998',
  },
  story: {
    eyebrow: 'Quiénes somos',
    title: 'Un proyecto familiar entre los montes de Aramaio.',
    body: 'Iturrieta es un proyecto familiar de agricultura y ganadería. En 1997 llegamos de Vitoria a este precioso caserío de Aramaio y convertimos los establos en sidrería, que abrimos el día de Santiago de 1998. Hoy cuidamos cerca de 1.400 manzanos.',
    motto: '«Sagarretik txotxera»: de la manzana al txotx, sidra natural ecológica hecha en casa.',
    caption: 'El caserío, la terraza y los manzanos, en pleno valle de Aramaio.',
  },
  experiences: {
    eyebrow: 'La experiencia',
    title: 'Sidra, parrilla y cuadrilla.',
    intro: 'Cultivamos manzana ecológica en Aramaio y elaboramos con ella nuestra sidra natural.',
    items: [
      {
        key: 'txotx',
        title: 'Txotx!',
        meta: 'De enero a mayo',
        body: 'La sidra directa de la kupela, la parrilla y el ambiente de cuadrilla. El resto del año, la servimos en botella.',
        alt: 'Las kupelas de Iturrieta, listas para el txotx',
      },
      {
        key: 'menu',
        title: 'Menú de sidrería',
        meta: '45 € por persona · todo el año',
        body: 'Chorizo a la sidra, revuelto de bacalao, bacalao con pimientos asados, chuletón a la parrilla y queso Idiazabal con membrillo y nueces. Menú infantil por 16 €.',
        alt: 'Manzana de Aramaio',
      },
      {
        key: 'music',
        title: 'Música en la sidrería',
        meta: 'Conciertos durante todo el año',
        body: 'En verano, en la terraza con el valle de Aramaio delante. En invierno, dentro, junto a la chimenea. Llámanos para saber las fechas del próximo.',
        alt: 'La terraza de Iturrieta con la sierra nevada al fondo',
      },
      {
        key: 'visit',
        title: 'Visitas guiadas',
        meta: 'Familias, grupos y cuadrillas',
        body: 'Descubre el caserío, los manzanos y la recogida de la manzana, y cómo se elabora la sidra natural.',
        alt: 'La manzana de Aramaio entrando al lagar',
      },
    ],
    priceNote: 'Precios según la web oficial. Confírmalos al reservar.',
  },
  reserve: {
    eyebrow: 'Erreserbak · Reservas',
    title: 'Reserva llamándonos.',
    body: 'Las reservas las cogemos por teléfono y por WhatsApp. Llámanos y te confirmamos la mesa en el momento.',
    call: 'Llamar al',
    whatsapp: 'Escribir por WhatsApp',
    hours: 'Comidas',
    hoursValue: 'Jueves a domingo · 13:00–16:00',
    dinners: 'Cenas',
    dinnersValue: 'Solo por encargo',
    closedDays: 'Lunes a miércoles',
    closedDaysValue: 'Cerrado · grupos por encargo',
    holidays: 'Cerrado por vacaciones del 24 de diciembre al 1 de enero.',
    prototypeBadge: 'Prototipo',
    prototypeNotice:
      'La reserva online todavía no está activa. Este formulario no envía ni guarda nada: solo prepara tu solicitud para que la mandes tú por WhatsApp.',
    form: {
      legend: 'Prepara tu solicitud',
      date: 'Fecha',
      dateHint: 'Abrimos de jueves a domingo.',
      time: 'Hora aproximada',
      timeHint: 'Comidas de 13:00 a 16:00. Cenas solo por encargo.',
      guests: 'Personas',
      seating: 'Preferencia',
      seatingHint: 'Es una preferencia, no una mesa garantizada.',
      indoor: 'Dentro',
      terrace: 'Terraza',
      name: 'Nombre',
      nameRequired: 'Escribe tu nombre.',
      phone: 'Teléfono',
      phoneRequired: 'Escribe un teléfono de contacto.',
      notes: 'Comentarios (opcional)',
      submit: 'Revisar solicitud',
      indoorAlt: 'El comedor de Iturrieta junto a las kupelas',
      terraceAlt: 'La terraza de Iturrieta con la sierra al fondo',
    },
    summary: {
      title: 'Tu solicitud, lista para enviar',
      body: 'Todavía no se ha enviado nada y no hay ninguna mesa reservada. Envíala por WhatsApp y el equipo de Iturrieta te la confirmará.',
      whatsapp: 'Abrir WhatsApp con estos datos',
      edit: 'Editar',
    },
    whatsappMessage: (d) =>
      lines(
        'Hola, me gustaría reservar en Iturrieta:',
        `· Fecha: ${d.date}`,
        `· Hora: ${d.time}`,
        `· Personas: ${d.guests}`,
        `· Preferencia: ${d.seating}`,
        `· Nombre: ${d.name}`,
        `· Teléfono: ${d.phone}`,
        !!d.notes && `· Comentarios: ${d.notes}`,
      ),
  },
  footer: {
    address: 'Dirección',
    directions: 'Cómo llegar',
    contact: 'Contacto',
    photoNote: 'Fotografías: web oficial de Iturrieta Sagardotegia.',
    officialSite: 'Web oficial',
  },
  imageUnavailable: 'Fotografía no disponible',
  photoCredit: 'Foto',
}

const eu: Copy = {
  skipToContent: 'Joan edukira',
  nav: {
    story: 'Nor gara',
    experiences: 'Esperientziak',
    visit: 'Nola iritsi',
    reserve: 'Erreserbatu',
    menu: 'Menua',
    close: 'Itxi',
    language: 'Hizkuntza',
  },
  hero: {
    eyebrow: 'Sagardotegia · Aramaio, Araba',
    titleLead: 'Sagarretik',
    titleAccent: 'txotxera.',
    lede: 'Aramaioko sagarrarekin egindako sagardo natural ekologikoa. Etorri sagardotegiaren esperientzia bizitzera, mendien artean eta mahai onarekin.',
    primaryCta: 'Mahaia erreserbatu',
    secondaryCta: 'Sagardotegia ezagutu',
    facts: [
      { label: 'Txotx', value: 'Urtarriletik maiatzera' },
      { label: 'Irekita', value: 'Ostegunetik igandera · 13:00–16:00' },
      { label: 'Sagarrondo', value: '1.400 inguru' },
    ],
    captionStone: 'Iturrieta baserria, Arraga auzoan',
    captionKupelas: 'Kupelak, txotxerako prest',
    chip: '1998tik',
  },
  story: {
    eyebrow: 'Nor gara',
    title: 'Familia-proiektu bat Aramaioko mendien artean.',
    body: 'Iturrieta nekazaritza eta abeltzaintzako proiektu familiarra da. 1997an Gasteiztik Aramaioko baserri eder honetara etorri ginen, eta ukuiluak sagardotegi bihurtu genituen, 1998ko Santiago egunean irekiz. Gaur egun 1.400 sagarrondo inguru zaintzen ditugu.',
    motto: '«Sagarretik txotxera»: etxean egindako sagardo natural ekologikoa.',
    caption: 'Baserria, terraza eta sagarrondoak, Aramaioko haranaren erdian.',
  },
  experiences: {
    eyebrow: 'Esperientzia',
    title: 'Sagardoa, parrila eta koadrila.',
    intro: 'Aramaion sagar ekologikoa lantzen dugu eta horrekin egiten dugu gure sagardo naturala.',
    items: [
      {
        key: 'txotx',
        title: 'Txotx!',
        meta: 'Urtarriletik maiatzera',
        body: 'Kupeletik zuzeneko sagardoa, parrila eta koadrilaren giroa. Gainerako urtean, botilan.',
        alt: 'Iturrietako kupelak, txotxerako prest',
      },
      {
        key: 'menu',
        title: 'Sagardotegiko menua',
        meta: '45 € pertsonako · urte osoan',
        body: 'Txorizoa sagardotan, bakailao nahaskia, bakailaoa piper erretan, txuletoia parrillan eta Idiazabal gazta, irasagarra eta intxaurrak. Umeen menua 16 €.',
        alt: 'Aramaioko sagarra',
      },
      {
        key: 'music',
        title: 'Musika sagardotegian',
        meta: 'Kontzertuak urte osoan',
        body: 'Udan, terrazan, Aramaioko harana aurrean duzula. Neguan, barruan, tximiniaren ondoan. Deitu hurrengoaren datak jakiteko.',
        alt: 'Iturrietako terraza, mendi elurtuak atzean',
      },
      {
        key: 'visit',
        title: 'Bisita gidatuak',
        meta: 'Familia, talde eta koadrilentzat',
        body: 'Ezagutu baserria, sagarrondoak eta sagar bilketa, eta nola egiten den sagardo naturala.',
        alt: 'Aramaioko sagarra dolarera sartzen',
      },
    ],
    priceNote: 'Prezioak webgune ofizialaren arabera. Berretsi erreserbatzean.',
  },
  reserve: {
    eyebrow: 'Erreserbak',
    title: 'Erreserbatu deituz.',
    body: 'Erreserbak telefonoz eta WhatsApp bidez hartzen ditugu. Deitu eta unean bertan baieztatuko dizugu mahaia.',
    call: 'Deitu',
    whatsapp: 'Idatzi WhatsApp bidez',
    hours: 'Bazkariak',
    hoursValue: 'Ostegunetik igandera · 13:00–16:00',
    dinners: 'Afariak',
    dinnersValue: 'Eskaeraz soilik',
    closedDays: 'Astelehenetik asteazkenera',
    closedDaysValue: 'Itxita · taldeak enkarguz',
    holidays: 'Oporrengatik itxita abenduaren 24tik urtarrilaren 1era.',
    prototypeBadge: 'Prototipoa',
    prototypeNotice:
      'Online erreserba oraindik ez dago martxan. Inprimaki honek ez du ezer bidaltzen ez gordetzen: zure eskaera prestatzen du, zuk WhatsApp bidez bidal dezazun.',
    form: {
      legend: 'Prestatu zure eskaera',
      date: 'Data',
      dateHint: 'Ostegunetik igandera irekitzen dugu.',
      time: 'Gutxi gorabeherako ordua',
      timeHint: 'Bazkariak 13:00etatik 16:00etara. Afariak eskaeraz soilik.',
      guests: 'Pertsonak',
      seating: 'Lehentasuna',
      seatingHint: 'Lehentasun bat da, ez bermatutako mahai bat.',
      indoor: 'Barruan',
      terrace: 'Terrazan',
      name: 'Izena',
      nameRequired: 'Idatzi zure izena.',
      phone: 'Telefonoa',
      phoneRequired: 'Idatzi harremanetarako telefono bat.',
      notes: 'Oharrak (aukerakoa)',
      submit: 'Eskaera berrikusi',
      indoorAlt: 'Iturrietako jangela, kupelen ondoan',
      terraceAlt: 'Iturrietako terraza, mendiak atzean',
    },
    summary: {
      title: 'Zure eskaera, bidaltzeko prest',
      body: 'Oraindik ez da ezer bidali eta ez dago mahairik erreserbatuta. Bidali WhatsApp bidez eta Iturrietako taldeak baieztatuko dizu.',
      whatsapp: 'Ireki WhatsApp datu hauekin',
      edit: 'Editatu',
    },
    whatsappMessage: (d) =>
      lines(
        'Kaixo, Iturrietan erreserbatu nahi nuke:',
        `· Data: ${d.date}`,
        `· Ordua: ${d.time}`,
        `· Pertsonak: ${d.guests}`,
        `· Lehentasuna: ${d.seating}`,
        `· Izena: ${d.name}`,
        `· Telefonoa: ${d.phone}`,
        !!d.notes && `· Oharrak: ${d.notes}`,
      ),
  },
  footer: {
    address: 'Helbidea',
    directions: 'Nola iritsi',
    contact: 'Kontaktua',
    photoNote: 'Argazkiak: Iturrieta Sagardotegiaren webgune ofiziala.',
    officialSite: 'Webgune ofiziala',
  },
  imageUnavailable: 'Argazkia ez dago eskuragarri',
  photoCredit: 'Argazkia',
}

const en: Copy = {
  skipToContent: 'Skip to content',
  nav: {
    story: 'Our story',
    experiences: 'Experiences',
    visit: 'Getting here',
    reserve: 'Book',
    menu: 'Menu',
    close: 'Close',
    language: 'Language',
  },
  hero: {
    eyebrow: 'Sagardotegia · Aramaio, Álava',
    titleLead: 'From apple tree',
    titleAccent: 'to txotx.',
    lede: 'Natural organic cider made with apples from Aramaio. Come and live the cider house experience, among mountains and great food.',
    primaryCta: 'Book a table',
    secondaryCta: 'Discover the cider house',
    facts: [
      { label: 'Txotx', value: 'January to May' },
      { label: 'Open', value: 'Thursday to Sunday · 1–4 pm' },
      { label: 'Apple trees', value: 'Around 1,400' },
    ],
    captionStone: 'The Iturrieta farmhouse, in the Arraga neighbourhood',
    captionKupelas: 'The kupelas, ready for txotx',
    chip: 'Since 1998',
  },
  story: {
    eyebrow: 'Our story',
    title: 'A family project in the mountains of Aramaio.',
    body: "Iturrieta is a family farming project. In 1997 we moved from Vitoria to this beautiful farmhouse in Aramaio and turned the stables into a cider house, opening on St. James's Day 1998. Today we tend around 1,400 apple trees.",
    motto: '"Sagarretik txotxera": from apple to txotx, natural organic cider made at home.',
    caption: 'The farmhouse, the terrace and the apple trees, deep in the Aramaio valley.',
  },
  experiences: {
    eyebrow: 'The experience',
    title: 'Cider, grill and good company.',
    intro: 'We grow organic apples in Aramaio and make our natural cider with them.',
    items: [
      {
        key: 'txotx',
        title: 'Txotx!',
        meta: 'January to May',
        body: 'Cider straight from the kupela, the grill and the friendly atmosphere. The rest of the year, we serve it bottled.',
        alt: 'The kupelas at Iturrieta, ready for txotx',
      },
      {
        key: 'menu',
        title: 'Cider house menu',
        meta: '€45 per person · all year',
        body: 'Chorizo in cider, salt-cod scramble, cod with roasted peppers, grilled txuletón (rib steak), and Idiazabal cheese with quince and walnuts. Children’s menu €16.',
        alt: 'An apple from Aramaio',
      },
      {
        key: 'music',
        title: 'Live music',
        meta: 'Concerts all year round',
        body: 'In summer, on the terrace with the Aramaio valley in front of you. In winter, indoors by the fireplace. Call us to find out the next dates.',
        alt: 'The terrace at Iturrieta with snowy mountains behind',
      },
      {
        key: 'visit',
        title: 'Guided visits',
        meta: 'For families and groups',
        body: 'Discover the farmhouse, the apple trees and the harvest, and how natural cider is made.',
        alt: 'Aramaio apples arriving at the cider press',
      },
    ],
    priceNote: 'Prices as listed on the official website. Please confirm when booking.',
  },
  reserve: {
    eyebrow: 'Erreserbak · Bookings',
    title: 'Book by phone.',
    body: "We take bookings by phone and WhatsApp. Call us and we'll confirm your table right away.",
    call: 'Call',
    whatsapp: 'Message us on WhatsApp',
    hours: 'Lunch',
    hoursValue: 'Thursday to Sunday · 1–4 pm',
    dinners: 'Dinners',
    dinnersValue: 'By arrangement only',
    closedDays: 'Monday to Wednesday',
    closedDaysValue: 'Closed · groups by arrangement',
    holidays: 'Closed for the holidays from 24 December to 1 January.',
    prototypeBadge: 'Prototype',
    prototypeNotice:
      "Online booking isn't live yet. This form doesn't send or store anything. It only prepares your request so you can send it yourself on WhatsApp.",
    form: {
      legend: 'Prepare your request',
      date: 'Date',
      dateHint: 'We open Thursday to Sunday.',
      time: 'Approximate time',
      timeHint: 'Lunch 1–4 pm. Dinners by arrangement only.',
      guests: 'Guests',
      seating: 'Preference',
      seatingHint: 'This is a preference, not a guaranteed table.',
      indoor: 'Indoors',
      terrace: 'Terrace',
      name: 'Name',
      nameRequired: 'Please enter your name.',
      phone: 'Phone',
      phoneRequired: 'Please enter a contact phone number.',
      notes: 'Notes (optional)',
      submit: 'Review request',
      indoorAlt: 'The Iturrieta dining room beside the kupelas',
      terraceAlt: 'The Iturrieta terrace with the mountains behind',
    },
    summary: {
      title: 'Your request, ready to send',
      body: 'Nothing has been sent yet and no table is reserved. Send it on WhatsApp and the Iturrieta team will confirm it with you.',
      whatsapp: 'Open WhatsApp with these details',
      edit: 'Edit',
    },
    whatsappMessage: (d) =>
      lines(
        "Hello, I'd like to book a table at Iturrieta:",
        `· Date: ${d.date}`,
        `· Time: ${d.time}`,
        `· Guests: ${d.guests}`,
        `· Preference: ${d.seating}`,
        `· Name: ${d.name}`,
        `· Phone: ${d.phone}`,
        !!d.notes && `· Notes: ${d.notes}`,
      ),
  },
  footer: {
    address: 'Address',
    directions: 'Getting here',
    contact: 'Contact',
    photoNote: 'Photography: official Iturrieta Sagardotegia website.',
    officialSite: 'Official website',
  },
  imageUnavailable: 'Photograph unavailable',
  photoCredit: 'Photo',
}

export const copy: Record<Lang, Copy> = { eu, es, fr, en, de }
