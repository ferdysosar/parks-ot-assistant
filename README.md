# Parks OT Assistant

Parks OT Assistant es una aplicación Angular para consulta de Órdenes de Trabajo (OT) en contexto naval.

## Arranque rápido

1. Clonar el repositorio:

```bash
git clone https://github.com/ferdysosar/parks-ot-assistant
cd parks-ot-assistant
```

2. Usar la versión de Node recomendada:

```bash
nvm use
```

3. Instalar dependencias:

```bash
cd frontend
npm ci
```

4. Ejecutar en local:

```bash
npm run start
```

5. Abrir en navegador:

- `http://localhost:4200/` (dashboard/template base)
- `http://localhost:4200/landing` (experiencia principal del asistente)

## Rutas principales

- `/`: carga el dashboard/base del template.
- `/landing`: carga la experiencia principal del asistente Parks OT Assistant.

## Estructura del proyecto

- `frontend/`: aplicación Angular principal.
- `frontend/src/app/pages/landing/`: composición principal de la landing y sus widgets visuales.
- `frontend/src/app/pages/landing/components/`: incluye widgets en uso y también widgets heredados no integrados actualmente (`highlights`, `pricing`, `demowidget`, `companieswidget`).
- `frontend/src/app/shared/chat-widget/`: sistema de chat (UI + servicio + parser + matcher + formatter + utilidades + tipos).
- `frontend/src/assets/ots-demo.json`: dataset local de OTs para la demo.
- `docs/setup-local.md`: guía detallada de instalación local.
- `Tareas/`: material académico del proyecto.

## Estado actual

- Chat funcional para consultas por OT, empresa, activo y fecha.
- Sin backend en esta etapa (datos locales JSON).
- Landing modular con componentes standalone.

## Documentación adicional

- [Guía detallada de setup local](docs/setup-local.md)
