/* =============================================
   MUUL — Preguntas predefinidas del Chatbot IA
   5 preguntas por categoría × 4 idiomas
   ============================================= */

export interface PreguntaPredefinida {
  id: string;
  texto_es: string;
  texto_en: string;
  texto_zh: string;
  texto_pt: string;
}

export const preguntasPorCategoria: Record<string, PreguntaPredefinida[]> = {
  cultural: [
    {
      id: "c1",
      texto_es: "¿Cuál es la historia de este lugar?",
      texto_en: "What is the history of this place?",
      texto_zh: "这个地方的历史是什么？",
      texto_pt: "Qual é a história deste lugar?",
    },
    {
      id: "c2",
      texto_es: "¿Cuál es el horario de visita?",
      texto_en: "What are the visiting hours?",
      texto_zh: "参观时间是什么？",
      texto_pt: "Qual é o horário de visita?",
    },
    {
      id: "c3",
      texto_es: "¿Cuánto cuesta la entrada?",
      texto_en: "How much is the admission?",
      texto_zh: "门票多少钱？",
      texto_pt: "Quanto custa a entrada?",
    },
    {
      id: "c4",
      texto_es: "¿Qué puedo ver o hacer aquí?",
      texto_en: "What can I see or do here?",
      texto_zh: "我在这里可以看到或做什么？",
      texto_pt: "O que posso ver ou fazer aqui?",
    },
    {
      id: "c5",
      texto_es: "¿Cómo llego desde el centro de la ciudad?",
      texto_en: "How do I get here from downtown?",
      texto_zh: "从市中心怎么到这里？",
      texto_pt: "Como chego aqui a partir do centro?",
    },
  ],

  comida: [
    {
      id: "f1",
      texto_es: "¿Qué platillos ofrecen?",
      texto_en: "What dishes do you offer?",
      texto_zh: "你们提供什么菜？",
      texto_pt: "Que pratos vocês oferecem?",
    },
    {
      id: "f2",
      texto_es: "¿Cuál es la especialidad de la casa?",
      texto_en: "What is the house specialty?",
      texto_zh: "招牌菜是什么？",
      texto_pt: "Qual é a especialidade da casa?",
    },
    {
      id: "f3",
      texto_es: "¿Cuál es el horario de atención?",
      texto_en: "What are the opening hours?",
      texto_zh: "营业时间是什么？",
      texto_pt: "Qual é o horário de funcionamento?",
    },
    {
      id: "f4",
      texto_es: "¿Tienen opciones vegetarianas o veganas?",
      texto_en: "Do you have vegetarian or vegan options?",
      texto_zh: "有素食选择吗？",
      texto_pt: "Vocês têm opções vegetarianas ou veganas?",
    },
    {
      id: "f5",
      texto_es: "¿Aceptan pagos con tarjeta?",
      texto_en: "Do you accept card payments?",
      texto_zh: "可以刷卡吗？",
      texto_pt: "Aceitam pagamento com cartão?",
    },
  ],

  tienda: [
    {
      id: "t1",
      texto_es: "¿Qué productos venden aquí?",
      texto_en: "What products do you sell here?",
      texto_zh: "这里卖什么产品？",
      texto_pt: "Que produtos vocês vendem aqui?",
    },
    {
      id: "t2",
      texto_es: "¿Tienen productos típicos de la región?",
      texto_en: "Do you have typical regional products?",
      texto_zh: "有当地特色产品吗？",
      texto_pt: "Vocês têm produtos típicos da região?",
    },
    {
      id: "t3",
      texto_es: "¿Cuál es el horario de la tienda?",
      texto_en: "What are the store hours?",
      texto_zh: "商店的营业时间是什么？",
      texto_pt: "Qual é o horário da loja?",
    },
    {
      id: "t4",
      texto_es: "¿Aceptan pagos con tarjeta?",
      texto_en: "Do you accept card payments?",
      texto_zh: "可以刷卡吗？",
      texto_pt: "Aceitam pagamento com cartão?",
    },
    {
      id: "t5",
      texto_es: "¿Tienen envíos o delivery?",
      texto_en: "Do you offer shipping or delivery?",
      texto_zh: "提供送货服务吗？",
      texto_pt: "Vocês fazem entregas?",
    },
  ],

  deportes: [
    {
      id: "d1",
      texto_es: "¿Qué eventos deportivos hay próximamente?",
      texto_en: "What upcoming sporting events are there?",
      texto_zh: "近期有什么体育赛事？",
      texto_pt: "Que eventos esportivos estão próximos?",
    },
    {
      id: "d2",
      texto_es: "¿Cómo puedo conseguir boletos?",
      texto_en: "How can I get tickets?",
      texto_zh: "怎么买票？",
      texto_pt: "Como posso conseguir ingressos?",
    },
    {
      id: "d3",
      texto_es: "¿Cuál es el horario de acceso?",
      texto_en: "What are the access hours?",
      texto_zh: "开放时间是什么？",
      texto_pt: "Qual é o horário de acesso?",
    },
    {
      id: "d4",
      texto_es: "¿Qué transporte público llega aquí?",
      texto_en: "What public transport goes here?",
      texto_zh: "什么公共交通可以到这里？",
      texto_pt: "Que transporte público chega aqui?",
    },
    {
      id: "d5",
      texto_es: "¿Hay restaurantes o tiendas cerca?",
      texto_en: "Are there restaurants or shops nearby?",
      texto_zh: "附近有餐厅或商店吗？",
      texto_pt: "Há restaurantes ou lojas por perto?",
    },
  ],

  servicio: [
    {
      id: "s1",
      texto_es: "¿Qué servicios ofrecen?",
      texto_en: "What services do you offer?",
      texto_zh: "你们提供什么服务？",
      texto_pt: "Que serviços vocês oferecem?",
    },
    {
      id: "s2",
      texto_es: "¿Cuál es el horario de atención?",
      texto_en: "What are the service hours?",
      texto_zh: "服务时间是什么？",
      texto_pt: "Qual é o horário de atendimento?",
    },
    {
      id: "s3",
      texto_es: "¿Cuánto cuestan los servicios?",
      texto_en: "How much do the services cost?",
      texto_zh: "服务多少钱？",
      texto_pt: "Quanto custam os serviços?",
    },
    {
      id: "s4",
      texto_es: "¿Necesito hacer reservación?",
      texto_en: "Do I need to make a reservation?",
      texto_zh: "需要预约吗？",
      texto_pt: "Preciso fazer reserva?",
    },
    {
      id: "s5",
      texto_es: "¿Aceptan pagos con tarjeta?",
      texto_en: "Do you accept card payments?",
      texto_zh: "可以刷卡吗？",
      texto_pt: "Aceitam pagamento com cartão?",
    },
  ],
};

/* ── Helper: get language key from locale ── */
export type IdiomaKey = "texto_es" | "texto_en" | "texto_zh" | "texto_pt";

export function getIdiomaKey(idioma: string): IdiomaKey {
  const map: Record<string, IdiomaKey> = {
    "es-MX": "texto_es",
    "en-US": "texto_en",
    "zh-CN": "texto_zh",
    "pt-BR": "texto_pt",
    es: "texto_es",
    en: "texto_en",
    zh: "texto_zh",
    pt: "texto_pt",
  };
  return map[idioma] || "texto_es";
}

/* ── Helper: get questions for a POI category ── */
export function getPreguntasParaPOI(categoria: string): PreguntaPredefinida[] {
  return preguntasPorCategoria[categoria] || preguntasPorCategoria.servicio;
}

const preguntasContexto = {
  general: [
    {
      id: "g1",
      texto_es: "Recomiéndame 3 lugares cercanos para visitar.",
      texto_en: "Recommend 3 nearby places to visit.",
      texto_zh: "推荐3个附近可以去的地方。",
      texto_pt: "Recomende 3 lugares próximos para visitar.",
    },
    {
      id: "g2",
      texto_es: "¿Qué zona me recomiendas para comer hoy?",
      texto_en: "Which area do you recommend for food today?",
      texto_zh: "今天推荐我去哪一片区域吃饭？",
      texto_pt: "Qual área você recomenda para comer hoje?",
    },
    {
      id: "g3",
      texto_es: "¿Qué ruta corta puedo hacer en menos de 2 horas?",
      texto_en: "What short route can I do in under 2 hours?",
      texto_zh: "我可以在2小时内完成什么短路线？",
      texto_pt: "Que rota curta posso fazer em menos de 2 horas?",
    },
  ],
  negocio: [
    {
      id: "n1",
      texto_es: "¿Qué servicios y beneficios ofrece este negocio?",
      texto_en: "What services and benefits does this business offer?",
      texto_zh: "这个商家提供哪些服务和权益？",
      texto_pt: "Quais serviços e benefícios este negócio oferece?",
    },
    {
      id: "n2",
      texto_es: "¿Este negocio acepta pago con tarjeta y transferencias?",
      texto_en: "Does this business accept card and bank transfer payments?",
      texto_zh: "这个商家支持刷卡和转账吗？",
      texto_pt: "Este negócio aceita cartão e transferência?",
    },
    {
      id: "n3",
      texto_es: "¿Cuál es la mejor hora para visitar este negocio?",
      texto_en: "What is the best time to visit this business?",
      texto_zh: "什么时候去这家店最好？",
      texto_pt: "Qual é o melhor horário para visitar este negócio?",
    },
  ],
  ruta: [
    {
      id: "r1",
      texto_es: "Optimiza esta ruta para gastar menos tiempo.",
      texto_en: "Optimize this route to spend less time.",
      texto_zh: "请把这条路线优化得更省时。",
      texto_pt: "Otimize esta rota para gastar menos tempo.",
    },
    {
      id: "r2",
      texto_es: "¿Qué paradas recomiendas quitar o agregar?",
      texto_en: "Which stops should I remove or add?",
      texto_zh: "你建议我删掉或增加哪些站点？",
      texto_pt: "Quais paradas você recomenda remover ou adicionar?",
    },
    {
      id: "r3",
      texto_es: "Dame consejos para esta ruta si voy caminando.",
      texto_en: "Give me tips for this route if I go walking.",
      texto_zh: "如果我步行，这条路线有什么建议？",
      texto_pt: "Dê dicas para esta rota se eu for caminhando.",
    },
  ],
} as const;

export type ContextoPreguntas = "general" | "negocio" | "ruta";

export function getPreguntasPorContexto(contexto: ContextoPreguntas): PreguntaPredefinida[] {
  return [...preguntasContexto[contexto]];
}

export function getTextoPregunta(pregunta: PreguntaPredefinida, idioma: string): string {
  const key = getIdiomaKey(idioma);
  return pregunta[key];
}

export function getTextoPreguntaPorId(id: string, idioma: string): string | undefined {
  const allPreguntas = [
    ...Object.values(preguntasPorCategoria).flat(),
    ...Object.values(preguntasContexto).flat(),
  ];
  const encontrada = allPreguntas.find((p) => p.id === id);
  if (!encontrada) return undefined;
  return getTextoPregunta(encontrada, idioma);
}