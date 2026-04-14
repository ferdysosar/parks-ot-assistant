# Parks OT Assistant Frontend

Aplicación Angular del asistente.

## Uso rápido

```bash
npm ci
npm run start
```

URLs:

- `http://localhost:4200/`
- `http://localhost:4200/landing`

## Configuración de datasource

Editar `public/runtime-config.js`:

- `mode: 'api'`: consume backend REST.
- `mode: 'local'`: usa JSON local.
- `apiBaseUrl`: base URL de la API.
- `fallbackToLocalOnApiError`: fallback local cuando la API falla.

## Referencias

- [README raíz](../README.md)
- [Setup local](../docs/setup-local.md)
