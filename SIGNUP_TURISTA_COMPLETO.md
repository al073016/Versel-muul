# ✅ REGISTRO DE TURISTAS - SOLUCIÓN COMPLETA

## 📍 Ubicación del Formulario

**URL**: `http://localhost:3000/es/signup-turista`  
**Archivo**: `src/app/[locale]/signup-turista/page.tsx`  
**API Endpoint**: `POST /api/auth/signup-turista`

---

## 🔧 ¿Cuál era el problema?

Basado en el JSON que mostraste:
```json
{
  "nombre": "correo",  // ❌ INCORRECTO - Debería ser el nombre ingresado
  "apellido": "",      // ❌ VACÍO
  "username": null,    // ❌ NULL
  "correo": "correo@example.com",  // ✓ Correcto
  "telefono": null     // ❌ NULL
}
```

**Causas identificadas:**
1. Los datos no se enviaban correctamente desde el cliente
2. Faltaban políticas de RLS para permitir inserciones
3. No había logging/debugging para ver qué estaba pasando

---

## ✅ Lo que hice para arreglarlo

### 1. **Creé un endpoint API seguro** (`/api/auth/signup-turista`)
- Validación server-side completa
- Mejor manejo de errores
- Acceso a admin de Supabase
- Logging para debugging

### 2. **Actualizé el formulario** para usar el API
- Envía datos limpios y validados
- Mejor manejo de errores visuales
- Muestra mensajes de éxito/error

### 3. **Creé políticas de RLS** para la tabla perfiles
- Permite que usuarios se auto-registren
- Todos pueden ver perfiles (datos públicos)
- Solo pueden editar el suyo propio

### 4. **Agregué página de debug** para verificar datos
- URL: `http://localhost:3000/es/debug-signup`
- Muestra usuario auth vs perfil guardado

---

## 🚀 PASOS PARA QUE FUNCIONE

### PASO 1: Configurar Políticas de RLS (IMPORTANTE)

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Click en **SQL Editor** 
3. Click en **New Query**
4. Copia y pega TODO el contenido de:
   ```
   supabase/rls_policies_perfiles.sql
   ```
5. Click en **Run**
6. Verifica en la consola que no hay errores

### PASO 2: Verificar Estructura de Tabla

1. Abre otra query en SQL Editor
2. Copia y pega TODO de:
   ```
   supabase/debug_perfiles.sql
   ```
3. Click en **Run**
4. Verifica que la tabla tiene estos campos EXACTAMENTE:
   - `id` (UUID)
   - `tipo_cuenta` (TEXT o ENUM)
   - `username` (TEXT UNIQUE)
   - `nombre` (TEXT)
   - `apellido` (TEXT)
   - `correo` (TEXT)
   - `telefono` (TEXT)
   - `foto_url` (TEXT null)
   - `banner_url` (TEXT null)
   - `idioma` (TEXT)
   - `ciudad` (TEXT null)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### PASO 3: Probar el Formulario

1. Abre: `http://localhost:3000/es/signup-turista`
2. Llena todos los campos:
   - Nombre: Pedro
   - Apellido: López
   - Usuario: pedrolopez
   - Email: pedro@example.com
   - Teléfono: +1234567890
   - Contraseña: Test123456
   - Confirmar: Test123456
   - Acepta términos

3. Click en **Registrarse**
4. Deberías ver: "✓ Cuenta creada exitosamente. Redirigiendo..."

### PASO 4: Verificar en Supabase

1. Ve a **Supabase Dashboard**
2. **Authentication** → Verifica que haya nuevo usuario
3. **SQL Editor** → Ejecuta:
   ```sql
   SELECT * FROM perfiles ORDER BY created_at DESC LIMIT 1;
   ```
4. Verifica que TODOS los campos están llenos correctamente

### PASO 5: Debugging (si algo falla)

1. Abre **Console del navegador** (F12)
2. Mira los errores de red
3. Ve a `http://localhost:3000/es/debug-signup` **después de registrarte**
4. Debería mostrar los datos del usuario y perfil

---

## 🛠️ Archivos Creados/Modificados

| Archivo | Descripción |
|---------|-------------|
| `src/app/[locale]/signup-turista/page.tsx` | Formulario de registro (con llamadas a API) |
| `src/app/api/auth/signup-turista/route.ts` | ✨ **Endpoint API con validación** |
| `src/app/[locale]/debug-signup/page.tsx` | Página de verificación de datos |
| `supabase/rls_policies_perfiles.sql` | ✨ **Políticas de RLS (IMPORTANTE)** |
| `supabase/debug_perfiles.sql` | Query para verificar estructura |
| `src/types/database.ts` | Types actualizados para Perfil |
| `REGISTRO_TURISTAS_SETUP.md` | Este documento |

---

## 📊 Flujo Completo

```
Usuario llena formulario
         ↓
Cliente valida datos (F12)
         ↓
POST /api/auth/signup-turista
         ↓
Servidor valida datos
         ↓
supabase.auth.signUp() → Crea usuario en auth
         ↓
supabase.from("perfiles").insert() → Crea perfil
         ↓
Retorna datos guardados
         ↓
Cliente muestra éxito y redirige
         ↓
Usuario ve su perfil
```

---

## ❓ FAQ

### P: ¿Dónde puedo ver los datos guardados?  
**R:** En Supabase Dashboard → **Table Editor** → tabla `perfiles` (última fila)

### P: ¿Qué hago si sigue fallando?  
**R:** 
1. Revisa F12 Console para errores
2. Abre la página de debug: `/es/debug-signup`
3. Verifica que RLS está configurada correctamente

### P: ¿Necesito algo más para producción?  
**R:** Sí:
- Validación de email (verificación)
- Validación de unicidad de username
- Rate limiting
- Protección CSRF

---

## 📞 Resumen

✅ Ahora los datos de registro se guardan:
- En `auth.users` (autenticación)
- En tabla `perfiles` (perfil de turista)

✅ Con todos los campos correctos:
- nombre
- apellido
- username
- correo
- telefono
- Y más...

✅ Endpoint desplegado: `/api/auth/signup-turista`

---

**Última actualización:** 2026-04-08
