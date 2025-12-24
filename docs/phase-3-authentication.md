# Phase 3: Authentication Implementation

## Overview

This phase implements Supabase authentication with STRICT email-only login restricted to @deped.gov.ph domains.

## What's Implemented

### 1. **Authentication Types** ([src/types/auth.ts](../src/types/auth.ts))

Complete TypeScript type definitions for auth state:

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface LoginCredentials {
  email: string; // Must be @deped.gov.ph
  password: string;
}
```

### 2. **Auth Composable** ([src/composables/useAuth.ts](../src/composables/useAuth.ts))

Reusable authentication logic:

**Functions:**

- `login(credentials)` - Login with @deped.gov.ph email validation
- `logout()` - Sign out from Supabase
- `getSession()` - Retrieve current session
- `getUser()` - Get current user data
- `validateDepEdEmail(email)` - STRICT @deped.gov.ph domain validation

**Email Validation Rules:**

```typescript
✅ teacher@deped.gov.ph      // Valid
✅ juan.delacruz@deped.gov.ph // Valid
❌ teacher@gmail.com          // Rejected
❌ admin@school.edu.ph        // Rejected
❌ user@deped.com             // Rejected
```

### 3. **Pinia Auth Store** ([src/stores/auth.ts](../src/stores/auth.ts))

Global authentication state management:

**State:**

- `user` - Current authenticated user
- `session` - Active Supabase session
- `loading` - Auth operation status
- `initialized` - Store initialization flag

**Computed:**

- `isAuthenticated` - Boolean auth status
- `userEmail` - Current user's email
- `authState` - Complete auth state object

**Actions:**

- `initialize()` - Load session and setup auth listener
- `setUser()` - Store user after login
- `clearUser()` - Clear on logout
- `refreshSession()` - Refresh Supabase session

### 4. **Login Page** ([src/pages/login.vue](../src/pages/login.vue))

Beautiful, secure login interface:

**Features:**

- ✅ Email-only login (no username field)
- ✅ Real-time @deped.gov.ph validation
- ✅ Password visibility toggle
- ✅ Form validation
- ✅ Error handling with user-friendly messages
- ✅ Loading states
- ✅ Responsive design (Vuetify)

**Validation:**

- Email required
- Must be valid email format
- Must end with @deped.gov.ph
- Password minimum 6 characters

### 5. **Logout Functionality**

Implemented across all three role layouts:

**Admin Layout** ([src/layouts/admin.vue](../src/layouts/admin.vue))
**Teacher Layout** ([src/layouts/teacher.vue](../src/layouts/teacher.vue))
**Student Layout** ([src/layouts/student.vue](../src/layouts/student.vue))

```typescript
async function handleLogout() {
  const result = await logout();
  if (result.success) {
    authStore.clearUser();
    router.push("/login");
  }
}
```

### 6. **Route Guards** ([src/router/index.ts](../src/router/index.ts))

**Phase 3 Implementation:**

- ✅ Authentication checking
- ✅ Redirect unauthenticated users to login
- ✅ Prevent logged-in users from accessing login page
- ✅ Public routes: `/`, `/login`, `/test-supabase`
- ⏳ Role validation (placeholder - Phase 4 will use profiles table)

**Guard Logic:**

```typescript
// Public routes accessible to all
const publicRoutes = ["/", "/login", "/test-supabase"];

// Protected routes require authentication
if (!isAuthenticated()) {
  next({ path: "/login", query: { redirect: to.fullPath } });
  return;
}
```

### 7. **Error Handling**

User-friendly error messages:

| Supabase Error              | User Sees                                        |
| --------------------------- | ------------------------------------------------ |
| `Invalid login credentials` | "Invalid email or password"                      |
| `Email not confirmed`       | "Please confirm your email address"              |
| Invalid domain              | "Only @deped.gov.ph email addresses are allowed" |
| Network error               | Original error message                           |

## Architecture

### Authentication Flow

```
1. User visits protected route
   ↓
2. Router guard checks authentication
   ↓
3. If not authenticated → Redirect to /login
   ↓
4. User enters @deped.gov.ph email + password
   ↓
5. Validation: Email domain check
   ↓
6. Supabase Auth: signInWithPassword()
   ↓
7. Success: Update authStore, redirect to original route
   ↓
8. Session persisted and auto-refreshed
```

### Logout Flow

```
1. User clicks logout button
   ↓
2. Call useAuth().logout()
   ↓
3. Supabase Auth: signOut()
   ↓
4. Clear authStore state
   ↓
5. Redirect to /login
```

## Configuration

### Supabase Auth Settings

Ensure your Supabase project has:

1. **Email Auth Enabled:**

   - Dashboard → Authentication → Providers
   - Enable "Email"

2. **Email Confirmations (Optional):**

   - Can be disabled for internal systems
   - Dashboard → Authentication → Email Templates

3. **User Creation:**
   - Admin manually creates users via Supabase dashboard
   - Or use Supabase API in admin panel (Phase 4)

## Usage Examples

### Login in a Component

```vue
<script setup>
import { useAuth } from "@/composables/useAuth";
import { useAuthStore } from "@/stores/auth";

const { login, loading, error } = useAuth();
const authStore = useAuthStore();

async function handleLogin() {
  const result = await login({
    email: "teacher@deped.gov.ph",
    password: "securepassword",
  });

  if (result.success) {
    // User is now logged in
    console.log("Welcome:", authStore.userEmail);
  }
}
</script>
```

### Check Auth Status

```typescript
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

if (authStore.isAuthenticated) {
  console.log("User logged in:", authStore.userEmail);
} else {
  console.log("Not authenticated");
}
```

### Logout

```typescript
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";

const { logout } = useAuth();
const router = useRouter();

async function signOut() {
  await logout();
  router.push("/login");
}
```

## Security Features

### 1. Email Domain Restriction

- ✅ STRICT @deped.gov.ph validation
- ✅ Case-insensitive checking
- ✅ Trimming whitespace
- ✅ Frontend and backend validation

### 2. Password Security

- ✅ Minimum length requirement
- ✅ Supabase handles hashing/storage
- ✅ No passwords stored in frontend
- ✅ Session-based authentication

### 3. Session Management

- ✅ Auto-refresh tokens
- ✅ Persistent sessions (localStorage)
- ✅ Session detection in URL params
- ✅ Real-time auth state updates

### 4. Route Protection

- ✅ Global navigation guards
- ✅ Redirect after login support
- ✅ Public route allowlist
- ✅ Authenticated-only routes

## What's NOT Included (By Design)

As specified in [phase-3-authentication.md](../../.github/prompts/phase-3-authentication.md):

❌ **Role-based routing** - Phase 4 (will use profiles table)  
❌ **User signup UI** - Admin creates users  
❌ **Password reset** - Future enhancement  
❌ **Email verification** - Optional, can be added  
❌ **Social auth** - Email-only per requirements  
❌ **Multi-factor auth** - Future security enhancement

## Testing the Authentication

### 1. Create a Test User

In Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click "Add User"
3. Enter:
   - Email: `test@deped.gov.ph`
   - Password: `testpassword123`
   - Email Confirm: ✅ (if confirmations enabled)

### 2. Test Login

1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   ```
   Email: test@deped.gov.ph
   Password: testpassword123
   ```
3. Click "Login"
4. Should redirect to home page

### 3. Test Protected Routes

1. Log out
2. Try accessing `/admin`, `/teacher`, or `/student`
3. Should redirect to `/login`
4. Login and retry - should work

### 4. Test Email Validation

Try invalid emails:

- `user@gmail.com` → ❌ "Only @deped.gov.ph email addresses are allowed"
- `admin@school.com` → ❌ Same error
- `test@deped.gov.ph` → ✅ Allowed

### 5. Test Logout

1. Login successfully
2. Click logout in navigation drawer
3. Should redirect to `/login`
4. Try accessing protected route - should redirect back to login

## Next Steps (Phase 4)

1. **User Profiles & Roles:**

   - Query `profiles` table for user role
   - Replace route guard placeholders with real role checking
   - Implement role-based redirects after login

2. **User Management (Admin):**

   - Admin UI to create/edit users
   - Assign roles (admin/teacher/student)
   - Manage user status

3. **Enhanced Security:**
   - Password reset via email
   - Email change workflow
   - Activity logging

## Troubleshooting

### Issue: "Only @deped.gov.ph emails allowed" but using correct email

**Solution:**

- Check for extra spaces
- Verify email is lowercase
- Ensure exactly `@deped.gov.ph` (not .com or variations)

### Issue: "Invalid email or password"

**Solution:**

- Verify user exists in Supabase
- Check email is confirmed (if confirmations enabled)
- Try creating new test user
- Check Supabase dashboard for user status

### Issue: Redirect loop after login

**Solution:**

- Clear browser localStorage
- Check router guards aren't conflicting
- Verify auth store is initialized

### Issue: Session not persisting

**Solution:**

- Check browser allows localStorage
- Verify Supabase client config has `persistSession: true`
- Try hard refresh (Ctrl+Shift+R)

## Files Created/Modified

### New Files:

- `src/types/auth.ts` - Auth type definitions
- `src/composables/useAuth.ts` - Auth composable
- `src/stores/auth.ts` - Pinia auth store
- `src/pages/login.vue` - Login page

### Modified Files:

- `src/router/index.ts` - Added real auth guards
- `src/layouts/admin.vue` - Real logout
- `src/layouts/teacher.vue` - Real logout
- `src/layouts/student.vue` - Real logout
- `src/main.ts` - Initialize auth store

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Phase 2 Supabase Setup](./phase-2-supabase-setup.md)
