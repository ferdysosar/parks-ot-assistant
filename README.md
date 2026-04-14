# Parks OT Assistant

Parks OT Assistant es un proyecto full-stack para consulta de OTs:

- `frontend/`: Angular + chatbot + datasource local/api con fallback local.
- `backend/`: Node.js + TypeScript + Fastify + API REST v1.
- PostgreSQL opcional para persistencia real en backend.

## Requisitos

- Node.js (usar versión de `.nvmrc`)
- npm
- PostgreSQL (solo si querés modo `postgres`)

## Instalación

```bash
cd frontend
npm ci

cd ../backend
npm ci
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Flujo recomendado diario

1. Backend en modo `local-json` (rápido y estable para desarrollo funcional).
2. Frontend en modo `api` (consume backend local y mantiene fallback local).
3. Usar modo `postgres` cuando necesites validar integración con DB.

## Levantar backend

Desde `backend/`:

```bash
npm run dev
```

Scripts útiles:

- `npm run dev`: respeta `REPOSITORY_DRIVER` de `.env`.
- `npm run dev:local`: fuerza `REPOSITORY_DRIVER=local-json`.
- `npm run dev:postgres`: fuerza `REPOSITORY_DRIVER=postgres`.
- `npm run build`: compila TypeScript.
- `npm run start`: ejecuta `dist/server.js`.
- `npm run seed:demo:pg`: carga dataset demo en PostgreSQL.

## Levantar frontend

Desde `frontend/`:

```bash
npm run start
```

Aplicación:

- `http://localhost:4200/`
- `http://localhost:4200/landing`

## Cambiar frontend entre local y api

Editar `frontend/public/runtime-config.js`:

- `mode: 'api'`: usa backend (`apiBaseUrl`).
- `mode: 'local'`: fuerza datasource JSON local en frontend.
- `fallbackToLocalOnApiError: true`: si API falla en modo `api`, continúa con dataset local.

No requiere recompilar para cambiar el modo en desarrollo.

## Usar PostgreSQL

1. Crear base de datos.
2. Aplicar `backend/migrations/001_init_schema.sql`.
3. Configurar `backend/.env` con `REPOSITORY_DRIVER=postgres` y conexión PG.
4. Ejecutar seed:

```bash
cd backend
npm run seed:demo:pg
```

## Documentación adicional

- [Guía de setup local](docs/setup-local.md)
- [Backend README](backend/README.md)
