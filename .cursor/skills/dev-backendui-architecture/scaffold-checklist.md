# Feature scaffold checklist

Copy and track when adding a new domain feature.

```
Progress:
- [ ] 1. Entity + DTOs
- [ ] 2. Repository interface (port)
- [ ] 3. Use case(s)
- [ ] 4. Repository implementation
- [ ] 5. Endpoint constant(s)
- [ ] 6. Zustand store
- [ ] 7. Hook
- [ ] 8. Page + components
- [ ] 9. Router + guard + menu
- [ ] 10. Manual smoke test
```

## 1. Entity + DTOs

`src/core/domain/entities/{security|business}/YourEntity.ts`

- Domain fields only (no axios shapes in entity if avoidable)
- `CreateYourEntityDTO`, `UpdateYourEntityDTO` as needed

## 2. Port

`src/core/domain/interfaces/{security|business}/IYourRepository.ts`

```ts
export interface IYourRepository {
  getById(id: string): Promise<YourEntity>;
  getAll(pageable?: PageableQuery): Promise<Page<YourEntity>>;
  create(data: CreateYourEntityDTO): Promise<YourEntity>;
  // update, delete as needed
}
```

## 3. Use cases

`src/core/applications/{security|business}/yourEntity/`

- One file per operation: `getYourEntityUseCase.ts`, `postYourEntityUseCase.ts`
- Class with `constructor(private readonly repo: IYourRepository)` and `execute(...)`

## 4. Repository

`src/infra/repository/{security|business}/YourRepository.ts`

- `implements IYourRepository`
- Use `httpMsSecurity` or `httpMsBussines` (see `dev-backendui-api` skill)
- Map API JSON → entity inside the repository

Export from `src/infra/repository/security/index.ts` if applicable.

## 5. Endpoints

`src/infra/api/endpoints.ts` — add under `ENDPOINTS.YOUR_ENTITY`

## 6. Store

`src/store/{security|business}/yourEntityStore.ts`

```ts
const repo = new YourRepository();
const getUseCase = new GetYourEntityUseCase(repo);

export const useYourEntityStore = create((set) => ({
  loading: false,
  error: null,
  fetchOne: async (id) => { /* toast + set loading + execute */ },
}));
```

Export from `src/store/index.ts` for security stores.

## 7. Hook

`src/hooks/{security|business}/useYourEntity.ts`

- `useMemo` selectors from store
- Friendly names: `loadItems` wrapping `fetchAllItems`

## 8. Page + components

- `src/app/pages/.../page.tsx` — default export, uses hook only
- Reuse `src/app/components/security/data-table.tsx` pattern for admin CRUD
- shadcn components from `@/components/ui/*`

## 9. Router + guard + menu

**`src/app/App.tsx`**

```tsx
<Route
  path="your-path"
  element={
    <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
      <YourPage />
    </RoleGuard>
  }
/>
```

**`management-layout.tsx`** — add to `securityMenuItems` or `businessMenuItems` with matching `requiredRoles`.

**`src/app/pages/index.tsx`** — export `YourPage`.

## 10. Manual test

- Security features: `docs/TESTING_RBAC.md`
- Verify loading toasts, error toasts, and 401 redirect if token expired

## Security CRUD reference files

| Artifact | File |
|----------|------|
| Page | `src/app/pages/security/roles/page.tsx` |
| Hook | `src/hooks/security/useRole.ts` |
| Store | `src/store/security/roleStore.ts` |
| Use case | `src/core/applications/security/role/getRoleUseCase.ts` |
| Port | `src/core/domain/interfaces/security/IRoleRepository.ts` |
| Repo | `src/infra/repository/security/RoleRepository.ts` |

## Business reference files

| Artifact | File |
|----------|------|
| Page | `src/app/pages/business/nearby-stops/page.tsx` |
| Geolocation | `src/store/geolocationStore.ts`, `src/app/cases/geolocation/GetUserGeolocation.ts` |
| Stop API | `src/infra/repository/stop.ts` or `business/StopRepository.ts` |
