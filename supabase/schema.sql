-- =============================================
-- MUUL Plataforma v1 (Destructivo)
-- =============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;

DROP FUNCTION IF EXISTS touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS sync_nombre_completo() CASCADE;
DROP FUNCTION IF EXISTS handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS negocios_en_radio(double precision, double precision, double precision) CASCADE;
DROP FUNCTION IF EXISTS pois_en_radio(double precision, double precision, double precision) CASCADE;
DROP FUNCTION IF EXISTS sorprendeme(double precision, double precision, categoria_poi, integer) CASCADE;
DROP FUNCTION IF EXISTS buscar_usuarios(text) CASCADE;
DROP FUNCTION IF EXISTS buscar_negocios(text) CASCADE;
DROP FUNCTION IF EXISTS buscar_pois(text) CASCADE;

DROP TABLE IF EXISTS rutas_participantes CASCADE;
DROP TABLE IF EXISTS rutas_guardadas CASCADE;
DROP TABLE IF EXISTS usuario_insignias CASCADE;
DROP TABLE IF EXISTS insignias CASCADE;
DROP TABLE IF EXISTS visitas CASCADE;
DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS negocio_caracteristicas CASCADE;
DROP TABLE IF EXISTS seguimientos_negocios CASCADE;
DROP TABLE IF EXISTS pois CASCADE;
DROP TABLE IF EXISTS negocios CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;

DROP TYPE IF EXISTS tipo_cuenta CASCADE;
DROP TYPE IF EXISTS categoria_negocio CASCADE;
DROP TYPE IF EXISTS categoria_poi CASCADE;
DROP TYPE IF EXISTS precio_rango CASCADE;
DROP TYPE IF EXISTS categoria_insignia CASCADE;
DROP TYPE IF EXISTS nivel_insignia CASCADE;
DROP TYPE IF EXISTS modo_transporte CASCADE;
DROP TYPE IF EXISTS caracteristica_negocio CASCADE;
DROP TYPE IF EXISTS tipo_catalogo_item CASCADE;

CREATE TYPE tipo_cuenta AS ENUM ('turista', 'negocio');

CREATE TYPE categoria_negocio AS ENUM (
  'alimentos',
  'servicios_personales',
  'comercio_tiendas',
  'artesanias',
  'turismo_alojamiento'
);

CREATE TYPE categoria_poi AS ENUM (
  'comida',
  'cultural',
  'tienda',
  'deportes',
  'servicio',
  'artesanias',
  'alojamiento'
);

CREATE TYPE precio_rango AS ENUM ('$', '$$', '$$$', '$$$$');
CREATE TYPE categoria_insignia AS ENUM ('cultural', 'comida', 'tiendas', 'especial');
CREATE TYPE nivel_insignia AS ENUM ('bronce', 'plata', 'oro', 'platino');
CREATE TYPE modo_transporte AS ENUM ('caminando', 'vehiculo', 'bicicleta');

CREATE TYPE caracteristica_negocio AS ENUM (
  'pago_tarjeta',
  'transferencias',
  'pet_friendly',
  'vegana',
  'accesibilidad'
);

CREATE TYPE tipo_catalogo_item AS ENUM ('producto', 'servicio');

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_nombre_completo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.nombre_completo = trim(coalesce(NEW.nombre, '') || ' ' || coalesce(NEW.apellido, ''));
  RETURN NEW;
END;
$$;

CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_cuenta tipo_cuenta NOT NULL DEFAULT 'turista',
  nombre TEXT NOT NULL DEFAULT '',
  apellido TEXT NOT NULL DEFAULT '',
  nombre_completo TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  correo TEXT UNIQUE,
  telefono TEXT,
  foto_url TEXT,
  banner_url TEXT,
  idioma TEXT NOT NULL DEFAULT 'es-MX',
  ciudad TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_perfiles_nombre_completo
BEFORE INSERT OR UPDATE ON perfiles
FOR EACH ROW EXECUTE FUNCTION sync_nombre_completo();

CREATE TRIGGER tr_perfiles_updated_at
BEFORE UPDATE ON perfiles
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX idx_perfiles_username ON perfiles (username);
CREATE INDEX idx_perfiles_tipo ON perfiles (tipo_cuenta);
CREATE INDEX idx_perfiles_nombre ON perfiles (nombre);
CREATE INDEX idx_perfiles_apellido ON perfiles (apellido);

CREATE TABLE negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE,
  descripcion TEXT,
  categoria categoria_negocio NOT NULL DEFAULT 'comercio_tiendas',
  propietario_nombre TEXT NOT NULL DEFAULT '',
  propietario_apellido TEXT NOT NULL DEFAULT '',
  propietario_cp TEXT,
  propietario_telefono TEXT NOT NULL,
  propietario_correo TEXT,
  direccion TEXT,
  ubicacion GEOGRAPHY(Point, 4326) NOT NULL,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  facebook_url TEXT,
  instagram_url TEXT,
  horario_apertura TEXT,
  horario_cierre TEXT,
  foto_url TEXT,
  banner_url TEXT,
  verificado BOOLEAN NOT NULL DEFAULT FALSE,
  verificado_en TIMESTAMPTZ,
  verificado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  destacado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_negocios_updated_at
BEFORE UPDATE ON negocios
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX idx_negocios_ubicacion ON negocios USING GIST (ubicacion);
CREATE INDEX idx_negocios_categoria ON negocios (categoria);
CREATE INDEX idx_negocios_verificado ON negocios (verificado);
CREATE INDEX idx_negocios_activo ON negocios (activo);
CREATE INDEX idx_negocios_propietario ON negocios (propietario_id);

CREATE TABLE negocio_caracteristicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  caracteristica caracteristica_negocio NOT NULL,
  UNIQUE (negocio_id, caracteristica)
);

CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  tipo tipo_catalogo_item NOT NULL DEFAULT 'producto',
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  imagen_url TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_productos_updated_at
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria categoria_poi NOT NULL,
  ubicacion GEOGRAPHY(Point, 4326) NOT NULL,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  direccion TEXT,
  horario_apertura TEXT,
  horario_cierre TEXT,
  precio_rango precio_rango,
  emoji TEXT,
  foto_url TEXT,
  verificado BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_pois_updated_at
BEFORE UPDATE ON pois
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX idx_pois_ubicacion ON pois USING GIST (ubicacion);
CREATE INDEX idx_pois_categoria ON pois (categoria);
CREATE INDEX idx_pois_negocio ON pois (negocio_id);

CREATE TABLE seguimientos_negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, negocio_id)
);

CREATE TABLE resenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
  calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  texto TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((negocio_id IS NOT NULL AND poi_id IS NULL) OR (negocio_id IS NULL AND poi_id IS NOT NULL))
);

CREATE TRIGGER tr_resenas_updated_at
BEFORE UPDATE ON resenas
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  poi_id UUID NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
  verificada BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, poi_id)
);

CREATE TABLE insignias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria categoria_insignia NOT NULL,
  nivel nivel_insignia NOT NULL,
  visitas_requeridas INTEGER NOT NULL DEFAULT 1,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_insignias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  insignia_id UUID NOT NULL REFERENCES insignias(id) ON DELETE CASCADE,
  desbloqueada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, insignia_id)
);

CREATE TABLE rutas_guardadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  pois_ids UUID[] NOT NULL DEFAULT '{}',
  pois_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  modo_transporte modo_transporte NOT NULL DEFAULT 'caminando',
  distancia_texto TEXT,
  duracion_texto TEXT,
  radio_km NUMERIC(4,2) NOT NULL DEFAULT 5.00,
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  es_favorita BOOLEAN NOT NULL DEFAULT FALSE,
  es_publica BOOLEAN NOT NULL DEFAULT FALSE,
  share_code TEXT UNIQUE,
  imagen_compartir_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_rutas_guardadas_updated_at
BEFORE UPDATE ON rutas_guardadas
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE rutas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES rutas_guardadas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  unido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ruta_id, usuario_id)
);

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nombre TEXT;
  v_apellido TEXT;
  v_tipo tipo_cuenta;
BEGIN
  v_nombre := COALESCE(
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'full_name',
    split_part(COALESCE(NEW.email,''), '@', 1),
    'Usuario'
  );

  v_apellido := COALESCE(NEW.raw_user_meta_data->>'apellido', '');
  v_tipo := CASE
    WHEN COALESCE(NEW.raw_user_meta_data->>'tipo_cuenta', 'turista') = 'negocio' THEN 'negocio'::tipo_cuenta
    ELSE 'turista'::tipo_cuenta
  END;

  INSERT INTO public.perfiles (id, tipo_cuenta, nombre, apellido, correo, username, idioma)
  VALUES (NEW.id, v_tipo, v_nombre, v_apellido, NEW.email, NULL, 'es-MX')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

CREATE OR REPLACE FUNCTION negocios_en_radio(lat DOUBLE PRECISION, lng DOUBLE PRECISION, radio_km DOUBLE PRECISION DEFAULT 5.0)
RETURNS SETOF negocios
LANGUAGE sql
STABLE
AS $$
  SELECT n.*
  FROM negocios n
  WHERE n.activo = TRUE
    AND ST_DWithin(n.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radio_km * 1000)
  ORDER BY ST_Distance(n.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography);
$$;

CREATE OR REPLACE FUNCTION pois_en_radio(lat DOUBLE PRECISION, lng DOUBLE PRECISION, radio_km DOUBLE PRECISION DEFAULT 5.0)
RETURNS SETOF pois
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM pois p
  WHERE p.activo = TRUE
    AND ST_DWithin(p.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radio_km * 1000)
  ORDER BY ST_Distance(p.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography);
$$;

CREATE OR REPLACE FUNCTION sorprendeme(lat DOUBLE PRECISION, lng DOUBLE PRECISION, filtro_categoria categoria_poi DEFAULT NULL, cantidad INTEGER DEFAULT 5)
RETURNS SETOF pois
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM pois p
  WHERE p.activo = TRUE
    AND ST_DWithin(p.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, 5000)
    AND (filtro_categoria IS NULL OR p.categoria = filtro_categoria)
  ORDER BY RANDOM()
  LIMIT cantidad;
$$;

CREATE OR REPLACE FUNCTION buscar_usuarios(query TEXT)
RETURNS TABLE (id UUID, nombre_completo TEXT, username TEXT, foto_url TEXT, tipo_cuenta tipo_cuenta, ciudad TEXT)
LANGUAGE sql
STABLE
AS $$
  SELECT p.id, p.nombre_completo, p.username, p.foto_url, p.tipo_cuenta, p.ciudad
  FROM perfiles p
  WHERE unaccent(lower(p.nombre_completo)) LIKE '%' || unaccent(lower(query)) || '%'
     OR lower(coalesce(p.username,'')) LIKE '%' || lower(query) || '%'
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION buscar_negocios(query TEXT)
RETURNS SETOF negocios
LANGUAGE sql
STABLE
AS $$
  SELECT n.*
  FROM negocios n
  WHERE n.activo = TRUE
    AND (
      unaccent(lower(n.nombre)) LIKE '%' || unaccent(lower(query)) || '%'
      OR unaccent(lower(coalesce(n.descripcion, ''))) LIKE '%' || unaccent(lower(query)) || '%'
    )
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION buscar_pois(query TEXT)
RETURNS SETOF pois
LANGUAGE sql
STABLE
AS $$
  SELECT p.*
  FROM pois p
  WHERE p.activo = TRUE
    AND (
      unaccent(lower(p.nombre)) LIKE '%' || unaccent(lower(query)) || '%'
      OR unaccent(lower(coalesce(p.descripcion, ''))) LIKE '%' || unaccent(lower(query)) || '%'
    )
  LIMIT 20;
$$;

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocio_caracteristicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_guardadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimientos_negocios ENABLE ROW LEVEL SECURITY;

CREATE POLICY perfiles_select_own ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY perfiles_insert_own ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY perfiles_update_own ON perfiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY negocios_select_public ON negocios FOR SELECT USING (activo = TRUE);
CREATE POLICY negocios_insert_owner ON negocios FOR INSERT WITH CHECK (auth.uid() = propietario_id);
CREATE POLICY negocios_update_owner ON negocios FOR UPDATE USING (auth.uid() = propietario_id) WITH CHECK (auth.uid() = propietario_id);

CREATE POLICY negocio_caract_select_public ON negocio_caracteristicas FOR SELECT USING (TRUE);
CREATE POLICY negocio_caract_owner_write ON negocio_caracteristicas
FOR ALL
USING (EXISTS (SELECT 1 FROM negocios n WHERE n.id = negocio_caracteristicas.negocio_id AND n.propietario_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM negocios n WHERE n.id = negocio_caracteristicas.negocio_id AND n.propietario_id = auth.uid()));

CREATE POLICY productos_select_public ON productos FOR SELECT USING (activo = TRUE);
CREATE POLICY productos_owner_write ON productos
FOR ALL
USING (EXISTS (SELECT 1 FROM negocios n WHERE n.id = productos.negocio_id AND n.propietario_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM negocios n WHERE n.id = productos.negocio_id AND n.propietario_id = auth.uid()));

CREATE POLICY pois_select_public ON pois FOR SELECT USING (activo = TRUE);

CREATE POLICY resenas_select_public ON resenas FOR SELECT USING (TRUE);
CREATE POLICY resenas_insert_own ON resenas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY resenas_update_own ON resenas FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY visitas_own ON visitas FOR ALL USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY insignias_select_public ON insignias FOR SELECT USING (TRUE);
CREATE POLICY usuario_insignias_own_select ON usuario_insignias FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY usuario_insignias_own_insert ON usuario_insignias FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY rutas_select_own_or_public ON rutas_guardadas FOR SELECT USING (auth.uid() = usuario_id OR es_publica = TRUE);
CREATE POLICY rutas_insert_own ON rutas_guardadas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY rutas_update_own ON rutas_guardadas FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY rutas_delete_own ON rutas_guardadas FOR DELETE USING (auth.uid() = usuario_id);

CREATE POLICY rutas_participantes_select ON rutas_participantes
FOR SELECT
USING (auth.uid() = usuario_id OR EXISTS (SELECT 1 FROM rutas_guardadas r WHERE r.id = rutas_participantes.ruta_id AND r.es_publica = TRUE));
CREATE POLICY rutas_participantes_insert ON rutas_participantes FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY rutas_participantes_delete ON rutas_participantes FOR DELETE USING (auth.uid() = usuario_id);

CREATE POLICY seguimientos_select_own ON seguimientos_negocios FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY seguimientos_insert_own ON seguimientos_negocios FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY seguimientos_delete_own ON seguimientos_negocios FOR DELETE USING (auth.uid() = usuario_id);

COMMIT;
