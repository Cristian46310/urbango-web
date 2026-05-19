# Routes, guards, and roles

Source: `src/app/App.tsx` and `management-layout.tsx` (keep aligned when changing).

## Public routes

| Path | Page |
|------|------|
| `/` | Redirect → `/login` |
| `/login` | Login |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/auth/github/callback` | GitHub OAuth |
| `/auth/microsoft/callback` | Microsoft OAuth |
| `/access-denied` | Access denied |

## Authenticated routes (`ProtectedRoute` + `ManagementLayout`)

| Path | RoleGuard `requiredRoles` | Notes |
|------|---------------------------|-------|
| `/app` | none (auth only) | Dashboard |
| `/app/users` | ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/permissions` | ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/profiles` | ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/roles` | ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/team` | none (auth only) | |
| `/app/nearby-stops` | CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/incident-report` | DRIVER, ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/ticket/alight` | CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER | |
| `/app/ticket/:ticketId/alight` | CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER | |

## RoleGuard behavior

`src/components/guards/RoleGuard.tsx`:

- Not authenticated → redirect `/login`
- Authenticated but missing role → redirect `/access-denied`
- Uses `authStore.hasAnyRole(requiredRoles)`

## Sidebar menu (`requiredRoles`)

**Security section** (hidden if user lacks any item role):

| Menu | Path | Roles |
|------|------|-------|
| Usuarios | `/app/users` | ADMIN, ADMIN_BUS, SUPERVISER |
| Perfiles | `/app/profiles` | same |
| Roles | `/app/roles` | same |
| Permisos | `/app/permissions` | same |

**Business section:**

| Menu | Path | Roles |
|------|------|-------|
| Paraderos | `/app/nearby-stops` | CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER |
| Descenso | `/app/ticket/alight` | same |
| Reportar | `/app/incident-report` | DRIVER, ADMIN, ADMIN_BUS, SUPERVISER |

**Always visible (auth only):** Dashboard (`/app`), Equipo (`/app/team`).

## CITIZEN vs CITEZEN

- JWT / backend may emit `CITEZEN` (see `ROLES.CITIZEN` in `Roles.ts`)
- `App.tsx` and menu use literal `'CITIZEN'`

When debugging citizen access, verify the token payload matches guard strings. Align all three places if changing.

## Checklist: new protected route

```
- [ ] RoleGuard in App.tsx with correct requiredRoles
- [ ] Menu item in management-layout.tsx (same roles)
- [ ] Page export in app/pages/index.tsx
- [ ] Optional: ROLE_GROUPS entry in Roles.ts + useCanAccess
- [ ] Update docs/TESTING_RBAC.md scenario if behavior is new
- [ ] Manual test with JWT for allowed and denied roles
```

## Manual testing

No automated auth tests. Follow `docs/TESTING_RBAC.md`:

- Login as each role type
- Confirm menu visibility and direct URL access
- Confirm 401 clears session and returns to login
