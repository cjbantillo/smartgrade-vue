# SmartGrade — Authoritative System Context & Design Decisions

## 1. System Overview

SmartGrade is an automated grading and academic document system for Ampayon National High School – Senior High School.

The system supports three roles:

- Admin
- Teacher
- Student

The system is being rebuilt using a modern stack:

- **Frontend**: Vue 3 (Composition API), TypeScript, Vuetify, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)

No legacy PHP/MySQL code remains. All legacy files have already been analyzed and removed.

---

## 2. Authentication Model (CRITICAL)

### Single Login Rule

- There is **ONLY ONE login flow**
- Users **DO NOT** choose their role
- Role is resolved after login from the database
- UI must **never** present Admin / Teacher / Student login buttons

### Authentication Provider

- Supabase Auth is the **ONLY** authentication system
- Email and password-based authentication
- **No username fields anywhere**

---

## 3. Login Rules by Role

### Admin & Teacher

**MUST log in using:**

- Email ending in `@deped.gov.ph`
- Password

**Enforcement:**

- Email domain `@deped.gov.ph` is **REQUIRED** and **ENFORCED** for admin and teacher accounts
- Admin and teachers already possess DepEd accounts (standard government requirement)
- Email format: `firstname.lastname@deped.gov.ph`
- Username fields must **NOT** exist for admin/teacher

### Student

**Can log in using:**

- **LRN** (Learner Reference Number) as username, OR
- **Personal email** (any valid email, including Gmail, Yahoo, etc.)
- Password

**Student-Specific Notes:**

- Students do **NOT** have `@deped.gov.ph` email accounts
- LRN is:
  - **REQUIRED** for all students
  - **UNIQUE** across the system
  - Used as alternative login credential (in addition to email)
  - Stored in `students` table
- Students can register/login with:
  - LRN + password, OR
  - Personal email + password
- Personal emails are **NOT** restricted to any domain

---

## 4. Role Resolution & Redirection

After successful login:

1. Fetch `profiles.role` from database
2. Automatically redirect based on role:

| Role      | Redirect Path        |
| --------- | -------------------- |
| `admin`   | `/admin/dashboard`   |
| `teacher` | `/teacher/dashboard` |
| `student` | `/student/dashboard` |

**There must be NO manual role selection in the UI.**

---

## 5. Database Architecture (Supabase)

### General Rules

- **PostgreSQL ONLY**
- Supabase SQL Editor compatible
- **No** `CREATE DATABASE`
- **No** PostgreSQL roles or permissions
- Use `public` schema only
- Use `uuid` primary keys with `gen_random_uuid()`
- Use `timestamptz` for timestamps
- Use `jsonb` for JSON data
- Enforce integrity via constraints, **not** frontend logic

### Auth Linking

- `profiles.user_id` → `auth.users(id)`
- Roles stored in `profiles.role`
- Allowed roles:
  - `admin`
  - `teacher`
  - `student`

### Email Domain Enforcement

- Database-level check constraint on `profiles` table for admin and teacher roles:
  ```sql
  CHECK (
    (role = 'student') OR
    (role IN ('admin', 'teacher') AND email LIKE '%@deped.gov.ph')
  )
  ```
- Admin/Teacher accounts: Email must end with `@deped.gov.ph`
- Student accounts: Any valid email allowed (no domain restriction)

---

## 6. Academic & Business Rules

### Admin

**Lower responsibility than legacy system:**

- Manages teacher affiliation with Ampayon SHS
- Can **unlock** finalized grades
- Can **view** audit logs
- **Cannot** edit grades directly

### Teacher

**PRIMARY OPERATORS:**

- Manually enrolls students into their own classes
- Inputs grades (Written Work, Performance Tasks, Quarterly Assessment)
- Must **finalize** (lock) grades before:
  - Generating SF9
  - Generating SF10
  - Generating certificates
- **Cannot** modify grades after finalization
- Must request Admin unlock for changes

### Student

**Read-only access:**

- Can view:
  - Grades
  - SF9 / SF10
  - Certificates
- Can only see their **own** records
- **Cannot** modify any data

---

## 7. Grade Finalization Rules

Grades must support:

- `is_finalized` (boolean)
- `finalized_at` (timestamp)
- `finalized_by` (admin or teacher UUID)

### State Machine

**DRAFT → READY FOR FINALIZATION → FINALIZED → UNLOCKED → RE-FINALIZED**

#### Rules:

**If NOT finalized:**

- SF9 / SF10 **cannot** be generated
- Certificates **cannot** be generated
- Grades are **editable** by teacher

**Once finalized:**

- Teachers **cannot** edit grades
- SF9 / SF10 **can** be generated
- Certificates **can** be generated
- Admin unlock is **required** for changes

**Unlock actions:**

- Must be **logged** in audit trail
- Must include **reason** for unlock
- Teacher can re-edit, then **re-finalize**

---

## 8. Documents & Certificates

### SF9 / SF10

- Generated **only** from finalized grades
- Content must be **editable** (names, clerical errors)
- Editing must **NOT** change underlying grade data
- All edits must be **logged separately** in `document_edits` table

### Certificates

- Generated by **teachers** (NOT admin)
- PDF format with QR code
- Backed by finalized grades
- Must support **QR-based public verification**
- Public verification must **not** expose sensitive student data

### Storage Infrastructure (Phase 12.1)

- **PDF Generation:** Client-side rendering using html2pdf.js
- **Storage:** Supabase Storage buckets
  - `certificates` bucket (5MB limit, public read, PDF only)
  - `documents` bucket (10MB limit, public read, PDF only)
- **Upload Workflow:**
  1. Render HTML element to PDF blob
  2. Upload to Supabase Storage
  3. Generate public URL
  4. Store URL in database table
- **Access Control:** RLS policies on storage.objects
  - Authenticated users: INSERT, UPDATE
  - Public (anon): SELECT (for QR verification)
  - Admin only: DELETE

### Document Generation Gating

| Document Type           | Generation Allowed When                                          |
| ----------------------- | ---------------------------------------------------------------- |
| SF9 (Report Card)       | Grades are in **FINALIZED** state                                |
| SF10 (Permanent Record) | Grades are in **FINALIZED** state                                |
| Honors Certificate      | Grades are **FINALIZED** AND student qualifies (GPA ≥ threshold) |
| Good Moral Certificate  | Grades are **FINALIZED** (GPA not required)                      |
| Draft Reports           | Any state (informal previews permitted)                          |

---

## 9. Frontend Architecture Rules

### Component Design

- **No business logic** in UI components
- Use **composables** and **services**
- Role-based layouts:
  - `admin.vue`
  - `teacher.vue`
  - `student.vue`
- **No shared mutation logic** across roles
- Route guards enforce role access
- Frontend must **never assume privileges**

### Error Handling

- Use centralized error handling utility (`errorHandling.ts`)
- User-friendly messages for all errors
- Map PostgreSQL error codes to readable messages
- Retry logic for network errors
- No raw database errors exposed to users

### Validation

- Use `useFormValidation` composable
- Validate at both frontend and database level
- Grade rules: 0-100, max 2 decimals
- LRN rules: exactly 12 digits
- Email rules:
  - Admin/Teacher: must end with `@deped.gov.ph`
  - Student: any valid email format

---

## 10. Development Process (Phased)

Development is done in strict phases:

1. ✅ Project setup
2. ✅ Routing & layouts
3. ✅ Supabase client
4. ✅ Authentication
5. ✅ Role resolution & profile management
6. ✅ Admin module
7. ✅ Teacher classes & enrollment
8. ✅ Grade entry & computation
9. ✅ Documents (SF9/SF10) - Data fetching complete
10. ✅ Certificates - Template complete
11. ✅ Student dashboard
12. ✅ RLS policies (806 lines)
13. ✅ Production hardening (Phase 12 - Error handling, validation, UI components)
14. ✅ **Phase 12.1 - PDF Generation & Storage** (CURRENT)
    - html2pdf.js integration
    - Supabase Storage buckets created
    - useCertificates composable with PDF upload
    - useDocuments composable with PDF upload
    - Storage policies documented (manual setup required)

**Each phase is handled with a separate LLM prompt stored in `.github/prompts/`**

**Current Status:** Phase 12.1 complete - Ready for storage policy setup in Supabase Dashboard

---

## 11. Security (Row-Level Security)

### RLS Policies

- **ALL 17 tables** have RLS enabled
- **Helper functions** for role checks:
  - `get_user_role()`
  - `is_admin()`
  - `is_teacher()`
  - `is_student()`
  - `teacher_owns_class(class_id)`
  - `student_in_class(student_id, class_id)`

### Access Rules Summary

| Table                     | Admin | Teacher  | Student | Public                  |
| ------------------------- | ----- | -------- | ------- | ----------------------- |
| profiles                  | All   | Own      | Own     | None                    |
| school_years              | All   | Read     | Read    | None                    |
| students                  | All   | Enrolled | Own     | None                    |
| teachers                  | All   | Own      | None    | None                    |
| teacher_classes           | All   | Own      | None    | None                    |
| class_enrollments         | All   | Own      | Own     | None                    |
| grades                    | All   | Own      | Own     | None                    |
| final_grades              | All   | Own      | Own     | None                    |
| grade_finalization_status | All   | Own      | Own     | None                    |
| certificates              | All   | Own      | Own     | **Read** (verification) |
| audit_logs                | All   | Own      | None    | None                    |

---

## 12. Copilot / LLM Usage Rules

### Global Rules

- `.github/copilot-instructions.md` contains **ONLY** global rules
- Phase prompts are stored **separately** in `.github/prompts/`
- Phase prompts are applied **manually** per development phase

### LLMs Must NOT:

- ❌ Add role selectors (role is resolved from database)
- ❌ Allow non-`@deped.gov.ph` emails for admin/teacher accounts
- ❌ Bypass grade locking (finalization must be enforced)
- ❌ Generate backend schema unless explicitly asked
- ❌ Allow admin to edit grades directly (must unlock first)
- ❌ Allow document generation without finalization check
- ❌ Mix user roles in same component
- ❌ Assume admin privileges for teachers
- ❌ Use MySQL syntax (PostgreSQL only)
- ❌ Hardcode credentials

### LLMs Should:

- ✅ Use `@deped.gov.ph` for admin and teacher accounts ONLY
- ✅ Allow students to login with LRN or personal email
- ✅ Support dual login methods for students (LRN or email)
- ✅ Respect grade finalization state machine
- ✅ Gate document generation on `is_finalized` flag
- ✅ Use centralized error handling (`errorHandling.ts`)
- ✅ Use validation composables (`useFormValidation.ts`)
- ✅ Follow official policy requirements (`step-one-policy-adjustments.md`)
- ✅ Implement teacher-driven enrollment workflow
- ✅ Create separate layouts per role
- ✅ Use Composition API with `<script setup>` syntax

---

## 13. Critical Files Reference

### Official Requirements (MANDATORY)

- `step-one-policy-adjustments.md` — **Authoritative policies from school ICT-in-charge**
- `step-one-process.md` — Legacy system analysis (reference only)

### Database

- `smartgrade_db_upgrade_supabase.sql` — Complete schema (17 tables)
- `rls-policies.sql` — Row-Level Security policies (806 lines)
- `supabase/storage_policies.sql` — Storage bucket creation (certificates, documents)

### Documentation

- `development-notfinal.md` — Current development status report
- `phase-12-improvements-list.md` — Hardening issues catalog (35+ items)
- `docs/phase-12-hardening.md` — Implementation guide
- `Phase-12.1-Completion-Report.md` — PDF generation & storage implementation

### Phase Guides

- `.github/prompts/phase-0-project-setup.md`
- `.github/prompts/phase-1-routing-and-layout.md`
- `.github/prompts/phase-2-supabase-client.md`
- `.github/prompts/phase-3-authentication.md`
- `.github/prompts/phase-4-profile-role.md`
- `.github/prompts/phase-5-admin-module.md`
- `.github/prompts/phase-6-teacher-classes.md`
- `.github/prompts/phase-7-grades.md`
- `.github/prompts/phase-8-documents.md`
- `.github/prompts/phase-9-certificates.md`
- `.github/prompts/phase-10-student-dashboard.md`
- `.github/prompts/phase-11-rls.md`
- `.github/prompts/phase-12-hardening.md`

---

## 14. Known Constraints & Requirements

### School IT Responsibility

- School IT must provision `@deped.gov.ph` email accounts for **admin and teacher accounts** only
- Students use their own personal email addresses (Gmail, Yahoo, etc.)
- Students are identified primarily by **LRN** (Learner Reference Number)
- Email provisioning is **outside** the scope of SmartGrade system
- SmartGrade **validates** email formats but does **not create** accounts

### DepEd Compliance

- All grading formulas follow DepEd Order
- Component weightings: Written Work (WW), Performance Tasks (PT), Quarterly Assessment (QA)
- GPA calculation: Average of all final grades
- Honors thresholds:
  - With Honors: 90.00 - 94.99
  - High Honors: 95.00 - 97.99
  - Highest Honors: 98.00 - 100.00
- Passing grade: 75 (configurable in system settings)

### Document Standards

- SF9 (School Form 9): Report Card
- SF10 (School Form 10): Permanent Record
- Both forms follow DepEd templates
- Certificates use official school letterhead

---

## 15. Anti-Patterns to Avoid

### Authentication

- ❌ Role selection dropdown on login page
- ❌ "Login as Admin/Teacher/Student" buttons
- ❌ Non-DepEd email addresses for admin/teacher accounts
- ❌ Allowing students to use @deped.gov.ph emails (they don't have them)
- ❌ Requiring email-only login for students (LRN login must be supported)

### Enrollment

- ❌ Admin-driven section assignment
- ❌ Automatic student enrollment (must be manual by teacher)
- ❌ Bulk enrollment without teacher review

### Grade Management

- ❌ Admin editing grades directly
- ❌ Document generation without finalization
- ❌ Grade modification without audit trail
- ❌ Finalization bypass in UI

### Security

- ❌ Hardcoded role checks in frontend (use RLS)
- ❌ Trusting client-side role verification
- ❌ Exposing sensitive data in public verification
- ❌ Missing audit logs for critical actions

---

## 16. Success Criteria

The system is **production-ready** when:

- ✅ Admin and teachers authenticate with `@deped.gov.ph` emails
- ✅ Students can authenticate with LRN or personal email
- ✅ Role is auto-resolved from database (no UI selection)
- ✅ Teachers can create classes and enroll students
- ✅ Grade finalization workflow is fully functional
- ✅ Document generation is gated by finalization status
- ✅ SF9/SF10 content is editable without changing grades
- ✅ Certificates have QR codes for public verification
- ✅ RLS policies enforce all access rules
- ✅ Audit logs capture all critical actions
- ✅ Error handling provides user-friendly messages (Phase 12)
- ✅ Validation prevents invalid data entry (Phase 12)
- ✅ Admin can unlock grades with logged reason
- ✅ Students can only view their own records
- ✅ PDF generation infrastructure complete (Phase 12.1)
- ⏳ Storage policies configured in Supabase Dashboard (Phase 12.1 - Manual setup)
- ⏳ SF9/SF10 template components created (Phase 12.2)
- ⏳ Certificate generation tested end-to-end (Phase 12.2)
- ⏳ Public verification page functional (Phase 12.2)

---

## 17. Phase 12.1 Implementation Status

### Completed ✅

1. **html2pdf.js Integration**

   - Package installed (v0.10.2, 24 packages, 0 vulnerabilities)
   - Client-side PDF rendering configured
   - A4 portrait for certificates, Legal portrait for documents

2. **Supabase Storage Infrastructure**

   - `certificates` bucket created (5MB, public, PDF only)
   - `documents` bucket created (10MB, public, PDF only)
   - SQL script: `supabase/storage_policies.sql`

3. **Composables Updated**

   - `useCertificates.ts`: Added PDF generation with storage upload
   - `useDocuments.ts`: Added `generatePDF()` function
   - Phase 12 error handling integrated
   - Audit logging for all document operations

4. **Documentation**
   - `Phase-12.1-Completion-Report.md` created
   - API usage examples documented
   - Testing checklist provided
   - Storage policy templates included

### Pending ⏳

1. **Manual Setup Required**

   - Storage policies must be created in Supabase Dashboard
   - 8 policies total (4 per bucket: INSERT, SELECT, UPDATE, DELETE)
   - Instructions provided in `storage_policies.sql` comments

2. **TypeScript Fixes**

   - Some error handling function calls need adjustment
   - `authStore.user` references (should use `getUser()` method)

3. **Next Phase (12.2)**
   - SF9/SF10 template components
   - Public verification page
   - End-to-end certificate generation testing
   - Quarterly grades integration for SF9

---

**This document is the single source of truth for SmartGrade behavior.**

**Version:** 2.1 (Phase 12.1 Update)  
**Last Updated:** December 24, 2025  
**Authoritative Source:** step-one-policy-adjustments.md
