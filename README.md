# Emergencias — Web (Angular 18+)

Panel web para talleres y administradores. Especificación: `docs/05_WEB_ANGULAR_SPEC.md`.

## Requisitos

- Node.js 18+
- Backend FastAPI en `http://localhost:8000`

## Instalación

```bash
cd web
npm install
npm start
```

Abrir `http://localhost:4200`.

## Cuentas demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Taller | centro@auxilionorte.com | password123 |
| Admin tenant | ana@auxilionorte.com | password123 |
| Admin plataforma | admin@plataforma.com | password123 |

## Rutas

- `/login` — autenticación JWT
- `/requests` — bandeja taller (WebSocket)
- `/availability` — disponibilidad taller
- `/kpis` — dashboard ECharts
- `/sla` — configuración SLA (ADM)
- `/admin/tenants` — gestión tenants (ADM)
