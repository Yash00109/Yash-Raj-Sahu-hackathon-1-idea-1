import type { Lang } from '../../i18n/copy'

/** The official site has no concerts page: this comes from the "Música en la sidrería" homepage section, and no dates are published. */
export interface ConcertsContent {
  eyebrow: string
  title: string
  lede: string
  imageAlt: string
  seasons: { title: string; body: string; alt: string }[]
  datesNote: string
}

export const concertsContent: Record<Lang, ConcertsContent> = {
  es: {
    eyebrow: 'Musika · Música',
    title: 'Música en la sidrería.',
    lede: 'Hacemos conciertos durante todo el año. Cambia el sitio según la época, pero el ambiente es el mismo.',
    imageAlt: 'Público durante un concierto en la sidrería (fotograma del vídeo de la web oficial)',
    seasons: [
      { title: 'En verano', body: 'En la terraza, con el valle de Aramaio delante.', alt: 'El caserío Iturrieta en verano' },
      { title: 'En invierno', body: 'Dentro, junto a la chimenea.', alt: 'El comedor de la sidrería' },
    ],
    datesNote: 'Llámanos para saber las fechas del próximo.',
  },
  eu: {
    eyebrow: 'Musika',
    title: 'Musika sagardotegian.',
    lede: 'Urte osoan egiten ditugu kontzertuak. Lekua aldatzen da garaiaren arabera, giroa berdina da.',
    imageAlt: 'Jendea sagardotegiko kontzertu batean (webgune ofizialeko bideoko irudia)',
    seasons: [
      { title: 'Udan', body: 'Terrazan, Aramaioko harana aurrean duzula.', alt: 'Iturrieta baserria udan' },
      { title: 'Neguan', body: 'Barruan, tximiniaren ondoan.', alt: 'Sagardotegiko jantokia' },
    ],
    datesNote: 'Deitu hurrengoaren datak jakiteko.',
  },
  fr: {
    eyebrow: 'Musika · Musique',
    title: 'De la musique à la cidrerie.',
    lede: "Nous organisons des concerts toute l'année. Le lieu change selon la saison, l'ambiance reste la même.",
    imageAlt: 'Public lors d’un concert à la cidrerie (image extraite de la vidéo du site officiel)',
    seasons: [
      { title: 'En été', body: "Sur la terrasse, la vallée d'Aramaio en face.", alt: 'La ferme Iturrieta en été' },
      { title: 'En hiver', body: "À l'intérieur, près de la cheminée.", alt: 'La salle de la cidrerie' },
    ],
    datesNote: 'Appelez-nous pour connaître les prochaines dates.',
  },
  de: {
    eyebrow: 'Musika · Livemusik',
    title: 'Livemusik in der Sidrería.',
    lede: 'Wir veranstalten das ganze Jahr über Konzerte. Der Ort wechselt mit der Jahreszeit, die Stimmung bleibt dieselbe.',
    imageAlt: 'Publikum bei einem Konzert in der Sidrería (Standbild aus dem Video der offiziellen Website)',
    seasons: [
      { title: 'Im Sommer', body: 'Auf der Terrasse, mit Blick ins Tal von Aramaio.', alt: 'Der Bauernhof Iturrieta im Sommer' },
      { title: 'Im Winter', body: 'Drinnen, am Kamin.', alt: 'Der Speiseraum der Sidrería' },
    ],
    datesNote: 'Rufen Sie uns an, um die nächsten Termine zu erfahren.',
  },
  en: {
    eyebrow: 'Musika · Live music',
    title: 'Live music at the cider house.',
    lede: "We host live music all year round. The spot changes with the season; the atmosphere doesn't.",
    imageAlt: 'People at a concert in the cider house (still from the official website video)',
    seasons: [
      { title: 'In summer', body: 'On the terrace, with the Aramaio valley in front of you.', alt: 'The Iturrieta farmhouse in summer' },
      { title: 'In winter', body: 'Indoors, by the fireplace.', alt: 'The cider house dining room' },
    ],
    datesNote: 'Call us to find out the next dates.',
  },
}
