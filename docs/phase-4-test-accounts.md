# Phase 4: Test User Setup Instructions

## Overview

Create test accounts for each role to verify role-based routing and access control.

## Test Accounts Required

### 1. Admin Account

- **Email:** `admin@deped.gov.ph`
- **Password:** `admin123`
- **Role:** admin
- **Note:** Must use @deped.gov.ph email

### 2. Teacher Account

- **Email:** `teacher@deped.gov.ph`
- **Password:** `teacher123`
- **Role:** teacher
- **Note:** Must use @deped.gov.ph email

### 3. Student Account

- **Email:** `student@example.com` (or any valid email)
- **Password:** `student123`
- **Role:** student
- **Note:** Students can use any email address

## Setup Steps

### Option 1: Using Supabase Dashboard

1. Go to https://gxowjqnyzzgeymgrzxmx.supabase.co
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. For each account:
   - Enter the email
   - Enter the password
   - Click **Create User**
5. After creating auth users, run the SQL script below

### Option 2: Run SQL to Create Profiles

After creating users in Supabase Auth Dashboard, run this SQL:

```sql
-- Get the user IDs
DO $$
DECLARE
    admin_user_id uuid;
    teacher_user_id uuid;
    student_user_id uuid;
BEGIN
    -- Get user IDs from auth.users
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@deped.gov.ph';
    SELECT id INTO teacher_user_id FROM auth.users WHERE email = 'teacher@deped.gov.ph';
    SELECT id INTO student_user_id FROM auth.users WHERE email = 'student@example.com';

    -- Create or update admin profile
    INSERT INTO profiles (user_id, email, first_name, last_name, role, is_active, is_approved, created_at, updated_at)
    VALUES (admin_user_id, 'admin@deped.gov.ph', 'Admin', 'User', 'admin', true, true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        email = 'admin@deped.gov.ph',
        first_name = 'Admin',
        last_name = 'User',
        is_active = true,
        is_approved = true,
        updated_at = NOW();

    -- Create or update teacher profile
    INSERT INTO profiles (user_id, email, first_name, last_name, role, is_active, is_approved, created_at, updated_at)
    VALUES (teacher_user_id, 'teacher@deped.gov.ph', 'Teacher', 'User', 'teacher', true, true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'teacher',
        email = 'teacher@deped.gov.ph',
        first_name = 'Teacher',
        last_name = 'User',
        is_active = true,
        is_approved = true,
        updated_at = NOW();

    -- Create or update student profile
    INSERT INTO profiles (user_id, email, first_name, last_name, role, is_active, is_approved, created_at, updated_at)
    VALUES (student_user_id, 'student@deped.gov.ph', 'Student', 'User', 'student', true, true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'student',
        email = 'student@deped.gov.ph',
        first_name = 'Student',
        last_name = 'User',
        is_active = true,
        is_approved = true,
        updated_at = NOW();
END $$;

-- Verify profiles created
SELECT user_id, email, first_name, last_name, role, is_active, is_approved
FROM profiles
WHERE email IN ('admin@deped.gov.ph', 'teacher@deped.gov.ph', 'student@deped.gov.ph')
ORDER BY role;
```

## Testing Checklist

After setup, test the following:

### Admin User

- [ ] Login with `admin@deped.gov.ph` / `admin123`
- [ ] Redirects to `/admin` after login
- [ ] Can access admin dashboard
- [ ] Cannot access `/teacher` or `/student` routes
- [ ] Logout works correctly

### Teacher User

- [ ] Login with `teacher@deped.gov.ph` / `teacher123`
- [ ] Redirects to `/teacher` after login
- [ ] Can access teacher dashboard
- [ ] Cannot access `/admin` or `/student` routes
- [ ] Logout works correctly

### Student User

- [ ] Login with `student@deped.gov.ph` / `student123`
- [ ] Redirects to `/student` after login
- [ ] Can access student dashboard
- [ ] Cannot access `/admin` or `/teacher` routes
- [ ] Logout works correctly

## Manual Test Creation Script

If you prefer to create users programmatically, you can use this signup approach (temporarily disable email validation for testing):

```javascript
// Run in browser console at http://localhost:3000
const { createClient } = window.supabase;
const supabase = createClient(
  "https://gxowjqnyzzgeymgrzxmx.supabase.co",
  "your-anon-key-here"
);

// Create admin
await supabase.auth.signUp({
  email: "admin@deped.gov.ph",
  password: "admin123",
});

// Create teacher
await supabase.auth.signUp({
  email: "teacher@deped.gov.ph",
  password: "teacher123",
});

// Create student
await supabase.auth.signUp({
  email: "student@deped.gov.ph",
  password: "student123",
});
```
