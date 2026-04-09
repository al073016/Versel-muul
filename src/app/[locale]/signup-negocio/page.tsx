"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

export default function SignupNegocioPage() {
  const router = useRouter();
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Propietario
    nombrePropietario: "",
    apellidoPropietario: "",
    cp: "",
    telefonoPropietario: "",
    correoPropietario: "",
    
    // Negocio
    nombreNegocio: "",
    categoriaNegocio: "comercio_tiendas",
    latitud: 19.4326, // CDMX default
    longitud: -99.1677,
    direccion: "",
    
    // Autenticación
    email: "",
    password: "",
    confirmPassword: "",
    
    // Características
    caracteristicas: {
      pago_tarjeta: false,
      transferencias: false,
      pet_friendly: false,
      vegana: false,
      accesibilidad: false,
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        caracteristicas: {
          ...prev.caracteristicas,
          [name]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(null);
  };

  const validateStep1 = (): string | null => {
    if (!formData.nombrePropietario.trim()) return "El nombre del propietario es requerido";
    if (!formData.apellidoPropietario.trim()) return "El apellido del propietario es requerido";
    if (!formData.cp.trim()) return "El CP es requerido";
    if (!formData.telefonoPropietario.trim()) return "El teléfono es requerido";
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!formData.nombreNegocio.trim()) return "El nombre del negocio es requerido";
    if (!formData.direccion.trim()) return "La dirección es requerida";
    if (!formData.email.trim()) return "El correo es requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "El correo no es válido";
    if (formData.password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    if (formData.password !== formData.confirmPassword) return "Las contraseñas no coinciden";
    return null;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const validationError = validateStep1();
      if (validationError) {
        setError(validationError);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const validationError = validateStep2();
      if (validationError) {
        setError(validationError);
        return;
      }
      setCurrentStep(3);
    }
    setError(null);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup-negocio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Propietario
          nombrePropietario: formData.nombrePropietario,
          apellidoPropietario: formData.apellidoPropietario,
          cp: formData.cp,
          telefonoPropietario: formData.telefonoPropietario,
          correoPropietario: formData.correoPropietario || null,

          // Negocio
          nombreNegocio: formData.nombreNegocio,
          categoriaNegocio: formData.categoriaNegocio,
          latitud: formData.latitud,
          longitud: formData.longitud,
          direccion: formData.direccion,

          // Auth
          email: formData.email,
          password: formData.password,
          
          // Características
          caracteristicas: Object.keys(formData.caracteristicas).filter(
            (key) => formData.caracteristicas[key as keyof typeof formData.caracteristicas]
          ),

          locale: locale === "es" ? "es-MX" : locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        setError(data.error || `Error al registrar: ${JSON.stringify(data)}`);
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirigir al perfil del negocio con su ID
      setTimeout(() => {
        if (data.data?.negocio_id) {
          router.push(`/negocio/${data.data.negocio_id}`);
        } else if (data.data?.user_id) {
          // Fallback: si no viene negocio_id, usar user_id
          router.push(`/negocio/${data.data.user_id}`);
        } else {
          // Si no hay IDs, ir a home
          router.push("/");
        }
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Ocurrió un error al registrar el negocio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003e6f] to-[#0d5fa0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registra tu Negocio</h1>
          <p className="text-gray-600">Paso {currentStep} de 3</p>
          
          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-[#003e6f]" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">✅ Negocio registrado exitosamente</p>
            <p className="text-green-600 text-sm">Redirigiendo a tu perfil...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 3) {
            handleSubmit(e);
          } else {
            handleNextStep();
          }
        }}>
          {/* PASO 1: Datos del Propietario */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Datos del Propietario</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del propietario
                </label>
                <input
                  type="text"
                  name="nombrePropietario"
                  value={formData.nombrePropietario}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido del propietario
                </label>
                <input
                  type="text"
                  name="apellidoPropietario"
                  value={formData.apellidoPropietario}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código postal (CP)
                </label>
                <input
                  type="text"
                  name="cp"
                  value={formData.cp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="28001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefonoPropietario"
                  value={formData.telefonoPropietario}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="+34 912 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico (Opcional)
                </label>
                <input
                  type="email"
                  name="correoPropietario"
                  value={formData.correoPropietario}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="juan@example.com"
                />
              </div>
            </div>
          )}

          {/* PASO 2: Datos del Negocio */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Datos del Negocio</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  name="nombreNegocio"
                  value={formData.nombreNegocio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="Mi tienda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de negocio
                </label>
                <select
                  name="categoriaNegocio"
                  value={formData.categoriaNegocio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                >
                  <option value="alimentos">Alimentos</option>
                  <option value="servicios_personales">Servicios personales</option>
                  <option value="comercio_tiendas">Comercio o tiendas</option>
                  <option value="artesanias">Artesanías</option>
                  <option value="turismo_alojamiento">Turismo o alojamiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="Calle Ejemplo 123"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  📍 Coordenadas: {formData.latitud.toFixed(4)}, {formData.longitud.toFixed(4)}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Puedes ajustar ubicación manually. Mapa interactivo víendose próximamente.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Datos de autenticación
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="negocio@example.com"
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="Contraseña (mín. 6 caracteres)"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  placeholder="Confirma contraseña"
                />
              </div>
            </div>
          )}

          {/* PASO 3: Características del Negocio */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Características del Negocio</h2>

              <div className="space-y-3">
                {[
                  { id: "pago_tarjeta", label: "Pago con tarjeta" },
                  { id: "transferencias", label: "Transferencias" },
                  { id: "pet_friendly", label: "Pet friendly" },
                  { id: "vegana", label: "Vegana" },
                  { id: "accesibilidad", label: "Accesibilidad" },
                ].map((char) => (
                  <label key={char.id} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name={char.id}
                      checked={formData.caracteristicas[char.id as keyof typeof formData.caracteristicas]}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#003e6f] rounded cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700 font-medium">{char.label}</span>
                  </label>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <p className="text-sm text-gray-600">
                  Las características ayudan a los clientes a encontrar negocios con los servicios que necesitan.
                </p>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                ← Atrás
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#003e6f] text-white font-semibold rounded-lg hover:bg-[#002e52] transition disabled:opacity-50"
            >
              {loading ? "Cargando..." : currentStep === 3 ? "✓ Registrar Negocio" : "Siguiente →"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#003e6f] font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
