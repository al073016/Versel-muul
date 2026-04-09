# MUUL by Coppel Web

Plataforma web de turismo inteligente, descubrimiento de negocios locales y movilidad urbana, enfocada en experiencias en Mexico para el contexto MUUL 2026.

Este proyecto combina mapas interactivos, rutas optimizadas, recomendaciones asistidas por IA, internacionalizacion y un ecosistema social para turistas y negocios.

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Caracteristicas Principales](#caracteristicas-principales)
3. [Apartados de la Web](#apartados-de-la-web)
4. [Funciones por Tipo de Usuario](#funciones-por-tipo-de-usuario)
5. [Arquitectura Tecnica](#arquitectura-tecnica)
6. [Stack Tecnologico](#stack-tecnologico)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Requisitos Previos](#requisitos-previos)
9. [Configuracion de Variables de Entorno](#configuracion-de-variables-de-entorno)
10. [Instalacion y Ejecucion](#instalacion-y-ejecucion)
11. [Scripts Disponibles](#scripts-disponibles)
12. [Endpoints API Internos](#endpoints-api-internos)
13. [Base de Datos y Migraciones](#base-de-datos-y-migraciones)
14. [Internacionalizacion (i18n)](#internacionalizacion-i18n)
15. [Notas de Operacion](#notas-de-operacion)

## Resumen Ejecutivo

MUUL by Coppel Web es una aplicacion desarrollada con Next.js (App Router) para:

- Descubrir puntos de interes y negocios cercanos.
- Construir rutas inteligentes por distintos modos de transporte.
- Guardar, compartir y publicar rutas.
- Conectar visitantes y comunidad mediante funciones sociales.
- Impulsar negocios locales con perfiles, catalogo y visibilidad.
- Asistir al usuario con un chat de IA contextual y multilenguaje.

La plataforma integra Supabase para autenticacion, datos y realtime, Mapbox para geolocalizacion/ruteo y OpenRouter para capacidades de IA.

## Caracteristicas Principales

- Mapa interactivo con filtros por categoria y estado (abierto/cerrado).
- Calculo de rutas con optimizacion y alternativas.
- Modos de movilidad: caminando, accesible, vehiculo y metro (segun cobertura).
- Modo Party colaborativo con sincronizacion en tiempo real.
- MUUL AI para preguntas contextuales de lugares, rutas y descubrimiento general.
- Modo "Sorprendeme" para descubrimiento dinamico de lugares.
- Busqueda global de lugares y ubicaciones.
- Rutas guardadas del usuario y herramientas para compartir itinerarios (copiar/imagen/apps).
- Perfil de turista y perfil de negocio con experiencia diferenciada.
- Registro de negocios con datos del propietario y caracteristicas comerciales.
- Catalogo de productos por negocio.
- Sistema social y de gamificacion desacoplado por servicios.
- Internacionalizacion integrada (es, en, pt, zh).

## Apartados de la Web

La aplicacion incluye los siguientes apartados/paginas principales:

- Inicio
- Mapa
- Tiendas
- Ofertas
- Amigos
- Comunidad
- Perfil
- Negocio (vista de perfil de negocio)
- Dashboard principal de negocio
- Login
- Registro turista
- Registro negocio
- Privacidad
- Soporte

Adicionalmente, existen rutas API para autenticacion, chatbot, ruteo y utilidades de depuracion.

## Funciones por Tipo de Usuario

### Turista

- Registro e inicio de sesion.
- Exploracion de POIs y negocios por categorias.
- Planeacion de rutas con tiempos, distancia e indicaciones.
- Guardado de rutas y gestion de itinerarios.
- Interaccion con MUUL AI.
- Participacion en funcionalidades sociales y de comunidad.

### Negocio

- Registro de cuenta de negocio.
- Alta de negocio con ubicacion, categoria y datos de contacto.
- Gestion de perfil comercial.
- Publicacion y administracion de productos.
- Participacion en experiencias visibles dentro del ecosistema MUUL.

## Arquitectura Tecnica

### Frontend

- Next.js 14 con App Router.
- React 18 + TypeScript.
- Tailwind CSS para estilos y sistema visual.
- next-intl para traducciones y locales.

### Backend y Datos

- Supabase Auth para autenticacion.
- Supabase Postgres + PostGIS para datos y geoespacial.
- Supabase Realtime para colaboracion en vivo (Party Mode).
- RPCs en base de datos para operaciones de negocio/perfil.

### Servicios Externos

- Mapbox para mapas, busqueda y ruteo.
- OpenRouter para generacion y traduccion asistida por IA.

### Patron de Servicios

El modulo de servicios en `src/lib/services` sigue enfoque local-first adapter:

- Estado actual: soporte local/seed para resiliencia demo.
- Evolucion: intercambio transparente a fuentes remotas sin romper UI.

## Stack Tecnologico

- Next.js 14.2.x
- React 18
- TypeScript 5
- Tailwind CSS 3
- Supabase JS 2.x
- Mapbox GL 3.x
- next-intl 3.x
- html2canvas

## Estructura del Proyecto

```text
src/
	app/
		[locale]/          # Rutas de UI por idioma
		api/               # Endpoints API internos
	components/          # Componentes de layout, mapa y UI
	hooks/               # Hooks de logica de negocio y mapas
	lib/
		services/          # Capa de servicios desacoplada
		supabase/          # Clientes y compatibilidad Supabase
	i18n/                # Configuracion de internacionalizacion
messages/              # Archivos de traduccion por idioma
scripts/               # Utilidades (ej. manager de traducciones)
supabase/migrations/   # Migraciones SQL
```

## Requisitos Previos

- Node.js 18 o superior.
- npm 9 o superior (o equivalente con pnpm/yarn).
- Proyecto Supabase configurado.
- Token de Mapbox.
- (Opcional) API key de OpenRouter para MUUL AI.

## Configuracion de Variables de Entorno

Crea un archivo `.env.local` en la raiz del proyecto con los valores necesarios:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_MAPBOX_TOKEN=
MAPBOX_SECRET_TOKEN=

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notas:

- `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en backend/API routes.
- Si no se configura OpenRouter, las funciones de chat/traduccion IA no estaran disponibles.
- Si no se configura Mapbox, las funciones de mapa/ruta no operaran correctamente.

## Instalacion y Ejecucion

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar en modo desarrollo:

```bash
npm run dev
```

3. Abrir en navegador:

```text
http://localhost:3000
```

4. Build de produccion:

```bash
npm run build
npm run start
```

## Scripts Disponibles

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera build de produccion.
- `npm run start`: levanta la build en modo produccion.
- `npm run lint`: ejecuta analisis estatico.
- `npm run translations:add`: agrega clave de traduccion a todos los idiomas.
- `npm run translations:sync`: sincroniza llaves faltantes usando `es.json` como base.

## Endpoints API Internos

### Autenticacion

- `POST /api/auth/signup-turista`
- `POST /api/auth/signup-negocio`
- `POST /api/auth/login`

### Rutas y Movilidad

- `POST /api/ruta`: calculo de rutas optimizadas con Mapbox.

### IA / Chat

- `GET /api/chatbot`: health/availability del servicio de IA.
- `POST /api/chatbot`: consulta conversacional y traducciones por lote.

### Debug

- `GET /api/debug/perfiles` (entorno de soporte/diagnostico).

## Base de Datos y Migraciones

- La documentacion del esquema principal se encuentra en `DATABASE.md`.
- Las migraciones SQL estan en `supabase/migrations`.
- Se utiliza PostGIS para funcionalidades geoespaciales.
- Existen funciones RPC para guardar perfiles y crear negocios con seguridad definida en BD.

## Internacionalizacion (i18n)

Idiomas soportados actualmente:

- Espanol (`es`)
- Ingles (`en`)
- Portugues (`pt`)
- Chino (`zh`)

Elementos clave:

- Configuracion de middleware de locale y deteccion automatica.
- Mensajes por idioma en la carpeta `messages`.
- Utilidad de mantenimiento de traducciones en `scripts/i18n-manager.js`.

## Notas de Operacion

- El proyecto incluye rutas de resiliencia para escenarios de hackathon/demo (fallback local y dummy data en ciertos modulos).
- Algunas funcionalidades dependen de que el esquema SQL y las RPCs esten alineadas con `DATABASE.md`.
- Para entornos productivos, se recomienda reforzar monitoreo, trazabilidad de errores y validaciones de seguridad adicionales en APIs.

---

Proyecto desarrollado como plataforma digital para conectar turismo, comunidad y comercio local bajo el ecosistema MUUL by Inteligencia Artesanal.
