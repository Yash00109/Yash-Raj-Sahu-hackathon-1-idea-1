import type { Copy } from './copy'

const lines = (...parts: (string | false)[]) => parts.filter(Boolean).join('\n')

/**
 * German. The official website has no German version: every string here is an
 * unofficial translation of the official Spanish/English text and must be
 * reviewed by a native speaker before launch.
 */
export const de: Copy = {
  skipToContent: 'Zum Inhalt springen',
  nav: {
    story: 'Über uns',
    experiences: 'Erlebnisse',
    visit: 'Anfahrt',
    reserve: 'Reservieren',
    menu: 'Menü',
    close: 'Schließen',
    language: 'Sprache',
  },
  hero: {
    eyebrow: 'Sagardotegia · Aramaio, Álava',
    titleLead: 'Vom Apfelbaum',
    titleAccent: 'zum Txotx.',
    lede: 'Naturtrüber Bio-Apfelwein aus Äpfeln aus Aramaio. Erleben Sie die Sidrería zwischen Bergen und guter Küche.',
    primaryCta: 'Tisch reservieren',
    secondaryCta: 'Die Sidrería entdecken',
    facts: [
      { label: 'Txotx', value: 'Januar bis Mai' },
      { label: 'Geöffnet', value: 'Donnerstag bis Sonntag · 13–16 Uhr' },
      { label: 'Apfelbäume', value: 'Rund 1.400' },
    ],
    captionStone: 'Der Bauernhof Iturrieta im Ortsteil Arraga',
    captionKupelas: 'Die Kupelas, bereit für den Txotx',
    chip: 'Seit 1998',
  },
  story: {
    eyebrow: 'Über uns',
    title: 'Ein Familienprojekt in den Bergen von Aramaio.',
    body: 'Iturrieta ist ein landwirtschaftliches Familienprojekt. 1997 zogen wir von Vitoria auf diesen schönen Bauernhof in Aramaio und bauten die Ställe zu einer Sidrería um, die wir am Jakobstag 1998 eröffneten. Heute pflegen wir rund 1.400 Apfelbäume.',
    motto: '„Sagarretik txotxera“: vom Apfel zum Txotx, hausgemachter naturtrüber Bio-Apfelwein.',
    caption: 'Der Bauernhof, die Terrasse und die Apfelbäume mitten im Tal von Aramaio.',
  },
  experiences: {
    eyebrow: 'Das Erlebnis',
    title: 'Apfelwein, Grill und gute Gesellschaft.',
    intro: 'Wir bauen in Aramaio Bio-Äpfel an und keltern daraus unseren naturtrüben Apfelwein.',
    items: [
      {
        key: 'txotx',
        title: 'Txotx!',
        meta: 'Januar bis Mai',
        body: 'Apfelwein direkt aus der Kupela, der Grill und geselliges Beisammensein. Den Rest des Jahres servieren wir ihn in der Flasche.',
        alt: 'Die Kupelas von Iturrieta, bereit für den Txotx',
      },
      {
        key: 'menu',
        title: 'Sidrería-Menü',
        meta: '45€ pro Person · ganzjährig',
        body: 'Chorizo in Apfelwein, Rührei mit Stockfisch, Stockfisch mit gerösteter Paprika, Txuletón vom Grill sowie Idiazabal-Käse mit Quittenbrot und Walnüssen. Kindermenü 16 €.',
        alt: 'Ein Apfel aus Aramaio',
      },
      {
        key: 'music',
        title: 'Livemusik in der Sidrería',
        meta: 'Konzerte das ganze Jahr',
        body: 'Im Sommer auf der Terrasse mit Blick ins Tal von Aramaio. Im Winter drinnen am Kamin. Rufen Sie uns an, um die nächsten Termine zu erfahren.',
        alt: 'Die Terrasse von Iturrieta mit verschneiten Bergen',
      },
      {
        key: 'visit',
        title: 'Führungen',
        meta: 'Für Familien und Gruppen',
        body: 'Entdecken Sie den Bauernhof, die Apfelbäume und die Ernte – und wie naturtrüber Apfelwein entsteht.',
        alt: 'Äpfel aus Aramaio auf dem Weg zur Presse',
      },
    ],
    priceNote: 'Preise laut offizieller Website. Bitte bei der Reservierung bestätigen.',
  },
  reserve: {
    eyebrow: 'Erreserbak · Reservierungen',
    title: 'Reservierung per Telefon.',
    body: 'Reservierungen nehmen wir telefonisch und per WhatsApp entgegen. Rufen Sie uns an, und wir bestätigen Ihren Tisch sofort.',
    call: 'Anrufen unter',
    whatsapp: 'Per WhatsApp schreiben',
    hours: 'Mittagessen',
    hoursValue: 'Donnerstag bis Sonntag · 13–16 Uhr',
    dinners: 'Abendessen',
    dinnersValue: 'Nur auf Vorbestellung',
    closedDays: 'Montag bis Mittwoch',
    closedDaysValue: 'Geschlossen · Gruppen auf Anfrage',
    holidays: 'Betriebsferien vom 24. Dezember bis 1. Januar.',
    prototypeBadge: 'Prototyp',
    prototypeNotice:
      'Die Online-Reservierung ist noch nicht aktiv. Dieses Formular sendet und speichert nichts: Es bereitet nur Ihre Anfrage vor, die Sie selbst per WhatsApp senden.',
    form: {
      legend: 'Anfrage vorbereiten',
      date: 'Datum',
      dateHint: 'Wir haben donnerstags bis sonntags geöffnet.',
      time: 'Ungefähre Uhrzeit',
      timeHint: 'Mittagessen 13–16 Uhr. Abendessen nur auf Vorbestellung.',
      guests: 'Personen',
      seating: 'Wunsch',
      seatingHint: 'Dies ist ein Wunsch, kein garantierter Tisch.',
      indoor: 'Drinnen',
      terrace: 'Terrasse',
      name: 'Name',
      nameRequired: 'Bitte geben Sie Ihren Namen ein.',
      phone: 'Telefon',
      phoneRequired: 'Bitte geben Sie eine Telefonnummer ein.',
      notes: 'Anmerkungen (optional)',
      submit: 'Anfrage prüfen',
      indoorAlt: 'Der Speiseraum von Iturrieta neben den Kupelas',
      terraceAlt: 'Die Terrasse von Iturrieta mit den Bergen im Hintergrund',
    },
    summary: {
      title: 'Ihre Anfrage, bereit zum Senden',
      body: 'Es wurde noch nichts gesendet und kein Tisch reserviert. Senden Sie die Anfrage per WhatsApp, und das Team von Iturrieta bestätigt sie Ihnen.',
      whatsapp: 'WhatsApp mit diesen Angaben öffnen',
      edit: 'Bearbeiten',
    },
    whatsappMessage: (d) =>
      lines(
        'Hallo, ich möchte bei Iturrieta reservieren:',
        `· Datum: ${d.date}`,
        `· Uhrzeit: ${d.time}`,
        `· Personen: ${d.guests}`,
        `· Wunsch: ${d.seating}`,
        `· Name: ${d.name}`,
        `· Telefon: ${d.phone}`,
        !!d.notes && `· Anmerkungen: ${d.notes}`,
      ),
  },
  footer: {
    address: 'Adresse',
    directions: 'Route anzeigen',
    contact: 'Kontakt',
    photoNote: 'Fotos: offizielle Website von Iturrieta Sagardotegia.',
    officialSite: 'Offizielle Website',
  },
  imageUnavailable: 'Foto nicht verfügbar',
  photoCredit: 'Foto',
}
