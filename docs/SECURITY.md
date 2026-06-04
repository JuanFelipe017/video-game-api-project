# Política de Seguridad

## Actualización de Dependencias — Reporte de Vulnerabilidades

### Cómo se identificaron las vulnerabilidades

Las vulnerabilidades de seguridad en las dependencias del proyecto se identificaron usando la extensión **Version Lens** para Visual Studio Code. Esta extensión muestra la versión más reciente disponible de cada paquete directamente en `package.json`, facilitando la detección de dependencias desactualizadas con vulnerabilidades conocidas.

Al comparar las versiones instaladas contra los últimos lanzamientos, se identificaron paquetes desactualizados tanto en el frontend como en el backend:

#### Frontend (Astro + Node)

| Paquete | Versión anterior | Versión actual | Cambio |
|---|---|---|---|
| `astro` | `^5.18.1` | `^6.4.3` | Mayor (5 → 6) |
| `@astrojs/node` | `^9.5.5` | `^10.1.3` | Mayor (9 → 10) |

#### Backend (Python + FastAPI)

Las dependencias del backend no tenían versiones fijas, lo que podía causar roturas o arrastrar dependencias transitivas vulnerables. Se fijaron todas las versiones y se agregó `PyJWT` para autenticación segura:

| Paquete | Versión anterior | Versión actual | Cambio |
|---|---|---|---|
| `fastapi` | *(sin pin)* | `0.136.3` | Pin de versión |
| `uvicorn` | *(sin pin)* | `0.49.0` | Pin de versión |
| `psycopg2-binary` | *(sin pin)* | `2.9.12` | Pin de versión |
| `python-dotenv` | *(sin pin)* | `1.2.2` | Pin de versión |
| `requests` | *(sin pin)* | `2.34.2` | Pin de versión |
| `bcrypt` | *(sin pin)* | `5.0.0` | Pin de versión |
| `PyJWT` | — | `>=2.13.0` | **Nuevo** (autenticación JWT) |

### Vulnerabilidades corregidas en `astro` (5.18.1 → 6.4.3)

La rama Astro 5.x tuvo múltiples avisos de seguridad que se resolvieron durante su ciclo de vida. Si bien la versión 5.18.1 incluía algunos parches, la actualización a Astro 6 garantiza que todas las vulnerabilidades conocidas estén resueltas y proporciona mantenimiento de seguridad continuo.

| CVE | Severidad | Descripción | Corregido en |
|---|---|---|---|
| **CVE-2025-61925** | Moderada (6.5) | La cabecera `X-Forwarded-Host` se refleja sin validación en `Astro.url`, permitiendo manipulación de URL y envenenamiento de caché cuando hay un proxy intermedio. | 5.14.2 |
| **CVE-2025-64525** | Moderada (6.5) | Las cabeceras `x-forwarded-proto` y `x-forwarded-port` se usan sin sanitización para construir URLs, permitiendo bypass de middleware, SSRF, DoS por envenenamiento de caché y bypass de WAF. | 5.15.5 |
| **CVE-2025-64765** | Moderada (6.9) | Discrepancia en la normalización de rutas entre el enrutamiento y el middleware permitía path traversal mediante variantes codificadas, evadiendo validaciones en rutas protegidas. | 5.15.8 |
| **CVE-2025-54793** | Moderada (5.5) | Redirección abierta mediante el manejo de doble slash (`//`) en rutas, explotable por usuarios no autenticados. | 5.12.8 |
| **CVE-2025-59837** | Alta (7.2) | Server-Side Request Forgery (SSRF) que permite a atacantes hacer peticiones a recursos internos. | Parche 5.x |
| **CVE-2025-58179** | Alta (7.2) | SSRF a través del adaptador de Cloudflare en el endpoint de optimización de imágenes, sirviendo dominios de terceros no autorizados. | Parche 5.x |
| **CVE-2026-25545** | Moderada | SSRF mediante inyección en la cabecera `Host` en páginas de error SSR prerenderizadas (404.astro / 500.astro), permitiendo escaneo de redes internas. | 5.17.2 |
| **CVE-2026-27829** | Moderada | Vulnerabilidad SSRF en el framework Astro que permite acceso no autorizado a servicios internos. | 6.x |
| **CVE-2026-41067** | Moderada | Cross-Site Scripting (XSS) que permite a atacantes evadir la sanitización de etiquetas script e inyectar código malicioso. | 6.x |

### Vulnerabilidades corregidas en `@astrojs/node` (9.5.5 → 10.1.3)

| CVE | Severidad | Descripción | Corregido en |
|---|---|---|---|
| **CVE-2025-55207** | Moderada (5.5) | Redirección abierta mediante el manejo de slash final en el adaptador `@astrojs/node`, permitiendo ataques de phishing mediante URLs manipuladas. | 9.4.1 |
| **CVE-2026-27729** | Moderada | Denegación de Servicio (DoS) por agotamiento de memoria debido a la ausencia de un límite en el tamaño del cuerpo de la petición en Server Actions. | 9.5.4 |
| **CVE-2026-25545** | Moderada | SSRF mediante inyección en la cabecera `Host` en páginas de error SSR (también afecta al adaptador de runtime). | 9.5.3 |

### Otras mejoras de seguridad implementadas

Más allá de los CVEs específicos, se realizaron los siguientes cambios:

- **Autenticación JWT**: Se reemplazó el mecanismo anterior basado en el header `x-user-id` por tokens JWT (`HS256`) con expiración configurable. Los endpoints protegidos ahora requieren el header `Authorization: Bearer <token>`. Esto elimina la suplantación de identidad por ID numérico.
- **URLs hardcodeadas eliminadas**: La URL base de la API de RAWG (`https://api.rawg.io/api`) estaba hardcodeada en `rawg_service.py`. Se movió a la variable de entorno `RAWG_URL_GAMES`. El frontend usa `PUBLIC_API_URL` desde `.env`.
- **CORS actualizado**: El header permitido cambió de `x-user-id` a `Authorization` para reflejar el nuevo esquema de autenticación.
- **Node.js 18 EOL**: Astro 5.8+ dejó de soportar Node.js 18 (fin de vida útil), asegurando que los builds se ejecuten en runtimes con mantenimiento activo.
- **Configuración predeterminada reforzada**: API CSP (Content Security Policy) mejorada y cabeceras de seguridad predeterminadas más estrictas.
- **Refuerzo en la cadena de dependencias**: Dependencias transitivas actualizadas con menos vulnerabilidades conocidas.
- **Mantenimiento de seguridad activo**: Astro 5.x pasó a modo solo-mantenimiento; las correcciones críticas solo están garantizadas en Astro 6+.

---

## Análisis de Seguridad

### Vulnerabilidades identificadas

A continuación se listan los puntos débiles identificados en el sistema actual, detallando su estado de mitigación.

| # | Vulnerabilidad | Impacto | Estado |
|---|---|---|---|
| 1 | **Autenticación basada en header `x-user-id`** | Cualquier usuario autenticado podía suplantar a otro simplemente cambiando el ID numérico en el header. No había firmas, sesiones ni expiración. | **Mitigado** — reemplazado por JWT Bearer token con expiración y algoritmo HMAC-SHA256 |
| 2 | **URLs hardcodeadas en el código fuente** | La URL de RAWG y la URL base del frontend estaban quemadas en el código, dificultando cambiar entornos sin recompilar y exponiendo endpoints en el repositorio. | **Mitigado** — movidas a variables de entorno (`RAWG_URL_GAMES`, `PUBLIC_API_URL`) |
| 3 | **Sin rate limiting en endpoints de autenticación** | Los endpoints `/api/users/login` y `/api/users/register` no tienen protección contra ataques de fuerza bruta ni diccionario. | **Pendiente** — requiere implementación a nivel de aplicación o infraestructura |
| 4 | **Sin Content Security Policy (CSP) configurada** | No hay cabeceras CSP estrictas. Astro 6 ofrece API para configurarlas, pero no se ha implementado una política que restrinja orígenes de scripts y estilos. | **Pendiente** — riesgo de bloquear recursos legítimos (RAWG images, Groq API); requiere testing exhaustivo |

### Medidas implementadas

| Vulnerabilidad | Medida implementada | Detalle |
|---|---|---|
| Autenticación débil | **JWT Bearer tokens** | Se creó `jwt_service.py` con `create_access_token()` y `verify_access_token()` usando `HS256`. Los tokens incluyen claims `exp`, `iat`, `user_id`, `username`, `email`. El middleware `auth_middleware.py` ahora valida el header `Authorization: Bearer <token>` en lugar del header `x-user-id`. |
| URLs hardcodeadas | **Variables de entorno** | `RAWG_URL_GAMES` en backend; `PUBLIC_API_URL` en frontend. Cada entorno (local, GCP) define su propio valor sin modificar el código. |
| Hashing de contraseñas | **bcrypt con `gensalt()`** | Las contraseñas se almacenan con hash bcrypt y salt automático. El backend ahora usa `bcrypt==5.0.0` con versión fija. |
| Inyección SQL | **Consultas parametrizadas** | Todas las consultas SQL usan parámetros `%s` de psycopg2, previniendo inyección SQL. |
| CORS permisivo | **Orígenes restringidos** | Solo se permiten `https://gamehub-front-back-556939640766.us-central1.run.app` (producción) y `http://localhost:4321` (desarrollo). |
| Dependencias sin versión | **Versionado fijo** | Todas las dependencias del backend ahora tienen versiones concretas (`fastapi==0.136.3`, etc.), eliminando la ambigüedad en los builds. |

### Medidas pendientes

| Medida | Prioridad | Motivo de no implementación |
|---|---|---|
| **Rate limiting en auth endpoints** | Media | Se puede implementar con `slowapi` (FastAPI) o a nivel de infraestructura con Cloud Armor. Agrega latencia en desarrollo y requiere configuración cuidadosa para no bloquear usuarios legítimos. |
| **CSP headers estrictos** | Media | Riesgo de bloquear recursos legítimos (imágenes de RAWG, llamadas a Groq API). Requiere un inventario completo de todos los orígenes externos y testing en staging antes de desplegar a producción. |
| **Integración OAuth (Google/Apple)** | Baja | Depende de registrarse en consolas de desarrollador de Google y Apple. La UI ya tiene los botones sociales, pero la integración real requiere credenciales y endpoints de callback. |
| **Verificación de propiedad en favoritos** | Baja | El middleware JWT ya autentica al usuario, pero los endpoints de favoritos no verifican que el `user_id` del recurso coincida con el `user_id` del token. Un usuario podría modificar favoritos de otro si conoce su ID. |

### Plan de respuesta a incidentes

El equipo seguirá este proceso ante la detección de acceso no autorizado o compromiso de datos:

1. **Detección y contención**: Identificar el alcance del incidente (logs de Cloud Run, Cloud SQL y Groq API). Rotar inmediatamente todas las credenciales comprometidas (`JWT_SECRET`, `RAWG_API_KEY`, `GROQ_API_KEY`, `PGPASSWORD`) y revocar tokens JWT activos forzando un nuevo despliegue.
2. **Análisis forense**: Revisar logs de acceso a Cloud SQL y llamadas a la API de RAWG/Groq para determinar qué datos fueron accedidos o exfiltrados. Verificar si hubo explotación de vulnerabilidades conocidas.
3. **Notificación**: Informar a los usuarios afectados (si hay datos personales comprometidos) dentro del plazo legal aplicable. Documentar el incidente internamente con detalles técnicos, causas raíz y lecciones aprendidas.
4. **Remediación**: Aplicar el parche necesario (actualizar dependencias, reforzar reglas de firewall, agregar rate limiting, rotar certificados). Desplegar una versión corregida a producción mediante el pipeline CI/CD.
5. **Post-mortem**: Realizar una reunión post-incidente para documentar la línea de tiempo, causas raíz, efectividad de la respuesta y mejoras al plan. Actualizar este documento con las lecciones aprendidas.

### Recomendaciones

1. **Monitorea las dependencias regularmente**: Usa Version Lens o `npm audit` / `pip-audit` para detectar paquetes desactualizados con avisos conocidos.
2. **Mantén las versiones mayores actualizadas**: Astro 5.x ya no recibe actualizaciones de seguridad activas; mantenerse en Astro 6 garantiza cobertura continua.
3. **No commitees secretos en el repositorio**: Usa GCP Secret Manager o variables de entorno del entorno de despliegue para credenciales sensibles.
4. **Consulta GitHub Advisories**: Monitorea la [página de avisos de seguridad de Astro](https://github.com/withastro/astro/security/advisories) y los [avisos de PyPI](https://github.com/advisories) para vulnerabilidades recién divulgadas.
