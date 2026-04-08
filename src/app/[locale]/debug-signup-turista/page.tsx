"use client";

import { useState } from "react";

interface DebugResponse {
  success?: boolean;
  error?: string;
  message?: string;
  data?: any;
  code?: string;
  details?: any;
}

export default function DebugSignupPage() {
  const [formData, setFormData] = useState({
    nombre: "Juan",
    apellido: "García",
    username: "juangarcia",
    email: "juan@example.com",
    telefono: "+1234567890",
    password: "Test123456",
    confirmPassword: "Test123456",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DebugResponse | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setResponse({ error: "Las contraseñas no coinciden" });
      return;
    }

    setLoading(true);
    setTimestamp(new Date().toLocaleTimeString());

    try {
      console.log("📤 Enviando datos:", formData);

      const res = await fetch("/api/auth/signup-turista", {
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
          locale: "es-MX",
        }),
      });

      const data = await res.json();
      console.log("📥 Respuesta del servidor:", data);
      setResponse(data);
    } catch (err) {
      console.error("❌ Error en la solicitud:", err);
      setResponse({
        error: "Error al conectar con el servidor",
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-primary">🐛 Debug - Signup Turista</h1>

        <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-6 text-primary">Formulario de Prueba</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:brightness-105 disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </div>
        </div>

        {response && (
          <div
            className={`p-8 rounded-lg ${
              response.success
                ? "bg-green-100 border border-green-400"
                : "bg-red-100 border border-red-400"
            }`}
          >
            <h2 className="text-xl font-bold mb-4">
              {response.success ? "✅ Éxito" : "❌ Error"} ({timestamp})
            </h2>

            {response.message && (
              <p className="mb-4 text-sm">{response.message}</p>
            )}

            {response.error && (
              <p className="mb-4 font-semibold text-sm text-red-700">
                {response.error}
              </p>
            )}

            {response.code && (
              <p className="mb-4 text-sm">
                <strong>Código:</strong> {response.code}
              </p>
            )}

            <details className="cursor-pointer">
              <summary className="font-semibold text-sm">
                Ver respuesta completa
              </summary>
              <pre className="mt-4 bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-100 border border-blue-400 rounded-lg text-sm">
          <p className="font-semibold mb-2">💡 Instrucciones:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Verifica la consola del navegador (F12) para ver logs</li>
            <li>Verifica la terminal del servidor para ver logs de backend</li>
            <li>Después de registrarte, ve a Supabase para verificar datos</li>
            <li>Si hay error, copia la respuesta completa</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
