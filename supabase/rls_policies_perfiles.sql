-- Políticas de Row Level Security para tabla perfiles
-- Esto permite que los usuarios se auto-registren

-- 1. Permitir que cualquiera (sin autenticar) INSERT su propio perfil
CREATE POLICY "allow_selfinsert_profiles" ON "public"."perfiles"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Permitir que autenticados vean todos los perfiles (data pública)
CREATE POLICY "allow_read_all_profiles" ON "public"."perfiles"
  AS PERMISSIVE
  FOR SELECT
  USING (true);

-- 3. Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "allow_selfupdate_profiles" ON "public"."perfiles"
  AS PERMISSIVE
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Permitir que los usuarios eliminen su propio perfil
CREATE POLICY "allow_selfdelete_profiles" ON "public"."perfiles"
  AS PERMISSIVE
  FOR DELETE
  USING (auth.uid() = id);

-- Verificar que RLS está habilitado
ALTER TABLE "public"."perfiles" ENABLE ROW LEVEL SECURITY;

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'perfiles';
