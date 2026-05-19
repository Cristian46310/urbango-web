---
name: dev-backendui-api
description: Documents Axios clients, endpoints, env vars, and interceptors for ms-security and ms-business in dev-backendUI-uc. Use when adding API calls, env config, or debugging 401/403/CORS.
disable-model-invocation: true
---

# API Integration

## HTTP clients

`src/infra/api/builderHttp.ts`:

| Export | Env variable | Backend |
|--------|--------------|---------|
| `httpMsSecurity` | `VITE_URL_MS_SECURITY` | Security microservice |
| `httpMsBussines` | `VITE_URL_MS_BUSSINES` | Business microservice |

Factory: `src/infra/api/http.ts` — creates Axios instance per base URL.

## Request interceptor

- Reads `localStorage` key `authToken`
- Sets `Authorization: Bearer <token>` if header not already present

## Error handling

- `setErrorHandler()` on client — used by `useHttpErrorHandler` for **security client only**
- 401: clear token, navigate `/login`
- 403: navigate `/access-denied`
- Business client has **no** global handler; handle errors in store/component

## Endpoint registry

All paths in `src/infra/api/endpoints.ts` as `ENDPOINTS`:

- `SECURITY.*` — login, register, OAuth, 2FA (public)
- `USER`, `SESSION`, `ROLE`, `PROFILE`, `PERMISSION`, `USER_ROLE`, `ROLE_PERMISSION`
- `STOPS.NEARBY`, `INCIDENT_REPORTS.BASE`

Repositories import `ENDPOINTS` — never hardcode paths in pages.

## Which client to use

| Feature area | Client |
|--------------|--------|
| Login, users, roles, permissions, profiles, sessions | `httpMsSecurity` |
| Nearby stops, incident reports, routes/stops (when wired) | `httpMsBussines` |

## Environment variables

Copy `.env.example` → `.env.local`:

```env
VITE_URL_MS_SECURITY=http://localhost:8080
VITE_URL_MS_BUSSINES=http://localhost:8081
```

Also used (see `src/config/`):

- `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_SCOPE` — OAuth
- `VITE_RECAPTCHA_SITE_KEY` — reCAPTCHA

Vite exposes only `VITE_*` to the client.

## Repository pattern

Preferred:

```ts
// infra/repository/security/RoleRepository.ts
import { httpMsSecurity } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';

export class RoleRepository implements IRoleRepository {
  async getById(id: string) {
    const { data } = await httpMsSecurity.get(ENDPOINTS.ROLE.BY_ID(id));
    return mapToRole(data);
  }
}
```

Legacy exception: `src/infra/repository/stop.ts` — object export; new code should use class + interface.

## Direct API in components (avoid for new code)

`IncidentReportButton.tsx` posts directly to `httpMsBussines` — prefer repository + use case for consistency.

## OpenAPI / backend docs

- `docs/openapi/` — API specs
- `docs/BACKEND_INTEGRATION.md`

Full endpoint and env tables: [endpoints-and-env.md](endpoints-and-env.md).
