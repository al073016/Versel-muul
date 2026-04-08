-- DESHABILITAR RLS EN LA TABLA PERFILES
ALTER TABLE "public"."perfiles" DISABLE ROW LEVEL SECURITY;

-- Verificar que está deshabilitado (query correcta)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'perfiles';
-- Debe mostrar: rowsecurity = false

