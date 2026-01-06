# SmartGrade Security Documentation

## Overview

SmartGrade is a school grading management system built with Vue.js and Supabase. This document outlines the security measures, authentication flow, and authorization mechanisms implemented in the application.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Authorization & Role-Based Access Control](#authorization--role-based-access-control)
3. [Database Security](#database-security)
4. [Password Management](#password-management)
5. [Session Management](#session-management)
6. [API Security](#api-security)
7. [Known Limitations](#known-limitations)
8. [Security Recommendations](#security-recommendations)

---

## Authentication

### Login Flow

1. User enters email and password on the login page
2. System queries the `users` table for a matching active user
3. Password is verified against the stored `password_hash`
4. On success, user profile is stored in localStorage and Pinia store
5. User is redirected to their role-specific dashboard

### Authentication Store (`src/stores/auth.ts`)

```typescript
// User profile structure
interface UserProfile {
  user_id: number;
  email: string;
  role: string;
  school_id: number;
  is_active: boolean;
}
```

### Supported Authentication Methods

| Method         | Status        | Description                                 |
| -------------- | ------------- | ------------------------------------------- |
| Email/Password | ✅ Active     | Primary authentication method               |
| Google OAuth   | ⚠️ Configured | Supabase OAuth integration (requires setup) |

---

## Authorization & Role-Based Access Control

### User Roles

SmartGrade implements three primary user roles defined in the database:

| Role      | Description          | Access Level                                                  |
| --------- | -------------------- | ------------------------------------------------------------- |
| `ADMIN`   | System Administrator | Full access to all features, user management, system settings |
| `TEACHER` | Teacher/Adviser      | Manage sections, grades, students (when assigned as adviser)  |
| `STUDENT` | Student              | View own grades, SF9 documents                                |

### Role Determination

- **ADMIN**: Assigned via `users.role = 'ADMIN'`
- **TEACHER**: Assigned via `users.role = 'TEACHER'`
- **STUDENT**: Assigned via `users.role = 'STUDENT'`
- **ADVISER**: A TEACHER who is assigned to a section via `sections.adviser_teacher_id`

> **Note**: "Adviser" is not a separate role. It's a TEACHER who has been assigned to manage a specific section.

### Route Protection (`src/router/index.ts`)

Routes are protected using navigation guards:

```typescript
// Example route meta configuration
{
  path: '/admin',
  meta: { requiresAuth: true, roles: ['admin'] }
}
```

### Access Control Matrix

| Feature                | ADMIN              | TEACHER                        | STUDENT              |
| ---------------------- | ------------------ | ------------------------------ | -------------------- |
| Dashboard              | ✅ Admin Dashboard | ✅ Adviser Dashboard           | ✅ Student Dashboard |
| User Management        | ✅ Full CRUD       | ❌                             | ❌                   |
| Section Management     | ✅ Full CRUD       | ✅ View/Edit assigned          | ❌                   |
| Subject Management     | ✅ Full CRUD       | ❌                             | ❌                   |
| School Year Management | ✅ Full CRUD       | ❌                             | ❌                   |
| Grade Management       | ✅ View all        | ✅ Edit assigned sections      | ✅ View own          |
| Student Management     | ✅ View all        | ✅ Manage assigned students    | ❌                   |
| Enrollment             | ✅ Full access     | ✅ Enroll in assigned sections | ❌                   |
| Documents (SF9/SF10)   | ✅ Generate all    | ✅ Generate for assigned       | ✅ View own          |
| Settings               | ✅ Full access     | ❌                             | ❌                   |

---

## Database Security

### Schema Design

The database uses PostgreSQL via Supabase with the following security considerations:

#### Foreign Key Constraints

```sql
-- Users are linked to schools
users.school_id REFERENCES schools(school_id)

-- Teachers are linked to users
teachers.user_id REFERENCES users(user_id)

-- Students are linked to users
students.user_id REFERENCES users(user_id)

-- Sections have adviser assignment
sections.adviser_teacher_id REFERENCES teachers(teacher_id)
```

#### Role Constraints

```sql
-- Users table role constraint
role TEXT CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')) NOT NULL
```

#### Status Constraints

```sql
-- Student status constraint
status TEXT CHECK (status IN ('active', 'graduated', 'archived', 'dropped'))
```

### Row Level Security (RLS)

> **Recommendation**: Enable Supabase Row Level Security policies for production:

```sql
-- Example RLS policy for students viewing their own grades
CREATE POLICY "Students can view own grades" ON grades
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM students
      WHERE student_id = (
        SELECT student_id FROM enrollments WHERE enrollment_id = grades.enrollment_id
      )
    )
  );
```

---

## Password Management

### Current Implementation

⚠️ **Demo/Development Mode**

The current implementation uses pre-defined password hashes for demonstration:

| Password     | Usage            |
| ------------ | ---------------- |
| `admin123`   | Admin accounts   |
| `teacher123` | Teacher accounts |
| `password`   | Default fallback |

### Password Storage

- Passwords are stored as bcrypt hashes in `users.password_hash`
- Hash format: `$2a$10$...` (bcrypt with cost factor 10)

### Production Recommendations

1. **Implement server-side password hashing** using Supabase Edge Functions:

```typescript
// Supabase Edge Function example
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}
```

2. **Enforce password policies**:

   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character

3. **Implement password reset flow** via email

---

## Session Management

### Current Implementation

- User session stored in `localStorage` as `smartgrade_user`
- Pinia store (`useAuthStore`) manages authentication state
- Session persists until explicit logout or localStorage clear

### Session Structure

```json
{
  "user_id": 1,
  "email": "admin@deped.gov.ph",
  "role": "ADMIN",
  "school_id": 1,
  "is_active": true
}
```

### Logout Process

1. Clear Pinia store profile
2. Remove `smartgrade_user` from localStorage
3. Call `supabase.auth.signOut()`
4. Redirect to login page

---

## API Security

### Supabase Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Variables

| Variable                 | Description            | Security Level    |
| ------------------------ | ---------------------- | ----------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL   | Public            |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Public (with RLS) |

> **Important**: Never expose the `service_role` key in frontend code.

### API Access Patterns

| Operation   | Method               | Security                |
| ----------- | -------------------- | ----------------------- |
| Read users  | SELECT               | Requires authentication |
| Create user | INSERT               | Admin only              |
| Update user | UPDATE               | Admin only              |
| Delete user | UPDATE (soft delete) | Admin only              |

---

## Known Limitations

### Current Security Gaps

1. **Client-side password hashing**: Passwords are matched against pre-defined hashes client-side. This is for demo purposes only.

2. **No JWT token validation**: The app relies on localStorage for session persistence without server-side token validation.

3. **No RLS policies**: Row Level Security is not currently configured in Supabase.

4. **No rate limiting**: API calls are not rate-limited.

5. **No CSRF protection**: Cross-Site Request Forgery protection is not implemented.

6. **Service role key issue**: The `supabase.auth.admin.createUser()` API requires a service role key which should only be used server-side.

---

## Security Recommendations

### Immediate Actions

1. **Enable Row Level Security (RLS)** in Supabase for all tables
2. **Implement server-side password hashing** via Edge Functions
3. **Add input validation** on all form inputs
4. **Implement proper JWT token management**

### Short-term Improvements

1. **Add HTTPS enforcement** in production
2. **Implement rate limiting** on authentication endpoints
3. **Add audit logging** for sensitive operations
4. **Implement password reset functionality**
5. **Add two-factor authentication (2FA)** option

### Long-term Enhancements

1. **Security audit** by third-party
2. **Penetration testing**
3. **Implement SSO** with DepEd systems
4. **Add IP whitelisting** for admin access
5. **Implement session timeout** and refresh tokens

---

## Audit Logging

The database includes an `audit_logs` table for tracking sensitive operations:

```sql
CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(255),
    target_table VARCHAR(100),
    target_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Logged Actions

- User creation/modification
- Grade changes
- Document generation
- Login attempts (recommended to implement)

---

## Contact

For security concerns or vulnerability reports, please contact:

- **Project Maintainer**: [Your Contact Information]
- **Issue Tracker**: [GitHub Issues URL]

---

## Version History

| Version | Date         | Changes                        |
| ------- | ------------ | ------------------------------ |
| 1.0.0   | January 2026 | Initial security documentation |

---

_Last Updated: January 6, 2026_
