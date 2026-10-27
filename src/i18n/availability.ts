import type { ReservationStatus } from '../../supabase/functions/_shared/reservation.ts'
import type { Lang } from './copy'

/**
 * Online availability and booking-tracker strings. Not on the official site: drafts
 * (French, Basque and German need native review). They must stay truthful: available
 * slots are requests the venue still confirms, and seating is a preference only.
 */
export interface AvailabilityCopy {
  slots: {
    legend: string
    hint: string
    idle: string
    loading: string
    error: string
    none: string
    full: string
    retry: string
    taken: string
  }
  tracker: {
    link: string
    title: string
    lede: string
    reference: string
    referenceHint: string
    phone: string
    phoneHint: string
    submit: string
    submitting: string
    resultTitle: string
    date: string
    time: string
    guests: string
    status: string
    statuses: Record<ReservationStatus, string>
    pendingNote: string
    notFound: string
    invalid: string
    rateLimited: string
    error: string
    unavailable: string
  }
}

export const availability: Record<Lang, AvailabilityCopy> = {
  es: {
    slots: {
      legend: 'Hora',
      hint: 'Solo se muestran las horas que aún admiten tu grupo. La preferencia de dentro o terraza no reserva una zona concreta.',
      idle: 'Elige una fecha y el número de personas para ver las horas disponibles.',
      loading: 'Buscando horas disponibles…',
      error: 'No hemos podido consultar la disponibilidad. Inténtalo de nuevo o llámanos.',
      none: 'No quedan horas para reservar online ese día. Prueba otra fecha o llámanos.',
      full: 'completo',
      retry: 'Volver a consultar',
      taken: 'Esa hora se acaba de completar. Elige otra hora disponible.',
    },
    tracker: {
      link: 'Consultar una solicitud',
      title: 'Consulta tu solicitud',
      lede: 'Escribe la referencia que recibiste y el teléfono con el que hiciste la solicitud.',
      reference: 'Referencia',
      referenceHint: 'Empieza por IT-, por ejemplo IT-1A2B3C4D5E6F.',
      phone: 'Teléfono de la solicitud',
      phoneHint: 'El mismo número que escribiste al solicitar.',
      submit: 'Consultar',
      submitting: 'Consultando…',
      resultTitle: 'Tu solicitud',
      date: 'Fecha',
      time: 'Hora',
      guests: 'Personas',
      status: 'Estado',
      statuses: { pending: 'Pendiente de confirmación', confirmed: 'Confirmada', rejected: 'No aceptada', cancelled: 'Cancelada' },
      pendingNote: 'Todavía no es una reserva confirmada: el equipo de Iturrieta te contactará.',
      notFound: 'No encontramos ninguna solicitud con esa referencia y ese teléfono. Revisa los datos.',
      invalid: 'Revisa la referencia y el teléfono.',
      rateLimited: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
      error: 'No hemos podido hacer la consulta. Inténtalo de nuevo o llámanos.',
      unavailable: 'La consulta online no está disponible ahora mismo. Llámanos para conocer el estado de tu solicitud.',
    },
  },
  eu: {
    slots: {
      legend: 'Ordua',
      hint: 'Zure taldearentzat lekua duten orduak bakarrik agertzen dira. Barruko edo terrazako lehentasunak ez du gune jakin bat erreserbatzen.',
      idle: 'Aukeratu data eta pertsona kopurua ordu libreak ikusteko.',
      loading: 'Ordu libreak bilatzen…',
      error: 'Ezin izan dugu erabilgarritasuna kontsultatu. Saiatu berriro edo deitu iezaguzu.',
      none: 'Egun horretan ez dago online erreserbatzeko ordurik. Probatu beste data bat edo deitu iezaguzu.',
      full: 'beteta',
      retry: 'Berriro kontsultatu',
      taken: 'Ordu hori bete berri da. Aukeratu beste ordu libre bat.',
    },
    tracker: {
      link: 'Eskaera bat kontsultatu',
      title: 'Kontsultatu zure eskaera',
      lede: 'Idatzi jaso zenuen erreferentzia eta eskaera egiteko erabili zenuen telefonoa.',
      reference: 'Erreferentzia',
      referenceHint: 'IT- hasten da, adibidez IT-1A2B3C4D5E6F.',
      phone: 'Eskaerako telefonoa',
      phoneHint: 'Eskaeran idatzi zenuen zenbaki bera.',
      submit: 'Kontsultatu',
      submitting: 'Kontsultatzen…',
      resultTitle: 'Zure eskaera',
      date: 'Data',
      time: 'Ordua',
      guests: 'Pertsonak',
      status: 'Egoera',
      statuses: { pending: 'Berrespenaren zain', confirmed: 'Berretsita', rejected: 'Ez da onartu', cancelled: 'Ezeztatuta' },
      pendingNote: 'Oraindik ez da erreserba berretsia: Iturrietako taldea zurekin jarriko da harremanetan.',
      notFound: 'Ez dugu aurkitu erreferentzia eta telefono horiekin bat datorren eskaerarik. Berrikusi datuak.',
      invalid: 'Berrikusi erreferentzia eta telefonoa.',
      rateLimited: 'Saiakera gehiegi. Itxaron minutu batzuk eta saiatu berriro.',
      error: 'Ezin izan dugu kontsulta egin. Saiatu berriro edo deitu iezaguzu.',
      unavailable: 'Online kontsulta ez dago erabilgarri une honetan. Deitu iezaguzu zure eskaeraren egoera jakiteko.',
    },
  },
  fr: {
    slots: {
      legend: 'Heure',
      hint: 'Seuls les horaires qui peuvent encore accueillir votre groupe sont proposés. La préférence intérieur ou terrasse ne réserve pas une zone précise.',
      idle: 'Choisissez une date et le nombre de personnes pour voir les horaires disponibles.',
      loading: 'Recherche des horaires disponibles…',
      error: "Impossible de consulter les disponibilités. Réessayez ou appelez-nous.",
      none: "Plus d'horaire réservable en ligne ce jour-là. Essayez une autre date ou appelez-nous.",
      full: 'complet',
      retry: 'Vérifier à nouveau',
      taken: 'Cet horaire vient d’être complet. Choisissez un autre horaire disponible.',
    },
    tracker: {
      link: 'Suivre une demande',
      title: 'Suivre votre demande',
      lede: 'Saisissez la référence reçue et le téléphone utilisé pour la demande.',
      reference: 'Référence',
      referenceHint: 'Commence par IT-, par exemple IT-1A2B3C4D5E6F.',
      phone: 'Téléphone de la demande',
      phoneHint: 'Le même numéro que lors de la demande.',
      submit: 'Consulter',
      submitting: 'Consultation…',
      resultTitle: 'Votre demande',
      date: 'Date',
      time: 'Heure',
      guests: 'Personnes',
      status: 'Statut',
      statuses: { pending: 'En attente de confirmation', confirmed: 'Confirmée', rejected: 'Non acceptée', cancelled: 'Annulée' },
      pendingNote: "Ce n'est pas encore une réservation confirmée : l'équipe d'Iturrieta vous contactera.",
      notFound: 'Aucune demande ne correspond à cette référence et à ce téléphone. Vérifiez vos informations.',
      invalid: 'Vérifiez la référence et le téléphone.',
      rateLimited: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
      error: 'La consultation a échoué. Réessayez ou appelez-nous.',
      unavailable: "Le suivi en ligne n'est pas disponible pour le moment. Appelez-nous pour connaître l'état de votre demande.",
    },
  },
  en: {
    slots: {
      legend: 'Time',
      hint: 'Only times that can still take your group are shown. The indoor or terrace preference does not reserve a specific area.',
      idle: 'Choose a date and the number of guests to see available times.',
      loading: 'Checking available times…',
      error: 'We could not check availability. Please try again or call us.',
      none: 'No times are left to book online on that day. Try another date or call us.',
      full: 'full',
      retry: 'Check again',
      taken: 'That time has just filled up. Please choose another available time.',
    },
    tracker: {
      link: 'Check a request',
      title: 'Check your request',
      lede: 'Enter the reference you received and the phone number you used for the request.',
      reference: 'Reference',
      referenceHint: 'Starts with IT-, for example IT-1A2B3C4D5E6F.',
      phone: 'Phone used for the request',
      phoneHint: 'The same number you entered when requesting.',
      submit: 'Check',
      submitting: 'Checking…',
      resultTitle: 'Your request',
      date: 'Date',
      time: 'Time',
      guests: 'Guests',
      status: 'Status',
      statuses: { pending: 'Awaiting confirmation', confirmed: 'Confirmed', rejected: 'Not accepted', cancelled: 'Cancelled' },
      pendingNote: 'This is not a confirmed booking yet: the Iturrieta team will contact you.',
      notFound: 'We could not find a request with that reference and phone number. Please check the details.',
      invalid: 'Please check the reference and the phone number.',
      rateLimited: 'Too many attempts. Please wait a few minutes and try again.',
      error: 'We could not complete the check. Please try again or call us.',
      unavailable: 'Online checking is not available right now. Please call us for the status of your request.',
    },
  },
  de: {
    slots: {
      legend: 'Uhrzeit',
      hint: 'Es werden nur Uhrzeiten angezeigt, zu denen Ihre Gruppe noch Platz hat. Die Wahl drinnen oder Terrasse reserviert keinen bestimmten Bereich.',
      idle: 'Wählen Sie ein Datum und die Personenzahl, um freie Uhrzeiten zu sehen.',
      loading: 'Freie Uhrzeiten werden gesucht…',
      error: 'Die Verfügbarkeit konnte nicht abgefragt werden. Bitte versuchen Sie es erneut oder rufen Sie uns an.',
      none: 'An diesem Tag sind online keine Uhrzeiten mehr buchbar. Versuchen Sie ein anderes Datum oder rufen Sie uns an.',
      full: 'ausgebucht',
      retry: 'Erneut prüfen',
      taken: 'Diese Uhrzeit ist gerade ausgebucht. Bitte wählen Sie eine andere freie Uhrzeit.',
    },
    tracker: {
      link: 'Anfrage abfragen',
      title: 'Ihre Anfrage abfragen',
      lede: 'Geben Sie die erhaltene Referenz und die Telefonnummer Ihrer Anfrage ein.',
      reference: 'Referenz',
      referenceHint: 'Beginnt mit IT-, zum Beispiel IT-1A2B3C4D5E6F.',
      phone: 'Telefonnummer der Anfrage',
      phoneHint: 'Dieselbe Nummer wie bei der Anfrage.',
      submit: 'Abfragen',
      submitting: 'Wird abgefragt…',
      resultTitle: 'Ihre Anfrage',
      date: 'Datum',
      time: 'Uhrzeit',
      guests: 'Personen',
      status: 'Status',
      statuses: { pending: 'Wartet auf Bestätigung', confirmed: 'Bestätigt', rejected: 'Nicht angenommen', cancelled: 'Storniert' },
      pendingNote: 'Dies ist noch keine bestätigte Reservierung: Das Team von Iturrieta meldet sich bei Ihnen.',
      notFound: 'Wir haben keine Anfrage mit dieser Referenz und Telefonnummer gefunden. Bitte prüfen Sie die Angaben.',
      invalid: 'Bitte prüfen Sie Referenz und Telefonnummer.',
      rateLimited: 'Zu viele Versuche. Bitte warten Sie einige Minuten und versuchen Sie es erneut.',
      error: 'Die Abfrage ist fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie uns an.',
      unavailable: 'Die Online-Abfrage ist derzeit nicht verfügbar. Bitte rufen Sie uns an, um den Stand Ihrer Anfrage zu erfahren.',
    },
  },
}
