# Configuración de Supabase Storage para Imágenes de POIs

## 1. Crear el Bucket en Supabase

1. Ve a tu panel de Supabase: https://supabase.com/
2. Selecciona tu proyecto
3. Navega a **Storage** en el sidebar izquierdo
4. Haz clic en **Create a new bucket**
5. Nombre: `poi-images`
6. Haz clic en **Create bucket**

## 2. Configurar Políticas RLS (Row Level Security)

En el mismo bucket **poi-images**, haz clic en las tres líneas (⋮) y selecciona **Policies**.

### Política de Lectura Pública:
```sql
-- Allow public read access to all images
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'poi-images');
```

### Política de Inserción Autenticada:
```sql
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated Users Upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'poi-images' 
    AND auth.role() = 'authenticated'
  );
```

### Política de Actualización:
```sql
-- Allow users to update their own images
CREATE POLICY "Authenticated Users Update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'poi-images' 
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'poi-images' 
    AND auth.role() = 'authenticated'
  );
```

### Política de Eliminación:
```sql
-- Allow users to delete images
CREATE POLICY "Authenticated Users Delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'poi-images' 
    AND auth.role() = 'authenticated'
  );
```

## 3. Alternativa: Usar SQL Editor de Supabase

Si prefieres ejecutar todos los permisos de una vez:

1. Ve a **SQL Editor** en el sidebar de Supabase
2. Copia y pega el siguiente código:

```sql
-- Create bucket if it doesn't exist (may not work via SQL Editor, use UI instead)

-- Enable RLS if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'poi-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'poi-images' 
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can update
CREATE POLICY "Authenticated Update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'poi-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'poi-images' AND auth.role() = 'authenticated');

-- Authenticated users can delete
CREATE POLICY "Authenticated Delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'poi-images' AND auth.role() = 'authenticated');
```

3. Haz clic en **Run** (Ctrl+Enter)

## 4. Estructura del Almacenamiento

Las imágenes se guardarán en la siguiente estructura:
```
poi-images/
  └── pois/
      ├── poi-id-1/
      │   └── poi_poi-id-1_1712594400000.png
      ├── poi-id-2/
      │   └── poi_poi-id-2_1712594500000.jpg
      └── ...
```

## 5. Ejemplo de Uso en el Código

```typescript
import { uploadPoiImage, getPoiImageUrl } from '@/lib/supabase/storage';

// Upload una imagen
const imageUrl = await uploadPoiImage(file, 'poi-123');

// Obtener URL de imagen
const url = await getPoiImageUrl('poi-123');

// Actualizar POI con la URL
await supabase
  .from('pois')
  .update({ foto_url: imageUrl })
  .eq('id', 'poi-123');
```

## 6. Variables de Entorno Necesarias

Ya están configuradas en tu proyecto:
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓

No necesitas agregar más variables.

## Notas Importantes

- Las imágenes son **públicas** (cualquiera puede verlas)
- Solo **usuarios autenticados** pueden subir/actualizar/eliminar
- Máximo tamaño: **5MB por imagen**
- Formatos soportados: **JPEG, PNG, WebP, GIF**
- Las imágenes se optimizan automáticamente en Supabase

## Solución de Problemas

### Error: "Bucket does not exist"
- Verifica que creaste el bucket `poi-images` en el UI de Supabase
- Asegúrate que está en la región correcta

### Error: "Permission denied"
- Verifica que las políticas RLS están bien configuradas
- Comprueba que el usuario está autenticado

### Imagen no se carga
- Verifica que la URL retornada es correcta
- Comprueba los CORS en settings de Storage
