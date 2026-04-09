import type { POI } from "@/types/database";

export type SupportedLocale = "es" | "en" | "pt" | "zh";

type LocalizedValue<T> = Record<SupportedLocale, T>;

interface LocalizedProductSeed {
  id: string;
  precio: number;
  nombre: LocalizedValue<string>;
  descripcion: LocalizedValue<string>;
}

interface PoiSeed {
  id: string;
  nombre: string;
  categoria: POI["categoria"];
  latitud: number;
  longitud: number;
  direccion: string;
  emoji: string;
  foto_url: string;
  verificado: boolean;
  activo: boolean;
  precio_rango: LocalizedValue<string>;
  horario_apertura: string;
  horario_cierre: string;
  descripcion: LocalizedValue<string>;
  especialidades: LocalizedValue<string[]>;
  telefono: string;
  instagram: string;
  facebook: string;
  productos: LocalizedProductSeed[];
}

const PLACE_IMAGE_URLS = {
  angel: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Angel_de_la_independencia_2n.jpg",
  bellasArtes: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Palacio_de_Bellas_Artes_-_CDMX.jpg",
  castilloChapultepec: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Castillo_de_Chapultepec_%28Museo_Nacional_de_Historia%29.JPG",
  museoSoumaya: "https://upload.wikimedia.org/wikipedia/commons/4/43/Museo_Soumaya%2C_Ciudad_de_M%C3%A9xico.jpg",
  sanMiguel: "https://commons.wikimedia.org/wiki/Special:FilePath/San_Miguel_de_Allende,_Guanajuato,_Mexico..JPG",
  puertoEscondido: "https://commons.wikimedia.org/wiki/Special:FilePath/Puerto_Escondido_Oaxaca.jpg",
  coppelStore: "https://commons.wikimedia.org/wiki/Special:FilePath/Tienda%20coppel%20en%20Riconada.jpg",
  tacos: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?q=80&w=1200&auto=format&fit=crop",
  coffeeShop: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
  events: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
  services: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop",
} as const;

export const CURATED_PLACE_IMAGES: Record<string, string> = {
  "Tacos El Guero": PLACE_IMAGE_URLS.tacos,
  "Coppel Reforma": PLACE_IMAGE_URLS.coppelStore,
  "Museo Soumaya": PLACE_IMAGE_URLS.museoSoumaya,
  "The Coffee Bean": PLACE_IMAGE_URLS.coffeeShop,
  "Centro Histórico": PLACE_IMAGE_URLS.bellasArtes,
  "Ángel de la Independencia": PLACE_IMAGE_URLS.angel,
  "Palacio de Bellas Artes": PLACE_IMAGE_URLS.bellasArtes,
  "Castillo de Chapultepec": PLACE_IMAGE_URLS.castilloChapultepec,
};

export const HOME_IMAGE_URLS = {
  hero: {
    angel: PLACE_IMAGE_URLS.angel,
    bellasArtes: PLACE_IMAGE_URLS.bellasArtes,
    chapultepec: PLACE_IMAGE_URLS.castilloChapultepec,
  },
  categories: {
    gastronomia: PLACE_IMAGE_URLS.tacos,
    hospedaje: PLACE_IMAGE_URLS.hotel,
    cultural: PLACE_IMAGE_URLS.museoSoumaya,
    eventos: PLACE_IMAGE_URLS.events,
    servicios: PLACE_IMAGE_URLS.services,
  },
  trends: {
    sanMiguel: PLACE_IMAGE_URLS.sanMiguel,
    puertoEscondido: PLACE_IMAGE_URLS.puertoEscondido,
  },
};

const POI_SEEDS: PoiSeed[] = [
  {
    id: "dummy-tacos-guero",
    nombre: "Tacos El Guero",
    descripcion: {
      es: "Legendarios tacos al pastor en el corazón del Centro Histórico. Una parada obligatoria para cualquier entusiasta de la gastronomía mexicana.",
      en: "Legendary tacos al pastor in the heart of the Historic Center. A must-stop for anyone who wants an authentic Mexico City bite.",
      pt: "Tacos al pastor lendários no coração do Centro Histórico. Uma parada obrigatória para quem quer provar a Cidade do México autêntica.",
      zh: "位于历史中心的传奇牧羊人烤肉塔可，是体验墨西哥城地道风味的必去一站。",
    },
    categoria: "comida",
    latitud: 19.4323,
    longitud: -99.1332,
    direccion: "Calle República de Uruguay 27, Centro Histórico, CDMX",
    emoji: "🌮",
    foto_url: PLACE_IMAGE_URLS.tacos,
    verificado: true,
    activo: true,
    precio_rango: { es: "$", en: "$", pt: "$", zh: "$" },
    horario_apertura: "09:00",
    horario_cierre: "23:00",
    especialidades: {
      es: ["Tacos al Pastor", "Costra de Queso", "Agua de Horchata"],
      en: ["Al Pastor Tacos", "Cheese Crust Taco", "Horchata"],
      pt: ["Tacos al Pastor", "Costra de Queijo", "Horchata"],
      zh: ["牧羊人烤肉塔可", "芝士脆壳塔可", "欧洽塔饮品"],
    },
    telefono: "55 1234 5678",
    instagram: "tacoselguero_mx",
    facebook: "TacosElGueroOficial",
    productos: [
      {
        id: "p1",
        nombre: {
          es: "Orden de 5 Tacos al Pastor",
          en: "Order of 5 Al Pastor Tacos",
          pt: "Porção com 5 Tacos al Pastor",
          zh: "5个牧羊人烤肉塔可套餐",
        },
        precio: 85,
        descripcion: {
          es: "Con piña, cebolla y cilantro.",
          en: "Served with pineapple, onion, and cilantro.",
          pt: "Servidos com abacaxi, cebola e coentro.",
          zh: "配菠萝、洋葱和香菜。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Gringa de Sirloin",
          en: "Sirloin Gringa",
          pt: "Gringa de Sirloin",
          zh: "西冷牛排奶酪薄饼",
        },
        precio: 65,
        descripcion: {
          es: "Queso fundido y carne premium.",
          en: "Melted cheese with premium beef.",
          pt: "Queijo derretido com carne premium.",
          zh: "融化奶酪搭配优质牛肉。",
        },
      },
    ],
  },
  {
    id: "dummy-coppel-reforma",
    nombre: "Coppel Reforma",
    descripcion: {
      es: "Sucursal de Coppel sobre Paseo de la Reforma, ideal para resolver compras de moda, tecnología y hogar durante tu recorrido por la ciudad.",
      en: "A Coppel branch on Paseo de la Reforma, ideal for fashion, tech, and home shopping during your time in the city.",
      pt: "Uma loja Coppel na Paseo de la Reforma, ideal para compras de moda, tecnologia e casa durante o passeio pela cidade.",
      zh: "位于改革大道的 Coppel 门店，适合在城市行程中采购时尚、科技和家居用品。",
    },
    categoria: "tienda",
    latitud: 19.4298,
    longitud: -99.1558,
    direccion: "Paseo de la Reforma 250, Juárez, CDMX",
    emoji: "🛍️",
    foto_url: PLACE_IMAGE_URLS.coppelStore,
    verificado: true,
    activo: true,
    precio_rango: { es: "$$", en: "$$", pt: "$$", zh: "$$" },
    horario_apertura: "10:00",
    horario_cierre: "20:00",
    especialidades: {
      es: ["Moda Deportiva", "Electrónica", "Hogar Digital"],
      en: ["Sportswear", "Electronics", "Home Tech"],
      pt: ["Moda Esportiva", "Eletrônicos", "Casa Digital"],
      zh: ["运动服饰", "电子产品", "智能家居"],
    },
    telefono: "800 220 7735",
    instagram: "coppel",
    facebook: "tiendascoppel",
    productos: [
      {
        id: "p1",
        nombre: {
          es: 'Smart TV 4K 55"',
          en: '55" 4K Smart TV',
          pt: 'Smart TV 4K 55"',
          zh: '55英寸4K智能电视',
        },
        precio: 8999,
        descripcion: {
          es: "Lo último en tecnología visual.",
          en: "A strong pick for an upgraded viewing setup.",
          pt: "Uma ótima opção para renovar sua experiência visual.",
          zh: "升级影音体验的热门选择。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Tenis de Running",
          en: "Running Sneakers",
          pt: "Tênis de Corrida",
          zh: "跑步运动鞋",
        },
        precio: 1299,
        descripcion: {
          es: "Comodidad para tus recorridos por la ciudad.",
          en: "Comfortable support for long city walks.",
          pt: "Conforto para longas caminhadas pela cidade.",
          zh: "适合城市长距离步行的舒适支撑。",
        },
      },
    ],
  },
  {
    id: "dummy-museo-soumaya",
    nombre: "Museo Soumaya",
    descripcion: {
      es: "Icono arquitectónico que alberga una de las colecciones de arte más importantes del país. Una parada esencial para amantes del diseño y la historia del arte.",
      en: "An architectural icon housing one of the city's most important art collections. Essential for design and art-history lovers.",
      pt: "Um ícone arquitetônico com uma das coleções de arte mais importantes da cidade. Parada obrigatória para amantes de design e história da arte.",
      zh: "这座建筑地标收藏着城市最重要的艺术藏品之一，是设计与艺术史爱好者的必访之地。",
    },
    categoria: "cultural",
    latitud: 19.4407,
    longitud: -99.2047,
    direccion: "Boulevard Miguel de Cervantes Saavedra 303, Granada, CDMX",
    emoji: "🏛️",
    foto_url: PLACE_IMAGE_URLS.museoSoumaya,
    verificado: true,
    activo: true,
    precio_rango: { es: "Gratis", en: "Free", pt: "Gratuito", zh: "免费" },
    horario_apertura: "10:30",
    horario_cierre: "18:30",
    especialidades: {
      es: ["Esculturas de Rodin", "Arte Europeo", "Arquitectura Vanguardista"],
      en: ["Rodin Sculptures", "European Art", "Avant-garde Architecture"],
      pt: ["Esculturas de Rodin", "Arte Europeu", "Arquitetura Vanguardista"],
      zh: ["罗丹雕塑", "欧洲艺术", "先锋建筑"],
    },
    telefono: "55 1103 9800",
    instagram: "elmuseosoumaya",
    facebook: "MuseoSoumaya",
    productos: [
      {
        id: "p1",
        nombre: {
          es: "Libro de Arte Soumaya",
          en: "Soumaya Art Book",
          pt: "Livro de Arte Soumaya",
          zh: "索玛雅艺术图录",
        },
        precio: 450,
        descripcion: {
          es: "Toda la colección en tus manos.",
          en: "A printed overview of the collection highlights.",
          pt: "Uma seleção impressa dos destaques da coleção.",
          zh: "馆藏精选的纸本导览。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Tour Privado Curado",
          en: "Curated Private Tour",
          pt: "Tour Privado Curado",
          zh: "精选私人导览",
        },
        precio: 1200,
        descripcion: {
          es: "Explicación profunda de las obras maestras.",
          en: "A deeper walk through the museum's standout works.",
          pt: "Um percurso aprofundado pelas obras principais.",
          zh: "深入了解馆内代表作。",
        },
      },
    ],
  },
  {
    id: "dummy-coffee-bean",
    nombre: "The Coffee Bean",
    descripcion: {
      es: "Refugio relajado en Polanco para una pausa de café, repostería artesanal y reuniones ligeras durante el día.",
      en: "A relaxed Polanco stop for coffee, pastries, and casual meetings throughout the day.",
      pt: "Um refúgio tranquilo em Polanco para café, confeitaria e encontros leves ao longo do dia.",
      zh: "位于波兰科的轻松咖啡馆，适合白天喝咖啡、吃甜点和小型会面。",
    },
    categoria: "comida",
    latitud: 19.43,
    longitud: -99.1901,
    direccion: "Emilio Castelar 135, Polanco, CDMX",
    emoji: "☕",
    foto_url: PLACE_IMAGE_URLS.coffeeShop,
    verificado: true,
    activo: true,
    precio_rango: { es: "$$", en: "$$", pt: "$$", zh: "$$" },
    horario_apertura: "07:00",
    horario_cierre: "22:00",
    especialidades: {
      es: ["Cold Brew", "Pan de Masa Madre", "Espresso Doble"],
      en: ["Cold Brew", "Sourdough Pastries", "Double Espresso"],
      pt: ["Cold Brew", "Pães de Fermentação Natural", "Espresso Duplo"],
      zh: ["冷萃咖啡", "天然酵母烘焙", "双份浓缩"],
    },
    telefono: "55 9876 5432",
    instagram: "thecoffeebean_polanco",
    facebook: "TheCoffeeBeanMX",
    productos: [
      {
        id: "p1",
        nombre: {
          es: "Flat White Doble",
          en: "Double Flat White",
          pt: "Flat White Duplo",
          zh: "双份馥芮白",
        },
        precio: 75,
        descripcion: {
          es: "Balance perfecto entre espresso y leche sedosa.",
          en: "Balanced espresso with silky milk texture.",
          pt: "Equilíbrio entre espresso e leite aveludado.",
          zh: "浓缩咖啡与丝滑牛奶的平衡组合。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Croissant de Almendras",
          en: "Almond Croissant",
          pt: "Croissant de Amêndoas",
          zh: "杏仁可颂",
        },
        precio: 55,
        descripcion: {
          es: "Horneado diariamente con mantequilla francesa.",
          en: "Baked fresh daily with buttery layers.",
          pt: "Assado diariamente com camadas amanteigadas.",
          zh: "每日现烤，层次酥香。",
        },
      },
    ],
  },
  {
    id: "dummy-angel-independencia",
    nombre: "Ángel de la Independencia",
    descripcion: {
      es: "Monumento emblemático de la Ciudad de México y punto de encuentro para celebraciones nacionales. Un símbolo de libertad envuelto en historia.",
      en: "An iconic Mexico City monument and a central meeting point for national celebrations. A symbol of freedom wrapped in history.",
      pt: "Um monumento emblemático da Cidade do México e ponto de encontro para celebrações nacionais. Um símbolo de liberdade cercado de história.",
      zh: "墨西哥城的标志性纪念碑，也是国家庆典的重要聚点，象征着自由与历史。",
    },
    categoria: "cultural",
    latitud: 19.427,
    longitud: -99.1677,
    direccion: "Paseo de la Reforma y Eje 2 PTE, Juárez, CDMX",
    emoji: "🗽",
    foto_url: PLACE_IMAGE_URLS.angel,
    verificado: true,
    activo: true,
    precio_rango: { es: "Gratis", en: "Free", pt: "Gratuito", zh: "免费" },
    horario_apertura: "00:00",
    horario_cierre: "23:59",
    especialidades: {
      es: ["Mirador", "Fotografía", "Historia Mexicana"],
      en: ["Scenic Views", "Photography", "Mexican History"],
      pt: ["Mirante", "Fotografia", "História Mexicana"],
      zh: ["观景", "摄影", "墨西哥历史"],
    },
    telefono: "55 1234 9999",
    instagram: "angelindependenciamx",
    facebook: "AngelIndependencia",
    productos: [
      {
        id: "p1",
        nombre: {
          es: "Paseo al Mirador",
          en: "Monument Viewpoint Visit",
          pt: "Subida ao Mirante",
          zh: "纪念碑观景参访",
        },
        precio: 0,
        descripcion: {
          es: "Sube las escalinatas para una vista hacia Reforma.",
          en: "Climb the stairs for a Reforma-facing viewpoint.",
          pt: "Suba as escadas para uma vista da Reforma.",
          zh: "登上台阶眺望改革大道。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Tour Histórico",
          en: "Historic Tour",
          pt: "Tour Histórico",
          zh: "历史导览",
        },
        precio: 150,
        descripcion: {
          es: "Conoce a los héroes patrios bajo el monumento.",
          en: "Learn about the national heroes honored below the monument.",
          pt: "Conheça os heróis nacionais homenageados sob o monumento.",
          zh: "了解纪念碑下方安葬与纪念的民族英雄。",
        },
      },
    ],
  },
  {
    id: "dummy-bellas-artes",
    nombre: "Palacio de Bellas Artes",
    descripcion: {
      es: "La obra arquitectónica más emblemática del centro de la ciudad. Sede de murales, ópera, danza y grandes exposiciones.",
      en: "One of the city's most iconic buildings, home to murals, opera, dance, and major exhibitions.",
      pt: "Uma das obras arquitetônicas mais emblemáticas do centro, sede de murais, ópera, dança e grandes exposições.",
      zh: "这座城市中心最具代表性的建筑之一，汇聚壁画、歌剧、舞蹈与大型展览。",
    },
    categoria: "cultural",
    latitud: 19.4352,
    longitud: -99.1412,
    direccion: "Av. Juárez S/N, Centro Histórico, CDMX",
    emoji: "🎭",
    foto_url: PLACE_IMAGE_URLS.bellasArtes,
    verificado: true,
    activo: true,
    precio_rango: { es: "$$", en: "$$", pt: "$$", zh: "$$" },
    horario_apertura: "10:00",
    horario_cierre: "18:00",
    especialidades: {
      es: ["Murales de Rivera", "Ballet Folklórico", "Exposiciones"],
      en: ["Rivera Murals", "Folkloric Ballet", "Exhibitions"],
      pt: ["Murais de Rivera", "Balé Folclórico", "Exposições"],
      zh: ["里维拉壁画", "民俗芭蕾", "展览"],
    },
    telefono: "55 8647 6500",
    instagram: "palaciooficial",
    facebook: "BellasArtesMexico",
    productos: [
      {
        id: "p1",
        nombre: {
          es: "Entrada General Museo",
          en: "General Museum Admission",
          pt: "Entrada Geral do Museu",
          zh: "博物馆普通门票",
        },
        precio: 85,
        descripcion: {
          es: "Acceso a murales y exposiciones.",
          en: "Access to murals and current exhibitions.",
          pt: "Acesso aos murais e às exposições em cartaz.",
          zh: "可参观壁画与当期展览。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Boleto Ópera",
          en: "Opera Ticket",
          pt: "Ingresso para Ópera",
          zh: "歌剧门票",
        },
        precio: 500,
        descripcion: {
          es: "Mejores asientos en la sala principal.",
          en: "Preferred seating in the main hall.",
          pt: "Melhores assentos na sala principal.",
          zh: "主厅优选座位。",
        },
      },
    ],
  },
  {
    id: "dummy-chapultepec",
    nombre: "Castillo de Chapultepec",
    descripcion: {
      es: "El castillo histórico del Bosque de Chapultepec, con salas imperiales, jardines y vistas panorámicas de la ciudad.",
      en: "The historic castle in Chapultepec Park, with imperial rooms, gardens, and panoramic city views.",
      pt: "O castelo histórico do Bosque de Chapultepec, com salões imperiais, jardins e vistas panorâmicas da cidade.",
      zh: "位于查普尔特佩克森林中的历史城堡，拥有皇室厅室、花园和城市全景。",
    },
    categoria: "cultural",
    latitud: 19.4204,
    longitud: -99.1819,
    direccion: "Primera Sección del Bosque de Chapultepec, CDMX",
    emoji: "🏰",
    foto_url: PLACE_IMAGE_URLS.castilloChapultepec,
    verificado: true,
    activo: true,
    precio_rango: { es: "$", en: "$", pt: "$", zh: "$" },
    horario_apertura: "09:00",
    horario_cierre: "17:00",
    especialidades: {
      es: ["Museo Nacional de Historia", "Habitaciones Imperiales", "Jardines"],
      en: ["National History Museum", "Imperial Rooms", "Gardens"],
      pt: ["Museu Nacional de História", "Salões Imperiais", "Jardins"],
      zh: ["国家历史博物馆", "皇室厅室", "花园"],
    },
    telefono: "55 4040 5200",
    instagram: "museodehistoria",
    facebook: "CastilloChapultepec",
    productos: [
      {
        id: "p1",
        nombre: {
          es: "Entrada General",
          en: "General Admission",
          pt: "Entrada Geral",
          zh: "普通门票",
        },
        precio: 90,
        descripcion: {
          es: "Acceso al castillo y áreas verdes.",
          en: "Entry to the castle and surrounding gardens.",
          pt: "Acesso ao castelo e às áreas verdes.",
          zh: "可进入城堡及周边绿地。",
        },
      },
      {
        id: "p2",
        nombre: {
          es: "Audioguía",
          en: "Audio Guide",
          pt: "Audioguia",
          zh: "语音导览",
        },
        precio: 45,
        descripcion: {
          es: "Recorrido detallado en varios idiomas.",
          en: "A deeper self-guided visit in multiple languages.",
          pt: "Percurso detalhado em vários idiomas.",
          zh: "提供多语言的详细自助导览。",
        },
      },
    ],
  },
];

const normalizeLocale = (locale?: string): SupportedLocale => {
  if (locale === "en" || locale === "pt" || locale === "zh") return locale;
  return "es";
};

export function getLocalizedDummyPois(locale?: string) {
  const safeLocale = normalizeLocale(locale);

  return POI_SEEDS.map((poi) => ({
    id: poi.id,
    nombre: poi.nombre,
    descripcion: poi.descripcion[safeLocale],
    categoria: poi.categoria,
    latitud: poi.latitud,
    longitud: poi.longitud,
    direccion: poi.direccion,
    emoji: poi.emoji,
    foto_url: poi.foto_url,
    verificado: poi.verificado,
    activo: poi.activo,
    precio_rango: poi.precio_rango[safeLocale],
    horario_apertura: poi.horario_apertura,
    horario_cierre: poi.horario_cierre,
    especialidades: poi.especialidades[safeLocale],
    telefono: poi.telefono,
    instagram: poi.instagram,
    facebook: poi.facebook,
    productos: poi.productos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre[safeLocale],
      precio: producto.precio,
      descripcion: producto.descripcion[safeLocale],
    })),
    negocio_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
  }));
}

export const DUMMY_POIS = getLocalizedDummyPois("es");
