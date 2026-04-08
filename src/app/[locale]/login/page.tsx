"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

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

  const getRegisterAuth = () => {
    if (profile === "turista") {
      return { email: touristRegister.email, password: touristRegister.password };
    }
    return { email: businessRegister.authEmail, password: businessRegister.authPassword };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) {
          setErrorMessage(t("errorCredenciales"));
          return;
        }
        router.push("/perfil");
        return;
      }

      const { email, password } = getRegisterAuth();
      if (!email || !password) {
        setErrorMessage(t("requiredFields"));
        return;
      }

      if (password.length < 8) {
        setErrorMessage(t("errorMinContrasena"));
        return;
      }

      const profileMetadata =
        profile === "turista"
          ? {
              first_name: touristRegister.firstName,
              last_name: touristRegister.lastName,
              username: touristRegister.username,
              phone: touristRegister.phone,
              tipo_usuario: "turista",
            }
          : {
              owner_first_name: businessRegister.ownerFirstName,
              owner_last_name: businessRegister.ownerLastName,
              postal_code: businessRegister.postalCode,
              phone: businessRegister.phone,
              contact_email: businessRegister.contactEmail || null,
              business_name: businessRegister.businessName,
              business_type: businessRegister.businessType,
              business_address: businessRegister.businessAddress,
              business_features: businessRegister.features,
              tipo_usuario: "negocio",
            };

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo:
              profile === "turista"
                ? `${touristRegister.firstName} ${touristRegister.lastName}`.trim()
                : `${businessRegister.ownerFirstName} ${businessRegister.ownerLastName}`.trim(),
            ...profileMetadata,
          },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/auth/callback?next=/perfil`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push("/perfil");
    } catch {
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
                <article className="bg-[#e9edf7] p-7 rounded-3xl border border-outline-variant/10 shadow-sm">
                  <span className="text-xl" aria-hidden="true">🧭</span>
                  <h3 className="font-headline italic text-4xl leading-none text-primary mt-4">{t("featureOneTitle")}</h3>
                  <p className="text-on-surface-variant mt-3 text-lg">{t("featureOneBody")}</p>
                </article>

                <article className="bg-primary text-white p-7 rounded-3xl shadow-xl shadow-primary/20">
                  <span className="text-xl" aria-hidden="true">🛡️</span>
                  <h3 className="font-headline italic text-4xl leading-none mt-4 !text-white">{t("featureTwoTitle")}</h3>
                  <p className="opacity-90 mt-3 text-lg">{t("featureTwoBody")}</p>
                </article>
              </div>
            </>
          ) : (
            <div className="bg-[#e9edf7] rounded-[2rem] border border-outline-variant/10 shadow-sm min-h-[620px] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-[#f8f1cf] opacity-45 blur-3xl rounded-full pointer-events-none" />
              <div className="space-y-6 relative z-10">
                <span className="font-label text-primary text-xs tracking-[0.28em] uppercase">{t("businessHeroEyebrow")}</span>
                <h1 className="text-5xl md:text-6xl xl:text-7xl font-headline text-primary leading-[0.95]">
                  {t("businessHeroTitle")}
                </h1>
                <p className="text-on-surface-variant text-xl max-w-xl leading-relaxed">{t("businessHeroSubtitle")}</p>
              </div>
              <div className="relative z-10 bg-[#f4efde] border-l-4 border-[#f5c11f] rounded-xl px-5 py-4">
                <p className="text-[#7b6421] font-semibold text-base">{t("businessBenefit")}</p>
              </div>
            </div>
          )}
        </section>

        <section className="w-full">
          <div className="bg-white rounded-[2.25rem] border border-outline-variant/10 shadow-xl p-8 md:p-10">
            <div className="mb-7 flex items-center justify-between bg-[#eef2fb] rounded-full p-1.5">
              <button
                type="button"
                onClick={() => {
                  setProfile("turista");
                  setErrorMessage("");
                }}
                className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all ${
                  profile === "turista" ? "bg-white text-primary shadow-sm" : "text-primary/60"
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
                className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all ${
                  profile === "negocio" ? "bg-white text-primary shadow-sm" : "text-primary/60"
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
                    <input
                      id="touristPassword"
                      type="password"
                      value={touristRegister.password}
                      onChange={(e) => setTouristRegister((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full h-14 px-4 bg-surface border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-secondary/40 focus:border-transparent outline-none"
                      minLength={8}
                      required
                    />
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

            {profile === "turista" && mode === "login" && (
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
                  className="w-full h-14 bg-[#eef2fb] rounded-full border border-outline-variant/15 flex items-center justify-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-white border border-outline-variant/20 flex items-center justify-center" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21.805 12.231c0-.819-.066-1.416-.209-2.034H12v3.805h5.64c-.114.946-.731 2.37-2.103 3.327l-.019.127 3.042 2.309.211.021c1.94-1.749 3.034-4.322 3.034-7.555Z" fill="#4285F4"/>
                      <path d="M12 21.923c2.762 0 5.084-.895 6.778-2.436l-3.234-2.457c-.866.595-2.03 1.011-3.544 1.011-2.705 0-4.998-1.749-5.817-4.166l-.122.01-3.163 2.398-.042.114c1.684 3.286 5.151 5.526 9.144 5.526Z" fill="#34A853"/>
                      <path d="M6.183 13.875A5.858 5.858 0 0 1 5.842 12c0-.652.124-1.28.333-1.874l-.006-.125-3.203-2.436-.105.049A9.786 9.786 0 0 0 1.8 12c0 1.558.38 3.032 1.061 4.386l3.322-2.511Z" fill="#FBBC05"/>
                      <path d="M12 5.959c1.903 0 3.186.809 3.915 1.487l2.857-2.735C17.075 3.153 14.762 2.077 12 2.077c-3.993 0-7.46 2.24-9.144 5.526L6.165 10c.837-2.417 3.13-4.041 5.835-4.041Z" fill="#EA4335"/>
                    </svg>
                  </span>
                  <span className="font-bold text-base text-primary">{t("google")}</span>
                </button>
                <p className="text-center text-xs text-on-surface-variant mt-3">{t("googleSoon")}</p>
              </>
            )}

            <div className="mt-8 text-center text-sm text-on-surface-variant">
              {mode === "login" ? t("sinCuenta") : t("yaTienesCuenta")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode((prev) => (prev === "login" ? "register" : "login"));
                  setErrorMessage("");
                }}
                className="text-primary font-bold underline underline-offset-4 decoration-secondary"
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
