-- Function to get a business by its ID or slug
CREATE OR REPLACE FUNCTION get_negocio_by_id_or_slug(p_id_or_slug TEXT)
RETURNS SETOF negocios AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM negocios
  WHERE
    (id::text = p_id_or_slug OR slugify(nombre) = p_id_or_slug OR slugify(nombre || '-' || id::text) = p_id_or_slug)
    AND activo = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get active products for a given business
CREATE OR REPLACE FUNCTION get_productos_by_negocio_id(p_negocio_id UUID)
RETURNS SETOF productos AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM productos
  WHERE
    negocio_id = p_negocio_id
    AND activo = true
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to add a new product
CREATE OR REPLACE FUNCTION add_new_producto(
  p_negocio_id UUID,
  p_nombre TEXT,
  p_descripcion TEXT,
  p_precio NUMERIC
)
RETURNS SETOF productos AS $$
DECLARE
  new_producto productos;
BEGIN
  INSERT INTO productos (negocio_id, nombre, descripcion, precio, activo)
  VALUES (p_negocio_id, p_nombre, p_descripcion, p_precio, true)
  RETURNING * INTO new_producto;
  
  RETURN QUERY SELECT * FROM productos WHERE id = new_producto.id;
END;
$$ LANGUAGE plpgsql;


-- Function to deactivate a product
CREATE OR REPLACE FUNCTION deactivate_producto(p_producto_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE productos
  SET activo = false
  WHERE id = p_producto_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function for slugifying strings, if you don't have it
CREATE OR REPLACE FUNCTION slugify(value TEXT)
RETURNS TEXT AS $$
  -- Your slugify implementation here
  -- For example:
  SELECT lower(regexp_replace(trim(value), '[^a-zA-Z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;
