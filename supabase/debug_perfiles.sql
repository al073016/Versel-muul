-- Verificar estructura de tabla perfiles
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'perfiles' 
  AND table_schema = 'public'
ORDER BY 
  ordinal_position;

-- Verificar políticas de RLS
SELECT * FROM pg_policies WHERE tablename = 'perfiles';

-- Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM 
  information_schema.triggers
WHERE 
  event_object_table = 'perfiles'
  AND trigger_schema = 'public';
