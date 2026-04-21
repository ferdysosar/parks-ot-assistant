# Parks OT Assistant

Asistente conversacional para consultar Órdenes de Trabajo (OT) en un contexto operativo/naval.  
El proyecto combina frontend, backend y capa de datos desacoplada para permitir consultas rápidas por chat y una evolución gradual hacia un entorno empresarial real.

## ¿Qué es y qué resuelve?

Parks OT Assistant busca reducir el tiempo de búsqueda de información operativa.  
En lugar de navegar registros manualmente, permite consultar OTs en lenguaje natural por:

- número de OT,
- empresa,
- activo,
- fecha o período.

El chatbot funciona como interfaz de consulta, manteniendo contexto conversacional para responder follow-ups (por ejemplo: "detalle", "la última", "mostrame más").

---

## Arquitectura actual

### Frontend (`frontend/`)

- Angular 21.
- Landing operativa con widgets y chat embebido.
- Lógica conversacional en `ChatService`.
- Capa de datasource con interfaz única (`OtDataSource`):
  - `LocalJsonOtDataSource`
  - `ApiOtDataSource`

### Backend (`backend/`)

- Node.js + TypeScript + Fastify.
- API REST v1 de solo lectura.
- Servicio de lectura (`OtReadService`) + repositorios (`OtRepository`).

### Datos y modos de ejecución

En `frontend/public/runtime-config.js`:

- `mode: 'local'`: usa JSON local.
- `mode: 'api'`: consume backend REST.
- `fallbackToLocalOnApiError: true`: fallback local si la API falla.

En backend (`.env`):

- `REPOSITORY_DRIVER=local-json|postgres`
- `REPOSITORY_FALLBACK_LOCAL=true|false`

---

## Funcionalidades actuales (implementadas)

### Chatbot

- Consulta por número de OT (incluye normalización, ej. `OT 7 -> OT-007`).
- Consulta por empresa y por activo.
- Consulta por fecha exacta (`dd/mm/yyyy`), mes/año y año.
- Conteos por período ("cuántas OTs hubo...").
- Consultas de "últimas N" (con default cuando no se indica cantidad).
- Historial por activo con orden cronológico configurable y filtro por año.
- Follow-ups contextuales (`detalle`, campos puntuales, `la última`, continuidad de listas).
- Desambiguación empresa/activo en consultas ambiguas.
- Respuestas de ayuda y fallback contextual.

### API v1

Endpoints activos:

- `GET /health`
- `GET /api/v1/ots`
- `GET /api/v1/ots/count`
- `GET /api/v1/companies`
- `GET /api/v1/assets`

Capacidades:

- filtros por OT, empresa, activo y rango de fechas,
- ordenamiento y paginación,
- conteos por `day | month | year`.

### PostgreSQL

- Esquema inicial con migración (`backend/migrations/001_init_schema.sql`).
- Seed demo (`npm run seed:demo:pg`).
- Repositorio PostgreSQL funcional con fallback opcional a local-json.

---

## Cómo levantar el proyecto

### Requisitos

- Node.js (versión de `.nvmrc`)
- npm
- PostgreSQL (opcional, para modo `postgres`)

### Instalación

```bash
cd frontend
npm ci

cd ../backend
npm ci
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

### Backend

```bash
cd backend
npm run dev
```

Scripts útiles:

```bash
npm run dev
npm run dev:local
npm run dev:postgres
npm run build
npm run start
npm run seed:demo:pg
```

### Frontend

```bash
cd frontend
npm run start
```

URLs:

- `http://localhost:4200/`
- `http://localhost:3001/health`
- `http://localhost:3001/api/v1/ots`

### PostgreSQL (opcional)

1. Crear base de datos.
2. Ejecutar `backend/migrations/001_init_schema.sql`.
3. Configurar conexión en `backend/.env`.
4. Definir `REPOSITORY_DRIVER=postgres`.
5. Ejecutar seed demo:

```bash
cd backend
npm run seed:demo:pg
```

### Flujo recomendado

1. Backend en `local-json` para iteración rápida.
2. Frontend en `mode: 'api'` para validar integración HTTP.
3. Validar `postgres` en pruebas de integración.

---

## Estado actual (honesto)

### Sólido hoy

- Separación clara frontend/backend.
- API v1 estable de lectura.
- Lógica conversacional con cobertura de tests en escenarios clave.
- Modo local robusto para desarrollo.
- Integración con PostgreSQL ya preparada.

### Aún base demo/controlada

- Dataset principal demo (JSON/seed).
- Sin integración nativa con sistemas OT corporativos.
- UI enfocada en operación y validación funcional.

### Límites actuales

- Sin autenticación ni roles.
- Sin auditoría persistente de consultas/conversaciones.
- Backend read-only (sin alta/edición/cierre de OTs).
- Heurísticas conversacionales basadas en reglas (no NLP/LLM productivo).

---

## Cómo adaptarlo a una empresa real

Plan práctico y gradual:

1. Definir diccionario real de campos OT (estado, prioridad, responsable, ubicación, etc.).
2. Conectar fuente real (API interna, DB de lectura o réplica controlada).
3. Implementar repositorio empresarial manteniendo el contrato actual (`OtRepository`).
4. Extender filtros y contratos sin romper API v1 de forma abrupta.
5. Incorporar autenticación (SSO/JWT) y autorización por rol/ámbito.
6. Ajustar vocabulario del chatbot a la terminología interna.
7. Preparar despliegue productivo (contenedores, secretos, observabilidad).
8. Agregar trazabilidad y auditoría (logs estructurados, retención, seguridad).

---

## Futuras implementaciones posibles

- Integración con datos reales de mantenimiento/operación.
- Autenticación y control de permisos.
- Panel administrativo de catálogos y configuraciones.
- Filtros avanzados (estado, prioridad, criticidad, responsable).
- Resúmenes y métricas operativas.
- Integraciones con sistemas corporativos (ERP/CMMS/BI/tickets).
- Auditoría y monitoreo de consultas.
- Mejora incremental del motor conversacional.
- CI/CD y hardening para despliegue productivo.

---

## Estructura técnica clave

### Carpetas principales

- `frontend/` aplicación Angular + chatbot + datasources.
- `backend/` API REST v1 + repositorios.
- `backend/migrations/` esquema SQL.
- `docs/` guías de setup local.

### Archivos/módulos clave

- `frontend/src/app/shared/chat-widget/chat.service.ts` (núcleo conversacional)
- `frontend/src/app/shared/chat-widget/chat-intent.parser.ts`
- `frontend/src/app/shared/chat-widget/chat-dynamic-query.ts`
- `frontend/src/app/core/data/*` (datasource local/api)
- `backend/src/routes/v1/*` (endpoints)
- `backend/src/repositories/*` (local-json/postgres)
- `backend/src/scripts/seed-demo-postgres.ts`
- `backend/migrations/001_init_schema.sql`

### Dónde extender

- Nuevas reglas de chat: `chat.service.ts` + parser/matcher.
- Nuevas fuentes de datos: implementar `OtRepository` y/o `OtDataSource`.
- Nuevos filtros de API: contratos + parsers + repositorios.
- Configuración de modo frontend: `frontend/public/runtime-config.js`.

---

Parks OT Assistant ya ofrece una base técnica sólida para consultas conversacionales de OTs y validación de integración local/API/PostgreSQL.  
No es todavía un producto corporativo cerrado de punta a punta, pero sí una base realista para avanzar con una evolución incremental, controlada y orientada a operación real.
