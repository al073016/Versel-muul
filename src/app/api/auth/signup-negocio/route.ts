import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombrePropietario,
      apellidoPropietario,
      cp,
      telefonoPropietario,
      correoPropietario,
      nombreNegocio,
      categoriaNegocio,
      latitud,
      longitud,
      direccion,
      email,
      password,
      caracteristicas = [],
      locale = "es-MX",
    } = body;

    console.log("📋 Datos recibidos para negocio");

    // Validar datos
    if (!nombrePropietario?.trim()) {
      return NextResponse.json(
        { error: "El nombre del propietario es requerido" },
        { status: 400 }
      );
    }
    if (!apellidoPropietario?.trim()) {
      return NextResponse.json(
        { error: "El apellido del propietario es requerido" },
        { status: 400 }
      );
    }
    if (!cp?.trim()) {
      return NextResponse.json(
        { error: "El CP es requerido" },
        { status: 400 }
      );
    }
    if (!telefonoPropietario?.trim()) {
      return NextResponse.json(
        { error: "El teléfono es requerido" },
        { status: 400 }
      );
    }
    if (!nombreNegocio?.trim()) {
      return NextResponse.json(
        { error: "El nombre del negocio es requerido" },
        { status: 400 }
      );
    }
    if (!direccion?.trim()) {
      return NextResponse.json(
        { error: "La dirección es requerida" },
        { status: 400 }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "El correo es requerido" },
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

    // Paso 1: Crear usuario en auth
    console.log("📝 Creando usuario en auth (tipo: negocio)...");
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        tipo_cuenta: "negocio",
        nombre: nombrePropietario,
        apellido: apellidoPropietario,
        username: nombreNegocio.toLowerCase().replace(/\s+/g, "_"),
        telefono: telefonoPropietario,
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

    // Paso 2: Guardar perfil del propietario usando RPC con SECURITY DEFINER
    console.log("🔄 Guardando perfil del propietario con RPC...");
    
    const { error: rpcError } = await supabase.rpc('guardar_perfil_negocio', {
      p_id: userId,
      p_nombre: nombrePropietario.trim(),
      p_apellido: apellidoPropietario.trim(),
      p_correo: email.toLowerCase().trim(),
      p_username: nombreNegocio.toLowerCase().replace(/\s+/g, "_"),
      p_telefono: telefonoPropietario.trim(),
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

    console.log("✅ Perfil del propietario guardado exitosamente");

    // Paso 3: Crear negocio usando RPC con SECURITY DEFINER
    console.log("🏪 Creando negocio con RPC...");
    
    const { data: negocioResult, error: negocioError } = await supabase.rpc('crear_negocio', {
      p_propietario_id: userId,
      p_nombre: nombreNegocio.trim(),
      p_categoria: categoriaNegocio,
      p_direccion: direccion.trim(),
      p_propietario_nombre: nombrePropietario.trim(),
      p_propietario_apellido: apellidoPropietario.trim(),
      p_propietario_cp: cp.trim(),
      p_propietario_telefono: telefonoPropietario.trim(),
      p_propietario_correo: correoPropietario || null,
      p_latitud: parseFloat(latitud) || 19.4326,
      p_longitud: parseFloat(longitud) || -99.1677,
      p_caracteristicas: Object.keys(caracteristicas).filter(
        (key) => caracteristicas[key as keyof typeof caracteristicas] === true
      ),
    });

    if (negocioError) {
      console.error("❌ Error al crear negocio:", negocioError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Error al crear negocio: ${negocioError.message}` },
        { status: 400 }
      );
    }

    const negocioId = negocioResult?.id;
    console.log("✅ Negocio creado:", negocioId);

    return NextResponse.json(
      {
        success: true,
        message: "Negocio registrado exitosamente",
        data: {
          user_id: userId,
          negocio_id: negocioId,
          tipo_cuenta: "negocio",
          nombre_negocio: nombreNegocio.trim(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error en signup API:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al registrar el negocio" },
      { status: 500 }
    );
  }
}
