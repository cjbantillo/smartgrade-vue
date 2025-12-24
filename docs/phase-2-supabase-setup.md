# Phase 2: Supabase Client Setup

## Overview

This phase establishes the connection between the Vue application and Supabase backend, following the principle of minimal, safe configuration.

## What's Included

### 1. **Supabase Package Installation**

- `@supabase/supabase-js` - Official Supabase JavaScript client
- Version managed via package.json

### 2. **Environment Configuration**

#### `.env` (Git-ignored)

Contains actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### `.env.example` (Tracked in Git)

Template for team members to create their `.env`:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. **Supabase Client Service**

**File:** [src/services/supabase.ts](../src/services/supabase.ts)

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
```

**Features:**

- ✅ Environment variable validation
- ✅ Helpful error messages
- ✅ Singleton pattern (one instance)
- ✅ Type-safe exports
- ✅ Debug helpers

### 4. **TypeScript Support**

**File:** [env.d.ts](../env.d.ts)

Defines types for environment variables:

```typescript
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly BASE_URL: string;
}
```

### 5. **Git Security**

Updated [.gitignore](../.gitignore) to exclude:

```ignore
.env              # Actual credentials (never commit)
.env.local
.env.*.local
```

`.env.example` is tracked in Git as a template.

## Configuration Steps

### 1. Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (the `anon` key, not the `service_role` key)

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-from-supabase
```

### 3. Verify Configuration

The Supabase client will throw clear errors if misconfigured:

- Missing URL: `Missing VITE_SUPABASE_URL environment variable`
- Missing key: `Missing VITE_SUPABASE_ANON_KEY environment variable`

Use the helper functions for debugging:

```typescript
import { isSupabaseConfigured, getSupabaseUrl } from "@/services/supabase";

console.log("Configured:", isSupabaseConfigured()); // true/false
console.log("URL:", getSupabaseUrl()); // https://your-project.supabase.co
```

## Usage in Components/Composables

### Import the Client

```typescript
import { supabase } from "@/services/supabase";
```

### Example (for future phases)

```typescript
// This is just a reference - NOT implemented in Phase 2
async function fetchData() {
  const { data, error } = await supabase.from("some_table").select("*");

  if (error) console.error(error);
  return data;
}
```

## Security Best Practices

### ✅ DO

- **Use environment variables** for all credentials
- **Keep `.env` in `.gitignore`**
- **Use the `anon` key**, not `service_role` key in frontend
- **Validate env vars** before creating client
- **Share `.env.example`** with team (without actual values)

### ❌ DON'T

- **Never commit `.env`** to Git
- **Never hardcode** Supabase credentials in source code
- **Never use `service_role` key** in frontend (it has admin privileges)
- **Never share credentials** in chat/email (use secure channels)

## Row Level Security (RLS)

The `anon` key requires Supabase RLS policies to be configured. Without RLS:

- Queries will fail with permission errors
- This is **intentional** and **secure**

RLS policies will be configured in later phases when we implement:

- Authentication
- User profiles
- Role-based access control

## What's NOT Included (By Design)

As specified in [phase-2-supabase-client.md](../../.github/prompts/phase-2-supabase-client.md):

❌ **No database queries** - Added in Phase 3+  
❌ **No auth logic** - Added in Phase 3+  
❌ **No composables** - Added in Phase 3+  
❌ **No API calls** - Added in Phase 3+

## File Structure

```
smartgrade-vue/
├── .env                          # Actual credentials (git-ignored)
├── .env.example                  # Template (tracked in git)
├── .gitignore                    # Updated to exclude .env
├── env.d.ts                      # TypeScript env definitions
├── package.json                  # Added @supabase/supabase-js
└── src/
    └── services/
        └── supabase.ts          # Supabase client singleton
```

## Testing the Setup

### 1. Check Environment Variables

```typescript
// In any component
console.log(import.meta.env.VITE_SUPABASE_URL); // Should show your URL
```

### 2. Import the Client

```typescript
import { supabase } from "@/services/supabase";
console.log(supabase); // Should show SupabaseClient instance
```

### 3. Verify Configuration

```typescript
import { isSupabaseConfigured, getSupabaseUrl } from "@/services/supabase";

if (isSupabaseConfigured()) {
  console.log("✅ Supabase configured:", getSupabaseUrl());
} else {
  console.error("❌ Supabase not configured");
}
```

## Troubleshooting

### Issue: "Missing VITE_SUPABASE_URL environment variable"

**Solution:**

1. Ensure `.env` file exists in project root
2. Check that variables start with `VITE_`
3. Restart dev server (Vite loads env vars on startup)

### Issue: Environment variables are undefined

**Solution:**

- **Restart the dev server** - Vite only loads `.env` on startup
- Check file is named exactly `.env` (not `.env.txt`)
- Ensure variables have `VITE_` prefix

### Issue: TypeScript errors for env variables

**Solution:**

- Check `env.d.ts` is in project root
- Restart TypeScript server (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

## Next Steps (Phase 3+)

1. **Authentication:**

   - Implement login/logout with Supabase Auth
   - Email validation (@deped.gov.ph)
   - Session management

2. **User Profiles:**

   - Query `profiles` table for user roles
   - Implement role-based routing
   - Update route guards with real auth

3. **Database Queries:**

   - Create composables for data fetching
   - Implement CRUD operations
   - Handle errors gracefully

4. **RLS Policies:**
   - Configure policies in Supabase
   - Test role-based access
   - Validate security rules

## References

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Phase 1 Architecture](./phase-1-architecture.md)
