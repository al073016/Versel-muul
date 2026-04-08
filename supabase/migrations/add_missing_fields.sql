-- Migración: Agregar campos faltantes a perfiles y negocios
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campos a tabla 'perfiles'
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Agregar campos a tabla 'negocios'
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS caracteristicas JSONB DEFAULT '{"pago_tarjeta": false, "transferencias": false, "pet_friendly": false, "vegana": false, "accesibilidad": false}';
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS seguidores INTEGER DEFAULT 0;

-- 3. Crear tabla 'insignias' si no existe
CREATE TABLE IF NOT EXISTS insignias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  nivel TEXT NOT NULL,
  visitas_requeridas INTEGER NOT NULL,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Crear tabla 'usuario_insignias' si no existe
CREATE TABLE IF NOT EXISTS usuario_insignias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  insignia_id UUID REFERENCES insignias(id) ON DELETE CASCADE,
  desbloqueada_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, insignia_id)
);

-- 5. Crear tabla 'rutas_guardadas' si no existe
CREATE TABLE IF NOT EXISTS rutas_guardadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  pois_ids TEXT[] NOT NULL,
  pois_data JSONB,
  distancia_texto TEXT,
  duracion_texto TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Crear tabla 'reseñas' si no existe
CREATE TABLE IF NOT EXISTS resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  texto TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Crear tabla 'visitas' si no existe
CREATE TABLE IF NOT EXISTS visitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
  verificada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_insignias ON usuario_insignias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rutas_usuario ON rutas_guardadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resenas_usuario ON resenas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resenas_poi ON resenas(poi_id);
CREATE INDEX IF NOT EXISTS idx_visitas_usuario ON visitas(usuario_id);

COMMIT;
