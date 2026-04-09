-- Function to get the business for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_negocio_usuario_actual()
RETURNS SETOF negocios
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM negocios
  WHERE propietario_id = auth.uid()
  AND activo = true
  LIMIT 1;
$$;
