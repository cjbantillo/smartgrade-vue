# SmartGrade System - Production Testing Checklist

**Version:** 1.0  
**Last Updated:** December 24, 2025  
**Purpose:** Comprehensive manual acceptance testing before production deployment

---

## Prerequisites (MUST BE COMPLETED FIRST)

Before starting any tests, ensure the following manual setup steps are completed:

### 1. Database Migrations

Run the following SQL migrations in **Supabase SQL Editor**:

- ✅ `smartgrade_db_upgrade_supabase.sql` - Main schema (17 tables)
- ✅ `rls-policies.sql` - Row-Level Security policies (806 lines)
- ✅ `supabase/migrations/20251224_create_document_metadata.sql` - Document metadata table

**Verification Steps:**

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables (18 total):
-- audit_logs, certificates, class_enrollments, document_metadata, final_grades,
-- grade_finalization_status, grades, profiles, school_years, students,
-- subjects, teacher_classes, teachers, and helper functions

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Should return all 18 tables

-- Check document_metadata policies
SELECT policyname FROM pg_policies
WHERE tablename = 'document_metadata';
-- Should return 6 policies
```

### 2. Storage Buckets & Policies

**Manual Setup in Supabase Dashboard → Storage:**

#### a. Create `certificates` Bucket

- **Name:** `certificates`
- **Public:** Yes (read-only)
- **File size limit:** 5MB
- **Allowed MIME types:** `application/pdf`

#### b. Create `documents` Bucket

- **Name:** `documents`
- **Public:** Yes (read-only)
- **File size limit:** 10MB
- **Allowed MIME types:** `application/pdf`

#### c. Apply Storage Policies

Navigate to **Storage → Policies** and create the following:

**For `certificates` bucket:**

```sql
-- Policy 1: Authenticated users can INSERT
CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificates');

-- Policy 2: Public SELECT (for QR verification)
CREATE POLICY "Anyone can view certificates"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'certificates');

-- Policy 3: Authenticated users can UPDATE
CREATE POLICY "Authenticated users can update certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certificates');

-- Policy 4: Admins can DELETE
CREATE POLICY "Admins can delete certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);
```

**For `documents` bucket:**

```sql
-- Repeat same 4 policies with 'documents' instead of 'certificates'
```

**Verification:**

- Upload a test PDF manually
- Verify public URL is accessible without authentication
- Delete test file

### 3. Seed Data

Ensure the following seed data exists:

**School Years:**

```sql
INSERT INTO public.school_years (year_code, start_date, end_date, is_current)
VALUES
  ('2024-2025', '2024-06-01', '2025-03-31', true),
  ('2023-2024', '2023-06-01', '2024-03-31', false);
```

**Subjects:**

```sql
-- Add at least 5 core subjects (Math, Science, English, Filipino, etc.)
```

**Test Accounts:**

- 1 Admin (`admin@deped.gov.ph`)
- 2 Teachers (`teacher1@deped.gov.ph`, `teacher2@deped.gov.ph`)
- 5 Students (with LRNs: 123456789012, etc.)

---

## Test Plan Overview

| Module              | Tests  | Status |
| ------------------- | ------ | ------ |
| Authentication      | 6      | ⬜     |
| Teacher Workflow    | 12     | ⬜     |
| Admin Workflow      | 5      | ⬜     |
| Student Workflow    | 4      | ⬜     |
| Documents (SF9)     | 6      | ⬜     |
| Documents (SF10)    | 5      | ⬜     |
| Certificates        | 7      | ⬜     |
| Public Verification | 3      | ⬜     |
| **TOTAL**           | **48** | **⬜** |

---

## 1. Authentication Tests

### Test 1.1: Admin Login

- **Action:** Login with `admin@deped.gov.ph`
- **Expected:** Redirects to `/admin/dashboard`
- **Status:** ⬜ Pass / ⬜ Fail

### Test 1.2: Teacher Login

- **Action:** Login with `teacher1@deped.gov.ph`
- **Expected:** Redirects to `/teacher/dashboard`
- **Status:** ⬜ Pass / ⬜ Fail

### Test 1.3: Student Login (Email)

- **Action:** Login with student's personal email
- **Expected:** Redirects to `/student/dashboard`
- **Status:** ⬜ Pass / ⬜ Fail

### Test 1.4: Student Login (LRN)

- **Action:** Login with LRN (e.g., `123456789012`)
- **Expected:** Redirects to `/student/dashboard`
- **Status:** ⬜ Pass / ⬜ Fail

### Test 1.5: Invalid Email Domain (Teacher)

- **Action:** Try creating teacher account with `@gmail.com`
- **Expected:** Database constraint error / UI validation error
- **Status:** ⬜ Pass / ⬜ Fail

### Test 1.6: Logout

- **Action:** Click logout from any role
- **Expected:** Redirects to `/login`, session cleared
- **Status:** ⬜ Pass / ⬜ Fail

---

## 2. Teacher Workflow Tests

### Test 2.1: Create Class

- **Action:** Navigate to `/teacher/classes`, click "Create Class"
- **Steps:**
  1. Select Subject (e.g., Math)
  2. Enter Section (e.g., "Einstein")
  3. Select School Year (2024-2025)
  4. Select Grading Period (1)
  5. Submit
- **Expected:** Class appears in list
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.2: Duplicate Class Prevention

- **Action:** Try creating same class again
- **Expected:** Error message "Class already exists"
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.3: Enroll Student

- **Action:** Open class → Click "Enroll Student"
- **Steps:**
  1. Search for student by LRN or name
  2. Select student
  3. Confirm enrollment
- **Expected:** Student appears in enrollment list
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.4: Duplicate Enrollment Prevention

- **Action:** Try enrolling same student twice
- **Expected:** Error message or disabled button
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.5: Enter Grades

- **Action:** Navigate to `/teacher/grades`, select class
- **Steps:**
  1. Select student
  2. Enter Written Work scores (e.g., 35/40)
  3. Enter Performance Task scores (e.g., 28/30)
  4. Enter Quarterly Assessment score (e.g., 45/50)
  5. Save
- **Expected:** Grades saved, computed grade displayed
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.6: Grade Validation

- **Action:** Try entering grade > 100 or < 0
- **Expected:** Validation error
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.7: Finalize Grades (Valid)

- **Action:** Click "Finalize Grades" after all grades entered
- **Expected:**
  - Success message
  - Grades become read-only
  - Finalization timestamp displayed
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.8: Finalize Grades (Missing Grades)

- **Action:** Try finalizing with incomplete grades
- **Expected:** Error message listing missing grades
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.9: Edit Locked Grades

- **Action:** After finalization, try editing a grade
- **Expected:** Input fields disabled, error message
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.10: Generate SF9 (Not Finalized)

- **Action:** Try accessing SF9 page before finalization
- **Expected:** Warning message "Grades must be finalized"
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.11: Generate Certificate (Not Finalized)

- **Action:** Try generating certificate before finalization
- **Expected:** Generate button disabled
- **Status:** ⬜ Pass / ⬜ Fail

### Test 2.12: View Audit Logs

- **Action:** Check that finalization is logged
- **Expected:** Entry in audit_logs table

```sql
SELECT * FROM audit_logs
WHERE action = 'grades_finalized'
ORDER BY created_at DESC LIMIT 5;
```

- **Status:** ⬜ Pass / ⬜ Fail

---

## 3. Admin Workflow Tests

### Test 3.1: View All Teachers

- **Action:** Login as Admin → Navigate to Teachers page
- **Expected:** List of all teachers with affiliation status
- **Status:** ⬜ Pass / ⬜ Fail

### Test 3.2: Unlock Grades

- **Action:** Admin unlocks finalized grades
- **Steps:**
  1. Find finalized student
  2. Click "Unlock Grades"
  3. Enter reason: "Clerical error correction"
  4. Submit
- **Expected:**
  - Grades become editable for teacher
  - Unlock logged in audit_logs
- **Status:** ⬜ Pass / ⬜ Fail

### Test 3.3: View Audit Logs

- **Action:** Navigate to `/admin/audit-logs`
- **Expected:** List of all system actions with timestamps
- **Status:** ⬜ Pass / ⬜ Fail

### Test 3.4: Admin Cannot Edit Grades Directly

- **Action:** Admin tries to modify grade directly
- **Expected:** No UI option available (read-only access)
- **Status:** ⬜ Pass / ⬜ Fail

### Test 3.5: Admin Cannot Generate Certificates

- **Action:** Check if Admin has certificate generation UI
- **Expected:** Option not available (teacher-only feature)
- **Status:** ⬜ Pass / ⬜ Fail

---

## 4. Student Workflow Tests

### Test 4.1: View Own Grades

- **Action:** Login as student → Navigate to Grades
- **Expected:** Only own grades visible
- **Status:** ⬜ Pass / ⬜ Fail

### Test 4.2: View SF9

- **Action:** Navigate to Documents → SF9
- **Expected:** Can view own SF9 (if finalized)
- **Status:** ⬜ Pass / ⬜ Fail

### Test 4.3: View Certificates

- **Action:** Navigate to Certificates
- **Expected:** List of own certificates only
- **Status:** ⬜ Pass / ⬜ Fail

### Test 4.4: Cannot Edit Anything

- **Action:** Try finding any edit/save button
- **Expected:** All data is read-only
- **Status:** ⬜ Pass / ⬜ Fail

---

## 5. SF9 Document Tests

### Test 5.1: Generate SF9 (After Finalization)

- **Action:** Teacher navigates to `/teacher/documents/sf9/:studentId/:schoolYearId`
- **Expected:** SF9 template renders with student data
- **Status:** ⬜ Pass / ⬜ Fail

### Test 5.2: Edit Attendance Metadata

- **Action:** Edit "Days Present" for June
- **Steps:**
  1. Change value from 20 to 18
  2. Click outside field (auto-save)
  3. Refresh page
- **Expected:** Value persists (18)
- **Status:** ⬜ Pass / ⬜ Fail

### Test 5.3: Edit Core Values

- **Action:** Change "Maka-Diyos #1 Sem 1" from "-" to "AO"
- **Expected:** Value persists after refresh
- **Status:** ⬜ Pass / ⬜ Fail

### Test 5.4: QR Code Appears

- **Action:** Check SF9 template
- **Expected:** QR code visible in footer
- **Status:** ⬜ Pass / ⬜ Fail

### Test 5.5: Generate PDF

- **Action:** Click "Generate PDF"
- **Expected:**
  - PDF downloads/renders
  - Upload success message with URL
  - PDF accessible via public URL
- **Status:** ⬜ Pass / ⬜ Fail

### Test 5.6: Print Preview

- **Action:** Click "Print"
- **Expected:**
  - Browser print dialog opens
  - Metadata editor hidden
  - Only SF9 template visible
- **Status:** ⬜ Pass / ⬜ Fail

---

## 6. SF10 Document Tests

### Test 6.1: Generate SF10 (Cumulative)

- **Action:** Teacher navigates to `/teacher/documents/sf10/:studentId`
- **Expected:** SF10 template with ALL school years
- **Status:** ⬜ Pass / ⬜ Fail

### Test 6.2: Edit Principal Name

- **Action:** Enter "Dr. Juan Dela Cruz"
- **Steps:**
  1. Type in Principal Name field
  2. Click "Save Draft"
  3. Refresh page
- **Expected:** Value persists
- **Status:** ⬜ Pass / ⬜ Fail

### Test 6.3: Select Eligibility

- **Action:** Choose "JHS Completer" from dropdown
- **Expected:** Value persists after save
- **Status:** ⬜ Pass / ⬜ Fail

### Test 6.4: QR Code Appears

- **Action:** After saving draft, check template
- **Expected:** QR code visible in certification section
- **Status:** ⬜ Pass / ⬜ Fail

### Test 6.5: Generate PDF

- **Action:** Click "Generate PDF"
- **Expected:**
  - Metadata auto-saved first
  - PDF generated successfully
  - Public URL returned
- **Status:** ⬜ Pass / ⬜ Fail

---

## 7. Certificate Generation Tests

### Test 7.1: Select Student

- **Action:** Navigate to `/teacher/certificates`
- **Expected:**
  - Autocomplete with enrolled students
  - Search by name or LRN
- **Status:** ⬜ Pass / ⬜ Fail

### Test 7.2: Gating - Not Finalized

- **Action:** Select student with non-finalized grades
- **Expected:**
  - Warning alert: "Grades must be finalized"
  - Generate button disabled
- **Status:** ⬜ Pass / ⬜ Fail

### Test 7.3: Gating - Honors (GPA < 90)

- **Action:** Select student with GPA 88.5, choose "Honors"
- **Expected:**
  - Error alert: "Does not qualify (GPA < 90)"
  - Generate button disabled
- **Status:** ⬜ Pass / ⬜ Fail

### Test 7.4: Preview Certificate

- **Action:** Select valid student, choose "Good Moral"
- **Expected:** Live preview appears in right panel
- **Status:** ⬜ Pass / ⬜ Fail

### Test 7.5: Generate Honors Certificate (Valid)

- **Action:** Select student with GPA 95.5, choose "Honors"
- **Steps:**
  1. Click "Generate & Save"
  2. Wait for processing
- **Expected:**
  - Success alert with PDF link
  - QR code in template
  - Certificate saved to database
- **Status:** ⬜ Pass / ⬜ Fail

### Test 7.6: Duplicate Certificate Prevention

- **Action:** Try generating same certificate type again
- **Expected:** Error "Certificate already exists"
- **Status:** ⬜ Pass / ⬜ Fail

### Test 7.7: Print Certificate

- **Action:** After preview loads, click "Print Preview"
- **Expected:** Browser print dialog opens
- **Status:** ⬜ Pass / ⬜ Fail

---

## 8. Public Verification Tests

### Test 8.1: Scan QR Code (SF9)

- **Action:** Use phone to scan QR code on SF9 PDF
- **Expected:**
  - Browser opens `/verify/:id`
  - Green "Verified" badge
  - Shows: Type, Student Name, Issue Date
  - Does NOT show grades
- **Status:** ⬜ Pass / ⬜ Fail

### Test 8.2: Scan QR Code (Certificate)

- **Action:** Use phone to scan certificate QR code
- **Expected:** Same verification page, certificate details
- **Status:** ⬜ Pass / ⬜ Fail

### Test 8.3: Invalid Verification ID

- **Action:** Navigate to `/verify/invalid-uuid-12345`
- **Expected:**
  - Red alert "Invalid or Revoked"
  - No document details shown
- **Status:** ⬜ Pass / ⬜ Fail

---

## Final Acceptance Criteria

### All Tests Pass

- [ ] Authentication (6/6)
- [ ] Teacher Workflow (12/12)
- [ ] Admin Workflow (5/5)
- [ ] Student Workflow (4/4)
- [ ] SF9 Documents (6/6)
- [ ] SF10 Documents (5/5)
- [ ] Certificates (7/7)
- [ ] Public Verification (3/3)

### Performance Checks

- [ ] Page load < 2 seconds
- [ ] PDF generation < 5 seconds
- [ ] QR code scan resolves < 1 second
- [ ] No console errors in browser

### Security Checks

- [ ] RLS policies prevent unauthorized access
- [ ] Students cannot see other students' data
- [ ] Teachers cannot edit grades after finalization
- [ ] Public verification doesn't expose sensitive data
- [ ] Storage buckets have correct public/private access

### Data Integrity

- [ ] All finalization actions logged in audit_logs
- [ ] Metadata persists correctly
- [ ] Duplicate prevention working
- [ ] Grade computations accurate

---

## Test Results Summary

**Date Tested:** ******\_\_\_******  
**Tester Name:** ******\_\_\_******  
**Environment:** ******\_\_\_******  
**Total Passed:** **\_** / 48  
**Total Failed:** **\_**  
**Blockers Found:** **\_**

### Critical Issues

_(List any critical bugs that block production)_

### Recommendations

_(List any improvements before deployment)_

---

**Sign-off:**

- [ ] QA Lead Approved
- [ ] School ICT In-Charge Approved
- [ ] System Ready for Production

---

**Notes:**

- Run this checklist on a staging environment first
- Document all failures with screenshots
- Re-test after fixes
- Keep this checklist updated with new features
