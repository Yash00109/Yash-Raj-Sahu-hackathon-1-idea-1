import type { Lang } from '../../i18n/copy'

export interface CareItem {
  title: string
  body: string
}

export interface AboutContent {
  eyebrow: string
  title: string
  lede: string
  story: { title: string; paragraphs: string[] }
  /** Key figures restate facts from `story`; only the short labels are new wording. */
  figures: { value: string; label: string }[]
  valley: { eyebrow: string; title: string; paragraphs: string[] }
  harvest: { title: string; paragraphs: string[]; updated: string }
  barrel: { label: string; caption: string }
  care: { title: string; lede: string; items: CareItem[] }
  cta: { title: string }
}

export const aboutContent: Record<Lang, AboutContent> = {
  es: {
    eyebrow: 'Nosotros',
    title: 'Nosotros',
    lede: 'Un proyecto familiar de agricultura y ganadería en el valle de Aramaio, dedicado a la sidra natural ecológica.',
    story: {
      title: 'De Vitoria a Aramaio, desde 1997.',
      paragraphs: [
        'Iturrieta es un proyecto familiar de agricultura y ganadería. En 1997 nos vinimos de Vitoria a este precioso caserío de Aramaio y convertimos los establos de vacas y ovejas en sidrería.',
        'La inauguración fue el 25 de julio de 1998, el día de Santiago. Plantamos 600 manzanos al principio y hoy son cerca de 1.400, mezclando variedades del País Vasco y asturianas.',
        'Tras más de 20 años en el mundo de la sidra, hoy elaboramos sidra natural ecológica certificada.',
      ],
    },
    figures: [
      { value: '1997', label: 'De Vitoria a Aramaio' },
      { value: '1998', label: 'Inauguración el 25 de julio, día de Santiago' },
      { value: '600 → 1.400', label: 'Manzanos de variedades vascas y asturianas' },
      { value: '20+', label: 'Años en el mundo de la sidra' },
    ],
    valley: {
      eyebrow: 'Non gauden · Dónde estamos',
      title: 'El valle de Aramaio.',
      paragraphs: [
        'El valle de Aramaio —también llamado «Suiza Txiki»— está al norte de Álava, junto a Bizkaia y Gipuzkoa (Debagoiena), y forma parte de la cuadrilla de Gorbeialdea.',
        'Rodeado de montes como Orixol, Anboto y Udalaitz al norte, y Murugain, Kurtzebarri, Aloña y Aizkorri al este. A 485 m de altitud, con clima atlántico y temperaturas suaves.',
      ],
    },
    harvest: {
      title: 'Cómo va la cosecha de 2026.',
      paragraphs: [
        'Este año los manzanos han dado poco fruto: el manzano es un árbol bianual y le tocaba descansar. Además, en Aramaio han caído dos tormentas que han tirado mucha manzana al suelo, así que esperamos una recolección más baja que la del año pasado.',
        'Empezamos a recoger hacia el 10 de septiembre, bastante antes de lo normal por el calor. Aun así, prevemos una sidra de calidad.',
      ],
      updated: 'Actualizado en septiembre de 2026',
    },
    barrel: { label: 'Kupelan · En la kupela', caption: 'La sidra fermentando, unas semanas después de la recogida.' },
    care: {
      title: 'Sidra y zumo, naturales y ecológicos',
      lede: 'Nuestra sidra y nuestro zumo de manzana son totalmente naturales y ecológicos, hechos con las manzanas de nuestros propios manzanos.',
      items: [
        { title: 'Manzanos sanos', body: 'Manzanales soleados y ventilados, con variedades diversas y un cuidado constante asesorado por técnicos especializados.' },
        { title: 'Poda y cuidado', body: 'Podas en invierno y verano (de noviembre a marzo y en agosto), floración hacia abril y recogida de octubre a mediados de noviembre.' },
        { title: 'Productos propios', body: 'Sidra y zumo ecológicos, y también vinagre de manzana y cava de manzana, elaborados en el caserío.' },
      ],
    },
    cta: { title: 'Ven a conocernos' },
  },
  eu: {
    eyebrow: 'Nor gara',
    title: 'Nor gara',
    lede: 'Aramaioko haranean nekazaritza eta abeltzaintzako familia-proiektua, sagardo natural ekologikoari eskainia.',
    story: {
      title: 'Gasteiztik Aramaiora, 1997tik.',
      paragraphs: [
        'Iturrieta nekazaritza eta abeltzaintzako familia-proiektua da. 1997an Gasteiztik Aramaioko baserri eder honetara etorri ginen eta behi eta ardien ukuiluak sagardotegi bihurtu genituen.',
        'Inaugurazioa 1998ko uztailaren 25ean izan zen, Santiago egunean. Hasieran 600 sagarrondo landatu genituen eta gaur egun 1.400 inguru dira, Euskal Herriko eta Asturiaseko barietateak nahastuz.',
        'Sagardoaren munduan 20 urte baino gehiago eman ondoren, gaur egun sagardo natural ekologiko ziurtatua egiten dugu.',
      ],
    },
    figures: [
      { value: '1997', label: 'Gasteiztik Aramaiora' },
      { value: '1998', label: 'Inaugurazioa uztailaren 25ean, Santiago egunean' },
      { value: '600 → 1.400', label: 'Euskal Herriko eta Asturiaseko sagarrondoak' },
      { value: '20+', label: 'Urte sagardoaren munduan' },
    ],
    valley: {
      eyebrow: 'Non gauden',
      title: 'Aramaioko harana.',
      paragraphs: [
        'Aramaioko harana —«Suitza Txiki» ere deitua— Arabako iparraldean dago, Bizkaia eta Gipuzkoarekin (Debagoiena) mugakide, eta Gorbeialdeko kuadrillaren parte da.',
        'Iparraldean Orixol, Anboto eta Udalaitz bezalako mendiz inguratua, eta ekialdean Murugain, Kurtzebarri, Aloña eta Aizkorri. 485 m-ra, klima atlantikoarekin eta tenperatura leunekin.',
      ],
    },
    harvest: {
      title: 'Nola doan 2026ko uzta.',
      paragraphs: [
        'Aurten sagarrondoek fruitu gutxi eman dute: sagarrondoa bi urtekoa da eta atseden hartzea zegokion. Gainera, Aramaion bi ekaitz izan dira eta sagar asko bota dute lurrera, beraz iaz baino bilketa txikiagoa espero dugu.',
        'Irailaren 10a inguruan hasiko gara biltzen, ohi baino dezente lehenago beroagatik. Hala ere, kalitatezko sagardoa espero dugu.',
      ],
      updated: '2026ko irailean eguneratua',
    },
    barrel: { label: 'Kupelan', caption: 'Sagardoa hartzitzen, bilketaren ondorengo asteetan.' },
    care: {
      title: 'Sagardoa eta zukua, naturalak eta ekologikoak',
      lede: 'Gure sagardoa eta sagar-zukua guztiz naturalak eta ekologikoak dira, gure sagarrondoetako sagarrekin eginak.',
      items: [
        { title: 'Sagarrondo osasuntsuak', body: 'Sagarrondo eguzkitsu eta aireztatuak, barietate ezberdinekin eta teknikari espezializatuen aholkularitzapean zaindurik.' },
        { title: 'Inausketa eta zainketa', body: 'Inausketak neguan eta udan (azarotik martxora eta abuztuan), loraketa apirilean eta bilketa urritik azaroaren erdialdera.' },
        { title: 'Gure produktuak', body: 'Sagardo eta zuku ekologikoak, eta baita sagar-ozpina eta sagar-cava ere, baserrian eginak.' },
      ],
    },
    cta: { title: 'Etorri gu ezagutzera' },
  },
  fr: {
    eyebrow: 'À propos',
    title: 'À propos',
    lede: "Un projet familial d'agriculture et d'élevage dans la vallée d'Aramaio, dédié au cidre naturel bio.",
    story: {
      title: 'De Vitoria à Aramaio, depuis 1997.',
      paragraphs: [
        "Iturrieta est un projet familial d'agriculture et d'élevage. En 1997, nous sommes venus de Vitoria dans cette belle ferme d'Aramaio et avons transformé les étables en cidrerie.",
        "L'inauguration a eu lieu le 25 juillet 1998, jour de la Saint-Jacques. Nous avons planté 600 pommiers au début et nous en cultivons aujourd'hui près de 1 400, mêlant variétés basques et asturiennes.",
        "Après plus de 20 ans dans le monde du cidre, nous élaborons aujourd'hui un cidre naturel bio certifié.",
      ],
    },
    figures: [
      { value: '1997', label: 'De Vitoria à Aramaio' },
      { value: '1998', label: 'Inauguration le 25 juillet, jour de la Saint-Jacques' },
      { value: '600 → 1 400', label: 'Pommiers de variétés basques et asturiennes' },
      { value: '20+', label: 'Ans dans le monde du cidre' },
    ],
    valley: {
      eyebrow: 'Non gauden · Où nous sommes',
      title: "La vallée d'Aramaio.",
      paragraphs: [
        "La vallée d'Aramaio —aussi appelée « Suiza Txiki »— se trouve au nord de l'Álava, près de la Biscaye et du Gipuzkoa (Debagoiena), et fait partie de la cuadrilla de Gorbeialdea.",
        "Entourée de monts comme Orixol, Anboto et Udalaitz au nord, et Murugain, Kurtzebarri, Aloña et Aizkorri à l'est. À 485 m d'altitude, climat atlantique et températures douces.",
      ],
    },
    harvest: {
      title: 'Où en est la récolte 2026.',
      paragraphs: [
        "Cette année, les pommiers ont peu donné : le pommier est un arbre bisannuel et c'était son année de repos. En plus, deux orages sur Aramaio ont fait tomber beaucoup de pommes, nous attendons donc une récolte plus faible que l'an dernier.",
        "Nous commençons la récolte vers le 10 septembre, bien plus tôt que d'habitude à cause de la chaleur. Nous attendons malgré tout un cidre de qualité.",
      ],
      updated: 'Mis à jour en septembre 2026',
    },
    barrel: { label: 'Kupelan · Dans le foudre', caption: 'Le cidre en fermentation, quelques semaines après la récolte.' },
    care: {
      title: 'Cidre et jus, naturels et bio',
      lede: 'Notre cidre et notre jus de pomme sont entièrement naturels et bio, élaborés avec les pommes de nos propres vergers.',
      items: [
        { title: 'Des pommiers sains', body: 'Vergers ensoleillés et ventilés, aux variétés diverses, soignés en continu sous le conseil de techniciens spécialisés.' },
        { title: 'Taille et soin', body: "Tailles en hiver et en été (novembre à mars et août), floraison vers avril et récolte d'octobre à mi-novembre." },
        { title: 'Nos produits', body: 'Cidre et jus bio, ainsi que vinaigre de pomme et cava de pomme, élaborés à la ferme.' },
      ],
    },
    cta: { title: 'Venez nous découvrir' },
  },
  de: {
    eyebrow: 'Über uns',
    title: 'Über uns',
    lede: 'Ein landwirtschaftliches Familienprojekt im Tal von Aramaio, das sich dem naturtrüben Bio-Apfelwein widmet.',
    story: {
      title: 'Von Vitoria nach Aramaio, seit 1997.',
      paragraphs: [
        'Iturrieta ist ein Familienprojekt aus Landwirtschaft und Viehzucht. 1997 zogen wir von Vitoria auf diesen schönen Bauernhof in Aramaio und bauten die Rinder- und Schafställe zu einer Sidrería um.',
        'Eröffnet wurde am 25. Juli 1998, dem Jakobstag. Anfangs pflanzten wir 600 Apfelbäume, heute sind es rund 1.400 – eine Mischung aus baskischen und asturischen Sorten.',
        'Nach mehr als 20 Jahren in der Welt des Apfelweins stellen wir heute zertifizierten naturtrüben Bio-Apfelwein her.',
      ],
    },
    figures: [
      { value: '1997', label: 'Von Vitoria nach Aramaio' },
      { value: '1998', label: 'Eröffnung am 25. Juli, dem Jakobstag' },
      { value: '600 → 1.400', label: 'Apfelbäume baskischer und asturischer Sorten' },
      { value: '20+', label: 'Jahre in der Welt des Apfelweins' },
    ],
    valley: {
      eyebrow: 'Non gauden · Wo wir sind',
      title: 'Das Tal von Aramaio.',
      paragraphs: [
        'Das Tal von Aramaio – auch „Suiza Txiki“ (kleine Schweiz) genannt – liegt im Norden der Provinz Álava, an der Grenze zu Bizkaia und Gipuzkoa (Debagoiena), und gehört zur Cuadrilla Gorbeialdea.',
        'Umgeben von Bergen wie Orixol, Anboto und Udalaitz im Norden sowie Murugain, Kurtzebarri, Aloña und Aizkorri im Osten. Auf 485 m Höhe, mit atlantischem Klima und milden Temperaturen.',
      ],
    },
    harvest: {
      title: 'So steht es um die Ernte 2026.',
      paragraphs: [
        'In diesem Jahr haben die Apfelbäume wenig getragen: Der Apfelbaum trägt im Zweijahresrhythmus, und es war sein Ruhejahr. Außerdem haben zwei Unwetter in Aramaio viele Äpfel zu Boden gerissen, daher erwarten wir eine kleinere Ernte als im Vorjahr.',
        'Wegen der Hitze beginnen wir um den 10. September mit der Ernte, deutlich früher als üblich. Trotzdem erwarten wir einen guten Apfelwein.',
      ],
      updated: 'Aktualisiert im September 2026',
    },
    barrel: { label: 'Kupelan · Im Fass', caption: 'Der Apfelwein in der Gärung, wenige Wochen nach der Ernte.' },
    care: {
      title: 'Apfelwein und Saft, natürlich und bio',
      lede: 'Unser Apfelwein und unser Apfelsaft sind vollkommen natürlich und bio, hergestellt aus den Äpfeln unserer eigenen Obstgärten.',
      items: [
        { title: 'Gesunde Apfelbäume', body: 'Sonnige, gut belüftete Obstgärten mit verschiedenen Sorten, ständig gepflegt und von Fachtechnikern beraten.' },
        { title: 'Schnitt und Pflege', body: 'Schnitt im Winter und Sommer (November bis März und August), Blüte um April und Ernte von Oktober bis Mitte November.' },
        { title: 'Eigene Produkte', body: 'Bio-Apfelwein und -Saft sowie Apfelessig und Apfel-Cava, hergestellt auf dem Hof.' },
      ],
    },
    cta: { title: 'Besuchen Sie uns' },
  },
  en: {
    eyebrow: 'About us',
    title: 'About us',
    lede: 'A family farming project in the Aramaio valley, devoted to natural organic cider.',
    story: {
      title: 'From Vitoria to Aramaio, since 1997.',
      paragraphs: [
        'Iturrieta is a family farming and livestock project. In 1997 we moved from Vitoria to this beautiful farmhouse in Aramaio and turned the cattle and sheep stables into a cider house.',
        "It opened on 25 July 1998, St. James's Day. We planted 600 apple trees at first and today tend around 1,400, mixing Basque and Asturian varieties.",
        'After more than 20 years in the cider world, we now make certified natural organic cider.',
      ],
    },
    figures: [
      { value: '1997', label: 'From Vitoria to Aramaio' },
      { value: '1998', label: "Opened on 25 July, St. James's Day" },
      { value: '600 → 1,400', label: 'Apple trees, Basque and Asturian varieties' },
      { value: '20+', label: 'Years in the cider world' },
    ],
    valley: {
      eyebrow: 'Non gauden · Where we are',
      title: 'The Aramaio valley.',
      paragraphs: [
        'The Aramaio valley —also called "Suiza Txiki" (little Switzerland)— lies in northern Álava, next to Bizkaia and Gipuzkoa (Debagoiena), and is part of the Gorbeialdea cuadrilla.',
        'Surrounded by mountains such as Orixol, Anboto and Udalaitz to the north, and Murugain, Kurtzebarri, Aloña and Aizkorri to the east. At 485 m, with an Atlantic climate and mild temperatures.',
      ],
    },
    harvest: {
      title: 'How the 2026 harvest is going.',
      paragraphs: [
        'The trees have borne little fruit this year: the apple tree is biennial and it was its year to rest. On top of that, two storms over Aramaio brought a lot of apples down, so we expect a smaller harvest than last year.',
        'We start picking around 10 September, well ahead of the usual date because of the heat. Even so, we expect a good cider.',
      ],
      updated: 'Updated September 2026',
    },
    barrel: { label: 'Kupelan · In the barrel', caption: 'The cider fermenting, a few weeks after the harvest.' },
    care: {
      title: 'Cider and juice, natural and organic',
      lede: 'Our cider and apple juice are fully natural and organic, made with apples from our own orchards.',
      items: [
        { title: 'Healthy apple trees', body: 'Sunny, well-ventilated orchards with diverse varieties, cared for constantly under the advice of specialist technicians.' },
        { title: 'Pruning and care', body: 'Pruning in winter and summer (November to March and August), blossoming around April and harvest from October to mid-November.' },
        { title: 'Our own products', body: 'Organic cider and juice, as well as apple vinegar and apple cava, made at the farmhouse.' },
      ],
    },
    cta: { title: 'Come and meet us' },
  },
}
