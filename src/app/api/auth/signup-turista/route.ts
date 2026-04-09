import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      apellido,
      username,
      email,
      telefono,
      password,
      locale = "es-MX",
    } = body;

    console.log("📋 Datos recibidos:", {
      nombre,
      apellido,
      username,
      email,
      telefono,
    });

    // Validar datos
    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }
    if (!apellido?.trim()) {
      return NextResponse.json(
        { error: "El apellido es requerido" },
        { status: 400 }
      );
    }
    if (!username?.trim()) {
      return NextResponse.json(
        { error: "El nombre de usuario es requerido" },
        { status: 400 }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "El correo es requerido" },
        { status: 400 }
      );
    }
    if (!telefono?.trim()) {
      return NextResponse.json(
        { error: "El teléfono es requerido" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Crear cliente Supabase con credenciales admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Faltan variables de entorno Supabase");
      return NextResponse.json(
        {
          error: "Error de configuración del servidor",
          details: "Missing Supabase credentials",
        },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🔐 Cliente Supabase creado (SERVICE_ROLE)");
    console.log("URL:", supabaseUrl);
    console.log("Service Key presente:", !!supabaseServiceKey);

    // Paso 1: Crear usuario en auth
    console.log("📝 Creando usuario en auth...");
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        tipo_cuenta: "turista",
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        username: username.toLowerCase().trim(),
        telefono: telefono.trim(),
        idioma: locale,
      },
    });

    if (signUpError) {
      console.error("❌ Error en auth.admin.createUser:", signUpError);
      return NextResponse.json(
        { error: `Error de autenticación: ${signUpError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      console.error("❌ No se generó ID de usuario");
      return NextResponse.json(
        { error: "No se generó ID de usuario" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log("✅ Usuario creado en auth:", userId);

    // Paso 2: Guardar perfil usando RPC con SECURITY DEFINER
    console.log("🔄 Guardando perfil con RPC...");
    
    const { error: rpcError } = await supabase.rpc('guardar_perfil_turista', {
      p_id: userId,
      p_nombre: nombre.trim(),
      p_apellido: apellido.trim(),
      p_correo: email.toLowerCase().trim(),
      p_username: username.toLowerCase().trim(),
      p_telefono: telefono.trim(),
      p_idioma: locale,
    });

    if (rpcError) {
      console.error("❌ Error RPC:", rpcError);
      console.error("Error completo:", JSON.stringify(rpcError, null, 2));
      
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (delErr) {
        console.error("Error cleanup:", delErr);
      }
      
      return NextResponse.json(
        { error: `Error al guardar perfil: ${rpcError.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Perfil guardado exitosamente");
    
    // Obtener el perfil creado
    const { data: profileData } = await supabase
      .from("perfiles")
      .select("id")
      .eq("id", userId)
      .single();

    return NextResponse.json(
      {
        success: true,
        message: "Cuenta creada exitosamente",
        data: {
          id: userId,
          tipo_cuenta: "turista",
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          correo: email.toLowerCase().trim(),
          username: username.toLowerCase().trim(),
          telefono: telefono.trim(),
          idioma: locale,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error en signup API:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
