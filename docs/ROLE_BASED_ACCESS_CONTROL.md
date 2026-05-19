# Role-Based Access Control (RBAC) Implementation

This document describes the complete implementation of frontend role-based access control using JWT roles claim.

## Overview

The frontend implements a multi-layered role-based access control system that:
1. Reads roles from JWT token claim (`token.roles` array)
2. Validates roles at route level (RoleGuard)
3. Filters navigation menu items by user roles
4. Handles 401/403 HTTP errors appropriately
5. Attaches Bearer token to all API requests

## Role Definitions

**Backend Role Names** (must match exactly):
- `ADMIN` - Full system access
- `ADMIN_BUS` - Bus administrator access
- `SUPERVISER` - Supervisor access (note: SUPERVISER, not SUPERVISOR)
- `DRIVER` - Driver/bus operator access
- `CITIZEN` - Regular citizen/passenger access

**Source:** `/src/core/domain/entities/security/Roles.ts`

## Authentication Flow

### 1. Token Initialization (`AuthService`)

```typescript
// Token validation on app startup
const token = AuthService.getToken();
if (!token || AuthService.isTokenExpired(token)) {
  // Redirect to login
}
```

**Path:** `/src/services/AuthService.ts`

Key methods:
- `decodeToken(token)` - Decode JWT without verification (client-side only)
- `isTokenExpired(token)` - Check if token is expired
- `hasRole(role)` - Check for specific role
- `hasAnyRole(roles[])` - Check if user has ANY of the provided roles (primary method)
- `hasAllRoles(roles[])` - Check if user has ALL of the provided roles

### 2. Auth Store (`useAuthStore`)

Zustand store that:
- Manages authentication state
- Exposes `hasRole()` and `hasAnyRole()` methods
- Keeps current user info with roles array

**Path:** `/src/store/security/authStore.ts`

```typescript
const { currentUser, hasAnyRole } = useAuthStore();
// currentUser = { id, email, roles: ['DRIVER', 'ADMIN'] }
```

## Route-Level Access Control

### RoleGuard Component

Wraps routes to enforce role-based access:

```typescript
<Route
  path="/app/users"
  element={
    <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
      <UsersPage />
    </RoleGuard>
  }
/>
```

**Behavior:**
- ✅ Token valid + has required roles → Render component
- ✅ No requiredRoles specified → Allow access
- ❌ Token missing/expired → Redirect to `/login`
- ❌ Authenticated but no required roles → Redirect to `/access-denied`

**Path:** `/src/components/guards/RoleGuard.tsx`

## Role Matrix

### Admin Views (ADMIN, ADMIN_BUS, SUPERVISER)
- `/app/users` - User management
- `/app/permissions` - Permission management
- `/app/roles` - Role management
- `/app/profiles` - Profile management

### Business Features
- `/app/nearby-stops` - View nearby stops
  - Access: CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER
- `/app/ticket/alight` - Validate ticket descent
  - Access: CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER
- `/app/incident-report` - Report incidents
  - Access: DRIVER, ADMIN, ADMIN_BUS, SUPERVISER

### Public/Team
- `/app/team` - Team page (accessible to all authenticated users)
- `/app` - Home/Dashboard (accessible to all authenticated users)

## Navigation Menu Filtering

### Management Layout Component

The sidebar dynamically filters menu items based on user roles:

```typescript
// Only show security menu items user has access to
const visibleSecurityItems = securityMenuItems.filter(
  (item) => !item.requiredRoles || hasAnyRole(item.requiredRoles)
);

// Hide entire section if no visible items
{visibleSecurityItems.length > 0 && (
  <SidebarMenuItem>
    {/* Security menu section */}
  </SidebarMenuItem>
)}
```

**Path:** `/src/app/components/security/management-layout.tsx`

Menu sections:
1. **Security** - Hidden for users without admin roles
2. **Business** - Shows only items user has access to
3. **Team** - Always visible (no role restrictions)

## HTTP Error Handling

### Bearer Token Interceptor

Automatically adds token to all API requests:

```typescript
// Request interceptor
headers.set('Authorization', `Bearer ${token}`);
```

**Path:** `/src/infra/api/http.ts`

### HTTP Error Handler Hook

Handles authentication/authorization errors:

```typescript
// 401 Unauthorized → clear token, redirect to /login
// 403 Forbidden → redirect to /access-denied
```

**Path:** `/src/hooks/security/useHttpErrorHandler.ts`

Registered in App.tsx:
```typescript
function AppContent() {
  useHttpErrorHandler(); // Set up error handlers
  // ...
}
```

## Token Structure

Expected JWT payload format:

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  roles: ["DRIVER", "ADMIN"],  // Array of role strings
  iat: 1234567890,
  exp: 1234571490,
  // ... other claims
}
```

**Important:** Roles must be an array of strings. If token has no roles array, access is denied (not allowed for development).

## Implementation Checklist

- ✅ AuthService with role checking methods
- ✅ RoleGuard component for route protection
- ✅ Auth Store (Zustand) managing state and exposing role methods
- ✅ Route configuration with role matrix
- ✅ Navigation menu filtering
- ✅ Bearer token interceptor
- ✅ HTTP error handler (401/403 distinction)
- ✅ Role definitions constant file

## Testing Role-Based Access

### Manual Testing

1. **Login with different users:**
   - CITIZEN user should see: Home, Paraderos, Descenso
   - DRIVER user should see: Home, Paraderos, Descenso, Reportar
   - ADMIN user should see: Home + Security section, Business section

2. **Test direct URL access:**
   - `/app/users` should redirect CITIZEN to `/access-denied`
   - `/app/incident-report` should redirect CITIZEN to `/access-denied`
   - `/app/nearby-stops` should work for all roles

3. **Test token expiration:**
   - Expired token should redirect to `/login`
   - Invalid token should redirect to `/login`

### Browser Console Verification

```typescript
// Check current user roles
const { currentUser, hasAnyRole } = useAuthStore.getState();
console.log(currentUser.roles); // ['DRIVER', 'ADMIN']
console.log(hasAnyRole(['ADMIN', 'ADMIN_BUS'])); // true/false
```

## Troubleshooting

### Issue: Menu items not hiding

**Solution:** Verify `requiredRoles` are defined on menu items with exact role names (case-sensitive).

### Issue: User can access route directly despite guard

**Solution:** 
1. Check RoleGuard is wrapping the route
2. Verify `requiredRoles` has correct role names
3. Check token.roles array is populated correctly

### Issue: Bearer token not being sent

**Solution:**
1. Verify token is stored in localStorage with key `authToken`
2. Check HTTP client is initialized with `Http()` helper
3. Verify interceptors are being set up

### Issue: Always redirecting to login

**Solution:**
1. Check if token is expired: `AuthService.isTokenExpired(token)`
2. Verify token format is valid JWT (3 parts separated by dots)
3. Check token payload has `exp` and `roles` claims

## Security Considerations

⚠️ **Important:** Role-based access control on the frontend is for **UX purposes only**. 
Always implement equivalent checks on the backend because:
- Frontend checks can be bypassed by modifying client code
- JWT can be forged if not verified by backend
- All API endpoints must validate roles server-side

## Future Enhancements

- [ ] Role permission matrix (granular permissions)
- [ ] Dynamic role loading from backend
- [ ] Role-based feature flags
- [ ] Audit logging for access attempts
- [ ] Session management improvements
