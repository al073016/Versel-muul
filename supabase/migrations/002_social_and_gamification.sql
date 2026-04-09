-- ============================================================
-- MUUL: Migración 002 — Social, Amistades y Gamificación
-- ============================================================
-- Instrucciones:
--   1. Ir a Supabase Dashboard → SQL Editor
--   2. Pegar este archivo completo y ejecutar
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────
-- 1. COLUMNAS DE GAMIFICACIÓN EN PERFILES
-- ─────────────────────────────────────────
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS puntos       INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel        TEXT        NOT NULL DEFAULT 'Explorador Novato',
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS seguidores   INTEGER     NOT NULL DEFAULT 0;

-- Índice para el ranking de comunidad
CREATE INDEX IF NOT EXISTS idx_perfiles_puntos ON perfiles (puntos DESC);

-- ─────────────────────────────────────────
-- 2. PUBLICACIONES (FEED SOCIAL)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publicaciones (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  contenido      TEXT        NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 2000),
  imagen_urls    TEXT[]      NOT NULL DEFAULT '{}',
  likes_count    INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_publicaciones_updated_at
  BEFORE UPDATE ON publicaciones
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_publicaciones_usuario  ON publicaciones (usuario_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_created  ON publicaciones (created_at DESC);

-- ─────────────────────────────────────────
-- 3. LIKES DE PUBLICACIONES (tabla puente)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publicacion_likes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID        NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id     UUID        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (publicacion_id, usuario_id)   -- un like por persona
);

CREATE INDEX IF NOT EXISTS idx_pub_likes_pub ON publicacion_likes (publicacion_id);

-- ─────────────────────────────────────────
-- 4. AMISTADES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amistades (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitante  UUID        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  id_receptor     UUID        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  estado          TEXT        NOT NULL DEFAULT 'aceptada' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_solicitante, id_receptor)
);

CREATE INDEX IF NOT EXISTS idx_amistades_solicitante ON amistades (id_solicitante);
CREATE INDEX IF NOT EXISTS idx_amistades_receptor    ON amistades (id_receptor);

-- ─────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────

-- Publicaciones
ALTER TABLE publicaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicacion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE amistades         ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer posts públicos
CREATE POLICY pub_select_all ON publicaciones
  FOR SELECT USING (true);

-- Solo el autor puede insertar sus propios posts
CREATE POLICY pub_insert_own ON publicaciones
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Solo el autor puede borrar sus posts
CREATE POLICY pub_delete_own ON publicaciones
  FOR DELETE USING (auth.uid() = usuario_id);

-- Likes: cualquiera puede ver, el autenticado puede dar/quitar su like
CREATE POLICY likes_select ON publicacion_likes
  FOR SELECT USING (true);

CREATE POLICY likes_insert ON publicacion_likes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY likes_delete ON publicacion_likes
  FOR DELETE USING (auth.uid() = usuario_id);

-- Amistades
CREATE POLICY amis_select ON amistades
  FOR SELECT USING (auth.uid() = id_solicitante OR auth.uid() = id_receptor);

CREATE POLICY amis_insert ON amistades
  FOR INSERT WITH CHECK (auth.uid() = id_solicitante);

CREATE POLICY amis_delete ON amistades
  FOR DELETE USING (auth.uid() = id_solicitante);

-- ─────────────────────────────────────────
-- 6. FUNCIONES RPC AUXILIARES
-- ─────────────────────────────────────────

-- Feed: trae posts con datos de autor y si el usuario autenticado ya dio like
CREATE OR REPLACE FUNCTION get_feed_publicaciones(p_limit INTEGER DEFAULT 30)
RETURNS TABLE (
  id             UUID,
  usuario_id     UUID,
  contenido      TEXT,
  imagen_urls    TEXT[],
  likes_count    INTEGER,
  created_at     TIMESTAMPTZ,
  autor_nombre   TEXT,
  autor_username TEXT,
  autor_avatar   TEXT,
  autor_nivel    TEXT,
  autor_puntos   INTEGER,
  yo_di_like     BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.usuario_id,
    p.contenido,
    p.imagen_urls,
    p.likes_count,
    p.created_at,
    perf.nombre_completo  AS autor_nombre,
    perf.username         AS autor_username,
    perf.foto_url         AS autor_avatar,
    perf.nivel            AS autor_nivel,
    perf.puntos           AS autor_puntos,
    EXISTS (
      SELECT 1 FROM publicacion_likes pl
      WHERE pl.publicacion_id = p.id AND pl.usuario_id = auth.uid()
    ) AS yo_di_like
  FROM publicaciones p
  JOIN perfiles perf ON perf.id = p.usuario_id
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

-- Ranking: top usuarios por puntos
CREATE OR REPLACE FUNCTION get_ranking(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id             UUID,
  nombre_completo TEXT,
  username       TEXT,
  foto_url       TEXT,
  puntos         INTEGER,
  nivel          TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, nombre_completo, username, foto_url, puntos, nivel
  FROM perfiles
  ORDER BY puntos DESC
  LIMIT p_limit;
$$;

-- Mis amigos: devuelve la lista de amigos del usuario autenticado con info de perfil
CREATE OR REPLACE FUNCTION get_mis_amigos()
RETURNS TABLE (
  amistad_id     UUID,
  amigo_id       UUID,
  nombre_completo TEXT,
  username       TEXT,
  foto_url       TEXT,
  nivel          TEXT,
  created_at     TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    a.id AS amistad_id,
    CASE WHEN a.id_solicitante = auth.uid() THEN a.id_receptor ELSE a.id_solicitante END AS amigo_id,
    p.nombre_completo,
    p.username,
    p.foto_url,
    p.nivel,
    a.created_at
  FROM amistades a
  JOIN perfiles p ON p.id = CASE WHEN a.id_solicitante = auth.uid() THEN a.id_receptor ELSE a.id_solicitante END
  WHERE (a.id_solicitante = auth.uid() OR a.id_receptor = auth.uid())
    AND a.estado = 'aceptada'
  ORDER BY a.created_at DESC;
$$;

-- Toggle like: da o quita like y actualiza contador en publicaciones
CREATE OR REPLACE FUNCTION toggle_like(p_publicacion_id UUID)
RETURNS BOOLEAN  -- TRUE = se dio like, FALSE = se quitó
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM publicacion_likes
    WHERE publicacion_id = p_publicacion_id AND usuario_id = auth.uid()
  ) INTO v_existe;

  IF v_existe THEN
    DELETE FROM publicacion_likes
    WHERE publicacion_id = p_publicacion_id AND usuario_id = auth.uid();
    UPDATE publicaciones SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = p_publicacion_id;
    RETURN FALSE;
  ELSE
    INSERT INTO publicacion_likes (publicacion_id, usuario_id)
    VALUES (p_publicacion_id, auth.uid());
    UPDATE publicaciones SET likes_count = likes_count + 1
    WHERE id = p_publicacion_id;
    -- Bonus puntos al autor del post (+2 pts por like recibido)
    UPDATE perfiles SET puntos = puntos + 2
    WHERE id = (SELECT usuario_id FROM publicaciones WHERE id = p_publicacion_id);
    RETURN TRUE;
  END IF;
END;
$$;

-- ─────────────────────────────────────────
-- 7. TRIGGERS DE GAMIFICACIÓN (Puntos automáticos)
-- ─────────────────────────────────────────

-- +5 puntos cuando el usuario publica algo
CREATE OR REPLACE FUNCTION award_points_on_post()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE perfiles SET puntos = puntos + 5 WHERE id = NEW.usuario_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_award_points_post ON publicaciones;
CREATE TRIGGER tr_award_points_post
  AFTER INSERT ON publicaciones
  FOR EACH ROW EXECUTE FUNCTION award_points_on_post();

-- +10 puntos cuando el usuario guarda una ruta
CREATE OR REPLACE FUNCTION award_points_on_ruta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE perfiles SET puntos = puntos + 10 WHERE id = NEW.usuario_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_award_points_ruta ON rutas_guardadas;
CREATE TRIGGER tr_award_points_ruta
  AFTER INSERT ON rutas_guardadas
  FOR EACH ROW EXECUTE FUNCTION award_points_on_ruta();

-- Auto-actualiza el nivel según los puntos acumulados
CREATE OR REPLACE FUNCTION sync_nivel()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.nivel := CASE
    WHEN NEW.puntos >= 10000 THEN 'Leyenda Local'
    WHEN NEW.puntos >= 5000  THEN 'Guía Maestro'
    WHEN NEW.puntos >= 2500  THEN 'Aventurero Veterano'
    WHEN NEW.puntos >= 1000  THEN 'Explorador Senior'
    WHEN NEW.puntos >= 500   THEN 'Turista Curioso'
    WHEN NEW.puntos >= 100   THEN 'Nómada Novato'
    ELSE 'Explorador Novato'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_nivel ON perfiles;
CREATE TRIGGER tr_sync_nivel
  BEFORE UPDATE OF puntos ON perfiles
  FOR EACH ROW EXECUTE FUNCTION sync_nivel();

COMMIT;
