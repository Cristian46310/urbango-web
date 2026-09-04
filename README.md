# urbanGO Web

Frontend SPA del ecosistema **urbanGO**: movilidad urbana y transporte público. Permite a ciudadanos, conductores y administradores gestionar rutas, flota, turnos, incidentes, recargas, PQRS, mensajería y seguridad (RBAC), consumiendo microservicios vía REST y WebSocket.

Repositorio: [https://github.com/Cristian46310/urbango-web](https://github.com/Cristian46310/urbango-web)

## Stack

| Capa | Librerías |
|------|-----------|
| Build | Vite, TypeScript, Tailwind CSS |
| UI | React 19, React Router, Radix UI / shadcn, Lucide |
| Estado | Zustand |
| HTTP / tiempo real | Axios, Socket.IO |
| Mapas | Leaflet, react-leaflet |
| Tablas y gráficos | TanStack Table, Chart.js, Recharts |
| Auth | Google OAuth (`@react-oauth/google`) |
| Utilidades | date-fns, Sonner, class-variance-authority, clsx, tailwind-merge |

Arquitectura hexagonal: `app` (UI) → `hooks` / `store` → `core` (dominio y casos de uso) → `infra` (API y repositorios).

## Requisitos

- Node.js 20+
- npm
- Backends locales con CORS para `http://localhost:5173`

## Instalación

```bash
git clone https://github.com/Cristian46310/urbango-web.git
cd urbango-web

npm install
cp .env.example .env
npm run dev
```

La app queda en `http://localhost:5173`.

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run preview` | Vista previa del build |

## Variables de entorno

Copia `.env.example` a `.env`. Principales:

| Variable | Uso |
|----------|-----|
| `VITE_URL_MS_SECURITY` | Auth, usuarios, RBAC |
| `VITE_URL_MS_BUSSINES` | Tránsito, flota, ciudadanos |
| `VITE_URL_MS_MESSAGES` | Chat / grupos |
| `VITE_URL_MS_AI` / `VITE_MS_AI_URL` | PQRS / IA |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Google |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA en login |
| `VITE_EPAYCO_TEST` | Modo prueba ePayco |
| `VITE_OSRM_URL` | Motor de rutas (opcional) |

## Microservicios

| Servicio | Puerto típico | Rol |
|----------|---------------|-----|
| ms-security | 8080 | Login, JWT, usuarios, roles |
| ms-business | 3000 | Paradas, rutas, flota, turnos, incidentes |
| ms-messages | 3001 | Mensajería en tiempo real |
| ms-ai | 8001 | PQRS e IA |

## Licencia

MIT — ver [`LICENSE`](LICENSE).
