# Setup Local - Parks OT Assistant

Guía detallada para clonar y ejecutar el proyecto en otra máquina.

## 1) Requisitos previos

- Git instalado
- Node.js compatible con Angular 21
- npm (incluido con Node)

### Versión recomendada de Node

Este proyecto usa Angular 21. Según los paquetes instalados, la compatibilidad es:

- `^20.19.0` o
- `^22.12.0` o
- `>=24.0.0`

Recomendación práctica para desarrollo local:

- **Node 22 LTS** (usando `.nvmrc`)

## 2) Clonar repositorio

```bash
git clone <URL_DEL_REPO>
cd parks-ot-assistant
```

## 3) Seleccionar versión de Node

Si usás nvm:

```bash
nvm use
```

Si no tenés la versión instalada:

```bash
nvm install
nvm use
```

## 4) Instalar dependencias

```bash
cd frontend
npm ci
```

> Si no tenés lockfile consistente, podés usar `npm install`, pero para reproducibilidad se recomienda `npm ci`.

## 5) Ejecutar aplicación

```bash
npm run start
```

## 6) URL local esperada

- http://localhost:4200/

## 7) Comandos útiles

Desde `frontend/`:

- Desarrollo: `npm run start`
- Build: `npm run build`
- Tests: `npm run test`

## 8) Variables de entorno

Actualmente, el proyecto **no requiere variables de entorno obligatorias** para correr en local.

Se incluye `frontend/.env.example` como plantilla para futuras integraciones (API, backend o despliegue en contenedores).

## 9) Problemas comunes y solución

### a) `ng` no reconocido

Usar scripts npm en lugar de comando global:

```bash
npm run start
```

### b) Puerto 4200 ocupado

Ejecutar en otro puerto:

```bash
npx ng serve --port 4201
```

### c) Error por versión de Node

Verificar versión:

```bash
node -v
```

Ajustar con nvm:

```bash
nvm use
```

### d) Fallo al instalar dependencias por caché corrupta

```bash
npm cache verify
npm ci
```

### e) Tests en entorno sin navegador disponible

Algunos entornos necesitan Chrome/Chromium para Karma. Si falla `npm run test`, verificar instalación del navegador local.

## 10) Preparación para Docker (futuro)

Sin dockerizar todavía, conviene dejar preparado:

1. `.nvmrc` (ya agregado) para alinear versión Node.
2. `frontend/.env.example` (ya agregado) para declarar configuración externa.
3. `package.json` con scripts claros (ya está: start/build/test).
4. Definir estrategia de build y servidor estático para producción (`ng build` + Nginx, por ejemplo).
5. Agregar más adelante:
   - `Dockerfile`
   - `.dockerignore`
   - `docker-compose.yml` (opcional para desarrollo)

## 11) Organización recomendada (mínima y realista)

El proyecto ya está razonablemente modular. Mejoras mínimas sugeridas para mantener profesionalidad:

- Unificar naming de algunos componentes de landing a convención consistente (por ejemplo, `topbar-widget.component.ts`, `hero-widget.component.ts`) en una refactorización futura controlada.
- Mantener documentación de setup en `docs/` y README raíz orientado a onboarding.
- Evitar mezclar documentación académica (`Tareas/`) con documentación técnica de ejecución.