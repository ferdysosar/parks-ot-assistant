# Parks OT Assistant Backend

Backend REST v1 de solo lectura para OTs, empresas y activos.

## Configuración

1. Copiar plantilla:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Elegir modo de repositorio en `.env`:

- `REPOSITORY_DRIVER=local-json` (default)
- `REPOSITORY_DRIVER=postgres`

3. Si usás postgres, configurar conexión:

- `DATABASE_URL` (recomendado), o
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

## Scripts

- `npm run dev`: inicia backend y toma configuración desde `.env`.
- `npm run dev:local`: fuerza `local-json`.
- `npm run dev:postgres`: fuerza `postgres`.
- `npm run build`: compila TypeScript.
- `npm run start`: ejecuta build.
- `npm run seed:demo:pg`: carga datos demo en PostgreSQL.

## Endpoints

- `GET /health`
- `GET /api/v1/ots`
- `GET /api/v1/ots/count`
- `GET /api/v1/companies`
- `GET /api/v1/assets`

## Migraciones y seed

1. Ejecutar `migrations/001_init_schema.sql`.
2. Ejecutar `npm run seed:demo:pg`.

## Fallback

- `REPOSITORY_FALLBACK_LOCAL=true` (default): si postgres falla, usa `LocalJsonOtRepository`.
- `REPOSITORY_FALLBACK_LOCAL=false`: falla explícitamente si postgres no está disponible.
