---
name: dev-backendui-architecture
description: Guides adding features through entity, port, use case, repository, store, hook, and page in dev-backendUI-uc clean architecture. Use when creating CRUD, use cases, stores, hooks, or refactoring layers.
disable-model-invocation: true
---

# Clean / Hexagonal Architecture

Mandatory data flow for new features:

```
page.tsx → useX() hook → useXStore → XUseCase.execute() → IXRepository → XRepository → axios
```

## Layer paths (actual codebase)

| Layer | Path | Example |
|-------|------|---------|
| Entity | `src/core/domain/entities/` | `security/Role.ts` |
| Port | `src/core/domain/interfaces/` | `security/IRoleRepository.ts` |
| Use case | `src/core/applications/security\|business/` | `role/getRoleUseCase.ts` |
| Adapter | `src/infra/repository/security\|business/` | `RoleRepository.ts` |
| Store | `src/store/security\|business/` | `roleStore.ts` |
| Hook | `src/hooks/security\|business/` | `useRole.ts` |
| Page | `src/app/pages/**/page.tsx` | `security/roles/page.tsx` |
| Feature UI | `src/app/components/` | `security/data-table.tsx` |

`docs/CLEAN_ARCHITECTURE.md` uses generic folder names; follow the table above.

## Composition root

**Stores wire dependencies at module load** — not in React components:

```ts
const roleRepository = new RoleRepository();
const getRoleUseCase = new GetRoleUseCase(roleRepository);

export const useRoleStore = create((set) => ({
  fetchRole: async (id) => getRoleUseCase.execute(id),
}));
```

Reference: `src/store/security/roleStore.ts`.

## Hard rules

1. **Pages/components** consume hooks only — no `axios`, no repository imports.
2. **Use cases** depend on interfaces only — no `infra/` imports.
3. **Repositories** implement ports and call `httpMsSecurity` or `httpMsBussines`.
4. **Toasts and loading UX** live in the store via `src/lib/toast.ts`.
5. **Endpoints** come from `src/infra/api/endpoints.ts` — no hardcoded paths in UI.
6. **Naming:** `GetRoleUseCase` + `execute()`, `IRoleRepository`, `useRoleStore`, `useRole`.

## Use case template

```ts
export class GetRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(roleId: string): Promise<Role> {
    return this.roleRepository.getById(roleId);
  }
}
```

## After adding a routed feature

1. Register route in `src/app/App.tsx` (+ `RoleGuard` if restricted).
2. Add sidebar item in `src/app/components/security/management-layout.tsx`.
3. Export page from `src/app/pages/index.tsx`.

Full checklist: [scaffold-checklist.md](scaffold-checklist.md).

## Templates by domain

| Domain | Copy from |
|--------|-----------|
| Security CRUD | roles: `roles/page.tsx`, `roleStore`, `GetRoleUseCase`, `RoleRepository` |
| Business + geo | nearby stops: `geolocationStore`, `GetUserGeolocation`, `stop.ts` / `StopRepository` |

## Exceptions

- `src/app/cases/geolocation/` — geolocation use case outside `core/applications`
- `src/infra/repository/stop.ts` — legacy object repo; new code uses class + `IStopRepository`

## Shared types

Pagination: `src/core/types/Page.ts`, `PageableQuery`.
