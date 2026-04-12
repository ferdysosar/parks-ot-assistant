# Parks OT Assistant Backend (v1 mínimo)

Backend de solo lectura para exponer API REST sobre el dataset temporal.

## Scripts

- `npm run dev`: inicia en modo desarrollo (`tsx watch`)
- `npm run build`: compila TypeScript a `dist/`
- `npm run start`: ejecuta build compilado

## Endpoints

- `GET /health`
- `GET /api/v1/ots`
- `GET /api/v1/ots/count`
- `GET /api/v1/companies`
- `GET /api/v1/assets`

## Fuente de datos temporal

Lee por defecto:

- `../frontend/src/assets/ots-demo.json`
- `../frontend/src/data/empresas-activos.json`

Variables opcionales para override:

- `OTS_DATA_PATH`
- `COMPANIES_DATA_PATH`
