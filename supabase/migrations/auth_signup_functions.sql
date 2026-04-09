-- =============================================
-- Funciones RPC para Autenticación y Registro
-- SECURITY DEFINER para omitir restricciones RLS
-- =============================================

-- Función para guardar perfil de turista
CREATE OR REPLACE FUNCTION guardar_perfil_turista(
  p_id UUID,
  p_nombre TEXT,
  p_apellido TEXT,
  p_correo TEXT,
  p_username TEXT,
  p_telefono TEXT,
  p_idioma TEXT DEFAULT 'es-MX'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Intentar insertar el perfil
  INSERT INTO perfiles (
    id,
    tipo_cuenta,
    nombre,
    apellido,
    username,
    correo,
    telefono,
    idioma,
    created_at
  ) VALUES (
    p_id,
    'turista',
    p_nombre,
    p_apellido,
    p_username,
    p_correo,
    p_telefono,
    p_idioma,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nombre = p_nombre,
    apellido = p_apellido,
    username = p_username,
    correo = p_correo,
    telefono = p_telefono,
    idioma = p_idioma,
    updated_at = NOW()
  RETURNING json_build_object(
    'id', id,
    'tipo_cuenta', tipo_cuenta,
    'nombre', nombre,
    'apellido', apellido,
    'username', username,
    'correo', correo,
    'telefono', telefono,
    'idioma', idioma
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al guardar perfil turista: %', SQLERR_MESSAGE;
END;
$$;

-- Función para guardar perfil de negocio
CREATE OR REPLACE FUNCTION guardar_perfil_negocio(
  p_id UUID,
  p_nombre TEXT,
  p_apellido TEXT,
  p_correo TEXT,
  p_username TEXT,
  p_telefono TEXT,
  p_idioma TEXT DEFAULT 'es-MX'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Intentar insertar el perfil
  INSERT INTO perfiles (
    id,
    tipo_cuenta,
    nombre,
    apellido,
    username,
    correo,
    telefono,
    idioma,
    created_at
  ) VALUES (
    p_id,
    'negocio',
    p_nombre,
    p_apellido,
    p_username,
    p_correo,
    p_telefono,
    p_idioma,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nombre = p_nombre,
    apellido = p_apellido,
    username = p_username,
    correo = p_correo,
    telefono = p_telefono,
    idioma = p_idioma,
    updated_at = NOW()
  RETURNING json_build_object(
    'id', id,
    'tipo_cuenta', tipo_cuenta,
    'nombre', nombre,
    'apellido', apellido,
    'username', username,
    'correo', correo,
    'telefono', telefono,
    'idioma', idioma
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al guardar perfil negocio: %', SQLERR_MESSAGE;
END;
$$;

-- Función para crear negocio completo
CREATE OR REPLACE FUNCTION crear_negocio(
  p_propietario_id UUID,
  p_nombre TEXT,
  p_categoria TEXT,
  p_direccion TEXT,
  p_propietario_nombre TEXT,
  p_propietario_apellido TEXT,
  p_propietario_cp TEXT,
  p_propietario_telefono TEXT,
  p_propietario_correo TEXT DEFAULT NULL,
  p_latitud DOUBLE PRECISION DEFAULT 19.4326,
  p_longitud DOUBLE PRECISION DEFAULT -99.1677,
  p_caracteristicas TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_negocio_id UUID;
  v_categoria categoria_negocio;
  v_slug TEXT;
  v_caracteristica TEXT;
  v_result JSON;
BEGIN
  -- Validar que el propietario existe
  IF NOT EXISTS (SELECT 1 FROM perfiles WHERE id = p_propietario_id) THEN
    RAISE EXCEPTION 'El propietario no existe';
  END IF;

  -- Convertir categoria a enum
  BEGIN
    v_categoria := p_categoria::categoria_negocio;
  EXCEPTION WHEN OTHERS THEN
    v_categoria := 'comercio_tiendas'::categoria_negocio;
  END;

  -- Generar slug único
  v_slug := lower(regexp_replace(p_nombre, '[^a-z0-9]+', '_', 'g'))
    || '_'
    || substring(gen_random_uuid()::text, 1, 8);

  -- Insertar negocio
  INSERT INTO negocios (
    propietario_id,
    nombre,
    slug,
    categoria,
    propietario_nombre,
    propietario_apellido,
    propietario_cp,
    propietario_telefono,
    propietario_correo,
    direccion,
    latitud,
    longitud,
    ubicacion,
    created_at
  ) VALUES (
    p_propietario_id,
    p_nombre,
    v_slug,
    v_categoria,
    p_propietario_nombre,
    p_propietario_apellido,
    p_propietario_cp,
    p_propietario_telefono,
    p_propietario_correo,
    p_direccion,
    p_latitud,
    p_longitud,
    ST_Point(p_longitud, p_latitud),
    NOW()
  )
  RETURNING id INTO v_negocio_id;

  -- Insertar características si existen
  IF p_caracteristicas IS NOT NULL AND array_length(p_caracteristicas, 1) > 0 THEN
    FOREACH v_caracteristica IN ARRAY p_caracteristicas
    LOOP
      BEGIN
        INSERT INTO negocio_caracteristicas (
          negocio_id,
          caracteristica
        ) VALUES (
          v_negocio_id,
          v_caracteristica::caracteristica_negocio
        )
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- Ignorar errores en características
        NULL;
      END;
    END LOOP;
  END IF;

  -- Retornar resultado con el ID
  v_result := json_build_object(
    'id', v_negocio_id,
    'nombre', p_nombre,
    'propietario_id', p_propietario_id,
    'categoria', v_categoria::TEXT,
    'slug', v_slug,
    'direccion', p_direccion,
    'latitud', p_latitud,
    'longitud', p_longitud
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al crear negocio: %', SQLERR_MESSAGE;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION guardar_perfil_turista(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION guardar_perfil_negocio(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION crear_negocio(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT[]) TO authenticated, anon;
