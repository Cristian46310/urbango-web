# Backend Integration Guide for RBAC

## Expected JWT Token Format

The backend should return JWT tokens with the following structure:

```typescript
{
  // Standard JWT claims
  "sub": "user-id-123",              // User ID
  "email": "user@example.com",        // User email
  "iat": 1684939200,                  // Issued at
  "exp": 1684945600,                  // Expiration time (required for validation)
  
  // Role-based access control
  "roles": ["DRIVER", "ADMIN"],       // Array of role strings (REQUIRED)
  
  // Optional additional claims
  "name": "User Name",
  "aud": "your-app-id",
  "iss": "your-auth-service",
  // ... other claims
}
```

## Critical Requirements

### 1. Roles Must Be an Array

```typescript
✅ CORRECT:
{ "roles": ["CITIZEN", "DRIVER"] }

❌ INCORRECT:
{ "role": "CITIZEN" }                 // Single string, not array
{ "roles": "CITIZEN,DRIVER" }         // String, not array
```

### 2. Use Exact Role Names

The frontend uses these role names **exactly**:
- `CITIZEN` - Passenger/citizen
- `DRIVER` - Bus driver/operator
- `ADMIN` - System administrator
- `ADMIN_BUS` - Bus company administrator
- `SUPERVISER` - Supervisor (note: SUPERVISER not SUPERVISOR)

```typescript
✅ CORRECT:
{ "roles": ["DRIVER", "ADMIN"] }

❌ INCORRECT:
{ "roles": ["driver", "admin"] }      // Lowercase
{ "roles": ["Driver", "Admin"] }      // Mixed case
{ "roles": ["SUPERVISOR"] }           // Wrong name
```

### 3. Include Expiration Time

The `exp` claim is required for token validation:

```typescript
✅ CORRECT:
{
  "exp": Math.floor(Date.now() / 1000) + 3600,  // 1 hour from now
  "roles": ["DRIVER"]
}

❌ INCORRECT:
{ "roles": ["DRIVER"] }               // No exp claim
```

### 4. Include Sub Claim

The `sub` claim is used to identify the user:

```typescript
✅ CORRECT:
{ 
  "sub": "user-123",
  "roles": ["DRIVER"]
}

❌ INCORRECT:
{ "roles": ["DRIVER"] }               // No sub claim
```

## Backend Implementation Checklist

- [ ] JWT signed and verified on backend
- [ ] `sub` claim contains user ID
- [ ] `email` claim contains user email
- [ ] `roles` claim is an array of strings
- [ ] Role names match exactly (CITIZEN, DRIVER, ADMIN, ADMIN_BUS, SUPERVISER)
- [ ] `exp` claim is set to future timestamp
- [ ] Tokens expire after reasonable time (recommended: 1-24 hours)
- [ ] Refresh token endpoint for getting new tokens
- [ ] 401 response when token is invalid/expired
- [ ] 403 response when user lacks permission for endpoint
- [ ] Role validation on **every** API endpoint

## Example Backend Routes

```typescript
// Login endpoint - returns JWT
POST /auth/login
Request: { email, password }
Response: { token: "eyJhbGc..." }

// Refresh token endpoint
POST /auth/refresh
Headers: Authorization: Bearer {token}
Response: { token: "eyJhbGc..." }

// Protected endpoint - validates roles
GET /api/users
Headers: Authorization: Bearer {token}
Response: 200 if token valid + has ADMIN role
Response: 403 if token valid but lacks ADMIN role
Response: 401 if token invalid/expired

// Incident report - requires DRIVER role
POST /api/incidents
Headers: Authorization: Bearer {token}
Response: 200 if token valid + has DRIVER role
Response: 403 if CITIZEN user tries to access
Response: 401 if token invalid
```

## Frontend Behavior Based on Backend Responses

### Status 200 - OK
- Frontend processes data normally
- No auth state changes

### Status 401 - Unauthorized
- Invalid or expired token
- Frontend action:
  - Clears localStorage token
  - Redirects to `/login`
  - User must login again

### Status 403 - Forbidden
- Token valid but user lacks permission
- Frontend action:
  - Token remains valid
  - Redirects to `/access-denied`
  - User can access other permitted routes

## Testing Token Generation

### Generate Test Token (Node.js)

```typescript
import jwt from 'jsonwebtoken';

const SECRET = 'your-secret-key';

const token = jwt.sign(
  {
    sub: 'user-123',
    email: 'user@example.com',
    roles: ['DRIVER', 'ADMIN'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  SECRET,
  { algorithm: 'HS256' }
);

console.log(token);
```

### Decode Token (Browser Console)

```typescript
import { AuthService } from '@/services/AuthService';

const token = 'eyJhbGc...';
const decoded = AuthService.decodeToken(token);
console.log(decoded);
// Output: { sub, email, roles, iat, exp, ... }
```

## Error Scenarios

### Scenario 1: Missing Roles Claim

**Backend sends:**
```json
{ "sub": "user-123", "email": "user@example.com" }
```

**Frontend behavior:**
- `currentUser.roles` will be empty array `[]`
- User will have no access to protected routes
- `hasAnyRole(['DRIVER'])` will return `false`

**Solution:** Backend must always include roles claim

### Scenario 2: Invalid Role Name

**Backend sends:**
```json
{ "roles": ["DRIVER_SPECIAL", "ADMIN"] }
```

**Frontend behavior:**
- User has ADMIN role, so can access admin routes
- But won't be recognized as "DRIVER" for driver-specific routes
- Menu items for DRIVER-only features won't show

**Solution:** Use exact role names defined in requirements

### Scenario 3: Expired Token

**Token has:**
```json
{ "exp": 1684939200 }
```

**Current time:** 1684945600 (token expired 6400 seconds ago)

**Frontend behavior:**
- `AuthService.isTokenExpired(token)` returns `true`
- Token is removed from localStorage
- User is redirected to `/login`

**Solution:** Backend should set exp to future time

## Security Considerations

⚠️ **Backend must:**

1. **Always validate JWT signature** - Don't trust client-provided tokens
2. **Check token expiration** - Validate `exp` claim server-side
3. **Verify user roles** - Check roles claim on each protected endpoint
4. **Use HTTPS only** - Never send tokens over HTTP
5. **Set secure cookie flags** - If storing token in cookie
6. **Implement rate limiting** - On login/token endpoints
7. **Log security events** - Login attempts, permission denials
8. **Use strong secrets** - For JWT signing (minimum 256-bit)

⚠️ **Frontend assumes:**

1. Backend validates all tokens before serving data
2. Backend checks roles on protected endpoints
3. Backend returns 401 for expired/invalid tokens
4. Backend returns 403 for insufficient permissions
5. Token contains truthful role information

## Migration from Old System

If migrating from a different auth system:

1. Ensure new tokens have `roles` array claim
2. Update client code to read from `token.roles`
3. Test token format matches expectations
4. Verify all role names are updated throughout system
5. Update API endpoints to validate new roles
6. Test all permission scenarios
