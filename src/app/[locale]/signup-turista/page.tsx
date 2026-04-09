"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

export default function SignupTuristaPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    username: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) return t("errors.nombreRequired");
    if (!formData.apellido.trim()) return t("errors.apellidoRequired");
    if (!formData.username.trim()) return t("errors.usernameRequired");
    if (!formData.email.trim()) return t("errors.emailRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t("errors.emailInvalid");
    if (!formData.telefono.trim()) return t("errors.telefonoRequired");
    if (formData.password.length < 6) return t("errors.passwordLength");
    if (formData.password !== formData.confirmPassword) return t("errors.passwordMismatch");
    if (!formData.terms) return t("errors.termsRequired");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the API endpoint
      const response = await fetch("/api/auth/signup-turista", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          username: formData.username,
          email: formData.email,
          telefono: formData.telefono,
          password: formData.password,
          locale: locale === "es" ? "es-MX" : locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        setError(data.error || t("errors.signupFailed"));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({
        nombre: "",
        apellido: "",
        username: "",
        email: "",
        telefono: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/perfil");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(t("errors.signupAccountFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/auth/callback?next=/perfil`,
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.googleConnectionFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center pt-20 px-6 md:px-0 bg-surface">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Editorial Content */}
        <div className="hidden lg:flex lg:col-span-6 flex-col space-y-8 pr-12">
          <div className="space-y-4">
            <span className="font-label text-primary text-sm font-bold tracking-tighter uppercase">
              {t("tagline")}
            </span>
            <h1 className="text-5xl md:text-6xl font-headline italic text-primary leading-tight">
              {t("welcomeTitle")}
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed font-body">
              {t("welcomeDescription")}
            </p>
          </div>

          {/* Bento Highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-xl space-y-2 border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary">explore</span>
              <h3 className="font-headline italic text-xl text-primary">{t("benefitRoutesTitle")}</h3>
              <p className="text-sm text-on-surface-variant font-body">{t("benefitRoutesDescription")}</p>
            </div>
            <div className="bg-primary text-white p-6 rounded-xl space-y-2">
              <span className="material-symbols-outlined">verified_user</span>
              <h3 className="font-headline italic text-xl">{t("benefitSafeTitle")}</h3>
              <p className="text-sm opacity-80 font-body">{t("benefitSafeDescription")}</p>
            </div>
          </div>
        </div>

        {/* Right: Signup Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-surface-container-lowest p-10 md:p-12 rounded-[2rem] shadow-sm border border-outline-variant/10">
            {/* Mobile Branding */}
            <div className="lg:hidden mb-8 flex justify-center">
              <span className="text-3xl font-black tracking-tight text-primary font-headline italic">MUUL</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-headline italic text-primary mb-2">{t("createAccount")}</h2>
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
                {t("registerTouristAccount")}
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-tertiary-container/20 border border-tertiary-container rounded-xl text-tertiary-container font-body text-sm">
                {t("successMessage")}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error rounded-xl text-error font-body text-sm">
                ✗ {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="nombre">
                  NOMBRE
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface placeholder:text-outline-variant disabled:opacity-50"
                  required
                />
              </div>

              {/* Apellido */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="apellido">
                  {t("fields.apellido")}
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  placeholder="García"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface placeholder:text-outline-variant disabled:opacity-50"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="username">
                  {t("fields.username")}
                </label>
                <div className="flex items-center h-12 px-4 bg-surface-container-low rounded-xl border-none focus-within:ring-2 focus-within:ring-secondary-container transition-all">
                  <span className="text-outline-variant font-label text-sm">@</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="tuusuario"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                    className="flex-1 h-full bg-transparent border-none focus:outline-none focus:ring-0 pl-2 text-on-surface placeholder:text-outline-variant disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="email">
                  {t("fields.email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface placeholder:text-outline-variant disabled:opacity-50"
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="telefono">
                  {t("fields.telefono")}
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface placeholder:text-outline-variant disabled:opacity-50"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="password">
                  {t("fields.password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface disabled:opacity-50"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-primary px-1" htmlFor="confirmPassword">
                  {t("fields.confirmPassword")}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary-container transition-all text-on-surface disabled:opacity-50"
                  required
                />
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2 px-1 pt-2">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 mt-0.5 accent-primary rounded cursor-pointer disabled:opacity-50"
                />
                <label className="font-body text-xs text-on-surface-variant leading-relaxed cursor-pointer" htmlFor="terms">
                  {t("terms.acceptPrefix")} {" "}
                  <a href="#" className="text-primary font-bold hover:underline">
                    {t("terms.termsLink")}
                  </a>{" "}
                  {t("terms.andPrefix")} {" "}
                  <a href="#" className="text-primary font-bold hover:underline">
                    {t("terms.privacyLink")}
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full h-12 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-full shadow-lg shadow-primary/10 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
              >
                <span className="font-body">{loading ? t("actions.registering") : t("actions.register")}</span>
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-container-lowest px-4 text-outline-variant font-label">
                  {t("orSignUpWith")}
                </span>
              </div>
            </div>

            {/* Social Signups */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                type="button"
                className="flex items-center justify-center space-x-2 h-12 bg-surface-container-low rounded-full border border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-95 disabled:opacity-50"
              >
                <span className="text-2xl">🔤</span>
                <span className="font-body font-bold text-sm">{t("providers.google")}</span>
              </button>
              <button
                disabled={loading}
                type="button"
                className="flex items-center justify-center space-x-2 h-12 bg-surface-container-low rounded-full border border-outline-variant/10 hover:bg-surface-container transition-colors active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-2xl">ios</span>
                <span className="font-body font-bold text-sm">{t("providers.apple")}</span>
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-on-surface-variant font-body">
                {t("loginPrompt")} {" "}
                <Link
                  href="/login"
                  className="text-primary font-bold hover:text-secondary transition-colors underline decoration-secondary-container decoration-2 underline-offset-4"
                >
                  {t("loginLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
