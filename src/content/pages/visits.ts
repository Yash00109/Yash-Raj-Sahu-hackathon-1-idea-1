import type { Lang } from '../../i18n/copy'
import type { VenueImageKey } from '../venue'

export interface VisitStep {
  title: string
  body: string
  image: VenueImageKey
  alt: string
}

export interface VisitsContent {
  eyebrow: string
  title: string
  lede: string
  intro: { title: string; paragraphs: string[] }
  steps: VisitStep[]
  products: { title: string; body: string }
  nature: { title: string; alts: [string, string] }
  bus: { title: string; body: string; location: string }
  cta: { title: string; body: string }
}

export const visitsContent: Record<Lang, VisitsContent> = {
  es: {
    eyebrow: 'Bisita gidatuak',
    title: 'Visitas guiadas',
    lede: 'Conoce de primera mano cómo nace nuestra sidra, entre manzanos y montañas, en Aramaio.',
    intro: {
      title: 'Del manzano a la kupela.',
      paragraphs: [
        'Te invitamos a recorrer nuestro caserío y conocer todo el proceso: desde la manzana cultivada en Aramaio hasta la sidra natural ecológica que servimos del txotx.',
        'Una experiencia cercana y didáctica, perfecta para familias, grupos y cuadrillas que quieren descubrir la cultura de la sidra.',
      ],
    },
    steps: [
      { title: 'El manzanal', body: 'Los manzanos de Aramaio y la recogida de la manzana que da vida a nuestra sidra.', image: 'snowTree', alt: 'Un manzano nevado en Iturrieta' },
      { title: 'La elaboración', body: 'Cómo prensamos la manzana y elaboramos la sidra natural ecológica en la kupela.', image: 'fermenting', alt: 'Sidra fermentando dentro de una kupela' },
      { title: 'El txotx', body: 'La cata directa de la kupela y la cultura de la sidrería, con buena mesa.', image: 'kupelas', alt: 'Las kupelas de Iturrieta junto a las mesas del comedor' },
    ],
    products: { title: 'Sidra y zumo ecológicos', body: 'Llévate a casa nuestra sidra natural y nuestro zumo de manzana ecológico, de manzana de Aramaio.' },
    nature: { title: 'Naturaleza de Aramaio', alts: ['El valle de Aramaio con los montes nevados al fondo', 'La terraza de Iturrieta cubierta de nieve'] },
    bus: {
      title: 'Servicio de autobús',
      body: 'Para grupos de Debagoiena ofrecemos servicio de autobús. Consúltanos al reservar y organizamos tu visita con transporte incluido.',
      location: 'Estamos en Arraga auzoa, 2 · 01169 Aramaio (Álava), en pleno entorno natural.',
    },
    cta: { title: 'Ven a conocernos', body: 'Reserva tu mesa o tu visita guiada y vive la sidra desde su origen.' },
  },
  eu: {
    eyebrow: 'Bisita gidatuak',
    title: 'Bisita gidatuak',
    lede: 'Ezagutu zuzenean nola jaiotzen den gure sagardoa, sagarrondo eta mendien artean, Aramaion.',
    intro: {
      title: 'Sagarrondotik kupelara.',
      paragraphs: [
        'Gure baserria ezagutzera gonbidatzen zaitugu eta prozesu osoa: Aramaion landutako sagarretik txotxetik ematen dugun sagardo natural ekologikora arte.',
        'Esperientzia hurbila eta didaktikoa, familia, talde eta koadrilentzat aproposa, sagardoaren kultura ezagutu nahi dutenentzat.',
      ],
    },
    steps: [
      { title: 'Sagardia', body: 'Aramaioko sagarrondoak eta gure sagardoa sortzen duen sagarraren bilketa.', image: 'snowTree', alt: 'Sagarrondo elurtua Iturrietan' },
      { title: 'Elaborazioa', body: 'Nola prentsatzen dugun sagarra eta nola egiten dugun sagardo natural ekologikoa kupelan.', image: 'fermenting', alt: 'Sagardoa hartzitzen kupela barruan' },
      { title: 'Txotxa', body: 'Kupeletik zuzeneko dastaketa eta sagardotegiaren kultura, mahai onarekin.', image: 'kupelas', alt: 'Iturrietako kupelak jantokiko mahaien ondoan' },
    ],
    products: { title: 'Sagardo eta zuku ekologikoak', body: 'Eraman etxera gure sagardo naturala eta Aramaioko sagarrarekin egindako sagar-zuku ekologikoa.' },
    nature: { title: 'Aramaioko natura', alts: ['Aramaioko harana, mendi elurtuak atzean', 'Iturrietako terraza elurrez estalita'] },
    bus: {
      title: 'Autobus zerbitzua',
      body: 'Debagoieneko taldeentzat autobus zerbitzua eskaintzen dugu. Galdetu erreserbatzean eta zure bisita garraioarekin antolatuko dugu.',
      location: 'Arraga auzoa, 2 · 01169 Aramaio (Araba), natura ingurunean.',
    },
    cta: { title: 'Etorri gu ezagutzera', body: 'Erreserbatu mahaia edo bisita gidatua eta bizi sagardoa jatorritik.' },
  },
  fr: {
    eyebrow: 'Bisita gidatuak',
    title: 'Visites guidées',
    lede: 'Découvrez de première main comment naît notre cidre, entre pommiers et montagnes, à Aramaio.',
    intro: {
      title: 'Du pommier à la kupela.',
      paragraphs: [
        'Nous vous invitons à parcourir notre ferme et à découvrir tout le processus : de la pomme cultivée à Aramaio au cidre naturel bio servi au txotx.',
        'Une expérience proche et didactique, parfaite pour les familles et groupes qui veulent découvrir la culture du cidre.',
      ],
    },
    steps: [
      { title: 'Le verger', body: "Les pommiers d'Aramaio et la récolte de la pomme qui donne vie à notre cidre.", image: 'snowTree', alt: 'Un pommier enneigé à Iturrieta' },
      { title: "L'élaboration", body: 'Comment nous pressons la pomme et élaborons le cidre naturel bio dans la kupela.', image: 'fermenting', alt: 'Cidre en fermentation dans une kupela' },
      { title: 'Le txotx', body: 'La dégustation directe de la kupela et la culture de la cidrerie, avec une bonne table.', image: 'kupelas', alt: "Les foudres d'Iturrieta près des tables de la salle" },
    ],
    products: { title: 'Cidre et jus bio', body: "Emportez chez vous notre cidre naturel et notre jus de pomme bio, à base de pommes d'Aramaio." },
    nature: { title: "Nature d'Aramaio", alts: ["La vallée d'Aramaio avec les montagnes enneigées", "La terrasse d'Iturrieta sous la neige"] },
    bus: {
      title: "Service d'autobus",
      body: "Pour les groupes de Debagoiena, nous proposons un service d'autobus. Demandez-nous lors de la réservation et nous organisons votre visite avec le transport.",
      location: 'Nous sommes à Arraga auzoa, 2 · 01169 Aramaio (Álava), en pleine nature.',
    },
    cta: { title: 'Venez nous découvrir', body: 'Réservez votre table ou votre visite guidée et vivez le cidre dès son origine.' },
  },
  de: {
    eyebrow: 'Bisita gidatuak',
    title: 'Führungen',
    lede: 'Erleben Sie aus erster Hand, wie unser Apfelwein entsteht – zwischen Apfelbäumen und Bergen in Aramaio.',
    intro: {
      title: 'Vom Apfelbaum zur Kupela.',
      paragraphs: [
        'Wir laden Sie ein, unseren Bauernhof zu erkunden und den ganzen Prozess kennenzulernen: vom in Aramaio angebauten Apfel bis zum naturtrüben Bio-Apfelwein, den wir vom Txotx ausschenken.',
        'Ein persönliches und lehrreiches Erlebnis, ideal für Familien, Gruppen und Freundeskreise, die die Apfelweinkultur entdecken möchten.',
      ],
    },
    steps: [
      { title: 'Der Obstgarten', body: 'Die Apfelbäume von Aramaio und die Ernte der Äpfel, aus denen unser Apfelwein entsteht.', image: 'snowTree', alt: 'Ein verschneiter Apfelbaum bei Iturrieta' },
      { title: 'Die Herstellung', body: 'Wie wir die Äpfel pressen und den naturtrüben Bio-Apfelwein in der Kupela herstellen.', image: 'fermenting', alt: 'Gärender Apfelwein in einer Kupela' },
      { title: 'Der Txotx', body: 'Die Verkostung direkt aus der Kupela und die Kultur der Sidrería, mit gutem Essen.', image: 'kupelas', alt: 'Die Kupelas von Iturrieta neben den Tischen im Speiseraum' },
    ],
    products: { title: 'Bio-Apfelwein und -Saft', body: 'Nehmen Sie unseren naturtrüben Apfelwein und unseren Bio-Apfelsaft aus Äpfeln aus Aramaio mit nach Hause.' },
    nature: { title: 'Natur von Aramaio', alts: ['Das Tal von Aramaio mit verschneiten Bergen', 'Die Terrasse von Iturrieta im Schnee'] },
    bus: {
      title: 'Busservice',
      body: 'Für Gruppen aus Debagoiena bieten wir einen Busservice an. Fragen Sie bei der Reservierung danach, und wir organisieren Ihren Besuch mit Transport.',
      location: 'Sie finden uns in Arraga auzoa, 2 · 01169 Aramaio (Álava), mitten in der Natur.',
    },
    cta: { title: 'Besuchen Sie uns', body: 'Reservieren Sie Ihren Tisch oder Ihre Führung und erleben Sie den Apfelwein von seinem Ursprung an.' },
  },
  en: {
    eyebrow: 'Bisita gidatuak',
    title: 'Guided visits',
    lede: 'Discover first-hand how our cider is born, among apple trees and mountains, in Aramaio.',
    intro: {
      title: 'From apple tree to kupela.',
      paragraphs: [
        'We invite you to tour our farmhouse and learn the whole process: from the apples grown in Aramaio to the natural organic cider we serve from the txotx.',
        'A close, hands-on experience, perfect for families and groups who want to discover cider culture.',
      ],
    },
    steps: [
      { title: 'The orchard', body: 'The apple trees of Aramaio and the harvest of the apples that give life to our cider.', image: 'snowTree', alt: 'A snow-covered apple tree at Iturrieta' },
      { title: 'The making', body: 'How we press the apples and make natural organic cider in the kupela.', image: 'fermenting', alt: 'Cider fermenting inside a kupela' },
      { title: 'The txotx', body: 'Tasting straight from the kupela and the cider-house culture, with great food.', image: 'kupelas', alt: 'The Iturrieta kupelas beside the dining tables' },
    ],
    products: { title: 'Organic cider & juice', body: 'Take home our natural cider and organic apple juice, made from Aramaio apples.' },
    nature: { title: 'Nature of Aramaio', alts: ['The Aramaio valley with snowy mountains behind', 'The Iturrieta terrace covered in snow'] },
    bus: {
      title: 'Bus service',
      body: "For groups from Debagoiena we offer a bus service. Ask us when booking and we'll arrange your visit with transport.",
      location: "We're at Arraga auzoa, 2 · 01169 Aramaio (Álava), surrounded by nature.",
    },
    cta: { title: 'Come and meet us', body: 'Book your table or guided visit and experience cider from its origin.' },
  },
}
