# Instrucciones para Configurar el Registro de Turistas

## Pasos a seguir:

### 1. Ejecutar en Supabase SQL Editor

Abre tu proyecto en Supabase y ve a **SQL Editor**, luego ejecuta estos scripts en orden:

#### A) Primero, verifica la estructura actual:
```bash
-- Copiar y pegar el contenido de: supabase/debug_perfiles.sql
```

#### B) Luego, asegúrate que RLS está configurado correctamente:
```bash
-- Copiar y pegar el contenido de: supabase/rls_policies_perfiles.sql
```

### 2. Campos requeridos en tabla `perfiles`:

La tabla debe tener estos campos exactos:
- `id` (UUID, PK) - Referencia a auth.users
- `tipo_cuenta` (ENUM: 'turista', 'negocio')
- `username` (TEXT UNIQUE) - Identificador único
- `nombre` (TEXT)
- `apellido` (TEXT)
- `correo` (TEXT) - Email sanitizado
- `telefono` (TEXT)
- `foto_url` (TEXT, nullable)
- `banner_url` (TEXT, nullable)
- `idioma` (TEXT, default 'es-MX')
- `ciudad` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. Verificar que todo funciona:

1. Ve a `localhost:3000/es/signup-turista`
2. Completa el formulario
3. Haz clic en "Registrarse"
4. Verifica en Supabase:
   - Nueva entrada en `auth.users`
   - Nuevo registro en tabla `perfiles` con TODOS los datos

### 4. Si hay errores:

Abre la consola del navegador (F12) y revisa los logs de error. También puedes:
- Ver los logs del servidor en la terminal
- Ver los logs SQL en Supabase (SQL Editor → History)

### 5. Troubleshooting:

Si los datos no se guardan:
1. ✓ Verifica que RLS policies estén habilitadas
2. ✓ Verifica que el usuario esté autenticado después de sign up
3. ✓ Revisa que los nombres de columnas coincidan exactamente
4. ✓ Verifica que no hay triggers que sobrescriban los datos

---

## Endpoint API

**POST** `/api/auth/signup-turista`

### Request body:
```json
{
  "nombre": "Juan",
  "apellido": "García",
  "username": "juangarcia",
  "email": "juan@example.com",
  "telefono": "+1234567890",
  "password": "SecurePassword123",
  "locale": "es-MX"
}
```

### Response (201):
```json
{
  "success": true,
  "message": "Cuenta creada exitosamente",
  "data": {
    "id": "uuid-here",
    "nombre": "Juan",
    "apellido": "García",
    "username": "juangarcia",
    "correo": "juan@example.com",
    ...
  }
}
```

---

## Endpoint de acceso:

- **URL**: `http://localhost:3000/es/signup-turista`
- **Método**: GET (muestra el formulario)
- **Ruta**: `[locale]/signup-turista/page.tsx`
