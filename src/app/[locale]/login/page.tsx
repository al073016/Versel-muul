"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type BusinessFeature = "card" | "transfer" | "petFriendly" | "vegan" | "accessible";

interface TouristRegisterForm {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

interface BusinessRegisterForm {
  ownerFirstName: string;
  ownerLastName: string;
  postalCode: string;
  phone: string;
  contactEmail: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  authEmail: string;
  authPassword: string;
  features: BusinessFeature[];
}

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const t = useTranslations("login");
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [profile, setProfile] = useState<"turista" | "negocio">("turista");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [touristRegister, setTouristRegister] = useState<TouristRegisterForm>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [businessRegister, setBusinessRegister] = useState<BusinessRegisterForm>({
    ownerFirstName: "",
    ownerLastName: "",
    postalCode: "",
    phone: "",
    contactEmail: "",
    businessName: "",
    businessType: "",
    businessAddress: "",
    authEmail: "",
    authPassword: "",
    features: [],
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const hasPrefilledFromOAuth = useRef(false);

  const isGoogleCompletionFlow =
    searchParams.get("oauth") === "google" && searchParams.get("complete") === "1";

  useEffect(() => {
    if (!isGoogleCompletionFlow || hasPrefilledFromOAuth.current) return;

    const firstName = searchParams.get("firstName") ?? "";
    const lastName = searchParams.get("lastName") ?? "";
    const username = searchParams.get("username") ?? "";
    const email = searchParams.get("email") ?? "";
    const phone = searchParams.get("phone") ?? "";

    setProfile("turista");
    setMode("register");
    setTouristRegister((prev) => ({
      ...prev,
      firstName,
      lastName,
      username,
      email,
      phone,
      password: "",
    }));

    hasPrefilledFromOAuth.current = true;
  }, [isGoogleCompletionFlow, searchParams]);

  const toggleFeature = (feature: BusinessFeature) => {
    setBusinessRegister((prev) => {
      const exists = prev.features.includes(feature);
      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
  };

  const mapFeaturesToDatabase = (features: BusinessFeature[]): string[] => {
    const featureMap: Record<BusinessFeature, string> = {
      card: "pago_tarjeta",
      transfer: "transferencias",
      petFriendly: "pet_friendly",
      vegan: "vegana",
      accessible: "accesibilidad",
    };
    return features.map((f) => featureMap[f]);
  };

  const getRegisterAuth = () => {
    if (profile === "turista") {
      return { email: touristRegister.email, password: touristRegister.password };
    }
    return { email: businessRegister.authEmail, password: businessRegister.authPassword };
  };

  const iniciarSesionConGoogle = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    const resetTimer = window.setTimeout(() => {
      setLoading(false);
    }, 6000);

    const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=/&flow=signin`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setErrorMessage(error.message || t("errorCredenciales"));
      setLoading(false);
    }

    window.clearTimeout(resetTimer);
  };

  useEffect(() => {
    // If user comes back from OAuth and this page is restored from cache,
    // ensure actions are not left in a blocked loading state.
    setLoading(false);

    const unlockUi = () => setLoading(false);

    window.addEventListener("focus", unlockUi);
    window.addEventListener("pageshow", unlockUi);
    document.addEventListener("visibilitychange", unlockUi);

    return () => {
      window.removeEventListener("focus", unlockUi);
      window.removeEventListener("pageshow", unlockUi);
      document.removeEventListener("visibilitychange", unlockUi);
    };
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        
        if (error) {
          setErrorMessage(t("errorCredenciales"));
          setLoading(false);
          return;
        }

        if (!data.user?.id) {
          setErrorMessage(t("errorCredenciales"));
          setLoading(false);
          return;
        }

        // Esperar un momento para que se establezca la sesión
        await new Promise(resolve => setTimeout(resolve, 500));

        // Consultar perfil en la base de datos usando RPC para obtener tipo_cuenta
        const { data: perfilData, error: perfilError } = await supabase.rpc('get_perfil_usuario_actual');

        if (perfilError || !perfilData || perfilData.length === 0) {
          console.error("Error fetching perfil:", perfilError);
          setErrorMessage(t("errorCredenciales"));
          setLoading(false);
          return;
        }

        const tipo_cuenta = perfilData[0]?.tipo_cuenta || "turista";
        console.log("Tipo de cuenta:", tipo_cuenta);
        console.log("Perfil seleccionado:", profile);

        // Validar que el tipo de cuenta coincida con el perfil seleccionado
        if (profile === "negocio" && tipo_cuenta !== "negocio") {
          setErrorMessage(t("negocioNoRegistrado") || "El negocio no está registrado");
          setLoading(false);
          return;
        }

        if (profile === "turista" && tipo_cuenta !== "turista") {
          setErrorMessage(t("turistaNoRegistrado") || "La cuenta de turista no está registrada");
          setLoading(false);
          return;
        }

        if (tipo_cuenta === "negocio") {
          // Obtener el negocio del usuario usando RPC
          console.log("Buscando negocio para usuario:", data.user.id);
          
          try {
            const { data: negocioData, error: negocioError } = await supabase.rpc('get_negocio_usuario_actual');

            console.log("Resultado de consulta negocios (RPC):", { negocioData, negocioError });

            if (negocioError) {
              console.error("Error fetching negocio:", negocioError);
              setErrorMessage(t("errorNegocio") || "Error al cargar el negocio");
              setLoading(false);
              return;
            }

            if (!negocioData || negocioData.length === 0 || !negocioData[0]?.id) {
              console.error("No se encontró negocio para el usuario");
              setErrorMessage(t("errorNegocio") || "No se encontró el negocio");
              setLoading(false);
              return;
            }

            const negocioId = negocioData[0].id;
            console.log("Redirigiendo a negocio:", negocioId);
            setLoading(false);
            await router.push(`/negocio/${negocioId}`);
            return;
          } catch (err) {
            console.error("Exception fetching negocio:", err);
            setErrorMessage(t("errorNegocio") || "Error al cargar el negocio");
            setLoading(false);
            return;
          }
        } else {
          // Redirigir al perfil de turista
          console.log("Redirigiendo a perfil turista - tipo_cuenta:", tipo_cuenta);
          setLoading(false);
          await router.push("/perfil");
          return;
        }
      }

      // REGISTRO - Usar RPC functions directamente
      if (profile === "turista") {
        // Validar campos
        if (!touristRegister.firstName.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!touristRegister.lastName.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!touristRegister.username.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!touristRegister.email.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!touristRegister.phone.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }

        if (!isGoogleCompletionFlow && (!touristRegister.password || touristRegister.password.length < 8)) {
          setErrorMessage(t("errorMinContrasena"));
          return;
        }

        if (isGoogleCompletionFlow) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user?.id) {
            setErrorMessage(t("googleSessionExpired"));
            return;
          }

          const { error: insertError } = await supabase.rpc("guardar_perfil_turista", {
            p_id: user.id,
            p_nombre: touristRegister.firstName.trim(),
            p_apellido: touristRegister.lastName.trim(),
            p_correo: touristRegister.email.toLowerCase().trim(),
            p_username: touristRegister.username.trim(),
            p_telefono: touristRegister.phone.trim(),
            p_idioma: locale,
          });

          if (insertError) {
            console.error("RPC Error:", insertError);
            setErrorMessage(t("googleProfileSaveError"));
            return;
          }

          router.push("/");
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: touristRegister.email,
          password: touristRegister.password,
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
          return;
        }

        if (!authData.user?.id) {
          setErrorMessage(t("errorCredenciales"));
          return;
        }

        const { error: profileError } = await supabase.rpc("guardar_perfil_turista", {
          p_id: authData.user.id,
          p_nombre: touristRegister.firstName.trim(),
          p_apellido: touristRegister.lastName.trim(),
          p_correo: touristRegister.email.toLowerCase().trim(),
          p_username: touristRegister.username.trim(),
          p_telefono: touristRegister.phone.trim(),
          p_idioma: locale,
        });

        if (profileError) {
          console.error("RPC Error:", profileError);
          setErrorMessage("Error al guardar perfil");
          return;
        }
      } else {
        // NEGOCIO - Validar campos
        if (!businessRegister.ownerFirstName.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.ownerLastName.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.postalCode.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.phone.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.businessName.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.businessType) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.businessAddress.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.authEmail.trim()) {
          setErrorMessage(t("requiredFields"));
          return;
        }
        if (!businessRegister.authPassword || businessRegister.authPassword.length < 8) {
          setErrorMessage(t("errorMinContrasena"));
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: businessRegister.authEmail,
          password: businessRegister.authPassword,
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
          return;
        }

        if (!authData.user?.id) {
          setErrorMessage(t("errorCredenciales"));
          return;
        }

        // Guardar perfil del propietario con RPC
        const { error: profileError } = await supabase.rpc("guardar_perfil_negocio", {
          p_id: authData.user.id,
          p_nombre: businessRegister.ownerFirstName.trim(),
          p_apellido: businessRegister.ownerLastName.trim(),
          p_correo: businessRegister.authEmail.toLowerCase().trim(),
          p_username: businessRegister.businessName.toLowerCase().replace(/\s+/g, "_"),
          p_telefono: businessRegister.phone.trim(),
          p_idioma: locale,
        });

        if (profileError) {
          console.error("Profile RPC Error:", profileError);
          setErrorMessage("Error al guardar perfil");
          return;
        }

        // Crear negocio con RPC
        const { data: negocioData, error: negocioError } = await supabase.rpc("crear_negocio", {
          p_propietario_id: authData.user.id,
          p_nombre: businessRegister.businessName.trim(),
          p_categoria: businessRegister.businessType,
          p_direccion: businessRegister.businessAddress.trim(),
          p_propietario_nombre: businessRegister.ownerFirstName.trim(),
          p_propietario_apellido: businessRegister.ownerLastName.trim(),
          p_propietario_cp: businessRegister.postalCode.trim(),
          p_propietario_telefono: businessRegister.phone.trim(),
          p_propietario_correo: businessRegister.contactEmail.trim() || null,
          p_latitud: 19.4326,
          p_longitud: -99.1677,
          p_caracteristicas: mapFeaturesToDatabase(businessRegister.features),
        });

        if (negocioError) {
          console.error("Negocio RPC Error:", negocioError);
          setErrorMessage("Error al crear negocio");
          return;
        }

        const negocioId = (negocioData as any)?.id;

        if (negocioData?.id) {
          router.push(`/negocio/${negocioData.id}`);
        } else {
          router.push("/perfil");
        }
        return;
      }

      // Para registro de turista
      router.push("/perfil");
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMessage(t("errorCredenciales"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 bg-surface">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_560px] gap-10 xl:gap-16 lg:items-start">
        <section className={`space-y-8 ${profile === "negocio" ? "lg:sticky lg:top-24 self-start" : ""}`}>
          {profile === "turista" ? (
            <>
              <div className="space-y-4">
                <span className="font-label text-primary text-xs tracking-[0.28em] uppercase">{t("heroEyebrow")}</span>
                <h1 className="text-5xl md:text-6xl xl:text-7xl font-headline italic text-primary leading-[0.92]">
                  {t("heroTitle")}
                </h1>
                <p className="text-on-surface-variant text-xl max-w-xl leading-relaxed">{t("heroSubtitle")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <article className="bg-[#f1f5f9] p-7 rounded-[2rem] border border-[#003e6f]/5 shadow-sm">
                  <span className="text-xl" aria-hidden="true">🧭</span>
                  <h3 className="font-headline italic text-4xl leading-none text-[#003e6f] mt-4">{t("featureOneTitle")}</h3>
                  <p className="text-[#003e6f]/60 mt-3 text-lg">{t("featureOneBody")}</p>
                </article>

                <article className="bg-[#003e6f] text-white p-7 rounded-[2rem] shadow-xl shadow-[#003e6f]/10">
                  <span className="text-xl" aria-hidden="true">🛡️</span>
                  <h3 className="font-headline italic text-4xl leading-none mt-4 !text-white">{t("featureTwoTitle")}</h3>
                  <p className="opacity-90 mt-3 text-lg">{t("featureTwoBody")}</p>
                </article>
              </div>
            </>
          ) : (
            <div className="bg-[#f1f5f9] rounded-[2.5rem] border border-[#003e6f]/5 shadow-sm min-h-[620px] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-[#fed000]/10 opacity-45 blur-3xl rounded-full pointer-events-none" />
              <div className="space-y-6 relative z-10">
                <span className="font-label text-[#003e6f] text-xs font-black tracking-[0.28em] uppercase">{t("businessHeroEyebrow")}</span>
                <h1 className="text-5xl md:text-6xl xl:text-7xl font-headline text-[#003e6f] leading-[0.95]">
                  {t("businessHeroTitle")}
                </h1>
                <p className="text-[#003e6f]/60 text-xl max-w-xl leading-relaxed">{t("businessHeroSubtitle")}</p>
              </div>
              <div className="relative z-10 bg-[#fed000] border-l-8 border-[#003e6f] rounded-2xl px-8 py-6 shadow-lg">
                <p className="text-[#003e6f] font-black text-lg leading-tight uppercase tracking-tighter">{t("businessBenefit")}</p>
              </div>
            </div>
          )}
        </section>

        <section className="w-full">
          <div className="bg-white rounded-[2.25rem] border border-outline-variant/10 shadow-xl p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between bg-slate-100 rounded-full p-1.5 border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setProfile("turista");
                  setErrorMessage("");
                }}
                className={`flex-1 rounded-full py-3.5 text-xs font-black uppercase tracking-[0.1em] transition-all ${
                  profile === "turista" ? "bg-white text-[#003e6f] shadow-lg" : "text-[#003e6f]/40"
                }`}
              >
                {t("turista")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfile("negocio");
                  setErrorMessage("");
                }}
                className={`flex-1 rounded-full py-3.5 text-xs font-black uppercase tracking-[0.1em] transition-all ${
                  profile === "negocio" ? "bg-white text-[#003e6f] shadow-lg" : "text-[#003e6f]/40"
                }`}
              >
                {t("negocio")}
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-5xl font-headline italic text-primary leading-none">
                {mode === "login" ? t("iniciarSesion") : t("crearCuenta")}
              </h2>
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.24em] mt-3">
                {profile === "negocio" ? t("businessSubtitle") : t("touristSubtitle")}
              </p>
              {isGoogleCompletionFlow && (
                <div className="mt-4 rounded-2xl border border-[#003e6f]/15 bg-[#003e6f]/5 px-4 py-3 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#003e6f]">{t("googleCompleteTitle")}</p>
                  <p className="mt-1 text-sm text-[#003e6f]/80">{t("googleCompleteBody")}</p>
                </div>
              )}
            </div>

            <form className="space-y-5" onSubmit={handleAuth}>
              {mode === "login" && (
                <>
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="loginEmail">
                      {profile === "negocio" ? t("businessAuthEmail") : t("correo")}
                    </label>
                    <input
                      id="loginEmail"
                      type="email"
                      placeholder={profile === "negocio" ? t("businessAuthEmailPlaceholder") : t("correoPlaceholder")}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="loginPassword">
                        {t("contrasena")}
                      </label>
                      <button type="button" className="font-label text-[10px] font-bold text-primary/80 uppercase tracking-[0.16em]">
                        {t("olvidaste")}
                      </button>
                    </div>
                    <input
                      id="loginPassword"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </>
              )}

              {mode === "register" && profile === "turista" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="touristFirstName">
                        {t("firstName")}
                      </label>
                      <input
                        id="touristFirstName"
                        type="text"
                        value={touristRegister.firstName}
                        onChange={(e) => setTouristRegister((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="touristLastName">
                        {t("lastName")}
                      </label>
                      <input
                        id="touristLastName"
                        type="text"
                        value={touristRegister.lastName}
                        onChange={(e) => setTouristRegister((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="touristUsername">
                      {t("username")}
                    </label>
                    <input
                      id="touristUsername"
                      type="text"
                      value={touristRegister.username}
                      onChange={(e) => setTouristRegister((prev) => ({ ...prev, username: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="touristEmail">
                      {t("correo")}
                    </label>
                    <input
                      id="touristEmail"
                      type="email"
                      value={touristRegister.email}
                      onChange={(e) => setTouristRegister((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="touristPhone">
                      {t("telefono")}
                    </label>
                    <input
                      id="touristPhone"
                      type="tel"
                      value={touristRegister.phone}
                      onChange={(e) => setTouristRegister((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="touristPassword">
                      {t("contrasena")}
                    </label>
                    {isGoogleCompletionFlow ? (
                      <div className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center text-sm text-on-surface-variant">
                        {t("googlePasswordNotRequired")}
                      </div>
                    ) : (
                      <input
                        id="touristPassword"
                        type="password"
                        value={touristRegister.password}
                        onChange={(e) => setTouristRegister((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        minLength={8}
                        required
                      />
                    )}
                  </div>
                </>
              )}

              {mode === "register" && profile === "negocio" && (
                <>
                  <h3 className="font-label text-xs text-primary uppercase tracking-[0.25em]">{t("ownerDataTitle")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="ownerFirstName">
                        {t("ownerFirstName")}
                      </label>
                      <input
                        id="ownerFirstName"
                        type="text"
                        value={businessRegister.ownerFirstName}
                        onChange={(e) => setBusinessRegister((prev) => ({ ...prev, ownerFirstName: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="ownerLastName">
                        {t("ownerLastName")}
                      </label>
                      <input
                        id="ownerLastName"
                        type="text"
                        value={businessRegister.ownerLastName}
                        onChange={(e) => setBusinessRegister((prev) => ({ ...prev, ownerLastName: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessPostalCode">
                        {t("postalCode")}
                      </label>
                      <input
                        id="businessPostalCode"
                        type="text"
                        value={businessRegister.postalCode}
                        onChange={(e) => setBusinessRegister((prev) => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessPhone">
                        {t("telefono")}
                      </label>
                      <input
                        id="businessPhone"
                        type="tel"
                        value={businessRegister.phone}
                        onChange={(e) => setBusinessRegister((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessContactEmail">
                      {t("businessContactEmailOptional")}
                    </label>
                    <input
                      id="businessContactEmail"
                      type="email"
                      value={businessRegister.contactEmail}
                      onChange={(e) => setBusinessRegister((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                    />
                  </div>

                  <h3 className="font-label text-xs text-primary uppercase tracking-[0.25em] pt-2">{t("businessDataTitle")}</h3>
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessName">
                      {t("businessName")}
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      value={businessRegister.businessName}
                      onChange={(e) => setBusinessRegister((prev) => ({ ...prev, businessName: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessType">
                      {t("businessType")}
                    </label>
                    <select
                      id="businessType"
                      value={businessRegister.businessType}
                      onChange={(e) => setBusinessRegister((prev) => ({ ...prev, businessType: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">{t("selectBusinessType")}</option>
                      <option value="restaurant">{t("businessTypeRestaurant")}</option>
                      <option value="shop">{t("businessTypeShop")}</option>
                      <option value="services">{t("businessTypeServices")}</option>
                      <option value="hotel">{t("businessTypeHotel")}</option>
                      <option value="tourism">{t("businessTypeTourism")}</option>
                      <option value="other">{t("businessTypeOther")}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessAddress">
                      {t("businessAddress")}
                    </label>
                    <input
                      id="businessAddress"
                      type="text"
                      value={businessRegister.businessAddress}
                      onChange={(e) => setBusinessRegister((prev) => ({ ...prev, businessAddress: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <h3 className="font-label text-xs text-primary uppercase tracking-[0.25em] pt-2">{t("businessAuthTitle")}</h3>
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessAuthEmail">
                      {t("businessAuthEmail")}
                    </label>
                    <input
                      id="businessAuthEmail"
                      type="email"
                      value={businessRegister.authEmail}
                      onChange={(e) => setBusinessRegister((prev) => ({ ...prev, authEmail: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-primary uppercase tracking-[0.2em]" htmlFor="businessAuthPassword">
                      {t("contrasena")}
                    </label>
                    <input
                      id="businessAuthPassword"
                      type="password"
                      value={businessRegister.authPassword}
                      onChange={(e) => setBusinessRegister((prev) => ({ ...prev, authPassword: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      minLength={8}
                      required
                    />
                  </div>

                  <h3 className="font-label text-xs text-primary uppercase tracking-[0.25em] pt-2">{t("businessFeaturesTitle")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([
                      ["card", t("featureCard")],
                      ["transfer", t("featureTransfer")],
                      ["petFriendly", t("featurePetFriendly")],
                      ["vegan", t("featureVegan")],
                      ["accessible", t("featureAccessible")],
                    ] as Array<[BusinessFeature, string]>).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface rounded-xl px-3 py-2 border border-outline-variant/20">
                        <input
                          type="checkbox"
                          checked={businessRegister.features.includes(value)}
                          onChange={() => toggleFeature(value)}
                          className="accent-primary"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {errorMessage && <p className="text-sm text-error font-medium">{errorMessage}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary text-white text-xl font-bold rounded-full hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? t("iniciando") : mode === "login" ? t("iniciarSesion") : t("crearBtn")}
              </button>
            </form>

            {profile === "turista" && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-outline-variant font-label tracking-[0.2em]">
                      {t("o")} {t("social")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={iniciarSesionConGoogle}
                  disabled={loading}
                  className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-4 hover:bg-slate-100 transition-all shadow-sm"
                >
                  <span className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-inner" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21.805 12.231c0-.819-.066-1.416-.209-2.034H12v3.805h5.64c-.114.946-.731 2.37-2.103 3.327l-.019.127 3.042 2.309.211.021c1.94-1.749 3.034-4.322 3.034-7.555Z" fill="#4285F4"/>
                      <path d="M12 21.923c2.762 0 5.084-.895 6.778-2.436l-3.234-2.457c-.866.595-2.03 1.011-3.544 1.011-2.705 0-4.998-1.749-5.817-4.166l-.122.01-3.163 2.398-.042.114c1.684 3.286 5.151 5.526 9.144 5.526Z" fill="#34A853"/>
                      <path d="M6.183 13.875A5.858 5.858 0 0 1 5.842 12c0-.652.124-1.28.333-1.874l-.006-.125-3.203-2.436-.105.049A9.786 9.786 0 0 0 1.8 12c0 1.558.38 3.032 1.061 4.386l3.322-2.511Z" fill="#FBBC05"/>
                      <path d="M12 5.959c1.903 0 3.186.809 3.915 1.487l2.857-2.735C17.075 3.153 14.762 2.077 12 2.077c-3.993 0-7.46 2.24-9.144 5.526L6.165 10c.837-2.417 3.13-4.041 5.835-4.041Z" fill="#EA4335"/>
                    </svg>
                  </span>
                  <span className="font-black text-xs uppercase tracking-widest text-[#003e6f]">{t("google")}</span>
                </button>
              </>
            )}

            <div className="mt-10 text-center text-[11px] font-black uppercase tracking-widest text-[#003e6f]/60">
              {mode === "login" ? t("sinCuenta") : t("yaTienesCuenta")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode((prev) => (prev === "login" ? "register" : "login"));
                  setErrorMessage("");
                }}
                className="text-[#003e6f] underline underline-offset-8 decoration-[#fed000] decoration-4 hover:decoration-[#003e6f] transition-all"
              >
                {mode === "login" ? t("registrate") : t("iniciaSesion")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
