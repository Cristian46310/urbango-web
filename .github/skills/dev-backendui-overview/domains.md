# Domain map — features, routes, and layers

## Security / identity (ms-security)

| Feature | Route | RoleGuard roles | Page | Store | Repository |
|---------|-------|-----------------|------|-------|------------|
| Login / 2FA / register | `/login`, etc. | — | `app/pages/security/login/` | `loginStore` | `LoginRepository` |
| Forgot / reset password | `/forgot-password`, `/reset-password` | — | login pages | `loginStore` | `LoginRepository` |
| OAuth callbacks | `/auth/github/callback`, `/auth/microsoft/callback` | — | login pages | `loginStore` | `LoginRepository` |
| Dashboard | `/app` | auth only | `dashboard/page.tsx` | — | — |
| Users CRUD | `/app/users` | ADMIN, ADMIN_BUS, SUPERVISER | `security/users/page.tsx` | `userStore` | `UserRepository` |
| Profiles CRUD | `/app/profiles` | same | `security/profiles/page.tsx` | `profileStore` | `ProfileRepository` |
| Roles CRUD | `/app/roles` | same | `security/roles/page.tsx` | `roleStore` | `RoleRepository` |
| Permissions CRUD | `/app/permissions` | same | `security/permissions/page.tsx` | `permissionStore` | `PermissionRepository` |
| Team showcase | `/app/team` | auth only | `team/page.tsx` | — | — |

Supporting use cases: user-role assignment, role-permission assignment, sessions (`src/core/applications/security/`).

## Transit / business (ms-business)

| Feature | Route | RoleGuard roles | Page | Store / data |
|---------|-------|-----------------|------|--------------|
| Nearby stops | `/app/nearby-stops` | CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER | `business/nearby-stops/page.tsx` | `geolocationStore`, `stop.ts` or `StopRepository` |
| Ticket alight search | `/app/ticket/alight` | same | `business/ticket/` | ticket components |
| Ticket alight validation | `/app/ticket/:ticketId/alight` | same | `business/ticket/` | ticket components |
| Incident report | `/app/incident-report` | DRIVER, ADMIN, ADMIN_BUS, SUPERVISER | `business/incident-report/page.tsx` | direct `httpMsBussines` in component |

## Not routed (exist but unused in App.tsx)

| Page path | Notes |
|-----------|-------|
| `business/stops/page.tsx` | Stops admin — wire route + guard before use |
| `business/routes/page.tsx` | Routes admin — same |

## Cross-cutting

| Concern | Location |
|---------|----------|
| JWT session | `services/AuthService.ts`, `store/security/authStore.ts` |
| Route auth | `components/guards/ProtectedRoute.tsx` |
| Role-based pages | `components/guards/RoleGuard.tsx` |
| Sidebar menu filter | `app/components/security/management-layout.tsx` |
| HTTP 401/403 | `hooks/security/useHttpErrorHandler.ts` (security client only) |
| Toasts | `lib/toast.ts`, Sonner in `App.tsx` |

## Choosing a microservice

- User, role, permission, profile, session, login → **ms-security** (`httpMsSecurity`)
- Stops nearby, incident reports, routes (when wired) → **ms-business** (`httpMsBussines`)
