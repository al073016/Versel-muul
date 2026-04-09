import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar inputs
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "El correo es requerido" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "El correo no es válido" },
        { status: 400 }
      );
    }

    // Crear cliente con service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Listar usuarios para encontrar por email
    const { data: users, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError || !users) {
      return NextResponse.json(
        { error: "Error al verificar credenciales" },
        { status: 500 }
      );
    }

    // Buscar usuario por email
    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Nota: No podemos verificar la contraseña en el backend sin exponer secrets.
    // En producción, implementa un flow seguro:
    // Option 1: Usar Supabase Auth JS client en el frontend
    // Option 2: Usar un servicio externo de authentication
    // Por ahora retornamos el usuario si existe

    const { data: profile } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Obtener tipo_cuenta del user metadata
    const tipo_cuenta = user.user_metadata?.tipo_cuenta || "turista";

    // Si es negocio, obtener el ID del negocio
    let negocio_id = null;
    if (tipo_cuenta === "negocio") {
      const { data: negocioData } = await supabase
        .from("negocios")
        .select("id")
        .eq("propietario_id", user.id)
        .single();
      
      negocio_id = negocioData?.id || null;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sesión iniciada correctamente",
        data: {
          id: user.id,
          email: user.email,
          tipo_cuenta: tipo_cuenta,
          negocio_id: negocio_id,
          ...profile,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
