import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const validLocales = ["es", "en", "zh", "pt"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const flow = searchParams.get("flow") ?? "signup";

  // Leer locale desde cookie de next-intl
  const cookieHeader = request.headers.get("cookie") ?? "";
  const localeCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("NEXT_LOCALE="));
  const locale = localeCookie?.split("=")?.[1] ?? "es";
  const safeLocale = validLocales.includes(locale) ? locale : "es";

  const getNameParts = (fullName: string) => {
    const normalized = fullName.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return { nombre: "", apellido: "" };
    }

    const parts = normalized.split(" ");
    if (parts.length === 1) {
      return { nombre: parts[0], apellido: "" };
    }

    return {
      nombre: parts[0],
      apellido: parts.slice(1).join(" "),
    };
  };

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: userResult } = await supabase.auth.getUser();
      const user = userResult.user;

      if (user) {
        const { data: existingProfile } = await supabase
          .from("perfiles")
          .select("id,nombre,apellido,nombre_completo,username,telefono,idioma")
          .eq("id", user.id)
          .maybeSingle();

        const metadata = user.user_metadata ?? {};
        const email = user.email ?? "";
        const fullName =
          metadata.full_name ||
          metadata.name ||
          `${metadata.given_name ?? ""} ${metadata.family_name ?? ""}`.trim();
        const { nombre, apellido } = getNameParts(fullName);

        const emailPrefix = (email.split("@")[0] || "usuario").toLowerCase();
        const suggestedUsername =
          metadata.preferred_username ||
          metadata.user_name ||
          `${emailPrefix}_${user.id.slice(0, 6)}`;

        const telefono =
          user.phone || metadata.phone || metadata.phone_number || metadata.mobile || "";

        // Obtener tipo_cuenta del metadata (por defecto turista)
        const tipo_cuenta = metadata.tipo_cuenta || "turista";

        if (flow === "signin") {
          if (!existingProfile) {
            await supabase.rpc("guardar_perfil_turista", {
              p_id: user.id,
              p_nombre: nombre || emailPrefix || "Usuario",
              p_apellido: apellido || "",
              p_correo: email.toLowerCase(),
              p_username: suggestedUsername,
              p_telefono: telefono,
              p_idioma: safeLocale,
            });
          }

          // Redirigir basándose en tipo_cuenta desde la base de datos
          const { data: perfilData } = await supabase
            .from("perfiles")
            .select("tipo_cuenta")
            .eq("id", user.id)
            .single();

          const dbTipoCuenta = perfilData?.tipo_cuenta || tipo_cuenta;

          if (dbTipoCuenta === "negocio") {
            // Obtener ID del negocio
            const { data: negocioData } = await supabase
              .from("negocios")
              .select("id")
              .eq("propietario_id", user.id)
              .single();

            if (negocioData?.id) {
              return NextResponse.redirect(`${origin}/${safeLocale}/negocio/${negocioData.id}`);
            }
          }

          // Default: redireccionar al siguiente parámetro o al perfil de turista
          const defaultPath = next === "/" ? "/perfil" : next;
          return NextResponse.redirect(`${origin}/${safeLocale}${defaultPath}`);
        }

        if (existingProfile) {
          // Consultar tipo_cuenta de la base de datos
          const { data: perfilData } = await supabase
            .from("perfiles")
            .select("tipo_cuenta")
            .eq("id", user.id)
            .single();

          const dbTipoCuenta = perfilData?.tipo_cuenta || tipo_cuenta;

          if (dbTipoCuenta === "negocio") {
            const { data: negocioData } = await supabase
              .from("negocios")
              .select("id")
              .eq("propietario_id", user.id)
              .single();

            if (negocioData?.id) {
              return NextResponse.redirect(`${origin}/${safeLocale}/negocio/${negocioData.id}`);
            }
          }

          const defaultPath = next === "/" ? "/perfil" : next;
          return NextResponse.redirect(`${origin}/${safeLocale}${defaultPath}`);
        }

        const missingRequiredData = !nombre || !apellido || !suggestedUsername || !telefono;

        if (missingRequiredData) {
          const completionParams = new URLSearchParams({
            oauth: "google",
            complete: "1",
            firstName: nombre,
            lastName: apellido,
            username: suggestedUsername,
            email: email.toLowerCase(),
            phone: telefono,
          });

          return NextResponse.redirect(
            `${origin}/${safeLocale}/login?${completionParams.toString()}`
          );
        }

        await supabase.rpc("guardar_perfil_turista", {
          p_id: user.id,
          p_nombre: nombre,
          p_apellido: apellido,
          p_correo: email.toLowerCase(),
          p_username: suggestedUsername,
          p_telefono: telefono,
          p_idioma: safeLocale,
        });

        // Consultar tipo_cuenta de la base de datos
        const { data: perfilFinalData } = await supabase
          .from("perfiles")
          .select("tipo_cuenta")
          .eq("id", user.id)
          .single();

        const finalTipoCuenta = perfilFinalData?.tipo_cuenta || tipo_cuenta;

        // Redirigir basándose en tipo_cuenta de la base de datos
        if (finalTipoCuenta === "negocio") {
          const { data: negocioData } = await supabase
            .from("negocios")
            .select("id")
            .eq("propietario_id", user.id)
            .single();

          if (negocioData?.id) {
            return NextResponse.redirect(`${origin}/${safeLocale}/negocio/${negocioData.id}`);
          }
        }

        const defaultPath = next === "/" ? "/perfil" : next;
        return NextResponse.redirect(`${origin}/${safeLocale}${defaultPath}`);
      }

      return NextResponse.redirect(`${origin}/${safeLocale}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/${safeLocale}/login`);
}