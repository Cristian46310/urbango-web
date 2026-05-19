# Endpoints and environment reference

## Environment → client

| Variable | Client | Default (example) |
|----------|--------|-------------------|
| `VITE_URL_MS_SECURITY` | `httpMsSecurity` | `http://localhost:8080` |
| `VITE_URL_MS_BUSSINES` | `httpMsBussines` | (set in `.env.local`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth provider | `src/config/oauth.ts` |
| `VITE_GOOGLE_SCOPE` | Google OAuth | `src/config/oauth.ts` |
| `VITE_RECAPTCHA_SITE_KEY` | Login/register | `src/config/recaptcha.ts` |

## Security — public auth (`ENDPOINTS.SECURITY`)

| Key | Path |
|-----|------|
| LOGIN | `/api/public/security/login` |
| REGISTER | `/api/public/security/register` |
| FORGOT_PASSWORD | `/api/public/security/forgot-password` |
| RESET_PASSWORD | `/api/public/security/reset-password` |
| VERIFY_2FA | `/api/public/security/verify-2fa` |
| LOGIN_GOOGLE | `/api/public/security/login/google` |
| LOGIN_GITHUB_AUTHORIZE | `/api/public/security/login/github/authorize` |
| LOGIN_GITHUB | `/api/public/security/login/github` |
| LOGIN_GITHUB_COMPLETE | `/api/public/security/login/github/complete` |
| LOGIN_MICROSOFT_AUTHORIZE | `/api/public/security/login/microsoft/authorize` |
| LOGIN_MICROSOFT | `/api/public/security/login/microsoft` |
| LOGIN_MICROSOFT_COMPLETE | `/api/public/security/login/microsoft/complete` |

## Security — CRUD (authenticated)

| Group | Base path |
|-------|-----------|
| USER | `/api/public/users` |
| SESSION | `/api/sessions` |
| ROLE | `/api/roles` |
| PROFILE | `/api/profiles` |
| PERMISSION | `/api/permissions` |
| USER_ROLE | `/api/public/user-role/...` |
| ROLE_PERMISSION | `/api/role-permission/...` |

Dynamic segments use helpers, e.g. `ENDPOINTS.ROLE.BY_ID(id)`.

## Business (`httpMsBussines`)

| Key | Path | Used by |
|-----|------|---------|
| STOPS.NEARBY | `/stop/nearby` | Nearby stops, geolocation |
| INCIDENT_REPORTS.BASE | `/incident-reports/driver` | Driver incident report |

## Repository → client map

| Repository | Client |
|------------|--------|
| `LoginRepository` | `httpMsSecurity` |
| `UserRepository`, `RoleRepository`, `PermissionRepository`, `ProfileRepository`, `SessionRepository`, `UserRoleRepository`, `RolePermissionRepository` | `httpMsSecurity` |
| `stop.ts`, `StopRepository`, `RouteRepository` | `httpMsBussines` |

## Adding a new endpoint

1. Add constant to `src/infra/api/endpoints.ts`
2. Use in repository method only
3. If new microservice boundary, extend `builderHttp.ts` (rare — prefer existing clients)

## Debugging checklist

- CORS: backend must allow frontend origin
- 401 on security API: token missing/expired → `useHttpErrorHandler` redirects
- Wrong service: security path on business client (or reverse) → 404 or wrong data
- Env not loaded: restart `npm run dev` after changing `.env.local`

## OpenAPI

Specs under `docs/openapi/` for contract details beyond this list.
