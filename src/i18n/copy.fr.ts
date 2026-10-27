import type { Copy } from './copy'

const lines = (...parts: (string | false)[]) => parts.filter(Boolean).join('\n')

/**
 * French. Venue sentences come from the official French site (/Fran-ais/);
 * form labels, notices and other interface strings are drafts that need
 * review by a native speaker.
 */
export const fr: Copy = {
  skipToContent: 'Aller au contenu',
  nav: {
    story: 'À propos',
    experiences: 'Expériences',
    visit: 'Accès',
    reserve: 'Réserver',
    menu: 'Menu',
    close: 'Fermer',
    language: 'Langue',
  },
  hero: {
    eyebrow: 'Sagardotegia · Aramaio, Álava',
    titleLead: 'Du pommier',
    titleAccent: 'au txotx.',
    lede: "Cidre naturel bio élaboré avec des pommes d'Aramaio. Venez vivre l'expérience de la cidrerie, entre montagnes et bonne table.",
    primaryCta: 'Réserver une table',
    secondaryCta: 'Découvrir la cidrerie',
    facts: [
      { label: 'Txotx', value: 'De janvier à mai' },
      { label: 'Ouvert', value: 'Du jeudi au dimanche · 13h00–16h00' },
      { label: 'Pommiers', value: 'Près de 1 400' },
    ],
    captionStone: 'La ferme Iturrieta, dans le quartier d’Arraga',
    captionKupelas: 'Les foudres, prêts pour le txotx',
    chip: 'Depuis 1998',
  },
  story: {
    eyebrow: 'À propos',
    title: "Un projet familial au cœur des montagnes d'Aramaio.",
    body: "Iturrieta est un projet familial d'agriculture et d'élevage. En 1997, nous sommes venus de Vitoria dans cette belle ferme d'Aramaio et avons transformé les étables en cidrerie, ouverte le jour de la Saint-Jacques 1998. Aujourd'hui, nous cultivons près de 1 400 pommiers.",
    motto: '« Sagarretik txotxera » : de la pomme au txotx, un cidre naturel bio fait maison.',
    caption: "La ferme, la terrasse et les pommiers, en plein cœur de la vallée d'Aramaio.",
  },
  experiences: {
    eyebrow: "L'expérience",
    title: 'Cidre, grill et bonne compagnie.',
    intro: "Nous cultivons des pommes bio à Aramaio et en faisons notre cidre naturel.",
    items: [
      {
        key: 'txotx',
        title: 'Txotx !',
        meta: 'De janvier à mai',
        body: "Le cidre directement de la kupela, le grill et l'ambiance entre amis. Le reste de l'année, nous le servons en bouteille.",
        alt: "Les foudres d'Iturrieta, prêts pour le txotx",
      },
      {
        key: 'menu',
        title: 'Menu de cidrerie',
        meta: "45€ par personne · toute l'année",
        body: 'Chorizo au cidre, brouillade de morue, morue aux poivrons rôtis, côte de bœuf au grill, et fromage Idiazabal, pâte de coing et noix. Menu enfant à 16 €.',
        alt: "Pomme d'Aramaio",
      },
      {
        key: 'music',
        title: 'De la musique à la cidrerie',
        meta: "Des concerts toute l'année",
        body: "En été, sur la terrasse, la vallée d'Aramaio en face. En hiver, à l'intérieur, près de la cheminée. Appelez-nous pour connaître les prochaines dates.",
        alt: "La terrasse d'Iturrieta avec les montagnes enneigées",
      },
      {
        key: 'visit',
        title: 'Visites guidées',
        meta: 'Familles et groupes',
        body: "Découvrez la ferme, les pommiers et la récolte, et l'élaboration du cidre naturel.",
        alt: "Les pommes d'Aramaio arrivant au pressoir",
      },
    ],
    priceNote: 'Prix selon le site officiel. Merci de les confirmer lors de la réservation.',
  },
  reserve: {
    eyebrow: 'Erreserbak · Réservations',
    title: 'Réservez par téléphone.',
    body: 'Nous prenons les réservations par téléphone et WhatsApp. Appelez-nous et nous confirmons votre table immédiatement.',
    call: 'Appelez le',
    whatsapp: 'Écrivez-nous sur WhatsApp',
    hours: 'Déjeuners',
    hoursValue: 'Du jeudi au dimanche · 13h00–16h00',
    dinners: 'Dîners',
    dinnersValue: 'Uniquement sur commande',
    closedDays: 'Lundi à mercredi',
    closedDaysValue: 'Fermé · groupes sur réservation',
    holidays: 'Fermé pour congés du 24 décembre au 1er janvier.',
    prototypeBadge: 'Prototype',
    prototypeNotice:
      "La réservation en ligne n'est pas encore active. Ce formulaire n'envoie ni n'enregistre rien : il prépare seulement votre demande pour que vous l'envoyiez vous-même par WhatsApp.",
    form: {
      legend: 'Préparez votre demande',
      date: 'Date',
      dateHint: 'Nous ouvrons du jeudi au dimanche.',
      time: 'Heure approximative',
      timeHint: 'Déjeuners de 13h00 à 16h00. Dîners uniquement sur commande.',
      guests: 'Personnes',
      seating: 'Préférence',
      seatingHint: "C'est une préférence, pas une table garantie.",
      indoor: 'Intérieur',
      terrace: 'Terrasse',
      name: 'Nom',
      nameRequired: 'Indiquez votre nom.',
      phone: 'Téléphone',
      phoneRequired: 'Indiquez un numéro de téléphone.',
      notes: 'Commentaires (facultatif)',
      submit: 'Vérifier la demande',
      indoorAlt: "La salle d'Iturrieta, près des foudres",
      terraceAlt: "La terrasse d'Iturrieta avec les montagnes",
    },
    summary: {
      title: 'Votre demande, prête à envoyer',
      body: "Rien n'a encore été envoyé et aucune table n'est réservée. Envoyez-la par WhatsApp et l'équipe d'Iturrieta vous la confirmera.",
      whatsapp: 'Ouvrir WhatsApp avec ces informations',
      edit: 'Modifier',
    },
    whatsappMessage: (d) =>
      lines(
        'Bonjour, je souhaite réserver chez Iturrieta :',
        `· Date : ${d.date}`,
        `· Heure : ${d.time}`,
        `· Personnes : ${d.guests}`,
        `· Préférence : ${d.seating}`,
        `· Nom : ${d.name}`,
        `· Téléphone : ${d.phone}`,
        !!d.notes && `· Commentaires : ${d.notes}`,
      ),
  },
  footer: {
    address: 'Adresse',
    directions: "Voir l'itinéraire",
    contact: 'Contact',
    photoNote: "Photographies : site officiel d'Iturrieta Sagardotegia.",
    officialSite: 'Site officiel',
  },
  imageUnavailable: 'Photographie indisponible',
  photoCredit: 'Photo',
}
