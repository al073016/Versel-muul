# URLs de Imágenes - Perfil de Negocio

## Ubicaciones de URLs en `src/app/[locale]/negocio/[id]/page.tsx`

### 1. **Imagen Hero (Fondo del Perfil) - Línea ~80**
```tsx
<img
  alt={negocio.nombre}
  className="w-full h-full object-cover"
  src={negocio.foto_url || getPremiumPhoto(negocio.nombre, negocio.categoria)}
/>
```
**Dónde poner la URL:**
- Usa el campo `negocio.foto_url` de la base de datos (si existe)
- O agrega una columna `foto_url` a la tabla `negocios` en Supabase
- **Tamaño recomendado:** 1200x400px o más
- **Formato:** JPG/PNG
- **Fallback:** `getPremiumPhoto()` genera una imagen automáticamente

**SQL para agregar columna:**
```sql
ALTER TABLE negocios ADD COLUMN foto_url TEXT;
```

---

### 2. **Logo del Negocio (Badge) - Línea ~90**
```tsx
<img
  alt="Business Logo"
  className="w-full h-full object-cover rounded-xl"
  src={negocio.foto_url || `https://ui-avatars.com/api/?name=${negocio.nombre}&background=003e6f&color=fff&size=256`}
/>
```
**Dónde poner la URL:**
- Si quieres un logo específico, agrega otra columna: `logo_url` o `imagen_perfil`
- Por ahora usa `negocio.foto_url` o genera un avatar automáticamente
- **Tamaño recomendado:** 256x256px (cuadrado)
- **Formato:** PNG con transparencia

**Para agregar columna logo específico:**
```sql
ALTER TABLE negocios ADD COLUMN logo_url TEXT;
```

---

### 3. **Imágenes de Productos - Línea ~150**
```tsx
<img
  alt={p.nombre}
  className="w-full h-full object-cover"
  src={`https://ui-avatars.com/api/?name=${p.nombre}&background=dde9ff&color=003e6f&size=400`}
/>
```
**Dónde poner la URL:**
- Agrega una columna `imagen_url` a la tabla `productos` en Supabase
- Cada producto debe tener su URL de imagen
- **Tamaño recomendado:** 400x500px (proporción 4:5)
- **Formato:** JPG/PNG

**SQL para agregar columna:**
```sql
ALTER TABLE productos ADD COLUMN imagen_url TEXT;
```

**Luego en el código:**
```tsx
<img
  alt={p.nombre}
  className="w-full h-full object-cover"
  src={p.imagen_url || `https://ui-avatars.com/api/?name=${p.nombre}&...`}
/>
```

---

## Resumen de Cambios en BD Necesarios

```sql
-- Agregar columnas para URLs de imágenes
ALTER TABLE negocios 
  ADD COLUMN foto_url TEXT,
  ADD COLUMN logo_url TEXT;

ALTER TABLE productos
  ADD COLUMN imagen_url TEXT;
```

---

## Opciones para Almacenar Imágenes

### Opción 1: Supabase Storage (Recomendado)
- Subir imágenes a Supabase Storage
- Guardar la URL pública en la BD
- Ejemplo: `https://your-bucket.supabase.co/storage/v1/object/public/fotos/negocio-1.jpg`

### Opción 2: URLs Externas
- Guardar URLs de un CDN (Cloudinary, ImgIX, etc.)
- Simple pero menos control

### Opción 3: Generar Automáticamente (Para Testing)
- Usar `ui-avatars.com` (ya está implementado como fallback)
- Usar `loremflickr.com` por categoría
- Usar `picsum.photos`

---

## Implementación en Componente de Upload (Futuro)

Cuando agregues un formulario de upload, puedes usar:

```tsx
async function uploadProductImage(file: File, productoId: string) {
  const { data, error } = await supabase.storage
    .from('productos')
    .upload(`${productoId}/${file.name}`, file);

  if (data) {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${data.path}`;
    await supabase
      .from('productos')
      .update({ imagen_url: url })
      .eq('id', productoId);
  }
}
```

---

## Notas Importantes

1. **Fallback Functions:** Las imágenes tienen fallbacks automáticos en caso de que no exista URL
2. **Material Symbols:** Los íconos ya están instalados, solo asegúrate de incluirlos en HTML `<head>`
3. **Optimización:** Las imágenes usan `object-cover` para mantener aspecto ratio
4. **Responsive:** Las imágenes escalan correctamente en móvil y desktop
