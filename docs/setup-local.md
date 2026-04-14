# Setup Local - Parks OT Assistant

Guía mínima para levantar frontend + backend en entorno local.

## 1) Requisitos

- Node.js (usar `.nvmrc`)
- npm
- PostgreSQL (opcional, solo para modo `postgres`)

## 2) Instalar dependencias

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

## 3) Levantar backend

Desde `backend/`:

```bash
npm run dev
```

Backend por defecto:

- `http://localhost:3001`
- `http://localhost:3001/health`
- `http://localhost:3001/api/v1/ots`

### Modos de backend

- `npm run dev:local`: fuerza repositorio local JSON.
- `npm run dev:postgres`: fuerza repositorio postgres.
- `REPOSITORY_FALLBACK_LOCAL=true` permite fallback local si postgres no responde.

## 4) Levantar frontend

Desde `frontend/`:

```bash
npm run start
```

Frontend:

- `http://localhost:4200/`
- `http://localhost:4200/landing`

## 5) Cambiar frontend entre modo local/api

Editar `frontend/public/runtime-config.js`:

- `mode: 'api'`: consume backend.
- `mode: 'local'`: usa datasource local.
- `apiBaseUrl`: URL base del backend (default `http://localhost:3001/api/v1`).
- `fallbackToLocalOnApiError`: fallback local en modo `api`.

## 6) Usar PostgreSQL + seed demo

1. Crear DB.
2. Ejecutar migración `backend/migrations/001_init_schema.sql`.
3. Configurar conexión en `backend/.env`.
4. Poner `REPOSITORY_DRIVER=postgres`.
5. Ejecutar seed:

```bash
cd backend
npm run seed:demo:pg
```

## 7) Flujo recomendado para desarrollo diario

1. Backend `local-json` para velocidad de iteración.
2. Frontend en `mode: 'api'` para validar integración HTTP.
3. Postgres solo cuando necesites validar persistencia real.
