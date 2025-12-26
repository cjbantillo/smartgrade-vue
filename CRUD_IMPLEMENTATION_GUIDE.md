# SmartGrade CRUD Implementation Guide

## Overview

This document outlines the complete CRUD (Create, Read, Update, Delete) functionality implemented across the SmartGrade Vue 3 application, excluding Student operations as per requirements.

**Implementation Date:** December 26, 2025  
**Framework:** Vue 3 (Composition API) + TypeScript + Supabase  
**Excluded:** Student CRUD operations (read-only access only)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Composables (Data Layer)](#composables-data-layer)
3. [Admin CRUD Operations](#admin-crud-operations)
4. [Teacher CRUD Operations](#teacher-crud-operations)
5. [Grades CRUD Operations](#grades-crud-operations)
6. [Documents CRUD Operations](#documents-crud-operations)
7. [Profile & Settings CRUD](#profile--settings-crud)
8. [UI Components (Presentation Layer)](#ui-components-presentation-layer)
9. [Best Practices & Guidelines](#best-practices--guidelines)
10. [Testing Checklist](#testing-checklist)

---

## Architecture Overview

The CRUD implementation follows a **layered architecture**:

```
┌─────────────────────────────────────┐
│  Vue Pages (UI Components)          │  ← User interface & presentation
├─────────────────────────────────────┤
│  Composables (Business Logic)       │  ← CRUD operations & data management
├─────────────────────────────────────┤
│  Supabase Client                    │  ← Database & authentication
├─────────────────────────────────────┤
│  PostgreSQL Database                │  ← Data persistence
└─────────────────────────────────────┘
```

**Key Principles:**

- No business logic in UI components
- All CRUD operations via composables
- Supabase Auth is the ONLY authentication provider
- DepEd email enforcement (@deped.gov.ph)
- Complete audit trail for all modifications
- Role-based access control (RBAC)

---

## Composables (Data Layer)

### 1. useAdmin.ts

**Location:** `src/composables/useAdmin.ts`

**Interfaces:**

- `AdminProfile` - Admin user information
- `TeacherApprovalRequest` - Teacher account approval workflow
- `UnlockRequest` - Grade unlock request details
- `SystemSettings` - School-wide configuration
- `AuditLog` - Comprehensive action logging

**CRUD Operations:**

#### CREATE

```typescript
// Create system settings
const settings = await createSystemSettings({
  school_name: "Ampayon Senior High School",
  passing_grade: 75,
  honors_with_honors_threshold: 90,
  // ...
});
```

#### READ

```typescript
// Fetch pending teacher approvals
const pendingTeachers = await fetchPendingTeachers();

// Fetch approved teachers
const approvedTeachers = await fetchApprovedTeachers();

// Fetch grade unlock requests
const requests = await fetchUnlockRequests("pending");

// Fetch system settings
const settings = await fetchSystemSettings();

// Fetch audit logs with filters
const logs = await fetchAuditLogs({
  user_id: "123",
  action: "grade_updated",
  table_name: "grades",
});
```

#### UPDATE

```typescript
// Approve a teacher
const success = await approveTeacher(teacherId);

// Reject a teacher
const success = await rejectTeacher(teacherId, "Reason here");

// Approve unlock request
const success = await approveUnlockRequest(requestId, "Admin notes");

// Reject unlock request
const success = await rejectUnlockRequest(requestId, "Admin notes");

// Update system settings
const updated = await updateSystemSettings({
  passing_grade: 76,
  honors_with_honors_threshold: 91,
});
```

#### DELETE

- Not applicable for Admin operations (audit trail preserved)

---

### 2. useTeacher.ts

**Location:** `src/composables/useTeacher.ts`

**Interfaces:**

- `TeacherClass` - Class/section assignment
- `ClassStudent` - Student enrollment record
- `StudentSearchResult` - Search result for student lookup

**CRUD Operations:**

#### CREATE

```typescript
// Create a new class
const newClass = await createClass({
  subject_id: "subj-123",
  section: "Einstein",
  school_year_id: "sy-2024-2025",
  grading_period: 1,
});
```

#### READ

```typescript
// Fetch all teacher's classes
const classes = await fetchTeacherClasses()

// Fetch students in a class
const students = await fetchClassStudents(classId)

// Search for students by LRN/name
const results = await searchStudents('John')

// Fetch available subjects
const subjects = await fetchSubjects()

// Fetch school years
const years = await fetchSchoolYears()

// Fetch teacher's audit logs
const logs = await fetchTeacherAuditLogs(limit: 50)
```

#### UPDATE

```typescript
// Update class details (section, grading period)
const updated = await updateClass(classId, {
  section: "Newton",
  grading_period: 2,
});
```

#### DELETE

```typescript
// Delete a class (must have no enrolled students)
const success = await deleteClass(classId);

// Unenroll a student from class
const success = await unenrollStudent(enrollmentId);
```

**Student Enrollment (Complementary Operations):**

```typescript
// Enroll a student in a class
const success = await enrollStudent(classId, studentId);

// Unenroll a student
const success = await unenrollStudent(enrollmentId);
```

---

### 3. useGrades.ts

**Location:** `src/composables/useGrades.ts`

**Interfaces:**

- `GradeEntry` - Individual student grade record
- `FinalizationStatus` - Grade lock/unlock state
- `GradingPeriod` - Quarter/period definition
- `SystemSettings` - Grading formula percentages

**CRUD Operations:**

#### CREATE

```typescript
// No direct CREATE (grades created via UPDATE)
```

#### READ

```typescript
// Fetch class grades
const grades = await fetchClassGrades(classId);

// Fetch finalization statuses
const statuses = await fetchFinalizationStatuses(
  studentIds,
  schoolYearId,
  semester
);

// Get student's GPA
const gpa = await fetchStudentGPA(studentId, schoolYearId, semester);

// Fetch system settings
const settings = await fetchSystemSettings();
```

#### UPDATE

```typescript
// Save/update a grade entry
const success = await saveGrade({
  student_id: "std-123",
  written_work_score: 45,
  written_work_total: 50,
  // ...
});

// Update specific grade component
const success = await updateGradeComponent(
  gradeId,
  "written_work",
  45, // score
  50 // total
);

// Finalize grades for a student
const success = await finalizeGrades(studentId, schoolYearId, "1");

// Finalize all class grades
const success = await finalizeClassGrades(classId, gradeEntries);
```

#### DELETE

```typescript
// Delete a grade entry
const success = await deleteGrade(gradeId);
```

**Special Operations:**

```typescript
// Request grade unlock (teacher to admin)
const requestId = await requestGradeUnlock(
  studentId,
  schoolYearId,
  "1",
  "Error in calculation"
);

// Compute quarterly grade
const grade = computeQuarterlyGrade(
  wwScore,
  wwTotal,
  ptScore,
  ptTotal,
  qaScore,
  qaTotal
);

// Compute GPA
const gpa = await computeStudentGPA(studentId, schoolYearId);

// Check if grades are finalized
const isLocked = await checkGradeFinalization(studentId, schoolYearId, "1");
```

---

### 4. useCRUDDocuments.ts

**Location:** `src/composables/useCRUDDocuments.ts`

**Interfaces:**

- `SF9Document` - Report Card interface
- `SF10Document` - Permanent Record interface
- `Certificate` - Awards/honors certificate
- `DocumentMetadata` - Storage metadata

**CRUD Operations:**

#### CREATE

```typescript
// Create SF9 (Report Card)
const sf9 = await createSF9Document(
  studentId,
  schoolYearId,
  '1',  // semester
  {
    adviser_name: 'Mr. Santos',
    school_name: 'Ampayon SHS'
  }
)

// Create SF10 (Permanent Record)
const sf10 = await createSF10Document(studentId, schoolYearId, {...})

// Create Certificate
const cert = await createCertificate(
  studentId,
  schoolYearId,
  'highest_honors',  // certificate_type
  { issued_date: '2025-03-15' }
)
```

#### READ

```typescript
// Fetch student's SF9 documents
const sf9s = await fetchStudentSF9s(studentId);

// Fetch student's SF10 documents
const sf10s = await fetchStudentSF10s(studentId);

// Fetch student's certificates
const certs = await fetchStudentCertificates(studentId);
```

#### UPDATE

```typescript
// Edit SF9 content
const updated = await updateSF9Document(sf9Id, {
  adviser_name: 'Ms. Garcia',
  remarks: 'Corrected adviser name'
})

// Edit SF10 content
const updated = await updateSF10Document(sf10Id, {...})

// Update certificate details
const updated = await updateCertificate(certId, {
  remarks: 'Issued during graduation'
})
```

#### DELETE

```typescript
// Delete SF9 document
const success = await deleteSF9Document(sf9Id);

// Delete SF10 document
const success = await deleteSF10Document(sf10Id);

// Delete certificate
const success = await deleteCertificate(certId);
```

**Gating Conditions:**

- SF9/SF10 require finalized grades
- Certificates require GPA thresholds met
- Only created by teachers with finalized grades

---

### 5. useProfileSettings.ts

**Location:** `src/composables/useProfileSettings.ts`

**Interfaces:**

- `UserProfile` - User account information
- `TeacherProfile` - Teacher-specific fields
- `StudentProfile` - Student-specific fields
- `SchoolSettings` - School configuration

**CRUD Operations:**

#### CREATE

```typescript
// Create school settings (admin only)
const settings = await createSchoolSettings({
  school_name: "Ampayon SHS",
  school_year_from: 2024,
  school_year_to: 2025,
  passing_grade: 75,
  // ...
});
```

#### READ

```typescript
// Fetch current user's profile
const profile = await fetchCurrentProfile();

// Fetch specific user profile (admin only)
const userProfile = await fetchUserProfile(userId);

// Fetch student profile
const student = await fetchStudentProfile(studentId);

// Fetch school settings
const settings = await fetchSchoolSettings();

// Fetch all users (admin only)
const users = await fetchAllUsers("teacher"); // Optional role filter

// Fetch all students
const students = await fetchAllStudents(gradeLevel); // Optional grade filter

// Search users
const results = await searchUsers("john@deped.gov.ph");

// Search students
const results = await searchStudents("12345"); // LRN or name
```

#### UPDATE

```typescript
// Update current user's profile
const updated = await updateProfile({
  first_name: "Juan",
  middle_name: "M",
  last_name: "Santos",
});

// Update student profile (teacher/admin)
const updated = await updateStudentProfile(studentId, {
  track: "STEM",
  strand: "Biology",
  grade_level: 11,
});

// Change password
const success = await changePassword("newPassword123");

// Update school settings (admin only)
const updated = await updateSchoolSettings({
  passing_grade: 76,
  honors_with_honors_threshold: 91,
});
```

#### DELETE

- Not applicable for profiles (deactivation via is_active flag)

---

## Admin CRUD Operations

### Pages

#### `/admin/teachers.vue`

- **Feature:** Approve/reject teacher accounts
- **CRUD Operations:**
  - **READ:** Fetch pending and approved teachers
  - **UPDATE:** Approve or reject teacher accounts
  - **Status Management:** Active/inactive toggle

**Key Components:**

- Pending Approval Tab - Manage new teacher requests
- Approved Teachers Tab - Manage existing teachers
- Reject Confirmation Dialog

#### `/admin/unlock-requests.vue`

- **Feature:** Manage grade unlock requests from teachers
- **CRUD Operations:**
  - **READ:** Fetch all unlock requests (pending/approved/rejected)
  - **UPDATE:** Approve or reject unlock requests
  - **Admin Notes:** Add decision notes

**Key Components:**

- Pending Requests Tab
- All Requests History
- Request Details Dialog

#### `/admin/settings.vue`

- **Feature:** Manage school-wide settings
- **CRUD Operations:**
  - **CREATE:** Initialize system settings
  - **READ:** Fetch current settings
  - **UPDATE:** Modify grading thresholds and percentages
  - **AUDIT:** View settings change history

**Key Components:**

- School Information Form
- Grade Thresholds Configuration
- DepEd Formula Percentages
- Audit History Table

#### `/admin/audit-logs.vue` (Existing)

- **Feature:** View comprehensive system audit trail
- **CRUD Operations:**
  - **READ:** Fetch audit logs with filters
  - **FILTERS:** By user, action, table, date range

---

## Teacher CRUD Operations

### Pages

#### `/teacher/classes-management.vue`

- **Feature:** Manage teacher's class assignments
- **CRUD Operations:**
  - **CREATE:** Create new class
  - **READ:** Fetch all teacher's classes
  - **UPDATE:** Modify class details (section, grading period)
  - **DELETE:** Delete empty classes

**Key Components:**

- Classes Grid View
- Create/Edit Class Dialog
- Delete Confirmation Dialog
- Class Card with quick stats

#### `/teacher/student-enrollment.vue`

- **Feature:** Manage class rosters
- **CRUD Operations:**
  - **CREATE:** Enroll students in class
  - **READ:** Fetch enrolled students
  - **DELETE:** Unenroll students
  - **SEARCH:** Find students by LRN/name

**Key Components:**

- Enrolled Students Table
- Student Search Dialog
- Enrollment/Unenrollment Actions

#### `/teacher/grades-management.vue`

- **Feature:** Enter and manage grades
- **CRUD Operations:**
  - **CREATE:** Save new grade entries
  - **READ:** Fetch class grades
  - **UPDATE:** Modify component scores (WW, PT, QA)
  - **DELETE:** Remove grade entries
  - **FINALIZE:** Lock grades for submission
  - **REQUEST UNLOCK:** Ask admin for modifications

**Key Components:**

- Grade Entry Table with inline editing
- Component Score Fields (WW, PT, QA)
- Quarterly Grade Computation
- Final Grade Entry
- Finalization Button
- Unlock Request Dialog

**Special Features:**

- Automatic quarterly grade calculation
- GPA computation on finalization
- Audit trail for all grade changes
- Request unlock workflow

---

## Grades CRUD Operations

### Academic Workflow

1. **Grade Entry Phase** (DRAFT state)

   - Teachers enter component scores
   - System auto-calculates quarterly grades
   - Modifications allowed

2. **Finalization Phase** (FINALIZED state)

   - Teacher clicks "Finalize Grades"
   - GPA computed automatically
   - Grades locked against modification

3. **Unlock Phase** (if needed)
   - Teacher requests unlock with reason
   - Admin reviews and approves/rejects
   - If approved, returns to DRAFT state
   - Teacher can correct and re-finalize

### Data Validation

```typescript
// Quarterly Grade Calculation (DepEd Formula)
// WW: 30%, PT: 50%, QA: 20%
quarterly_grade = (WW% × 0.30) + (PT% × 0.50) + (QA% × 0.20)

// GPA Calculation
// All final grades must be entered
// Credit units considered if applicable
gpa = Σ(final_grade × credit_units) / Σ(credit_units)
```

---

## Documents CRUD Operations

### Document Types

#### SF9 (Report Card)

- **Trigger:** Teacher generates after grade finalization
- **Content:** Quarterly grades for all subjects
- **Fields:** Student name, track, strand, adviser, school
- **Editable Before Export:** Yes
- **Deletion:** Soft delete (can be recreated)

#### SF10 (Permanent Record)

- **Trigger:** Teacher generates after year-end finalization
- **Content:** All grades across all quarters
- **Fields:** LRN, birth date, parent names, adviser
- **Editable Before Export:** Yes
- **Deletion:** Soft delete (can be recreated)

#### Certificates

- **Types:** With Honors (≥90), With High Honors (≥95), With Highest Honors (≥98), Good Moral
- **Trigger:** Teacher generates based on GPA
- **Validation:** GPA threshold must be met
- **Editable:** Remarks and issue date only
- **Deletion:** Soft delete

### Storage

- **Location:** Supabase Storage
- **Buckets:**
  - `documents/` - SF9 & SF10 PDFs
  - `certificates/` - Certificate PDFs
- **Access:** Public read (once finalized)
- **Ownership:** Teachers (created_by)

---

## Profile & Settings CRUD

### User Profile Management

```typescript
// Update own profile
await updateProfile({
  first_name: "Juan",
  middle_name: "M",
  last_name: "Santos",
});

// Change password (triggers Supabase auth)
await changePassword("newPassword");

// Admin: View user profiles
const user = await fetchUserProfile(userId);

// Admin: Search users
const results = await searchUsers("john");
```

### School Settings Management

```typescript
// Admin: Initialize settings for school year
await createSchoolSettings({
  school_name: "Ampayon Senior High School",
  current_school_year: "2024-2025",
  passing_grade: 75,
  honors_with_honors_threshold: 90,
  honors_with_high_honors_threshold: 95,
  honors_with_highest_honors_threshold: 98,
  written_work_percentage: 30,
  performance_task_percentage: 50,
  quarterly_assessment_percentage: 20,
});

// Admin: Update settings
await updateSchoolSettings({
  passing_grade: 76,
  honors_with_honors_threshold: 91,
});
```

---

## UI Components (Presentation Layer)

### Architecture Pattern

All pages follow a consistent pattern:

```vue
<template>
  <v-card>
    <!-- Header with Title & Actions -->
    <v-card-title class="d-flex justify-space-between">
      <span>Title</span>
      <v-btn color="primary" @click="openDialog">Create</v-btn>
    </v-card-title>

    <!-- Progress & Alerts -->
    <v-progress-linear v-if="loading" indeterminate />
    <v-alert v-if="error" type="error" closable @click:close="error = null" />

    <!-- Main Content -->
    <v-card-text>
      <!-- Table/List View -->
      <v-table hover>
        <!-- Headers -->
        <!-- Rows with Actions -->
      </v-table>
    </v-card-text>
  </v-card>

  <!-- Dialog for Create/Edit -->
  <v-dialog v-model="dialog">
    <v-card>
      <v-card-title>Dialog Title</v-card-title>
      <v-card-text>
        <v-form>
          <!-- Input Fields -->
        </v-form>
      </v-card-text>
      <v-card-actions>
        <!-- Buttons -->
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Confirmation -->
  <v-dialog v-model="deleteDialog">
    <!-- Confirmation content -->
  </v-dialog>

  <!-- Snackbar for Feedback -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color">
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useComposable } from "@/composables/useComposable";

// Composable
const { loading, error, fetchData, createItem, updateItem, deleteItem } =
  useComposable();

// State
const data = ref([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const selectedItem = ref(null);

// Snackbar
const snackbar = ref({ show: false, message: "", color: "success" });

// Methods
const loadData = async () => {
  /* ... */
};
const handleCreate = async () => {
  /* ... */
};
const handleUpdate = async () => {
  /* ... */
};
const handleDelete = async () => {
  /* ... */
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
```

---

## Best Practices & Guidelines

### 1. Error Handling

```typescript
// Always use try-catch in composables
try {
  const result = await supabase.from("table").select();
  if (fetchError) throw fetchError;
} catch (err) {
  error.value = err instanceof Error ? err.message : "Unknown error";
  console.error("Operation failed:", err);
}
```

### 2. Loading States

```typescript
// Always manage loading state
loading.value = true;
try {
  // Operation
} finally {
  loading.value = false;
}
```

### 3. Audit Trail

```typescript
// Log all CRUD operations
await supabase.from("audit_logs").insert({
  user_id: authStore.profile?.user_id,
  action: "OPERATION_NAME",
  table_name: "table_name",
  record_id: itemId,
  new_values: updateData,
  old_values: oldData, // For updates/deletes
});
```

### 4. Role-Based Access Control

```typescript
// Always verify user role
if (authStore.profile?.role !== "admin") {
  throw new Error("Insufficient permissions");
}
```

### 5. Email Validation

```typescript
// DepEd email enforcement
if (!email.endsWith("@deped.gov.ph")) {
  throw new Error("Only @deped.gov.ph email addresses allowed");
}
```

### 6. Grade Finalization Protection

```typescript
// Check finalization status before modifications
const isLocked = await checkGradeFinalization(
  studentId,
  schoolYearId,
  semester
);
if (isLocked) {
  throw new Error("Cannot modify finalized grades");
}
```

---

## Testing Checklist

### Admin Features

- [ ] Approve pending teacher accounts
- [ ] Reject teacher accounts
- [ ] Deactivate approved teachers
- [ ] View pending unlock requests
- [ ] Approve unlock requests with notes
- [ ] Reject unlock requests
- [ ] Create system settings
- [ ] Update grading thresholds
- [ ] Verify percentages sum to 100%
- [ ] View audit logs with filters
- [ ] Filter audit logs by user, action, date

### Teacher Features

- [ ] Create new class
- [ ] Edit class section and grading period
- [ ] Delete empty class
- [ ] Cannot delete class with enrolled students
- [ ] Search and enroll students
- [ ] Unenroll students from class
- [ ] Enter grade component scores
- [ ] Auto-calculate quarterly grades
- [ ] Enter final grades
- [ ] Finalize grades for all students
- [ ] Cannot modify after finalization
- [ ] Request grade unlock with reason
- [ ] View pending unlock requests
- [ ] View own audit logs

### Grade & Document Features

- [ ] Cannot generate SF9 without finalized grades
- [ ] Cannot generate SF10 without finalized grades
- [ ] Cannot issue honors certificate below GPA threshold
- [ ] Can edit document content before export
- [ ] Can delete documents (soft delete)
- [ ] GPA computed on grade finalization
- [ ] Unlock request returns grades to DRAFT state
- [ ] Re-finalization after unlock works correctly

### Data Integrity

- [ ] All operations logged in audit trail
- [ ] Unique constraint prevents duplicate enrollments
- [ ] Foreign keys prevent orphaned records
- [ ] Grade calculations match DepEd formula
- [ ] Email validation enforces @deped.gov.ph
- [ ] Role-based access control works correctly

---

## Summary

The SmartGrade CRUD implementation provides:

✅ **Complete CRUD for:**

- Admin (Teacher approval, unlock requests, system settings)
- Teachers (Classes, student enrollment, grades)
- Grades (Entry, calculation, finalization, unlock workflow)
- Documents (SF9, SF10, Certificates)
- Profiles & Settings

✅ **Excluded:**

- Student CRUD (read-only access only per requirements)

✅ **Key Features:**

- Comprehensive audit trail
- Role-based access control
- Grade finalization workflow
- GPA computation
- Document generation with gating
- DepEd formula implementation
- Email-only authentication
- Error handling & validation

✅ **Data Security:**

- All operations require authentication
- Role-based permission checks
- Audit logging for accountability
- Supabase RLS policies (in database)

This implementation follows Vue 3 best practices, maintains clean separation of concerns, and provides a user-friendly interface for managing the complete academic workflow.
