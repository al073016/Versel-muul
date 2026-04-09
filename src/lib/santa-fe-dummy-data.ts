export type SupportedLocale = "es" | "en" | "pt" | "zh";
// Removed circular import from ./dummy-data

type LocalizedValue<T> = Record<SupportedLocale, T>;

interface LocalizedProductSeed {
  id: string;
  precio: number;
  nombre: LocalizedValue<string>;
  descripcion: LocalizedValue<string>;
}

export const SANTA_FE_POIS: any[] = [
  {
    id: 'dummy-centro-santafe',
    nombre: 'Centro Santa Fe',
    descripcion: {
      es: 'El centro comercial más grande de América Latina. Más de 500 tiendas, cines, pista de hielo y la mejor oferta gastronómica de la zona poniente.',
      en: 'The largest shopping center in Latin America. Over 500 stores, cinemas, an ice rink, and the best dining in the western zone.',
      pt: 'O maior centro comercial da América Latina. Mais de 500 lojas, cinemas, pista de gelo e a melhor oferta gastronômica da zona poente.',
      zh: '拉丁美洲最大的购物中心。超过500家商店、电影院、滑冰场以及西部地区最好的美食。'
    },
    categoria: 'tienda',
    latitud: 19.3590,
    longitud: -99.2760,
    direccion: 'Av. Vasco de Quiroga 3800, Lomas de Santa Fe, CDMX',
    emoji: '🏬',
    foto_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "$$$", en: "$$$", pt: "$$$", zh: "$$$" },
    horario_apertura: '11:00',
    horario_cierre: '21:00',
    especialidades: {
      es: ['Moda Internacional', 'Pista de Hielo', 'Food Court Premium'],
      en: ['International Fashion', 'Ice Rink', 'Premium Food Court'],
      pt: ['Moda Internacional', 'Pista de Gelo', 'Food Court Premium'],
      zh: ['国际时尚', '滑冰场', '高级美食广场']
    },
    productos: [
      { 
        id: 'csf1', 
        precio: 500, 
        nombre: { es: 'Gift Card Centro Santa Fe', en: 'Gift Card Centro Santa Fe', pt: 'Cartão Presente Centro Santa Fe', zh: '圣达菲中心礼品卡' }, 
        descripcion: { es: 'Válida en todas las tiendas participantes.', en: 'Valid in all participating stores.', pt: 'Válido em todas as lojas participantes.', zh: '在所有参与商店有效。' } 
      }
    ]
  },
  {
    id: 'dummy-coppel-santafe',
    nombre: 'Coppel Santa Fe',
    descripcion: {
      es: 'Tu sucursal Coppel favorita en la zona más moderna de la ciudad. BanCoppel, Afore Coppel y toda la línea de productos.',
      en: 'Your favorite Coppel branch in the most modern area of the city. BanCoppel, Afore Coppel, and the full product line.',
      pt: 'A sua filial Coppel favorita na zona mais moderna da cidade. BanCoppel, Afore Coppel e toda a linha de produtos.',
      zh: '市最现代化地区您最喜欢的Coppel分店。拥有BanCoppel、Afore Coppel和全线产品。'
    },
    categoria: 'tienda',
    latitud: 19.3615,
    longitud: -99.2740,
    direccion: 'Av. Vasco de Quiroga 3850, Santa Fe, CDMX',
    emoji: '🛍️',
    foto_url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "$$", en: "$$", pt: "$$", zh: "$$" },
    horario_apertura: '09:00',
    horario_cierre: '21:00',
    especialidades: {
        es: ['BanCoppel', 'Electrónica', 'Muebles'],
        en: ['BanCoppel', 'Electronics', 'Furniture'],
        pt: ['BanCoppel', 'Eletrônicos', 'Móveis'],
        zh: ['BanCoppel', '电子产品', '家具']
    },
    productos: [
      { 
        id: 'csf_c1', 
        precio: 18999, 
        nombre: { es: 'Laptop Gamer ASUS', en: 'ASUS Gaming Laptop', pt: 'Laptop Gamer ASUS', zh: '华硕游戏笔记本' }, 
        descripcion: { es: 'Procesador i7, 16GB RAM, RTX 4060.', en: 'i7 Processor, 16GB RAM, RTX 4060.', pt: 'Processador i7, 16GB RAM, RTX 4060.', zh: 'i7处理器，16GB内存，RTX 4060。' } 
      },
      { 
        id: 'csf_c2', 
        precio: 12999, 
        nombre: { es: 'Sala Moderna 3 piezas', en: 'Modern 3-piece living room set', pt: 'Sala de estar moderna de 3 peças', zh: '现代3件套客厅家具' }, 
        descripcion: { es: 'Tela antimanchas, crédito Coppel disponible.', en: 'Stain-resistant fabric, Coppel credit available.', pt: 'Tecido antimanchas, crédito Coppel disponível.', zh: '防污面料，可用Coppel信贷。' } 
      }
    ]
  },
  {
    id: 'dummy-ibero',
    nombre: 'Universidad Iberoamericana',
    descripcion: {
      es: 'Una de las universidades privadas más prestigiosas de México. Campus con áreas verdes, galerías de arte y cafeterías estudiantiles.',
      en: 'One of the most prestigious private universities in Mexico. Campus with green areas, art galleries, and student cafeterias.',
      pt: 'Uma das universidades privadas mais prestigiadas do México. Campus com áreas verdes, galerias de arte e lanchonetes.',
      zh: '墨西哥最负盛名的私立大学之一。校园拥有绿地、艺廊和学生自助餐厅。'
    },
    categoria: 'cultural',
    latitud: 19.3700,
    longitud: -99.2635,
    direccion: 'Prolongación Paseo de la Reforma 880, Santa Fe',
    emoji: '🎓',
    foto_url: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "Gratis", en: "Free", pt: "Livre", zh: "自由的" },
    horario_apertura: '07:00',
    horario_cierre: '22:00',
    especialidades: {
        es: ['Galería Universitaria', 'Biblioteca', 'Cafetería Ibero'],
        en: ['University Gallery', 'Library', 'Ibero Cafeteria'],
        pt: ['Galeria Universitária', 'Biblioteca', 'Cantina Ibero'],
        zh: ['大学画廊', '图书馆', '伊比利亚自助餐厅']
    },
    productos: []
  },
  {
    id: 'dummy-sushi-santafe',
    nombre: 'Nobu Santa Fe',
    descripcion: {
      es: 'Cocina japonesa de autor con influencia peruana en un ambiente exclusivo con vista a la ciudad.',
      en: 'Signature Japanese cuisine with Peruvian influence in an exclusive atmosphere with city views.',
      pt: 'Cozinha japonesa de autor com influência peruana num ambiente exclusivo com vista para a cidade.',
      zh: '在享有城市景观的专属氛围中，融合秘鲁风味的特色日本料理。'
    },
    categoria: 'comida',
    latitud: 19.3580,
    longitud: -99.2720,
    direccion: 'Centro Comercial Garden Santa Fe, Piso 3',
    emoji: '🍣',
    foto_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "$$$$", en: "$$$$", pt: "$$$$", zh: "$$$$" },
    horario_apertura: '13:00',
    horario_cierre: '23:00',
    especialidades: {
        es: ['Omakase', 'Black Cod Miso', 'Cocteles Japoneses'],
        en: ['Omakase', 'Black Cod Miso', 'Japanese Cocktails'],
        pt: ['Omakase', 'Black Cod Miso', 'Coquetéis Japoneses'],
        zh: ['厨师发办', '味噌黑鳕鱼', '日式鸡尾酒']
    },
    productos: [
      { 
        id: 'nb1', 
        precio: 2800, 
        nombre: { es: 'Omakase 12 tiempos', en: '12-course Omakase', pt: 'Omakase de 12 pratos', zh: '12道菜厨师发办' }, 
        descripcion: { es: 'Experiencia del chef con ingredientes de temporada.', en: 'Chef\'s experience with seasonal ingredients.', pt: 'Experiência do chef com ingredientes da estação.', zh: '厨师采用时令食材的主厨体验。' } 
      },
      { 
        id: 'nb2', 
        precio: 680, 
        nombre: { es: 'Black Cod Miso', en: 'Black Cod Miso', pt: 'Black Cod Miso', zh: '黑鳕鱼味噌' }, 
        descripcion: { es: 'El platillo insignia de Nobu.', en: 'Nobu\'s signature dish.', pt: 'O prato de assinatura do Nobu.', zh: '隐户招牌菜。' } 
      }
    ]
  },
  {
    id: 'dummy-cafe-santafe',
    nombre: 'Café Punta del Cielo Santa Fe',
    descripcion: {
        es: 'Café 100% mexicano de especialidad. Granos de Chiapas y Oaxaca tostados artesanalmente.',
        en: '100% Mexican specialty coffee. Artisan-roasted beans from Chiapas and Oaxaca.',
        pt: 'Café 100% mexicano de especialidade. Grãos de Chiapas e Oaxaca torrados artesanalmente.',
        zh: '100%墨西哥精品咖啡。产自恰帕斯州和瓦哈卡州的手工烘焙咖啡豆。'
    },
    categoria: 'comida',
    latitud: 19.3620,
    longitud: -99.2690,
    direccion: 'Av. Santa Fe 440, Local 12',
    emoji: '☕',
    foto_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "$$", en: "$$", pt: "$$", zh: "$$" },
    horario_apertura: '07:00',
    horario_cierre: '21:00',
    especialidades: {
        es: ['Cappuccino Chiapaneco', 'Pan Artesanal', 'Wifi Rápido'],
        en: ['Chiapas Cappuccino', 'Artisan Bread', 'Fast Wifi'],
        pt: ['Cappuccino de Chiapas', 'Pão Artesanal', 'Wifi Rápido'],
        zh: ['恰帕斯卡布奇诺', '手工面包', '快速Wifi']
    },
    productos: [
      { id: 'pdc1', precio: 52, nombre: { es: 'Americano Grande', en: 'Large Americano', pt: 'Americano Grande', zh: '大杯美式咖啡' }, descripcion: { es: 'Grano de altura de Chiapas.', en: 'High-altitude beans from Chiapas.', pt: 'Grão de altitude de Chiapas.', zh: '恰帕斯高黎豆。' } },
      { id: 'pdc2', precio: 78, nombre: { es: 'Frappé de Cajeta', en: 'Cajeta Frappe', pt: 'Frappé de Cajeta', zh: '焦糖星冰乐' }, descripcion: { es: 'Con leche de almendra.', en: 'With almond milk.', pt: 'Com leite de amêndoa.', zh: '配杏仁奶。' } }
    ]
  },
  {
    id: 'dummy-gym-santafe',
    nombre: 'Smart Fit Santa Fe',
    descripcion: {
        es: 'Gimnasio 24/7 con equipo de última generación y clases grupales incluidas.',
        en: '24/7 gym with latest generation equipment and group classes included.',
        pt: 'Ginásio 24/7 com equipamentos de última geração e aulas de grupo incluídas.',
        zh: '24小时健身房，配备最新一代设备并包括团体课程。'
    },
    categoria: 'servicios',
    latitud: 19.3640,
    longitud: -99.2710,
    direccion: 'Av. Javier Barros Sierra 540, Santa Fe',
    emoji: '💪',
    foto_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "$", en: "$", pt: "$", zh: "$" },
    horario_apertura: '00:00',
    horario_cierre: '23:59',
    especialidades: {
        es: ['24 Horas', 'Spinning', 'Peso Libre'],
        en: ['24 Hours', 'Spinning', 'Free Weights'],
        pt: ['24 Horas', 'Spinning', 'Peso Livre'],
        zh: ['24小时', '动感单车', '自由力量']
    },
    productos: [
      { id: 'sf1', precio: 449, nombre: { es: 'Plan Mensual Smart', en: 'Smart Monthly Plan', pt: 'Plano Mensal Smart', zh: '智能月度计划' }, descripcion: { es: 'Acceso a todas las sucursales.', en: 'Access to all branches.', pt: 'Acesso a todas as filiais.', zh: '所有分店通用。' } },
      { id: 'sf2', precio: 649, nombre: { es: 'Plan Black', en: 'Black Plan', pt: 'Plano Black', zh: '黑卡计划' }, descripcion: { es: 'Incluye regaderas, toallas y app premium.', en: 'Includes showers, towels, and premium app.', pt: 'Inclui chuveiros, toalhas e aplicativo premium.', zh: '包括淋浴、毛巾和高级应用程序。' } }
    ]
  },
  {
    id: 'dummy-parque-labatida',
    nombre: 'Parque La Mexicana',
    descripcion: {
        es: 'El Central Park de Santa Fe. 30 hectáreas de áreas verdes, lago artificial, pista de correr y pet park.',
        en: 'The Central Park of Santa Fe. 30 hectares of green areas, artificial lake, running track and pet park.',
        pt: 'O Central Park de Santa Fe. 30 hectares de áreas verdes, lago artificial, pista de corrida e pet park.',
        zh: '圣达菲的中央公园。30公顷绿地、人工湖、跑道和宠物公园。'
    },
    categoria: 'cultural',
    latitud: 19.3630,
    longitud: -99.2780,
    direccion: 'Av. Javier Barros Sierra S/N, Santa Fe',
    emoji: '🌳',
    foto_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop',
    verificado: true,
    activo: true,
    precio_rango: { es: "Gratis", en: "Free", pt: "Livre", zh: "自由的" },
    horario_apertura: '05:00',
    horario_cierre: '22:00',
    especialidades: {
        es: ['Lago Artificial', 'Dog Park', 'Foodtrucks'],
        en: ['Artificial Lake', 'Dog Park', 'Food Trucks'],
        pt: ['Lago Artificial', 'Dog Park', 'Food Trucks'],
        zh: ['人工湖', '宠物公园', '美食车']
    },
    productos: []
  }
];
