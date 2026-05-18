---
name: dev-backendui-overview
description: Describes the dev-backendUI-uc Vite/React SPA for U Caldas transit and security admin. Use when working in this repository, onboarding, scoping tasks, or choosing security vs business modules.
disable-model-invocation: true
---

# dev-backendUI-uc — Project Overview

SPA frontend for **U Caldas** transit operations and **ms-security** administration. Not a Next.js app.

## Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 7, TypeScript ~5.9, ESM |
| UI | React 19, React Router 7 |
| State | Zustand |
| HTTP | Axios (two base URLs) |
| Components | shadcn/ui (new-york), Radix, Tailwind CSS 4 |
| Maps | Leaflet + react-leaflet |
| Tables | TanStack Table (security admin) |

Scripts: `npm run dev`, `build`, `lint`, `preview`.

## Critical conventions

- **`page.tsx` files are not Next.js App Router.** Routing lives in `src/app/App.tsx` with `BrowserRouter`.
- **Source code in English; UI labels in Spanish** (sidebar, toasts).
- **Path alias:** `@/*` → `src/*`.
- **Git flow:** features `feat/XXX/yyy`, fixes `fix/XXX/yyy`; PRs target `dev`, not direct merge to `main`.

## Directory map (`src/`)

| Path | Role |
|------|------|
| `app/App.tsx` | Route definitions |
| `app/pages/**/page.tsx` | Screen components |
| `app/components/` | Feature UI (login, security CRUD, maps, tickets) |
| `components/ui/` | shadcn primitives (ESLint-ignored) |
| `components/guards/` | `ProtectedRoute`, `RoleGuard` |
| `core/domain/entities/` | Domain models |
| `core/domain/interfaces/` | Repository ports (`I*Repository`) |
| `core/applications/` | Use cases (`*UseCase.ts`, `execute()`) |
| `infra/api/` | Axios client, `endpoints.ts` |
| `infra/repository/` | HTTP adapters |
| `store/` | Zustand — composition root for use cases |
| `hooks/` | Thin wrappers over stores |
| `services/AuthService.ts` | JWT in `localStorage` |
| `config/` | OAuth, reCAPTCHA env wrappers |

## Two domains

| Domain | Microservice env | HTTP client |
|--------|------------------|-------------|
| Security / identity | `VITE_URL_MS_SECURITY` | `httpMsSecurity` |
| Transit / business | `VITE_URL_MS_BUSSINES` | `httpMsBussines` |

See [domains.md](domains.md) for feature → route → store mapping.

## Active features (routed)

**Public:** `/login`, forgot/reset password, GitHub/Microsoft OAuth callbacks, `/access-denied`.

**Authenticated (`/app/*`, `ProtectedRoute`):**
- Dashboard, team
- Security CRUD: users, profiles, roles, permissions
- Business: nearby stops, ticket alight, incident report

## Orphan pages (not in router)

Do not assume these are reachable:
- `src/app/pages/business/stops/page.tsx`
- `src/app/pages/business/routes/page.tsx`

## Known inconsistencies (do not fix unless asked)

- Env/client typo: `BUSSINES` (not BUSINESS)
- `ROLES.CITIZEN` value is `'CITEZEN'` in `Roles.ts`; `App.tsx` / menu use string `'CITIZEN'`
- Legacy repo: `src/infra/repository/stop.ts` (object) vs class + interface pattern

## Related skills

| Skill | When to use |
|-------|-------------|
| `dev-backendui-architecture` | New CRUD, use cases, stores, hooks |
| `dev-backendui-rbac` | Routes, guards, login, menu visibility |
| `dev-backendui-api` | Endpoints, env, HTTP clients |

## Project docs

- `docs/CLEAN_ARCHITECTURE.md` — layer flow
- `docs/ROLE_BASED_ACCESS_CONTROL.md` — RBAC
- `docs/BACKEND_INTEGRATION.md`, `docs/TESTING_RBAC.md`
- `docs/DEPENDENCES.md` — dependency reference (do not duplicate in skills)

## Testing

No Vitest/Jest/Playwright. CI runs `lint` + `build`. Auth changes: manual checks per `docs/TESTING_RBAC.md`.
