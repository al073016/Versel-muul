export type SocialUser = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  points: number;
  level: string;
};

export type SocialPost = {
  id: string;
  user_id: string;
  content: string;
  image_urls: string[]; // Prepared for future Supabase storage transition
  likes: number;
  dislikes: number;
  comments: number;
  created_at: string;
  is_friend: boolean; // Flag to prioritize in feed
  user: SocialUser;
};

export type CommunityRoute = {
  id: string;
  name: string;
  creator: SocialUser;
  poi_count: number;
  collaborators: SocialUser[];
  likes: number;
  cover_image: string;
};

// ─── DUMMY DATA ──────────────────────────────────────────

export const DUMMY_SOCIAL_USERS: Record<string, SocialUser> = {
  'u1': {
    id: 'u1',
    username: '@viajera66',
    full_name: 'Ana Martínez',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop',
    points: 4500,
    level: 'Guía Maestro'
  },
  'u2': {
    id: 'u2',
    username: '@carlos_explorador',
    full_name: 'Carlos R.',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop',
    points: 3200,
    level: 'Aventurero Veterano'
  },
  'u3': {
    id: 'u3',
    username: '@sofia_cdmx',
    full_name: 'Sofía Navarro',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
    points: 1200,
    level: 'Turista Curioso'
  },
  'u4': {
    id: 'u4',
    username: '@foodie_mx',
    full_name: 'Diego Hernández',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop',
    points: 5100,
    level: 'Crítico Gourmet'
  },
  'u5': {
    id: 'u5',
    username: '@lu_traveler',
    full_name: 'Lucía Ramírez',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop',
    points: 2800,
    level: 'Nómada Digital'
  },
  'u6': {
    id: 'u6',
    username: '@marco_photo',
    full_name: 'Marco Villanueva',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
    points: 3900,
    level: 'Fotógrafo Urbano'
  },
  'u7': {
    id: 'u7',
    username: '@vale_fit',
    full_name: 'Valentina Orozco',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop',
    points: 1800,
    level: 'Exploradora Activa'
  },
  'u8': {
    id: 'u8',
    username: '@el_chef_pedro',
    full_name: 'Pedro Castañeda',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop',
    points: 6200,
    level: 'Leyenda Local'
  }
};

export const DUMMY_POSTS: SocialPost[] = [
  {
    id: 'post_1',
    user_id: 'u1',
    content: '¡Acabo de desbloquear el logro "Cultura Capital" al visitar Bellas Artes y el Museo Soumaya el mismo día! Totalmente recomendado, la ciudad está hermosa esta semana. 🎨🏛️',
    image_urls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 128,
    dislikes: 2,
    comments: 15,
    created_at: 'Hace 2 horas',
    is_friend: true,
    user: DUMMY_SOCIAL_USERS['u1']
  },
  {
    id: 'post_2',
    user_id: 'u2',
    content: 'Encontré unos tacos al pastor escondidos en la Juárez que están nivel Dios. Acabo de subir la ruta pública para que los prueben. De nada 😎🌮',
    image_urls: [
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 45,
    dislikes: 0,
    comments: 8,
    created_at: 'Hace 5 horas',
    is_friend: true,
    user: DUMMY_SOCIAL_USERS['u2']
  },
  {
    id: 'post_3',
    user_id: 'u3',
    content: 'Planeando la salida del fin de semana con amigos al Castillo de Chapultepec. Alguien recomienda un buen lugar para comer por la zona?',
    image_urls: [],
    likes: 12,
    dislikes: 1,
    comments: 4,
    created_at: 'Hace 1 día',
    is_friend: false,
    user: DUMMY_SOCIAL_USERS['u3']
  },
  {
    id: 'post_4',
    user_id: 'u4',
    content: 'Review del día: Samurai Sushi en la Alameda. El Dragon Roll está BRUTAL, la salsa anguila es casera. 9/10. Solo le falta mejor servicio en hora pico. 🍣⭐',
    image_urls: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 89,
    dislikes: 3,
    comments: 22,
    created_at: 'Hace 3 horas',
    is_friend: false,
    user: DUMMY_SOCIAL_USERS['u4']
  },
  {
    id: 'post_5',
    user_id: 'u5',
    content: 'Trabajé todo el día desde The Coffee Bean en Polanco. Internet rapidísimo, enchufes en todas las mesas, y el cold brew nitrogenado es adictivo. Nuevo spot favorito de home office. 💻☕',
    image_urls: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 67,
    dislikes: 0,
    comments: 11,
    created_at: 'Hace 6 horas',
    is_friend: false,
    user: DUMMY_SOCIAL_USERS['u5']
  },
  {
    id: 'post_6',
    user_id: 'u6',
    content: 'Golden hour en el Ángel de la Independencia. No importa cuántas veces lo fotografíe, siempre hay un ángulo nuevo. Esta ciudad nunca deja de sorprenderme. 📸✨',
    image_urls: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 234,
    dislikes: 1,
    comments: 31,
    created_at: 'Hace 8 horas',
    is_friend: true,
    user: DUMMY_SOCIAL_USERS['u6']
  },
  {
    id: 'post_7',
    user_id: 'u7',
    content: 'Entreno terminado en Power Fit Gym 💪 Después me fui caminando por Roma Norte y descubrí una heladería italiana increíble llamada Gelato Ciao. El pistacho es el mejor que he probado en CDMX.',
    image_urls: [],
    likes: 33,
    dislikes: 0,
    comments: 7,
    created_at: 'Hace 12 horas',
    is_friend: false,
    user: DUMMY_SOCIAL_USERS['u7']
  },
  {
    id: 'post_8',
    user_id: 'u8',
    content: 'Acabo de crear una ruta gastronómica de 5 paradas por el Centro Histórico. Incluye tacos, churros, esquites, mezcal artesanal y termina con un café de olla en un lugar secreto. La publiqué como ruta pública, ¡compártanla! 🔥🇲🇽',
    image_urls: [
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 312,
    dislikes: 4,
    comments: 48,
    created_at: 'Hace 1 día',
    is_friend: false,
    user: DUMMY_SOCIAL_USERS['u8']
  },
  {
    id: 'post_9',
    user_id: 'u1',
    content: 'Tip de viajera: si van al Castillo de Chapultepec, lleguen antes de las 10am. Casi no hay gente y pueden tomar fotos increíbles de toda la ciudad desde arriba. 🏰🌅',
    image_urls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop'
    ],
    likes: 156,
    dislikes: 0,
    comments: 19,
    created_at: 'Hace 2 días',
    is_friend: true,
    user: DUMMY_SOCIAL_USERS['u1']
  },
  {
    id: 'post_10',
    user_id: 'u4',
    content: 'Llevé a mi familia al Cine Mágico VIP. Las butacas son SOFÁ CAMA literal. Mis hijos no lo podían creer. El combo pareja incluye hasta hotdog. Noche 10/10 🍿🎬',
    image_urls: [],
    likes: 74,
    dislikes: 2,
    comments: 13,
    created_at: 'Hace 2 días',
    is_friend: false,
    user: DUMMY_SOCIAL_USERS['u4']
  }
];

export const DUMMY_RANKING: SocialUser[] = [
  DUMMY_SOCIAL_USERS['u8'],
  DUMMY_SOCIAL_USERS['u4'],
  DUMMY_SOCIAL_USERS['u1'],
  DUMMY_SOCIAL_USERS['u6'],
  DUMMY_SOCIAL_USERS['u2'],
  DUMMY_SOCIAL_USERS['u5'],
  DUMMY_SOCIAL_USERS['u7'],
  DUMMY_SOCIAL_USERS['u3']
];
