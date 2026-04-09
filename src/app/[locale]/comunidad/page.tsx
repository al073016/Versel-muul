"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { 
  DUMMY_RANKING, 
  SocialPost, 
  SocialUser 
} from "@/lib/social-dummy";
import { SocialService } from "@/lib/services/social.service";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";

function PostCard({ post }: { post: SocialPost }) {
  const t = useTranslations("comunidad");
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(newLiked ? likes + 1 : likes - 1);
    // Real Supabase toggle (no-op if not authenticated)
    await SocialService.toggleLike(post.id);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm p-6 mb-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4 items-center group">
          <Link href={`/perfil?id=${post.user.id}`} className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#003e6f]/10 shadow-sm transition-transform group-hover:scale-105">
            <Image src={post.user.avatar_url} alt={post.user.username} fill className="object-cover" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/perfil?id=${post.user.id}`} className="font-headline font-bold text-[#003e6f] hover:underline decoration-2 underline-offset-2 transition-all">
                {post.user.full_name}
              </Link>
              {post.is_friend && (
                <span className="bg-[#fed000]/20 text-[#003e6f] text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                  {t("tuAmigo")}
                </span>
              )}
            </div>
            <Link href={`/perfil?id=${post.user.id}`} className="text-on-surface-variant text-sm font-label hover:text-[#003e6f] transition-colors">
              {post.user.username}
            </Link>
            <span className="text-on-surface-variant text-sm font-label"> • {post.created_at}</span>
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
          <div key={user.id} className="flex items-center gap-4 bg-[#f3f6ff] p-4 rounded-2xl hover:-translate-y-1 transition-transform border border-[#003e6f]/5 group">
            <span className={`font-headline font-black text-xl w-6 text-center ${idx === 0 ? 'text-[#fed000]' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-neutral-400'}`}>
              #{idx + 1}
            </span>
            <Link href={`/perfil?id=${user.id}`} className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm hover:ring-2 hover:ring-[#fed000] transition-all">
              <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
            </Link>
            <div className="flex-1">
              <Link href={`/perfil?id=${user.id}`} className="font-headline font-bold text-[#003e6f] text-sm leading-tight hover:underline">
                {user.full_name}
              </Link>
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
  const supabase = createClient();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [ranking, setRanking] = useState<SocialUser[]>(DUMMY_RANKING);

  // Load real ranking from Supabase (get_ranking RPC)
  useEffect(() => {
    const loadRanking = async () => {
      try {
        const { data } = await supabase.rpc("get_ranking", { p_limit: 10 });
        if (data && data.length > 0) {
          setRanking(data.map((u: any) => ({
            id: u.id,
            username: u.username ? `@${u.username}` : "@usuario",
            full_name: u.nombre_completo ?? "Usuario",
            avatar_url: u.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre_completo ?? "U")}&background=003e6f&color=fff&bold=true&size=200`,
            points: u.puntos ?? 0,
            level: u.nivel ?? "Explorador Novato",
          })));
        }
      } catch {
        // fallback to DUMMY_RANKING already set as default
      }
    };
    loadRanking();
  }, [supabase]);

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await SocialService.getFeedPosts();
      setPosts(data);
    };
    fetchPosts();
  }, []);
  const [inputValue, setInputValue] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [currentUser, setCurrentUser] = useState<{ nombre: string, initials: string, avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const perfil = await getPerfilCompat(supabase, user.id);
        const nombre = perfil?.nombre_completo || user.user_metadata?.nombre_completo || user.email || "Usuario";
        const parts = nombre.split(" ");
        const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
        setCurrentUser({ nombre, initials, avatar_url: perfil?.avatar_url || null });
      }
    };
    fetchUser();
  }, [supabase]);

  const handleAddPost = async () => {
    if (!inputValue.trim()) return;
    
    setIsPublishing(true);
    
    try {
      let finalImageUrls: string[] = [];
      
      // If there is a file selected, upload it to real storage
      if (selectedImageFile) {
        const publicUrl = await SocialService.uploadImage(selectedImageFile);
        if (publicUrl) {
          finalImageUrls = [publicUrl];
        }
      }

      const userId = currentUser?.initials ? 'me' : 'anon';
      const newPost = await SocialService.createPost(userId, inputValue, finalImageUrls);
      
      // Fallback UI update if real data comes back lacking props
      if (!newPost.user.avatar_url && currentUser?.avatar_url) {
         newPost.user.avatar_url = currentUser.avatar_url;
      }
      if (newPost.user.username === '@me' && currentUser?.nombre) {
         newPost.user.full_name = currentUser.nombre;
         newPost.user.username = `@${currentUser.nombre.split(' ')[0].toLowerCase()}`;
      }

      setPosts(prev => [newPost, ...prev]);
      setInputValue("");
      setSelectedImage(null);
      setSelectedImageFile(null);
    } catch (error) {
      console.error("Error publishing post:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            <div className={`bg-white rounded-[2rem] border border-outline-variant/20 shadow-md p-6 mb-8 transition-colors ${isPublishing ? 'opacity-50 pointer-events-none' : 'hover:border-secondary'}`}>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 border-slate-100 bg-gradient-to-br from-[#003e6f] to-[#005596] text-white font-black text-lg shadow-inner">
                  {currentUser?.avatar_url ? (
                    <Image src={currentUser.avatar_url} alt="Yo" width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.initials || "US"
                  )}
                </div>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPost()}
                  placeholder={t("compartirAventura")}
                  className="flex-1 bg-transparent border-none outline-none font-body text-base placeholder-gray-400"
                />
                <label className="cursor-pointer text-neutral-400 hover:text-[#003e6f] transition-colors p-2 rounded-full hover:bg-neutral-100">
                  <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
                <button 
                  onClick={handleAddPost}
                  disabled={!inputValue.trim()}
                  className="bg-[#fed000] text-[#003e6f] h-12 px-6 rounded-full font-headline font-black text-sm uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(254,208,0,0.4)]"
                >
                  {isPublishing ? '...' : t("publicar")}
                </button>
              </div>
              {selectedImage && (
                <div className="mt-4 relative">
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-outline-variant/10">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => { setSelectedImage(null); setSelectedImageFile(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
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
            <RankingBoard users={ranking} />
          </div>

        </div>
      </div>
    </main>
  );
}
