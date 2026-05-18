---
name: dev-backendui-rbac
description: Explains JWT auth, RoleGuard, AuthService, and role constants in dev-backendUI-uc. Use when adding routes, menu items, login flows, or permission checks.
disable-model-invocation: true
---

# RBAC and Authentication

## Two meanings of "permission"

| Level | Mechanism | Purpose |
|-------|-----------|---------|
| **Route / UI access** | JWT `roles` claim + `RoleGuard` | Who can open a page or see a menu item |
| **Permission entities** | CRUD on `/api/permissions`, role-permission assignment | Admin data in ms-security; does **not** replace route guards |

Do not assume assigning a permission record grants UI access without a matching JWT role.

## Auth flow

```
Login (loginStore) → JWT stored as authToken → authStore.setToken / initializeAuth
→ ProtectedRoute (/app/*) → RoleGuard (per route) → Page
```

| Step | File |
|------|------|
| Token storage / decode | `src/services/AuthService.ts` (`localStorage` key: `authToken`) |
| Session state | `src/store/security/authStore.ts` |
| App bootstrap | `src/app/App.tsx` — `initializeAuth()` on mount |
| Require login | `src/components/guards/ProtectedRoute.tsx` |
| Require roles | `src/components/guards/RoleGuard.tsx` |
| 401 → logout + `/login` | `src/hooks/security/useHttpErrorHandler.ts` |
| 403 → `/access-denied` | same hook (wired to `httpMsSecurity` only) |

`AuthService` decodes JWT client-side (no signature verification). Supports `roles` as array or comma/space-separated string.

## Role constants

`src/core/domain/entities/security/Roles.ts`:

- `ADMIN`, `ADMIN_BUS`, `SUPERVISER` (spelling matches backend)
- `DRIVER`
- `CITIZEN` — constant key maps to value `'CITEZEN'` (backend typo)

`ROLE_GROUPS` for semantic checks: `src/hooks/security/useCanAccess.ts`.

## Menu vs route guards

`management-layout.tsx` filters sidebar items by `hasAnyRole(requiredRoles)`.

`RoleGuard` blocks navigation to unauthorized routes.

**Keep both in sync** when adding a feature: same role strings in `App.tsx`, layout menu, and docs.

## Login variants

Handled in `loginStore` + `LoginRepository`:

- Email/password + 2FA
- Google (`@react-oauth/google`)
- GitHub / Microsoft OAuth + complete-registration callbacks
- Forgot / reset password
- reCAPTCHA: `src/config/recaptcha.ts`

## Adding a protected screen

1. Wrap route with `RoleGuard` in `App.tsx`
2. Add menu entry with `requiredRoles` in `management-layout.tsx`
3. Use `ROLES` / `ROLE_GROUPS` in hooks when checking in components
4. Manual test per `docs/TESTING_RBAC.md`

Route → roles table: [guards-and-roles.md](guards-and-roles.md).

## Docs

- `docs/ROLE_BASED_ACCESS_CONTROL.md`
- `docs/TESTING_RBAC.md`
