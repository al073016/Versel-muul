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
  }
};

export const DUMMY_POSTS: SocialPost[] = [
  {
    id: 'post_1',
    user_id: 'u1',
    content: '¡Acabo de desbloquear el logro "Cultura Capital" al visitar Bellas Artes y el Museo Soumaya el mismo día! Totalmente recomendado, la ciudad está hermosa esta semana. 🎨🏛️',
    image_urls: [
      'https://images.unsplash.com/photo-1585464231473-746d24c039a2?q=80&w=1000&auto=format&fit=crop'
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
      'https://images.unsplash.com/photo-1565299585323-38d6b0865ef4?q=80&w=1000&auto=format&fit=crop'
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
  }
];

export const DUMMY_RANKING: SocialUser[] = [
  DUMMY_SOCIAL_USERS['u1'],
  DUMMY_SOCIAL_USERS['u2'],
  DUMMY_SOCIAL_USERS['u3']
];
