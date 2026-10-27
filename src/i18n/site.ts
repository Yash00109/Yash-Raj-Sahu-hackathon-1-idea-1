import type { PageKey } from '../routes'
import type { Lang } from './copy'

/**
 * Site-wide navigation and interface strings. Page labels follow the official
 * site's own section names where one exists; the remaining interface strings
 * are drafts (Basque ones need native review), not official copy.
 */
export interface SiteCopy {
  /** Official contact-page wording (German translated). */
  reservationsPage: { title: string; lede: string }
  home: string
  pages: Record<PageKey, string>
  primaryNav: string
  footerNav: string
  /** Discreet footer link to the staff area (not part of the customer journey). */
  staffLogin: string
  learnMore: string
  sourceNote: string
  sourceLink: string
  prepareRequest: string
  routeOnMaps: string
  notFound: { title: string; body: string; back: string }
  /** Shown site-wide when the language has no official source text. */
  translationNotice: string | null
}

export const site: Record<Lang, SiteCopy> = {
  es: {
    reservationsPage: { title: 'Reservas', lede: 'Reserva tu mesa o tu celebración. Estaremos encantados de recibirte en Aramaio.' },
    home: 'Inicio',
    pages: {
      menus: 'Menús',
      about: 'Nosotros',
      visits: 'Visitas guiadas',
      products: 'Sidra y zumo',
      concerts: 'Música',
      location: 'Contacto',
    },
    primaryNav: 'Navegación principal',
    footerNav: 'Páginas',
    staffLogin: 'Acceso del personal',
    learnMore: 'Ver más',
    sourceNote: 'Información publicada en la web oficial de Iturrieta Sagardotegia.',
    sourceLink: 'Ver página oficial',
    prepareRequest: 'Preparar solicitud',
    routeOnMaps: 'Ver la ruta en Google Maps',
    notFound: {
      title: 'Página no encontrada',
      body: 'La página que buscas no existe o ha cambiado de dirección.',
      back: 'Volver al inicio',
    },
    translationNotice: null,
  },
  eu: {
    reservationsPage: { title: 'Erreserbak', lede: 'Erreserbatu mahaia edo ospakizuna. Pozik hartuko zaitugu Aramaion.' },
    home: 'Hasiera',
    pages: {
      menus: 'Menuak',
      about: 'Nor gara',
      visits: 'Bisita gidatuak',
      products: 'Sagardoa eta zukua',
      concerts: 'Musika',
      location: 'Kontaktua',
    },
    primaryNav: 'Nabigazio nagusia',
    footerNav: 'Orriak',
    staffLogin: 'Langileen sarbidea',
    learnMore: 'Gehiago ikusi',
    sourceNote: 'Iturrieta Sagardotegiaren webgune ofizialean argitaratutako informazioa.',
    sourceLink: 'Ikusi orri ofiziala',
    prepareRequest: 'Prestatu eskaera',
    routeOnMaps: 'Ikusi ibilbidea Google Maps-en',
    notFound: {
      title: 'Ez da orria aurkitu',
      body: 'Bilatzen ari zaren orria ez dago edo helbidez aldatu da.',
      back: 'Itzuli hasierara',
    },
    translationNotice: null,
  },
  fr: {
    reservationsPage: { title: 'Réservations', lede: 'Réservez votre table ou votre célébration. Nous serons ravis de vous accueillir à Aramaio.' },
    home: 'Accueil',
    pages: {
      menus: 'Menus',
      about: 'À propos',
      visits: 'Visites guidées',
      products: 'Cidre et jus',
      concerts: 'Musique',
      location: 'Contact',
    },
    primaryNav: 'Navigation principale',
    footerNav: 'Pages',
    staffLogin: 'Accès du personnel',
    learnMore: 'En savoir plus',
    sourceNote: "Informations publiées sur le site officiel d'Iturrieta Sagardotegia.",
    sourceLink: 'Voir la page officielle',
    prepareRequest: 'Préparer une demande',
    routeOnMaps: "Voir l'itinéraire sur Google Maps",
    notFound: {
      title: 'Page introuvable',
      body: "La page que vous cherchez n'existe pas ou a changé d'adresse.",
      back: "Retour à l'accueil",
    },
    translationNotice: null,
  },
  de: {
    reservationsPage: { title: 'Reservierungen', lede: 'Reservieren Sie Ihren Tisch oder Ihre Feier. Wir freuen uns, Sie in Aramaio zu begrüßen.' },
    home: 'Start',
    pages: {
      menus: 'Menüs',
      about: 'Über uns',
      visits: 'Führungen',
      products: 'Apfelwein & Saft',
      concerts: 'Livemusik',
      location: 'Kontakt',
    },
    primaryNav: 'Hauptnavigation',
    footerNav: 'Seiten',
    staffLogin: 'Zugang für Mitarbeitende',
    learnMore: 'Mehr erfahren',
    sourceNote:
      'Inoffizielle deutsche Übersetzung der Informationen auf der offiziellen Website von Iturrieta Sagardotegia (dort nicht auf Deutsch verfügbar).',
    sourceLink: 'Offizielle Seite (Englisch)',
    prepareRequest: 'Anfrage vorbereiten',
    routeOnMaps: 'Route in Google Maps ansehen',
    notFound: {
      title: 'Seite nicht gefunden',
      body: 'Die gesuchte Seite existiert nicht oder ist umgezogen.',
      back: 'Zur Startseite',
    },
    translationNotice:
      'Inoffizielle Übersetzung: Die offizielle Website von Iturrieta ist nicht auf Deutsch verfügbar. Bitte bestätigen Sie wichtige Angaben telefonisch.',
  },
  en: {
    reservationsPage: { title: 'Bookings', lede: "Book your table or celebration. We'll be delighted to welcome you in Aramaio." },
    home: 'Home',
    pages: {
      menus: 'Menus',
      about: 'About us',
      visits: 'Guided visits',
      products: 'Cider & juice',
      concerts: 'Live music',
      location: 'Contact',
    },
    primaryNav: 'Main navigation',
    footerNav: 'Pages',
    staffLogin: 'Staff login',
    learnMore: 'Learn more',
    sourceNote: 'Information published on the official Iturrieta Sagardotegia website.',
    sourceLink: 'View official page',
    prepareRequest: 'Prepare a request',
    routeOnMaps: 'See the route on Google Maps',
    notFound: {
      title: 'Page not found',
      body: 'The page you are looking for does not exist or has moved.',
      back: 'Back to home',
    },
    translationNotice: null,
  },
}
