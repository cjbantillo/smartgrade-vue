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
14. ✅ **Phase 12.1 - PDF Generation & Storage**
    - html2pdf.js integration
    - Supabase Storage buckets created
    - useCertificates composable with PDF upload
    - useDocuments composable with PDF upload
    - Storage policies documented (manual setup required)
15. ✅ **Phase 12.2 - SF9/SF10 Templates & Verification**
    - TypeScript fixes (6/6 authStore.user references)
    - SF9Template.vue component (Legal size, 2-page layout)
    - SF10Template.vue component (Permanent record)
    - Public verification page (/verify/[id])
    - SF9 page integration with metadata editor
16. ✅ **Phase 12.3 - Metadata Persistence & QR Codes**
    - Database: document_metadata table with RLS policies
    - QR Package: qrcode-vue3 installed and integrated
    - Backend: saveMetadata, getMetadata, generateSF10Data functions
    - SF9/SF10: QR code components added to templates
    - SF10 Page: Complete integration with metadata editor
17. ✅ **Phase 12.4 - Certificate Generation UI** (CURRENT)
    - Certificate generation page with student selector
    - Live preview with CertificateTemplate component
    - Strict finalization and GPA gating logic
    - QR code verification ID integration
    - Print and PDF generation workflow

**Each phase is handled with a separate LLM prompt stored in `.github/prompts/`**

**Current Status:** Phase 12.4 complete - Certificate generation page ready with strict gating

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
- ✅ SF9/SF10 template components created (Phase 12.2)
- ✅ Public verification page functional (Phase 12.2)
- ✅ SF10 page integration with template (Phase 12.3)
- ✅ Metadata persistence to database (Phase 12.3)
- ✅ QR code generation and overlay (Phase 12.3)
- ✅ Database migration applied in Supabase (Phase 12.3)
- ✅ Certificate generation UI complete (Phase 12.4)
- ⏳ End-to-end certificate generation tested (Phase 12.4 - Testing required)
- ⏳ Storage policies configured in Supabase Dashboard (Manual setup required)

---

## 17. Phase 12.2 Implementation Status

### Completed ✅

1. **TypeScript Fixes (6/6)**

   - Fixed all `authStore.user` direct property access
   - Pattern: Replaced with `await authStore.getUser()` + null checks
   - Files updated:
     - `src/composables/useDocuments.ts` (4 fixes)
     - `src/composables/useCertificates.ts` (2 fixes)
   - All TypeScript errors resolved

2. **SF9 Template Component**

   - File: `src/components/documents/SF9Template.vue` (349 lines)
   - Legal size: 8.5in x 13in, 2-page layout
   - Front page: Header + Student Info + Attendance Table + Parent Signatures
   - Back page: Scholastic Grades (2 semesters, Q1-Q4) + Observed Values (4 core values) + Grading Scale
   - Props: `grades: SF9Data`, `metadata: Record<string, any>`
   - Hardcoded Core Values: Maka-Diyos (2), Makatao (2), Makakalikasan (1), Makabansa (2)
   - Print-ready with `print:break-after-page` and `print-color-adjust: exact`

3. **SF10 Template Component**

   - File: `src/components/documents/SF10Template.vue` (332 lines)
   - Permanent record layout (8.5in x 11in, multi-page)
   - Learner Information + Eligibility checkboxes
   - Scholastic Record loop per school_year + semester
   - Remedial table (conditional)
   - Certification section with School Head signature
   - Props: `data: SF10Data`, `metadata: Record<string, any>`

4. **Public Verification Page**

   - File: `src/pages/verify/[id].vue` (242 lines)
   - Route: `/verify/:id` (public, no authentication)
   - Three states: Loading, Verified (green badge), Invalid (red alert)
   - Security: No sensitive grades shown (privacy protection)
   - Displays: Certificate type, student name, issue date, ID, verification hash
   - QR code ready (awaiting QR generation implementation)

5. **SF9 Page Integration**

   - File: `src/pages/teacher/documents/sf9/[studentId]/[schoolYearId].vue`
   - Complete rewrite with SF9Template component
   - Metadata editor for:
     - Attendance (10 months, days_present editable)
     - Core Values (14 fields: 7 indicators x 2 semesters)
   - "Generate PDF" button with Supabase Storage upload
   - Print button hides metadata editor (`.no-print` class)

6. **Documentation**
   - `Phase-12.2-Completion-Report.md` created
   - Component specifications documented
   - Testing checklist provided
   - Known limitations listed

### Pending ⏳

1. **SF10 Page Integration**

   - Create/update SF10 document page similar to SF9
   - Add metadata editor for SF10-specific fields
   - Connect to SF10Template component

2. **Metadata Persistence**

   - Create `document_metadata` table in Supabase
   - Add save/load functions in `useDocuments.ts`
   - Auto-save metadata changes from SF9/SF10 pages

3. **QR Code Generation**

   - Install `qrcode.vue3` package
   - Add QR code overlay to SF9/SF10 templates
   - Link QR code to `/verify/:certificate_id`

4. **Storage Policies Manual Setup**
   - Storage policies must be created in Supabase Dashboard
   - 8 policies total (4 per bucket: INSERT, SELECT, UPDATE, DELETE)
   - Instructions provided in `storage_policies.sql` comments

---

## 18. Phase 12.3 Implementation Status

### Completed ✅

1. **Database Schema**

   - File: `supabase/migrations/20251224_create_document_metadata.sql` (130 lines)
   - Table: `document_metadata` with JSONB data field
   - Columns: id, student_id, document_type, school_year_id, data (jsonb), created_at, updated_at
   - Indexes: Composite on (student_id, document_type, school_year_id)
   - RLS Policies (6 total):
     - Teachers: SELECT/INSERT/UPDATE for their students
     - Students: SELECT own metadata only
     - Admins: DELETE for cleanup
   - Supports: Attendance, observed values, eligibility, principal info

2. **QR Code Package**

   - Package: `qrcode-vue3` v3.x (2 packages, 0 vulnerabilities)
   - Installation: `npm install qrcode-vue3`
   - Usage: `<QrcodeVue :value="url" :size="100" />`
   - Integration: SF9Template.vue and SF10Template.vue

3. **Backend Functions (useDocuments.ts)**

   - `saveMetadata(studentId, documentType, schoolYearId, data)`: Upserts metadata with conflict resolution, logs to audit_logs
   - `getMetadata(studentId, documentType, schoolYearId)`: Fetches JSONB data, returns null if not found
   - `generateSF10Data(studentId)`: Fetches ALL final grades across all school years, groups by year, calculates general averages, returns cumulative SF10Data
   - All functions use async getUser() pattern with null checks

4. **QR Code Integration**

   - SF9Template.vue:
     - Added `verificationId?: string` prop
     - Computed `verificationUrl` linking to `/verify/:id`
     - QR code component in page footer (100x100px)
   - SF10Template.vue:
     - Same prop and computed pattern as SF9
     - QR code in certification section (grid layout)

5. **SF10 Page Implementation**

   - File: `src/pages/teacher/documents/sf10/[studentId].vue` (310 lines)
   - Metadata editor fields:
     - `principal_name` (text input)
     - `school_address` (text input)
     - `eligibility` (select: Original/Transfer/Graduated/Continuing)
     - `admission_to` (text input)
   - Three action buttons:
     - Save Draft: `saveMetadataDraft()` with placeholder school_year_id
     - Print: Opens browser print dialog (hides metadata editor)
     - Generate PDF: Renders to PDF, uploads to Supabase Storage
   - Computed `sf10TemplateData` transforms `generateSF10Data()` output
   - Loads existing metadata on mount

6. **Documentation**
   - Migration SQL includes comprehensive comments
   - Sample JSONB data structures documented
   - Function signatures and error handling patterns established

### Pending ⏳

1. **Database Migration Execution**

   - Run `20251224_create_document_metadata.sql` in Supabase SQL Editor
   - Verify table creation and RLS policies
   - Test metadata insert/update/select operations

2. **SF9 Page QR Integration**

   - Update SF9 page to generate/fetch certificate ID
   - Pass `verificationId` prop to SF9Template component
   - Test QR code rendering in PDF output

3. **End-to-End Testing**

   - Save metadata from SF10 page, reload, verify persistence
   - Generate SF9/SF10 PDFs, scan QR codes, verify public page
   - Test cumulative data fetching (multiple school years)
   - Test metadata auto-save and conflict resolution

4. **Storage Policies Setup**
   - Configure `certificates` bucket policies in Supabase Dashboard
   - Configure `documents` bucket policies in Supabase Dashboard
   - Test authenticated upload and public read access

---

## 19. Phase 12.4 Implementation Status

### Completed ✅

1. **Certificate Generation Page**

   - File: `src/pages/teacher/certificates/index.vue` (485 lines)
   - Layout: Two-column (settings panel + preview panel)
   - **Student Selector:**
     - Autocomplete with search by name or LRN
     - Fetches all enrolled students from teacher's classes
     - Displays: Full name, LRN, Grade level, Track/Strand
   - **School Year Selector:**
     - Dropdown with all available school years
     - Auto-selects current/latest year
   - **Certificate Type Selector:**
     - Honors Certificate
     - Good Moral Certificate
     - Completion Certificate
   - **Gating Logic (STRICT):**
     - ⛔ Warning if grades not finalized (disables Generate button)
     - ⛔ Error if Honors selected but GPA < 90 (disables Generate button)
     - Shows current GPA and honors designation when available
   - **Preview Area:**
     - Live preview of CertificateTemplate with scaled display
     - Updates dynamically when selections change
     - Ref-based for PDF generation
   - **Actions:**
     - "Generate & Save" - Creates certificate, uploads PDF, saves to database
     - "Print Preview" - Opens browser print dialog
     - Success alert with PDF link after generation
   - **Student Info Summary:**
     - Display card showing name, LRN, grade level, track/strand, GPA, honors

2. **CertificateTemplate.vue Updates**

   - Added `verificationId?: string` prop
   - QR Code URL Logic:
     - Uses `verificationId` prop if provided
     - Falls back to `certificate.id` if no prop
     - For preview mode (id='preview'), QR points to homepage
     - Production URL: `${window.location.origin}/verify/${id}`
   - Dynamic QR generation for both preview and actual certificates

3. **Teacher Navigation**

   - `src/layouts/teacher.vue` already includes "Certificates" menu item
   - Icon: `mdi-certificate`
   - Route: `/teacher/certificates`
   - No changes required (pre-existing from earlier phase)

4. **Integration Features**

   - **Data Fetching:**
     - Fetches enrolled students via `class_enrollments` join
     - Fetches finalization status from `grade_finalization_status`
     - Fetches GPA and calculates honors designation (90/95/98 thresholds)
   - **Watchers:**
     - Resets preview and success state when student/year changes
     - Re-checks finalization status on selection changes
   - **Error Handling:**
     - Try-catch blocks for all async operations
     - Console logging for debugging
     - User-friendly error messages
   - **State Management:**
     - Loading states for students, school years, and generation process
     - Success/failure feedback with closable alerts
     - Generated PDF URL display with "View PDF" button

5. **Print Styles**
   - Media query hides settings panel when printing
   - Certificate preview scales to 1:1 for printing
   - Clean print output with only the certificate template

### Pending ⏳

1. **End-to-End Testing**

   - Test with real student data and finalized grades
   - Verify PDF generation and upload to Supabase Storage
   - Test QR code scanning and verification page linking
   - Test gating logic (finalization check, honors GPA threshold)
   - Test error handling for edge cases

2. **Storage Bucket Policies**

   - Must be configured manually in Supabase Dashboard
   - See `supabase/storage_policies.sql` for policy definitions
   - Required for PDF upload and public QR verification

3. **SF9 Page QR Integration**

   - Update SF9 document page to pass `verificationId` to template
   - Link to verification page via QR code
   - Test QR code rendering in SF9 PDFs

4. **Production Checklist**
   - Verify all certificates have unique verification codes
   - Test duplicate certificate prevention logic
   - Ensure audit logs capture certificate generation
   - Test revocation workflow (if implemented)

---

**This document is the single source of truth for SmartGrade behavior.**

**Version:** 2.4 (Phase 12.4 Update)  
**Last Updated:** December 24, 2025  
**Authoritative Source:** step-one-policy-adjustments.md
