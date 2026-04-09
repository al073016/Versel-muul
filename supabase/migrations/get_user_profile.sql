CREATE OR REPLACE FUNCTION public.get_perfil_usuario_actual()
RETURNS SETOF perfiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM perfiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;
