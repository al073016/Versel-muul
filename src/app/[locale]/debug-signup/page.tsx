"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function SignupDebugPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);

          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from("perfiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            // PGRST116 = no rows found
            throw profileError;
          }

          setProfile(profileData);
        }
      } catch (err) {
        console.error("Debug error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <main className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug - Verificar Registro</h1>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded text-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {user ? (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border">
              <h2 className="text-xl font-bold mb-4">Usuario de Auth</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            {profile ? (
              <div className="p-6 bg-white rounded-lg border">
                <h2 className="text-xl font-bold mb-4">Perfil de Turista</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-6 bg-warning/10 border border-warning rounded">
                <strong>⚠️ No hay perfil encontrado para este usuario</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-info/10 border border-info rounded">
            <strong>ℹ️ No hay usuario autenticado. Inicia sesión primero.</strong>
          </div>
        )}
      </div>
    </main>
  );
}
