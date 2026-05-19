# Testing Role-Based Access Control

## Manual Testing Scenarios

### Scenario 1: CITIZEN User
**Roles:** `["CITIZEN"]`

Expected behavior:
- ✅ Can access `/app` (Home)
- ✅ Can access `/app/nearby-stops`
- ✅ Can access `/app/ticket/alight`
- ✅ Can access `/app/team`
- ❌ Cannot access `/app/incident-report` (redirect to access-denied)
- ❌ Cannot access `/app/users` (redirect to access-denied)
- ❌ Security menu is NOT visible in sidebar
- ✅ Business menu shows: Paraderos, Descenso

### Scenario 2: DRIVER User
**Roles:** `["DRIVER"]`

Expected behavior:
- ✅ Can access `/app` (Home)
- ✅ Can access `/app/nearby-stops`
- ✅ Can access `/app/ticket/alight`
- ✅ Can access `/app/incident-report`
- ✅ Can access `/app/team`
- ❌ Cannot access `/app/users` (redirect to access-denied)
- ❌ Security menu is NOT visible
- ✅ Business menu shows: Paraderos, Descenso, Reportar

### Scenario 3: ADMIN User
**Roles:** `["ADMIN"]`

Expected behavior:
- ✅ Can access ALL routes
- ✅ Security menu is visible with: Usuarios, Perfiles, Roles, Permisos
- ✅ Business menu shows: Paraderos, Descenso, Reportar
- ✅ Can access `/app/users`
- ✅ Can access `/app/incident-report`

### Scenario 4: ADMIN_BUS User
**Roles:** `["ADMIN_BUS"]`

Same as ADMIN user (has same permissions)

### Scenario 5: SUPERVISER User
**Roles:** `["SUPERVISER"]`

Same as ADMIN user (has same permissions)

## Testing Steps

### 1. Verify Menu Filtering

**With CITIZEN role:**
```
Sidebar should show:
- Home
- Team
- Business (only Paraderos, Descenso)
```

**With DRIVER role:**
```
Sidebar should show:
- Home
- Team
- Business (Paraderos, Descenso, Reportar)
```

**With ADMIN role:**
```
Sidebar should show:
- Home
- Security (Usuarios, Perfiles, Roles, Permisos)
- Team
- Business (Paraderos, Descenso, Reportar)
```

### 2. Test Direct URL Access

```typescript
// Browser console
// Check current user
const { currentUser, hasAnyRole } = useAuthStore.getState();
console.log('Current user roles:', currentUser?.roles);
console.log('Can access admin:', hasAnyRole(['ADMIN', 'ADMIN_BUS', 'SUPERVISER']));
```

### 3. Test Token Expiration

1. Open DevTools → Application → Local Storage
2. Find `authToken` entry
3. Replace with expired token (exp timestamp in the past)
4. Refresh page
5. Should redirect to `/login`

### 4. Test Invalid Token

1. Modify `authToken` in localStorage to random text
2. Refresh page
3. Should redirect to `/login`

### 5. Test 403 Forbidden

1. Intercept network request
2. Mock 403 response from backend
3. Should redirect to `/access-denied`

## Code Examples

### Using in Components

```typescript
// Import the helper hook
import { useCanAccess } from '@/hooks/security';

export function MyComponent() {
  const { canAccessAdmin, canReportIncidents } = useCanAccess();

  return (
    <div>
      {canAccessAdmin() && <AdminPanel />}
      {canReportIncidents() && <ReportButton />}
    </div>
  );
}
```

### Using AuthStore directly

```typescript
import { useAuthStore } from '@/store/security/authStore';

export function FeatureCheck() {
  const { hasAnyRole, currentUser } = useAuthStore();

  if (!hasAnyRole(['DRIVER', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER'])) {
    return <div>Access Denied</div>;
  }

  return <IncidentReportForm />;
}
```

## Debugging

### Check Token Payload

```typescript
import { AuthService } from '@/services/AuthService';

const token = AuthService.getToken();
const decoded = AuthService.decodeToken(token);
console.log('Token payload:', decoded);
// Should show: { sub, email, roles: ['ROLE1', 'ROLE2'], ... }
```

### Check Auth Store State

```typescript
import { useAuthStore } from '@/store/security/authStore';

const { getState } = useAuthStore;
console.log('Auth store state:', getState());
```

### Verify API Calls

1. Open DevTools → Network tab
2. Make API request
3. Check request headers for `Authorization: Bearer {token}`
4. Check response status codes (401, 403, etc.)

## Common Issues

| Issue | Solution |
|-------|----------|
| Role names don't match | Use exact case: CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER |
| Menu items not hiding | Clear browser cache, check requiredRoles property |
| Always redirect to login | Check token validity, verify JWT format (3 parts) |
| Bearer token not sent | Verify token is in localStorage with key `authToken` |
| Redirects to access-denied | Verify user has required roles for route |
