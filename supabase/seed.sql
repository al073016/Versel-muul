BEGIN;

INSERT INTO insignias (nombre, descripcion, categoria, nivel, visitas_requeridas, emoji)
VALUES
  ('Explorador Inicial', 'Visita 3 POIs', 'especial', 'bronce', 3, '🧭'),
  ('Sabores MX', 'Visita 5 lugares de comida', 'comida', 'plata', 5, '🌮'),
  ('Ruta Cultural', 'Visita 5 POIs culturales', 'cultural', 'plata', 5, '🏛️'),
  ('Comprador Local', 'Visita 5 tiendas', 'tiendas', 'oro', 5, '🛍️')
ON CONFLICT DO NOTHING;

INSERT INTO pois (
  nombre, descripcion, categoria, ubicacion, latitud, longitud, direccion,
  horario_apertura, horario_cierre, precio_rango, emoji, foto_url, verificado, activo
)
VALUES
  (
    'Oasis Botanico',
    'Curaduria de plantas exoticas y productos organicos.',
    'tienda',
    ST_SetSRID(ST_MakePoint(-99.1677, 19.4326), 4326)::geography,
    19.4326,
    -99.1677,
    'Av. Reforma 450, CDMX',
    '10:00',
    '19:00',
    '$$',
    '🪴',
    'https://images.unsplash.com/photo-1463320726281-696a485928c7',
    true,
    true
  ),
  (
    'Casa del Mayorazgo',
    'Arquitectura colonial y cultura local.',
    'cultural',
    ST_SetSRID(ST_MakePoint(-100.8775, 20.9144), 4326)::geography,
    20.9144,
    -100.8775,
    'Centro Historico, San Miguel de Allende',
    '09:00',
    '18:00',
    '$',
    '🏛️',
    'https://images.unsplash.com/photo-1623264727301-a014514daec9',
    true,
    true
  ),
  (
    'Restaurante Los Danzantes',
    'Alta cocina oaxaquena contemporanea.',
    'comida',
    ST_SetSRID(ST_MakePoint(-96.7266, 17.0654), 4326)::geography,
    17.0654,
    -96.7266,
    'Oaxaca Centro',
    '13:00',
    '23:00',
    '$$$',
    '🍽️',
    'https://images.unsplash.com/photo-1544025162-d76694265947',
    true,
    true
  );

COMMIT;
