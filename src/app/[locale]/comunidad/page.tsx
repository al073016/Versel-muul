"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { 
  DUMMY_POSTS, 
  DUMMY_RANKING, 
  SocialPost, 
  SocialUser 
} from "@/lib/social-dummy";
import { useState } from "react";
import Image from "next/image";

function PostCard({ post }: { post: SocialPost }) {
  const t = useTranslations("comunidad");
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm p-6 mb-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4 items-center">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#003e6f]/10 shadow-sm">
            <Image src={post.user.avatar_url} alt={post.user.username} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-[#003e6f]">{post.user.full_name}</h3>
              {post.is_friend && (
                <span className="bg-[#fed000]/20 text-[#003e6f] text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                  {t("tuAmigo")}
                </span>
              )}
            </div>
            <p className="text-on-surface-variant text-sm font-label">{post.user.username} • {post.created_at}</p>
          </div>
        </div>
        <button className="text-on-surface-variant hover:bg-surface-container rounded-full p-2">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Content */}
      <p className="text-on-surface text-base mb-4 font-body leading-relaxed">
        {post.content}
      </p>

      {/* Images */}
      {post.image_urls.length > 0 && (
        <div className="w-full h-64 md:h-80 relative rounded-2xl overflow-hidden mb-4 shadow-sm border border-outline-variant/10">
          <Image src={post.image_urls[0]} alt="Post media" fill className="object-cover" />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-outline-variant/10">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${liked ? 'text-secondary' : 'text-on-surface-variant hover:text-[#003e6f]'}`}
        >
          <span className="material-symbols-outlined" style={liked ? {fontVariationSettings: "'FILL' 1"} : {}}>favorite</span>
          {likes}
        </button>
        <button className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-[#003e6f] transition-colors">
          <span className="material-symbols-outlined">chat_bubble</span>
          {post.comments}
        </button>
        <button className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-[#003e6f] transition-colors ml-auto">
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>
    </div>
  );
}

function RankingBoard({ users }: { users: SocialUser[] }) {
  const t = useTranslations("comunidad");

  return (
    <div className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-lg p-6 lg:p-8 sticky top-28">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-secondary text-3xl">workspace_premium</span>
        <h3 className="font-headline font-black text-2xl text-[#003e6f]">{t("topViajeros")}</h3>
      </div>
      
      <div className="flex flex-col gap-4">
        {users.map((user, idx) => (
          <div key={user.id} className="flex items-center gap-4 bg-[#f3f6ff] p-4 rounded-2xl hover:-translate-y-1 transition-transform border border-[#003e6f]/5">
            <span className={`font-headline font-black text-xl w-6 text-center ${idx === 0 ? 'text-[#fed000]' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-neutral-400'}`}>
              #{idx + 1}
            </span>
            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm">
              <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-headline font-bold text-[#003e6f] text-sm leading-tight">{user.full_name}</h4>
              <p className="text-on-surface-variant text-xs">{t("nivel", { nivel: user.level })}</p>
            </div>
            <div className="text-right">
              <span className="block font-black text-[#003e6f] text-sm">{t("puntos", { count: user.points })}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-3 font-headline font-bold text-sm text-[#003e6f] hover:bg-[#f3f6ff] rounded-xl transition-colors">
        Ver Ranking Completo
      </button>
    </div>
  );
}

export default function ComunidadPage() {
  const t = useTranslations("comunidad");
  const [posts, setPosts] = useState<SocialPost[]>(() => {
    return DUMMY_POSTS.slice().sort((a, b) => (b.is_friend === a.is_friend ? 0 : b.is_friend ? 1 : -1));
  });
  const [inputValue, setInputValue] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleAddPost = () => {
    if (!inputValue.trim()) return;
    
    setIsPublishing(true);
    
    // Simular un ligero retraso de red para dar realismo a la demo
    setTimeout(() => {
      const newPost: SocialPost = {
        id: `post_new_${Date.now()}`,
        user_id: 'me',
        content: inputValue,
        image_urls: [],
        likes: 0,
        dislikes: 0,
        comments: 0,
        created_at: 'Justo ahora',
        is_friend: true,
        user: {
          id: 'me',
          username: '@admin',
          full_name: 'Yo (Muul Master)',
          avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&auto=format&fit=crop',
          points: 9999,
          level: 'Creador'
        }
      };
      
      setPosts(prev => [newPost, ...prev]);
      setInputValue("");
      setIsPublishing(false);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-[#f8fafd] pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4 font-label text-xs uppercase tracking-[0.2em] text-[#005596] font-black">
            ✨ Red Social Muul
          </div>
          <h1 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black tracking-tight mb-4">{t("titulo")}</h1>
          <p className="text-neutral-500 font-body text-lg max-w-2xl">{t("subtitulo")}</p>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12">
          
          {/* Main Feed Column */}
          <div className="flex-1 lg:max-w-2xl">
            {/* Create Post Input */}
            <div className={`bg-white rounded-[2rem] border border-outline-variant/20 shadow-md p-6 mb-8 flex gap-4 items-center transition-colors ${isPublishing ? 'opacity-50 pointer-events-none' : 'hover:border-secondary'}`}>
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 border-slate-100">
                <Image src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&auto=format&fit=crop" alt="Yo" width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPost()}
                placeholder={t("compartirAventura")}
                className="flex-1 bg-transparent border-none outline-none font-body text-base placeholder-gray-400"
              />
              <button 
                onClick={handleAddPost}
                disabled={!inputValue.trim()}
                className="bg-[#fed000] text-[#003e6f] h-12 px-6 rounded-full font-headline font-black text-sm uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(254,208,0,0.4)]"
              >
                {isPublishing ? '...' : t("publicar")}
              </button>
            </div>

            {/* Posts Feed */}
            <div className="flex flex-col">
              <h2 className="font-headline font-black text-xl text-[#003e6f] mb-6">{t("publicaciones")}</h2>
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Right Sidebar - Ranking */}
          <div className="w-full lg:w-[400px] shrink-0">
            <RankingBoard users={DUMMY_RANKING} />
          </div>

        </div>
      </div>
    </main>
  );
}
