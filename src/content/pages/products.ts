import type { Lang } from '../../i18n/copy'
import type { VenueImageKey } from '../venue'

export interface Product {
  name: string
  body: string
  /** Only set where an official photo clearly shows this product. */
  image?: VenueImageKey
  alt?: string
}

export interface ProductsContent {
  eyebrow: string
  title: string
  lede: string
  heroAlt: string
  care: { title: string; body: string }[]
  shop: { title: string; lede: string; products: Product[] }
  order: { title: string; body: string; byEmail: string; byPhone: string; note: string }
  cta: { title: string; body: string }
}

export const productsContent: Record<Lang, ProductsContent> = {
  es: {
    eyebrow: 'Denda · Tienda',
    title: 'Sidra y zumo, naturales y ecológicos',
    lede: 'Nuestra sidra y nuestro zumo de manzana son totalmente naturales y ecológicos, hechos con las manzanas de nuestros propios manzanos.',
    heroAlt: 'Botellas de sidra y zumo de Iturrieta con manzanas',
    care: [
      { title: 'Manzanos sanos', body: 'Manzanales soleados y ventilados, con variedades diversas y un cuidado constante asesorado por técnicos especializados.' },
      { title: 'Poda y cuidado', body: 'Podas en invierno y verano (de noviembre a marzo y en agosto), floración hacia abril y recogida de octubre a mediados de noviembre.' },
      { title: 'Productos propios', body: 'Sidra y zumo ecológicos, y también vinagre de manzana y cava de manzana, elaborados en el caserío.' },
    ],
    shop: {
      title: 'Sidra y mucho más, de la manzana de Aramaio.',
      lede: 'Llévate a casa nuestra sidra y nuestros productos ecológicos, elaborados con manzana de Aramaio.',
      products: [
        { name: 'Sidra natural ecológica «Iturrieta»', body: 'Sagardo naturala. La de casa, de manzana de Aramaio: del txotx de enero a mayo y en botella el resto del año.', image: 'ciderBottle', alt: 'Botella de sidra natural ecológica Iturrieta' },
        { name: 'Zumo de manzana ecológico', body: 'Solo manzana, sin nada más. Recién prensado y embotellado en el caserío.', image: 'juiceBottles', alt: 'Botellas de zumo de manzana' },
        { name: 'Sagardo apardun · brut nature', body: 'Sidra espumosa hecha con el método tradicional, seca y sin azúcar añadido.', image: 'sparklingBottles', alt: 'Botellas de sagardo apardun brut nature' },
        { name: 'Vinagre de manzana', body: 'De nuestra propia sidra, con su fermentación lenta.' },
        { name: 'La cesta de Iturrieta', body: 'Sidra, zumo y producto de la casa en una cesta, para llevar o para regalar.', image: 'hamper', alt: 'Cesta con botellas de sidra y zumo de Iturrieta' },
      ],
    },
    order: {
      title: 'Haz tu pedido',
      body: 'Puedes comprar en el propio caserío o pedir y recibir tus productos por agencia de transporte.',
      byEmail: 'Por email',
      byPhone: 'Por teléfono',
      note: 'Envíos por agencia de transporte. Consúltanos disponibilidad, formatos y precios.',
    },
    cta: { title: 'Ven a conocernos', body: 'Reserva tu mesa o tu visita guiada y vive la sidra desde su origen.' },
  },
  eu: {
    eyebrow: 'Denda',
    title: 'Sagardoa eta zukua, naturalak eta ekologikoak',
    lede: 'Gure sagardoa eta sagar-zukua guztiz naturalak eta ekologikoak dira, gure sagarrondoetako sagarrekin eginak.',
    heroAlt: 'Iturrietako sagardo eta zuku botilak sagarrekin',
    care: [
      { title: 'Sagarrondo osasuntsuak', body: 'Sagarrondo eguzkitsu eta aireztatuak, barietate ezberdinekin eta teknikari espezializatuen aholkularitzapean zaindurik.' },
      { title: 'Inausketa eta zainketa', body: 'Inausketak neguan eta udan (azarotik martxora eta abuztuan), loraketa apirilean eta bilketa urritik azaroaren erdialdera.' },
      { title: 'Gure produktuak', body: 'Sagardo eta zuku ekologikoak, eta baita sagar-ozpina eta sagar-cava ere, baserrian eginak.' },
    ],
    shop: {
      title: 'Sagardoa eta gehiago, Aramaioko sagarretik.',
      lede: 'Eraman etxera gure sagardoa eta Aramaioko sagarrarekin egindako produktu ekologikoak.',
      products: [
        { name: '«Iturrieta» sagardo natural ekologikoa', body: 'Etxeko sagardoa, Aramaioko sagarrarekin: txotxetik urtarriletik maiatzera eta botilan urteko gainerakoan.', image: 'ciderBottle', alt: 'Iturrieta sagardo natural ekologikoaren botila' },
        { name: 'Sagar zuku ekologikoa', body: 'Sagarra besterik ez. Baserrian bertan prentsatua eta botilaratua.', image: 'juiceBottles', alt: 'Sagar zuku botilak' },
        { name: 'Sagardo apardun · brut nature', body: 'Metodo tradizionalarekin egindako sagardo aparduna, lehorra eta azukre gehiturik gabe.', image: 'sparklingBottles', alt: 'Sagardo apardun brut nature botilak' },
        { name: 'Sagar ozpina', body: 'Gure sagardotik bertatik, hartzidura geldiarekin.' },
        { name: 'Iturrietako saskia', body: 'Sagardoa, zukua eta etxeko produktua saski batean, eramateko edo oparitzeko.', image: 'hamper', alt: 'Iturrietako sagardo eta zuku botilak saski batean' },
      ],
    },
    order: {
      title: 'Egin zure eskaera',
      body: 'Baserrian bertan eros dezakezu edo garraio-agentzia bidez jaso zure produktuak.',
      byEmail: 'Emailez',
      byPhone: 'Telefonoz',
      note: 'Bidalketak garraio-agentzia bidez. Galdetu eskuragarritasuna, formatuak eta prezioak.',
    },
    cta: { title: 'Etorri gu ezagutzera', body: 'Erreserbatu mahaia edo bisita gidatua eta bizi sagardoa jatorritik.' },
  },
  fr: {
    eyebrow: 'Denda · Boutique',
    title: 'Cidre et jus, naturels et bio',
    lede: 'Notre cidre et notre jus de pomme sont entièrement naturels et bio, élaborés avec les pommes de nos propres vergers.',
    heroAlt: "Bouteilles de cidre et de jus d'Iturrieta avec des pommes",
    care: [
      { title: 'Des pommiers sains', body: 'Vergers ensoleillés et ventilés, aux variétés diverses, soignés en continu sous le conseil de techniciens spécialisés.' },
      { title: 'Taille et soin', body: "Tailles en hiver et en été (novembre à mars et août), floraison vers avril et récolte d'octobre à mi-novembre." },
      { title: 'Nos produits', body: 'Cidre et jus bio, ainsi que vinaigre de pomme et cava de pomme, élaborés à la ferme.' },
    ],
    shop: {
      title: "Du cidre et bien plus, de la pomme d'Aramaio.",
      lede: "Emportez chez vous notre cidre et nos produits bio, élaborés avec des pommes d'Aramaio.",
      products: [
        { name: 'Cidre naturel bio « Iturrieta »', body: "Le cidre de la maison, à la pomme d'Aramaio : au txotx de janvier à mai et en bouteille le reste de l'année.", image: 'ciderBottle', alt: 'Bouteille de cidre naturel bio Iturrieta' },
        { name: 'Jus de pomme bio', body: 'Rien que de la pomme. Pressé et mis en bouteille à la ferme.', image: 'juiceBottles', alt: 'Bouteilles de jus de pomme' },
        { name: 'Cidre mousseux · brut nature', body: 'Cidre mousseux élaboré selon la méthode traditionnelle, sec et sans sucre ajouté.', image: 'sparklingBottles', alt: 'Bouteilles de cidre mousseux brut nature' },
        { name: 'Vinaigre de pomme', body: 'Issu de notre propre cidre, en fermentation lente.' },
        { name: "Le panier d'Iturrieta", body: 'Cidre, jus et produits maison dans un panier, à emporter ou à offrir.', image: 'hamper', alt: "Panier avec des bouteilles de cidre et de jus d'Iturrieta" },
      ],
    },
    order: {
      title: 'Passez votre commande',
      // The French shop page omits these two sentences; translated from the Spanish/English pages (needs review).
      body: 'Vous pouvez acheter à la ferme ou commander et recevoir vos produits par transporteur.',
      byEmail: 'Par email',
      byPhone: 'Par téléphone',
      note: 'Envois par transporteur. Renseignez-vous sur la disponibilité, les formats et les prix.',
    },
    cta: { title: 'Venez nous découvrir', body: 'Réservez votre table ou votre visite guidée et vivez le cidre dès son origine.' },
  },
  de: {
    eyebrow: 'Denda · Hofladen',
    title: 'Apfelwein und Saft, natürlich und bio',
    lede: 'Unser Apfelwein und unser Apfelsaft sind vollkommen natürlich und bio, hergestellt aus den Äpfeln unserer eigenen Obstgärten.',
    heroAlt: 'Apfelwein- und Saftflaschen von Iturrieta mit Äpfeln',
    care: [
      { title: 'Gesunde Apfelbäume', body: 'Sonnige, gut belüftete Obstgärten mit verschiedenen Sorten, ständig gepflegt und von Fachtechnikern beraten.' },
      { title: 'Schnitt und Pflege', body: 'Schnitt im Winter und Sommer (November bis März und August), Blüte um April und Ernte von Oktober bis Mitte November.' },
      { title: 'Eigene Produkte', body: 'Bio-Apfelwein und -Saft sowie Apfelessig und Apfel-Cava, hergestellt auf dem Hof.' },
    ],
    shop: {
      title: 'Apfelwein und mehr, aus Äpfeln aus Aramaio.',
      lede: 'Nehmen Sie unseren Apfelwein und unsere Bio-Produkte aus Äpfeln aus Aramaio mit nach Hause.',
      products: [
        { name: 'Naturtrüber Bio-Apfelwein „Iturrieta“', body: 'Unser Hausapfelwein aus Äpfeln aus Aramaio: vom Txotx von Januar bis Mai und den Rest des Jahres in der Flasche.', image: 'ciderBottle', alt: 'Eine Flasche naturtrüber Bio-Apfelwein Iturrieta' },
        { name: 'Bio-Apfelsaft', body: 'Nur Äpfel, sonst nichts. Auf dem Hof gepresst und abgefüllt.', image: 'juiceBottles', alt: 'Flaschen mit Apfelsaft' },
        { name: 'Sagardo apardun · brut nature', body: 'Schaumapfelwein nach traditioneller Methode, trocken und ohne Zuckerzusatz.', image: 'sparklingBottles', alt: 'Flaschen Schaumapfelwein brut nature' },
        { name: 'Apfelessig', body: 'Aus unserem eigenen Apfelwein, langsam vergoren.' },
        { name: 'Der Iturrieta-Korb', body: 'Apfelwein, Saft und Hausprodukte in einem Korb, zum Mitnehmen oder Verschenken.', image: 'hamper', alt: 'Ein Korb mit Apfelwein- und Saftflaschen von Iturrieta' },
      ],
    },
    order: {
      title: 'Bestellen',
      body: 'Sie können direkt auf dem Hof kaufen oder bestellen und Ihre Produkte per Spedition erhalten.',
      byEmail: 'Per E-Mail',
      byPhone: 'Per Telefon',
      note: 'Versand per Spedition. Fragen Sie nach Verfügbarkeit, Formaten und Preisen.',
    },
    cta: { title: 'Besuchen Sie uns', body: 'Reservieren Sie Ihren Tisch oder Ihre Führung und erleben Sie den Apfelwein von seinem Ursprung an.' },
  },
  en: {
    eyebrow: 'Shop',
    title: 'Cider and juice, natural and organic',
    lede: 'Our cider and apple juice are fully natural and organic, made with apples from our own orchards.',
    heroAlt: 'Iturrieta cider and juice bottles with apples',
    care: [
      { title: 'Healthy apple trees', body: 'Sunny, well-ventilated orchards with diverse varieties, cared for constantly under the advice of specialist technicians.' },
      { title: 'Pruning and care', body: 'Pruning in winter and summer (November to March and August), blossoming around April and harvest from October to mid-November.' },
      { title: 'Our own products', body: 'Organic cider and juice, as well as apple vinegar and apple cava, made at the farmhouse.' },
    ],
    shop: {
      title: 'Cider and much more, from Aramaio apples.',
      lede: 'Take home our cider and organic products, made with Aramaio apples.',
      products: [
        { name: '«Iturrieta» organic natural cider', body: 'Our own cider, from Aramaio apples: from the txotx January to May and bottled the rest of the year.', image: 'ciderBottle', alt: 'A bottle of Iturrieta organic natural cider' },
        { name: 'Organic apple juice', body: 'Just apples, nothing else. Pressed and bottled at the farmhouse.', image: 'juiceBottles', alt: 'Bottles of apple juice' },
        { name: 'Sparkling cider · brut nature', body: 'Sparkling cider made the traditional way: dry, with no added sugar.', image: 'sparklingBottles', alt: 'Bottles of brut nature sparkling cider' },
        { name: 'Apple vinegar', body: 'From our own cider, slowly fermented.' },
        { name: 'The Iturrieta hamper', body: 'Cider, juice and house products in a hamper, to take away or to give.', image: 'hamper', alt: 'A hamper with Iturrieta cider and juice bottles' },
      ],
    },
    order: {
      title: 'Place your order',
      body: 'You can buy at the farmhouse or order and receive your products by courier.',
      byEmail: 'By email',
      byPhone: 'By phone',
      note: 'Shipping by courier. Ask us about availability, formats and prices.',
    },
    cta: { title: 'Come and meet us', body: 'Book your table or guided visit and experience cider from its origin.' },
  },
}
