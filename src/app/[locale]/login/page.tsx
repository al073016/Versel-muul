"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) {
        router.push("/perfil");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/auth/callback?next=/perfil`,
        },
      });
      if (error) console.error(error);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center pt-20 px-6 md:px-0 bg-surface">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Editorial Content */}\n        <div className="hidden lg:flex lg:col-span-6 flex-col space-y-8 pr-12">
          <div className="space-y-4">
            <span className="font-label text-primary text-sm font-bold tracking-tighter uppercase">Inteligencia en Movimiento</span>
            <h1 className="text-5xl md:text-6xl font-headline italic text-primary leading-tight">Bienvenido a MUUL</h1>
            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed font-body">
              Explora una nueva era de movilidad diseñada para el viajero inteligente. Datos precisos, experiencias curadas.
            </p>
          </div>
          {/* Bento Highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-xl space-y-2 border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary">explore</span>
              <h3 className="font-headline italic text-xl text-primary">Rutas Curadas</h3>
              <p className="text-sm text-on-surface-variant font-body">Inteligencia artificial en tu destino.</p>
            </div>
            <div className="bg-primary text-white p-6 rounded-xl space-y-2">
              <span className="material-symbols-outlined">verified_user</span>
              <h3 className="font-headline italic text-xl">Viaje Seguro</h3>
              <p className="text-sm opacity-80 font-body">Respaldo de Coppel en cada km.</p>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-surface-container-lowest p-10 md:p-12 rounded-[2rem] shadow-sm border border-outline-variant/10">
            {/* Mobile Branding */}
            <div className="lg:hidden mb-8 flex justify-center">
              <span className="text-3xl font-black tracking-tight text-primary font-headline italic">MUUL</span>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-headline italic text-primary mb-2">Ingresar</h2>
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">Gestiona tus beneficios</p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleEmailLogin}>
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="email">
                  CORREO ELECTRÓNICO
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface placeholder:text-outline-variant"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label text-xs font-bold text-primary" htmlFor="password">
                    CONTRASEÑA
                  </label>
                  <a href="#" className="font-label text-xs text-primary-container font-bold hover:underline">
                    ¿OLVIDASTE TU CONTRASEÑA?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-full shadow-lg shadow-primary/10 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span className="font-body">{loading ? "Cargando..." : "Continuar"}</span>
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-container-lowest px-4 text-outline-variant font-label">O accede con</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center space-x-2 h-14 bg-surface-container-low rounded-full border border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-95 disabled:opacity-50"
              >
                <span className="text-2xl">🔤</span>
                <span className="font-body font-bold text-sm">Google</span>
              </button>
              <button className="flex items-center justify-center space-x-2 h-14 bg-surface-container-low rounded-full border border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-95">
                <span className="material-symbols-outlined text-2xl">apple</span>
                <span className="font-body font-bold text-sm">Apple</span>
              </button>
            </div>

            {/* Footer Link */}
            <div className="mt-10 text-center">
              <p className="text-sm text-on-surface-variant font-body">
                ¿Nuevo en MUUL?{" "}
                <a href="#" className="text-primary font-bold hover:text-secondary transition-colors underline decoration-secondary-container decoration-2 underline-offset-4">
                  Crea una cuenta
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
