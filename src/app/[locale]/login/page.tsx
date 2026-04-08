"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

type AccountType = "turista" | "negocio";

export default function LoginPage() {
  const supabase = createClient();
  const t = useTranslations("login");
  // Agrega dentro del componente:
const locale = useLocale();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>("turista");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Reemplaza handleLogin completo:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoginError("");
  setLoginLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ 
    email: loginEmail, 
    password: loginPassword 
  });
  setLoginLoading(false);
  if (error) { setLoginError(t("errorCredenciales")); return; }
  // Hard redirect para que el servidor lea las cookies de sesión correctamente
  window.location.href = `/${locale}/perfil`;
};

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    if (regPassword.length < 8) { setRegError(t("errorMinContrasena")); setRegLoading(false); return; }
    const { error } = await supabase.auth.signUp({
      email: regEmail, password: regPassword,
      options: { data: { nombre_completo: regName, tipo_cuenta: accountType } },
    });
    setRegLoading(false);
    if (error) { setRegError(error.message); return; }
    setRegSuccess(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none" />

      <main className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-16 p-6 py-16 relative z-10">
        {/* ===== LOGIN ===== */}
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="glass-card p-8 md:p-10 rounded-xl shadow-card">
            <div className="flex flex-col items-center mb-10">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-glow-primary">
                <span className="material-symbols-outlined text-on-primary text-3xl font-bold">water_drop</span>
              </div>
              <h1 className="font-headline font-black text-3xl tracking-tight text-center">{t("bienvenido")}</h1>
              <p className="text-on-surface-variant text-sm mt-2 text-center">{t("exploraMsg")}</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-1">{t("correo")}</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={t("correoPlaceholder")} className="w-full bg-surface-container-highest border-none rounded-md px-4 py-3 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-secondary/40 transition-all outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-1">{t("contrasena")}</label>
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full bg-surface-container-highest border-none rounded-md px-4 py-3 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-secondary/40 transition-all outline-none" />
              </div>
              <div className="flex justify-end">
                <Link href="#" className="text-xs text-primary-fixed-dim hover:text-primary transition-colors">{t("olvidaste")}</Link>
              </div>
              {loginError && (<div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">{loginError}</div>)}
              <button type="submit" disabled={loginLoading} className="w-full bg-primary py-4 rounded-md font-headline font-bold text-on-primary hover:shadow-glow-secondary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                {loginLoading ? t("iniciando") : t("iniciarSesion")}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-[#1C1C1E] px-4 text-on-surface-variant font-medium">{t("o")}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center py-3 px-4 rounded-md bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high transition-colors opacity-50 cursor-not-allowed" disabled>
                <span className="material-symbols-outlined text-lg mr-2">g_translate</span><span className="text-xs font-semibold">{t("google")}</span>
              </button>
              <button type="button" className="flex items-center justify-center py-3 px-4 rounded-md bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-high transition-colors opacity-50 cursor-not-allowed" disabled>
                <span className="material-symbols-outlined text-lg mr-2">phone_iphone</span><span className="text-xs font-semibold">{t("apple")}</span>
              </button>
            </div>

            <p className="mt-10 text-center text-sm text-on-surface-variant">
              {t("sinCuenta")}{" "}
              <Link href="#registro" className="text-secondary font-bold ml-1 hover:underline">{t("registrate")}</Link>
            </p>
          </div>
        </div>

        <div className="hidden xl:block w-px h-64 bg-outline-variant/20" />

        {/* ===== REGISTER ===== */}
        <div className="w-full max-w-md animate-fade-in-up" id="registro" style={{ animationDelay: "0.15s" }}>
          <div className="glass-card p-8 md:p-10 rounded-xl shadow-card">
            {regSuccess ? (
              <div className="flex flex-col items-center text-center py-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h2 className="font-headline font-black text-2xl">{t("cuentaCreada")}</h2>
                <p className="text-on-surface-variant text-sm max-w-xs">{t("revisaCorreo")}</p>
                <button onClick={() => setRegSuccess(false)} className="px-8 py-3 bg-primary text-on-primary rounded-md font-headline font-bold hover:shadow-glow-secondary transition-all">{t("volverRegistro")}</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-8">
                  <h2 className="font-headline font-black text-3xl tracking-tight text-center">{t("crearCuenta")}</h2>
                  <p className="text-on-surface-variant text-sm mt-2 text-center">{t("unete")}</p>
                </div>

                <div className="bg-surface-container-lowest p-1 rounded-full flex mb-8">
                  <button type="button" onClick={() => setAccountType("turista")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${accountType === "turista" ? "bg-surface-container-highest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                    <span className="material-symbols-outlined text-sm" style={accountType === "turista" ? { fontVariationSettings: "'FILL' 1" } : undefined}>person</span>
                    {t("turista")}
                  </button>
                  <button type="button" onClick={() => setAccountType("negocio")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${accountType === "negocio" ? "bg-surface-container-highest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                    <span className="material-symbols-outlined text-sm">storefront</span>
                    {t("negocio")}
                  </button>
                </div>

                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-1">{t("nombre")}</label>
                    <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder={t("nombrePlaceholder")} className="w-full bg-surface-container-highest border-none rounded-md px-4 py-3 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-secondary/40 transition-all outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-1">{t("correo")}</label>
                    <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder={t("correoRegistroPlaceholder")} className="w-full bg-surface-container-highest border-none rounded-md px-4 py-3 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-secondary/40 transition-all outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant ml-1">{t("contrasena")}</label>
                    <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder={t("minCaracteres")} className="w-full bg-surface-container-highest border-none rounded-md px-4 py-3 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-secondary/40 transition-all outline-none" />
                  </div>

                  {accountType === "negocio" && (
                    <div className="p-4 rounded-xl bg-secondary-container/10 border border-secondary/20 flex gap-3 animate-fade-in-up">
                      <span className="material-symbols-outlined text-secondary shrink-0">info</span>
                      <p className="text-[11px] text-on-secondary-container leading-relaxed">{t("avisoNegocio")}</p>
                    </div>
                  )}

                  {regError && (<div className="p-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-xs font-medium animate-fade-in-up">{regError}</div>)}

                  <button type="submit" disabled={regLoading} className="w-full bg-primary py-4 rounded-md font-headline font-bold text-on-primary hover:shadow-glow-secondary transition-all mt-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {regLoading ? t("creando") : t("crearBtn")}
                  </button>
                </form>

                <p className="mt-8 text-center text-xs text-on-surface-variant leading-relaxed">
                  {t("terminosMsg")}{" "}
                  <Link href="#" className="text-on-surface font-medium hover:underline">{t("terminos")}</Link>
                  {" & "}
                  <Link href="#" className="text-on-surface font-medium hover:underline">{t("politica")}</Link>
                </p>

                <p className="mt-6 text-center text-sm text-on-surface-variant">
                  {t("yaTienesCuenta")}{" "}
                  <Link href="#" className="text-secondary font-bold ml-1 hover:underline">{t("iniciaSesion")}</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-6 opacity-40">
        <p className="text-[10px] uppercase tracking-[0.2em] font-headline font-bold">{t("ciudades")}</p>
      </footer>
    </div>
  );
}