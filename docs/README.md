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

## 🔗 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud Run Deploy Action](https://github.com/google-github-actions/deploy-cloudrun)
- [Google Auth Action](https://github.com/google-github-actions/auth)
