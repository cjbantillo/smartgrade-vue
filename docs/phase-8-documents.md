# Phase 8: Document Generation (SF9/SF10)

**Status:** ✅ Complete  
**Date:** December 24, 2024

## Overview

Implemented official DepEd document generation system (SF9 Report Card & SF10 Permanent Record) with editable metadata fields, strict finalization requirements, comprehensive edit logging, and print/PDF export capabilities.

## Features Implemented

### 1. Documents Composable

- **Location:** `src/composables/useDocuments.ts`
- **Core Functions:**
  - `checkFinalization()` - Verify grades are finalized before generation
  - `generateSF9()` - Build SF9 data from grades, student info, school year
  - `generateSF10()` - Build comprehensive SF10 with multi-year history
  - `logDocumentEdit()` - Track metadata field changes (NOT grades)
  - `fetchDocumentEdits()` - Get edit history for document
- **Data Models:**
  - `SF9Data` - Student info, subjects, quarterly grades, general average
  - `SF10Data` - Student info, multi-year academic history
  - `DocumentEdit` - Edit log entry with old/new values

### 2. SF9 (Report Card) Generator

- **Location:** `src/pages/teacher/documents/sf9/[studentId]/[schoolYearId].vue`
- **Features:**
  - **Official DepEd Header:** Republic of Philippines, DepEd, School name
  - **Student Information Display:**
    - Name (last, first, middle)
    - LRN
    - Grade level
    - Track/Strand
    - School year
  - **Editable Metadata Fields:**
    - Section (can be corrected)
    - Class Adviser name
    - School Principal name
    - Date Issued
    - Additional Remarks
  - **Grades Table:**
    - Learning Areas (subject names)
    - Quarterly Ratings (Q1, Q2, Q3, Q4)
    - Final Rating (computed)
    - Remarks (PASSED/FAILED)
    - General Average (bold, prominent)
  - **Signature Blocks:** Adviser, Parent/Guardian, Principal
  - **Print/PDF Export:** Browser print with @media print styles
  - **Edit History:** Shows all metadata changes with timestamps

### 3. SF10 (Permanent Record) Generator

- **Location:** `src/pages/teacher/documents/sf10/[studentId].vue`
- **Features:**
  - **Official DepEd Header:** Same as SF9
  - **Learner's Information Section:**
    - Name, LRN
    - Birthdate, Birthplace, Gender (editable)
    - Parent/Guardian, Contact Number (editable)
    - Address (editable)
  - **Academic History (Multi-Year):**
    - Separate table per school year
    - Grade level per year
    - All quarterly and final grades
    - General average per year
    - Remarks per year
  - **Editable Metadata:**
    - All personal information fields
    - Additional remarks
  - **Print-Optimized:** Page breaks between school years
  - **Edit History:** Complete log of all changes

### 4. Document Generation Workflow

#### Teacher Flow:

1. Enter grades for all students
2. Compute quarterly grades
3. Save all changes
4. Click "Finalize Grades"
5. **Document generation buttons appear**
6. Click "Generate SF9" or "Generate SF10"
7. View/edit document metadata
8. Print/export to PDF

#### System Validation:

- ✅ Grades must be finalized first (checked at composable level)
- ✅ Cannot generate if `is_finalized = false`
- ✅ Error shown if attempted before finalization
- ✅ All metadata edits logged (not grade changes)

## Policy Compliance

| Policy Requirement                      | Implementation Status                                   |
| --------------------------------------- | ------------------------------------------------------- |
| SF9/SF10 only after finalization        | ✅ `checkFinalization()` enforced in composable         |
| Edit document fields (not grades)       | ✅ Only metadata editable, grades are read-only display |
| All edits logged                        | ✅ `document_edits` table tracks every change           |
| Teacher-generated documents             | ✅ No admin involvement required                        |
| Cannot modify finalized grades via docs | ✅ Grade fields are computed/displayed only             |

## Database Integration

### Tables Used

**grades:**

- Source of quarterly grades for SF9/SF10
- Joined with `subjects`, `grading_periods`
- Read-only in document context

**final_grades:**

- Source of final ratings and remarks
- Semester-based aggregation
- Read-only in document context

**grade_finalization_status:**

- **Gatekeeper:** Checked before document generation
- `is_finalized` must be TRUE
- Stores `general_average` displayed on documents

**document_edits:**

- Logs all metadata field changes
- Columns: `document_type` (SF9/SF10), `student_id`, `field_name`, `old_value`, `new_value`, `edited_by`, `edited_at`
- Does NOT log grade changes (policy compliance)

**students:**

- Source of student personal information
- LRN, name, track, strand, grade level

**school_years:**

- Maps school year ID to display name (e.g., "2024-2025")

**audit_logs:**

- Additional logging: `sf9_edited`, `sf10_edited` actions
- Captures user_id and timestamp

## Testing Instructions

### Prerequisites

1. Login as teacher: `teacher@deped.gov.ph` / `password123`
2. Have a class with enrolled students
3. **Must have finalized grades** (complete Phase 7 first)

### Test Scenarios

#### 1. Verify Finalization Requirement

1. Navigate to class with **unfinalized** grades
2. Try accessing `/teacher/documents/sf9/[studentId]/[schoolYearId]`
3. **Expected:** Warning message "Cannot Generate SF9: Grades must be finalized first"
4. **Expected:** No document displayed

#### 2. Generate SF9 (After Finalization)

1. Finalize a class's grades
2. Click "Generate SF9 (Report Cards)" button
3. **Expected:** Navigate to SF9 page
4. **Expected:** Student info displayed
5. **Expected:** All quarterly grades shown in table
6. **Expected:** General average calculated
7. **Expected:** Signature blocks visible

#### 3. Edit SF9 Metadata

1. On SF9 page, edit "Section" field
2. Change value (e.g., "HUMSS A" → "HUMSS B")
3. Click outside field (blur)
4. **Expected:** Edit logged automatically
5. Scroll to "Edit History" section
6. **Expected:** Change appears with timestamp

#### 4. Edit Multiple Fields

1. Fill in "Class Adviser" name
2. Fill in "School Principal" name
3. Set "Date Issued"
4. Add "Additional Remarks"
5. **Expected:** Each edit creates separate log entry
6. **Expected:** Edit history shows all 4 changes

#### 5. Print/Export SF9

1. Click "Print / Export PDF" button
2. **Expected:** Browser print dialog opens
3. **Expected:** Document formatted for printing
4. **Expected:** Buttons/alerts hidden (no-print)
5. **Expected:** Tables properly formatted
6. Save as PDF or print to verify

#### 6. Generate SF10 (Permanent Record)

1. Click "Generate SF10 (Permanent Records)" button
2. **Expected:** Navigate to SF10 page
3. **Expected:** Student personal info section
4. **Expected:** Academic history for all school years
5. **Expected:** Each school year in separate card

#### 7. Edit SF10 Metadata

1. Fill "Birthdate", "Birthplace", "Gender"
2. Fill "Parent/Guardian", "Contact Number"
3. Fill "Address"
4. **Expected:** Each edit logged
5. Check edit history
6. **Expected:** All changes visible

#### 8. Multi-Year SF10

1. Generate SF10 for student with multiple years
2. **Expected:** Separate table per school year
3. **Expected:** Grades for each year displayed
4. **Expected:** General average per year calculated

#### 9. Verify Grade Immutability

1. On SF9 or SF10 page
2. Try to click on grade cells
3. **Expected:** Grades are plain text (not editable)
4. **Expected:** Only metadata fields are editable inputs

#### 10. Edit Logging Verification

1. Make 3 different edits
2. Reload the page
3. **Expected:** Edit history persists
4. **Expected:** Edits shown in chronological order (newest first)

## File Structure

```
src/
├── composables/
│   └── useDocuments.ts           # Document generation logic
├── pages/
│   └── teacher/
│       ├── classes/
│       │   └── [id]/
│       │       └── grades.vue    # Updated with doc generation buttons
│       └── documents/
│           ├── sf9/
│           │   └── [studentId]/
│           │       └── [schoolYearId].vue   # SF9 generator
│           └── sf10/
│               └── [studentId].vue          # SF10 generator
```

## API Patterns

### Generate SF9

```typescript
// Check finalization first
const isFinalized = await checkFinalization(studentId, schoolYearId, "1");
if (!isFinalized) throw new Error("Grades not finalized");

// Fetch student data
const { data: student } = await supabase
  .from("students")
  .select("*")
  .eq("id", studentId);

// Fetch grades
const { data: grades } = await supabase
  .from("grades")
  .select(
    `
    *,
    subjects:subject_id (code, name),
    grading_periods:grading_period_id (period_number)
  `
  )
  .eq("student_id", studentId)
  .eq("school_year_id", schoolYearId);

// Organize by subject and period
// Return SF9Data object
```

### Log Document Edit

```typescript
await supabase.from("document_edits").insert({
  document_type: "SF9",
  student_id,
  school_year_id,
  field_name: "adviser_name",
  old_value: "",
  new_value: "Mr. John Smith",
  edited_by: authStore.user.id,
});

// Also log in audit_logs
await supabase.from("audit_logs").insert({
  user_id: authStore.user.id,
  action: "sf9_edited",
  entity_type: "SF9",
  entity_id: studentId,
});
```

## Document Metadata Fields

### SF9 Editable Fields:

- `section` - Class section (correctable if wrong)
- `adviser_name` - Class adviser's full name
- `principal_name` - School principal's full name
- `date_issued` - Document issuance date
- `remarks_text` - Additional notes/remarks

### SF10 Editable Fields:

- `birthdate` - Student's date of birth
- `birthplace` - Student's place of birth
- `gender` - Male/Female
- `parent_guardian` - Parent or guardian name
- `contact_number` - Contact phone number
- `address` - Complete residential address
- `remarks_text` - Additional notes

### Non-Editable (Read-Only):

- **All grades:** Q1, Q2, Q3, Q4, Final
- **Computed values:** General Average
- **Student info:** LRN, Name
- **Academic data:** Track, Strand, Grade Level

## Print Styling

### CSS @media print:

```css
@media print {
  /* Hide UI elements */
  .v-btn,
  .v-alert,
  .edit-history {
    display: none !important;
  }

  /* Remove box shadows */
  .document-card {
    box-shadow: none;
  }

  /* Hide input borders */
  .v-text-field,
  .v-textarea {
    border: none !important;
  }

  /* Page breaks for SF10 */
  .school-year-section {
    page-break-after: always;
  }
}
```

## Known Limitations

- **Student Selection:** Currently navigates to first student only (needs selector dialog)
- **Batch Generation:** No bulk PDF export (one student at a time)
- **Digital Signatures:** Uses text signatures only (no e-signature integration)
- **Template Customization:** Header text is hardcoded (should be in settings)
- **SF10 School Year ID:** Needs proper mapping for edit logging
- **Document Storage:** Not persisted (regenerated on demand)

## Next Steps (Future Enhancements)

- [ ] Student selector dialog for document generation
- [ ] Batch PDF generation (all students in class)
- [ ] Document templates in system settings
- [ ] Digital signature integration
- [ ] Store generated documents in database
- [ ] Document version history
- [ ] Email documents to students/parents
- [ ] QR code for document verification

## Security Notes

- **Finalization Check:** Enforced at composable level (not just UI)
- **Edit Logging:** Every metadata change tracked with user ID
- **Grade Immutability:** Grades displayed as read-only text
- **Audit Trail:** Both `document_edits` and `audit_logs` updated
- **Teacher Isolation:** Can only generate docs for their students
- **No Grade Tampering:** Document edits cannot modify actual grade data

## UI/UX Notes

- **Print-Optimized Layout:** Official document formatting with headers
- **Professional Styling:** DepEd-compliant document appearance
- **Edit Tracking UI:** Clear history of all changes with timestamps
- **Responsive Design:** Works on desktop/tablet (print is primary use case)
- **Loading States:** Shows spinner during data fetching
- **Error Handling:** Clear messages for finalization requirement
- **Success Feedback:** Edit confirmation via logging display
