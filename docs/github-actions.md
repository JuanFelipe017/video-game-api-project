# ⚙️ GitHub Actions Workflows

Esta carpeta contiene los flujos de trabajo automatizados del proyecto **GameHub** utilizando GitHub Actions.

---

## 📋 Workflows Implementados

### 1. 🔄 CI Pipeline (`ci.yml`)
**Integración Continua**

Se ejecuta automáticamente en cada Pull Request hacia las ramas `development`, `main` o `master`.

**¿Qué hace?**
- Hace checkout del código
- Configura Node.js v18
- Instala las dependencias del proyecto
- Ejecuta los tests automáticamente
- Confirma que el build es exitoso antes de permitir el merge

**Trigger:**
```yaml
on:
  push:
    branches: [development]
  pull_request:
    branches: [development, main, master]
```

---

### 2. 🚀 CD Pipeline (`cd.yml`)
**Despliegue Continuo a GCP**

Se ejecuta automáticamente cuando se hace merge a la rama `main`.

**¿Qué hace?**
- Autentica en Google Cloud Platform
- Despliega el **backend** (FastAPI) al servicio `gamehub-backend` en Cloud Run
- Despliega el **frontend** (Astro) al servicio `gamehub-front-back` en Cloud Run
- El frontend espera a que el backend se despliegue primero (`needs: deploy-backend`)

**Trigger:**
```yaml
on:
  push:
    branches: [main]
```

**Servicios desplegados:**
| Servicio | Tecnología | Cloud Run |
|---|---|---|
| Backend | Python + FastAPI | `gamehub-backend` |
| Frontend | Astro + React | `gamehub-front-back` |

---

### 3. 🤖 Project Automation (`project-automation.yml`)
**Automatización del Tablero Kanban**

Se ejecuta automáticamente cuando se abren o asignan Issues y cuando se abren o cierran Pull Requests.

**¿Qué hace?**
- Mueve la card a **"In Progress"** cuando un Issue es asignado
- Mueve la card a **"Review"** cuando se abre un Pull Request
- Mueve la card a **"Done"** cuando se hace merge de un Pull Request

**Trigger:**
```yaml
on:
  issues:
    types: [opened, assigned]
  pull_request:
    types: [opened, closed]
```

---

## 🏗️ Arquitectura del CI/CD

```
Push a development
       │
       ▼
  CI Pipeline
  (Tests y Build)
       │
       ▼
  Pull Request
  a main
       │
       ▼
  CD Pipeline
  ┌─────────────┐
  │deploy-backend│ ──► gamehub-backend (Cloud Run)
  └─────────────┘
         │
         ▼
  ┌──────────────┐
  │deploy-frontend│ ──► gamehub-front-back (Cloud Run)
  └──────────────┘
```

---

## 🔐 Secrets Requeridos

| Secret | Descripción |
|---|---|
| `GCP_CREDENTIALS` | Credenciales JSON de la cuenta de servicio de GCP |

Configurar en: **Settings → Secrets and variables → Actions**

---

## 📊 Resumen

| Workflow | Trigger | Duración aprox. |
|---|---|---|
| CI Pipeline | PR a development/main | ~20s |
| CD Pipeline | Push a main | ~2-3 min |
| Project Automation | Issues y PRs | ~2s |

---

## 🧠 Enseñanzas y dificultades encontradas (GCP + CI/CD)

### ✅ Enseñanzas (lo que nos llevamos)
- **Alineación entre historia y despliegue real:** Aprendimos a mantener consistencia entre lo que se define en las historias (App Engine/Cloud Storage) y el despliegue real (Cloud Run), actualizando criterios y documentación para que la evidencia sea verificable.
- **CI/CD como garantía de calidad:** Automatizar tests y builds antes del merge reduce errores y acelera la integración del equipo.
- **Separación de responsabilidades:** Mantener pipelines separados (CI, CD, Project Automation) facilita el mantenimiento y la depuración cuando falla un paso.
- **Uso correcto de variables/entorno en frontend:** Centralizar la URL del backend con `PUBLIC_API_URL` evitó hardcodes y simplificó el cambio de entornos.
- **Importancia de evidencia reproducible:** Documentar URLs, flujos y configuración en el README permitió que un evaluador pueda validar el proyecto sin depender del equipo.

### ⚠️ Dificultades (qué nos costó y cómo lo resolvimos)
- **IAM en GCP (roles y políticas):**
  - *Problema:* Varias tareas (deploy, acceso a recursos, permisos para servicios) fallaban por falta de permisos o por políticas de seguridad del proyecto.
  - *Solución:* Ajustamos roles de IAM para las cuentas involucradas (incluida la cuenta de servicio usada por GitHub Actions) y revisamos políticas de acceso.
  - *Aprendizaje:* Antes de automatizar, es clave definir una **cuenta de servicio** con permisos mínimos necesarios y validar que el proyecto permita esos cambios.
- **Autenticación en GitHub Actions hacia GCP:**
  - *Problema:* El pipeline de CD requiere credenciales válidas y permisos correctos; si el JSON no tiene el rol adecuado, el deploy a Cloud Run falla.
  - *Solución:* Uso de `GCP_CREDENTIALS` como secret y verificación de roles en IAM para permitir despliegue y administración del servicio.
- **CORS y consumo de API desde frontend:**
  - *Problema:* Al integrar frontend y backend en dominios diferentes, los navegadores bloquean requests si no está bien configurado CORS.
  - *Solución:* Ajuste de CORS en el backend y validación en DevTools (Network/Console) hasta eliminar errores.
- **Diferencias entre servicios de despliegue (App Engine vs Cloud Run):**
  - *Problema:* App Engine requiere `app.yaml` y una estructura distinta; el proyecto ya estaba orientado a contenedores (Dockerfile) para Cloud Run.
  - *Solución:* Se decidió estandarizar el despliegue con Cloud Run y documentar correctamente el flujo y las URLs públicas.
- **Automatización del Project/Kanban:**
  - *Problema:* Mover tarjetas automáticamente depende de permisos/tokens y del evento correcto (issue assigned, PR opened/merged).
  - *Solución:* Definimos triggers claros y verificamos el comportamiento con runs en Actions y cambios visibles en el tablero.

### 🔒 Nota sobre permisos (recomendación)
Para evitar bloqueos futuros, se recomienda:
- Usar una **service account** dedicada para CI/CD.
- Asignar **roles mínimos necesarios** (principio de menor privilegio).
- Documentar en el README/Docs qué roles se requieren para deploy y administración de recursos.

---

## 🔗 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud Run Deploy Action](https://github.com/google-github-actions/deploy-cloudrun)
- [Google Auth Action](https://github.com/google-github-actions/auth)
