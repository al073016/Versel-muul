"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { 
  DUMMY_RANKING, 
  SocialPost, 
  SocialUser 
} from "@/lib/social-dummy";
import { SocialService } from "@/lib/services/social.service";
import { useState, useEffect, Suspense, Component, ReactNode } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getPerfilCompat } from "@/lib/supabase/profileCompat";

// Error boundary to catch render errors
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-red-600 bg-red-50 rounded-xl">
          <p className="font-bold">Error en Comunidad:</p>
          <pre className="text-xs mt-2">{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function PostCard({ post, currentUserId, onDelete }: { post: SocialPost, currentUserId?: string | null, onDelete?: (id: string) => void }) {
  const t = useTranslations("comunidad");
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const isMe = currentUserId && post.user_id === currentUserId;

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(newLiked ? likes + 1 : likes - 1);

    await SocialService.toggleLike(post.id);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-outline-variant/20 shadow-sm p-6 mb-6 hover:shadow-md transition-shadow">
      {}
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
              {isMe ? (
                <span className="bg-[#003e6f]/10 text-[#003e6f] text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">
                  {t("tu")}
                </span>
              ) : post.is_friend && (
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
        {isMe ? (
          <button 
            onClick={() => {
              if (window.confirm("¿Seguro que quieres borrar esta publicación?")) {
                onDelete?.(post.id);
              }
            }}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full p-2 transition-colors flex items-center"
            title="Borrar publicación"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        ) : (
          <button className="text-on-surface-variant hover:bg-surface-container rounded-full p-2">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        )}
      </div>

      {}
      <p className="text-on-surface text-base mb-4 font-body leading-relaxed">
        {post.content}
      </p>

      {}
      {post.image_urls.length > 0 && (
        <div className="w-full h-64 md:h-80 relative rounded-2xl overflow-hidden mb-4 shadow-sm border border-outline-variant/10">
          <Image src={post.image_urls[0]} alt="Post media" fill className="object-cover" />
        </div>
      )}

      {}
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
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#003e6f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500 font-body">Cargando comunidad...</p>
          </div>
        </div>
      }>
        <ComunidadContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function ComunidadContent() {
  const t = useTranslations("comunidad");
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [ranking, setRanking] = useState<SocialUser[]>(DUMMY_RANKING.slice(0, 5));


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

  const [currentUser, setCurrentUser] = useState<{ id: string, nombre: string, initials: string, avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const perfil = await getPerfilCompat(supabase, user.id);
        const nombre = perfil?.nombre_completo || user.user_metadata?.nombre_completo || user.email || "Usuario";
        const parts = nombre.split(" ");
        const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
        setCurrentUser({ id: user.id, nombre, initials, avatar_url: perfil?.avatar_url || null });
      }
    };
    fetchUser();
  }, [supabase]);


  const [isDraftLoading, setIsDraftLoading] = useState(false);

  useEffect(() => {
    const isDraft = searchParams.get("draft") === "true";
    if (isDraft) {
      const draftText = sessionStorage.getItem("muul_draft_text");
      const draftImage = sessionStorage.getItem("muul_draft_image");
      
      if (draftText) setInputValue(draftText);
      if (draftImage) {
        setIsDraftLoading(true);
        setSelectedImage(draftImage);
        

        const convertDataUrlToFile = async (dataUrl: string) => {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `ruta_${Date.now()}.png`, { type: "image/png" });
            setSelectedImageFile(file);
          } catch (err) {
            console.error("Error converting draft image:", err);
          } finally {
            setIsDraftLoading(false);
          }
        };
        convertDataUrlToFile(draftImage);
      }
      

      sessionStorage.removeItem("muul_draft_text");
      sessionStorage.removeItem("muul_draft_image");
    }
  }, [searchParams]);

  const handleAddPost = async () => {
    if (!inputValue.trim() || isDraftLoading) return;
    
    setIsPublishing(true);
    
    try {
      let finalImageUrls: string[] = [];
      
      if (selectedImageFile) {
        try {
          const publicUrl = await SocialService.uploadImage(selectedImageFile);
          if (publicUrl) {
            finalImageUrls = [publicUrl];
          } else {

            if (selectedImage) finalImageUrls = [selectedImage];
          }
        } catch (uploadError) {
          console.error("Upload error, using local fallback:", uploadError);
          if (selectedImage) finalImageUrls = [selectedImage];
        }
      }

      const userId = currentUser?.id || 'me';
      const newPost = await SocialService.createPost(userId, inputValue, finalImageUrls);
      

      setPosts(prev => [newPost, ...prev]);
      setInputValue("");
      setSelectedImage(null);
      setSelectedImageFile(null);
    } catch (error: any) {
      console.error("Error publishing post:", error);
      alert("La conexión con Supabase es inestable. El post se guardó localmente en este navegador para no perder tu aventura.");
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

  const handleDeletePost = async (postId: string) => {
    const success = await SocialService.deletePost(postId);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      alert("No se pudo borrar la publicación");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafd] pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12">
        {}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4 font-label text-xs uppercase tracking-[0.2em] text-[#005596] font-black">
            ✨ Red Social Muul
          </div>
          <h1 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black tracking-tight mb-4">{t("titulo")}</h1>
          <p className="text-neutral-500 font-body text-lg max-w-2xl">{t("subtitulo")}</p>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12">
          
          {}
          <div className="flex-1 lg:max-w-2xl">
            {}
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
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageSelect}
                  />
                </label>
                <button 
                  onClick={handleAddPost}
                  disabled={!inputValue.trim() || isPublishing}
                  className="bg-[#fed000] text-[#003e6f] px-6 py-2 rounded-full font-headline font-black text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isPublishing ? "..." : t("publicar")}
                </button>
              </div>

              {selectedImage && (
                <div className="mt-4 relative w-full h-48 rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setSelectedImage(null); setSelectedImageFile(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline font-black text-xl text-[#003e6f] mb-6">{t("publicaciones")}</h2>
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUser?.id} 
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          </div>

          {}
          <div className="w-full lg:w-[400px] shrink-0">
            <RankingBoard users={ranking} />
          </div>

        </div>
      </div>
    </main>
  );
}
