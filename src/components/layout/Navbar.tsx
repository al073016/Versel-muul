"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavbarTurista from "./NavbarTurista";
import NavbarNegocio from "./NavbarNegocio";

type ProfileType = "turista" | "negocio" | null;

export default function Navbar() {
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const detectProfileType = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setProfileType("turista");
          setIsLoading(false);
          return;
        }

        // Get user profile using RPC (same as login.tsx does)
        const { data: perfilData, error: perfilError } = await supabase.rpc("get_perfil_usuario_actual");

        if (perfilError || !perfilData || perfilData.length === 0) {
          console.error("Error fetching perfil:", perfilError);
          setProfileType("turista");
          setIsLoading(false);
          return;
        }

        const tipo_cuenta = perfilData[0]?.tipo_cuenta || "turista";

        if (tipo_cuenta === "negocio") {
          setProfileType("negocio");
        } else {
          setProfileType("turista");
        }
      } catch (error) {
        console.error("Error detecting profile type:", error);
        setProfileType("turista");
      } finally {
        setIsLoading(false);
      }
    };

    detectProfileType();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      detectProfileType();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 h-[80px]" />
    );
  }

  return profileType === "negocio" ? <NavbarNegocio /> : <NavbarTurista />;
}
