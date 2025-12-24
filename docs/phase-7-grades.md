# Phase 7: Grade Entry & Finalization

**Status:** ✅ Complete  
**Date:** December 24, 2024

## Overview

Implemented comprehensive grade entry and finalization system following DepEd grading formula and official policy requirements for grade locking workflow. Teachers can enter component scores, compute quarterly grades, and finalize grades with strict state machine enforcement.

## Features Implemented

### 1. Grades Composable

- **Location:** `src/composables/useGrades.ts`
- **Core Functions:**
  - `fetchClassGrades()` - Get all student grades for a class (existing + skeleton entries)
  - `saveGrade()` - Save/update individual grade entry with finalization check
  - `computeQuarterlyGrade()` - Calculate using DepEd formula (WW 30% + PT 50% + QA 20%)
  - `checkGradeFinalization()` - Verify if grades are locked
  - `finalizeClassGrades()` - Lock all grades for a class
  - `fetchFinalizationStatuses()` - Get finalization status for multiple students
  - `fetchSystemSettings()` - Load grading percentages and passing grade

### 2. Grade Entry Page

- **Location:** `src/pages/teacher/classes/[id]/grades.vue`
- **Features:**
  - **Spreadsheet-style table** with sticky header and columns
  - **Component score inputs:**
    - Written Work (Score / Total)
    - Performance Task (Score / Total)
    - Quarterly Assessment (Score / Total)
  - **Auto-computation:** Calculates grade on field blur when all components complete
  - **Batch operations:**
    - "Compute All Grades" button
    - "Save All Changes" button
  - **Individual actions:**
    - Compute button per student
    - Save button per student
  - **Quarterly grade display** with color coding:
    - Green (90+) - Excellent
    - Blue (75-89) - Passing
    - Red (<75) - Failed
  - **Finalization workflow:**
    - "Finalize Grades" button (disabled if incomplete)
    - Confirmation dialog with warnings
    - Shows incomplete count
  - **Lock status UI:**
    - Warning banner when finalized
    - Disabled inputs when locked
    - Status chip in header

### 3. DepEd Grading Formula

**Formula:** `Quarterly Grade = (WW% × 30%) + (PT% × 50%) + (QA% × 20%)`

**Calculation Steps:**

1. Convert raw scores to percentages:

   - `WW% = (WW Score / WW Total) × 100`
   - `PT% = (PT Score / PT Total) × 100`
   - `QA% = (QA Score / QA Total) × 100`

2. Apply weighted percentages:

   - `WW Component = WW% × 0.30`
   - `PT Component = PT% × 0.50`
   - `QA Component = QA% × 0.20`

3. Sum components:

   - `Quarterly Grade = WW Component + PT Component + QA Component`

4. Round to 2 decimal places

**Example:**

- WW: 35/40 → 87.5% → 87.5 × 0.30 = 26.25
- PT: 45/50 → 90% → 90 × 0.50 = 45.00
- QA: 18/20 → 90% → 90 × 0.20 = 18.00
- **Quarterly Grade = 89.25**

### 4. Grade Finalization State Machine

#### State 1: DRAFT (Editable)

**Characteristics:**

- All inputs enabled
- Teacher can modify scores freely
- Grades computed but not locked
- Students cannot view grades yet

**UI Indicators:**

- Green "Editable" chip in header
- All input fields active
- Save/Compute buttons enabled

**Allowed Actions:**

- Enter/update scores
- Compute grades
- Save changes
- Finalize (if all complete)

---

#### State 2: READY FOR FINALIZATION

**Characteristics:**

- All students have complete quarterly grades
- "Finalize Grades" button enabled
- Still in DRAFT state (editable)

**UI Indicators:**

- Incomplete count = 0
- Finalize button active
- Warning in dialog about finalization

**Transition Condition:**

- Teacher clicks "Finalize Grades"
- Confirms in dialog
- System locks all grades

---

#### State 3: FINALIZED (Locked)

**Characteristics:**

- **All inputs disabled** - No teacher edits allowed
- Grades visible to students
- Documents (SF9/SF10) can be generated
- Only Admin can unlock

**UI Indicators:**

- ⚠️ Warning banner: "Grades are finalized and locked"
- Orange "Finalized" chip with lock icon
- All input fields disabled (grey background)
- Save/Compute/Finalize buttons hidden

**Database Changes:**

- `grade_finalization_status.is_finalized = true`
- `finalized_by` = teacher user_id
- `finalized_at` = timestamp
- Audit log entry created

**Unlock Process (Admin Only):**

1. Admin reviews unlock request
2. Admin updates `is_finalized = false`
3. Increments `unlock_count`
4. Records `last_unlocked_by`, `last_unlocked_at`, `unlock_reason`
5. Grades return to DRAFT state

## Policy Compliance

| Policy Requirement                           | Implementation Status                                   |
| -------------------------------------------- | ------------------------------------------------------- |
| Teachers enter component grades (WW, PT, QA) | ✅ Spreadsheet table with dedicated columns             |
| DepEd formula: 30-50-20 weighting            | ✅ Implemented in `computeQuarterlyGrade()`             |
| Teacher must explicitly finalize             | ✅ Dedicated "Finalize Grades" button with confirmation |
| Finalized grades locked from teacher edits   | ✅ All inputs disabled, save blocked with error         |
| Only Admin can unlock finalized grades       | ✅ Teacher cannot unlock (Admin feature in Phase 5)     |
| All grade entries audited                    | ✅ Logged via `audit_logs` table                        |
| GPA calculation (future)                     | ⏳ Deferred to Phase 8                                  |
| Document generation after finalization       | ⏳ Phase 9                                              |

## Database Integration

### Tables Used

**grades:**

- Stores component scores and computed quarterly grade
- Columns: `written_work_score`, `written_work_total`, `performance_task_score`, `performance_task_total`, `quarterly_assessment_score`, `quarterly_assessment_total`, `quarterly_grade`
- UNIQUE constraint: `(student_id, subject_id, grading_period_id)`
- CHECK: `quarterly_grade` between 60-100

**grade_finalization_status:**

- Tracks lock state per student/semester
- Columns: `is_finalized`, `finalized_by`, `finalized_at`, `unlock_count`
- UNIQUE: `(student_id, school_year_id, semester)`

**grading_periods:**

- Maps period number to school year
- Used to get `grading_period_id` from class's `grading_period` number

**system_settings:**

- Stores configurable percentages
- Keys: `written_work_percentage`, `performance_task_percentage`, `quarterly_assessment_percentage`, `passing_grade`

**audit_logs:**

- Logs: `grade_entered`, `grade_updated`, `grades_finalized`

## Testing Instructions

### Prerequisites

1. Login as teacher: `teacher@deped.gov.ph` / `password123`
2. Have a class with enrolled students (from Phase 6)

### Test Scenarios

#### 1. Enter Grades for Students

1. Navigate to `/teacher/classes`
2. Click "View Roster" on any class
3. Click "Manage Grades" button
4. **Expected:** Grade entry table loads with all enrolled students

#### 2. Compute Individual Student Grade

1. Enter scores for one student:
   - WW Score: 35, WW Total: 40
   - PT Score: 45, PT Total: 50
   - QA Score: 18, QA Total: 20
2. Click calculator icon for that student
3. **Expected:** Quarterly grade shows **89.25** (blue chip)

#### 3. Auto-Compute on Field Exit

1. Enter all 6 scores for a student
2. Click outside the last input (blur)
3. **Expected:** Quarterly grade auto-computes

#### 4. Save Individual Grade

1. Enter and compute a grade
2. Click save icon for that student
3. **Expected:** Success snackbar appears
4. Refresh page
5. **Expected:** Grade persists

#### 5. Compute All Grades (Batch)

1. Enter scores for multiple students
2. Click "Compute All Grades" button
3. **Expected:** All quarterly grades calculate simultaneously

#### 6. Save All Changes (Batch)

1. Modify multiple student grades
2. Click "Save All Changes" button
3. **Expected:** Success message shows count saved

#### 7. Finalize Grades (Happy Path)

1. Ensure all students have complete grades (quarterly_grade !== null)
2. Click "Finalize Grades" button
3. **Expected:** Dialog opens showing:
   - Student count
   - Finalization warnings
   - "Incomplete Grades: 0"
4. Click "Confirm & Finalize"
5. **Expected:**
   - Success message
   - Warning banner appears
   - All inputs disabled
   - "Finalized" chip visible
   - Redirect to class detail page

#### 8. Finalize Prevention (Incomplete Grades)

1. Leave at least one student with incomplete grades
2. Click "Finalize Grades" button
3. **Expected:** Dialog shows incomplete count > 0
4. **Expected:** "Confirm & Finalize" button is disabled

#### 9. Lock Enforcement (After Finalization)

1. Finalize a class's grades
2. Try to edit any score input
3. **Expected:** Inputs are disabled (grey)
4. Try clicking save button
5. **Expected:** Button not visible/disabled

#### 10. Grade Color Coding

- Enter grade >= 90 → **Green chip**
- Enter grade 75-89 → **Blue chip**
- Enter grade < 75 → **Red chip**

#### 11. Validation

- Enter WW Score > WW Total → Should still compute (allows bonus points)
- Enter negative score → Browser validation prevents
- Leave QA Total = 0 → Computation returns null (division by zero prevented)

## File Structure

```
src/
├── composables/
│   └── useGrades.ts              # Grade business logic & DepEd formula
├── pages/
│   └── teacher/
│       └── classes/
│           └── [id]/
│               └── grades.vue    # Grade entry spreadsheet UI
```

## API Patterns

### Fetch Class Grades

```typescript
// Get class details
const { data: classData } = await supabase
  .from("class_assignments")
  .select("subject_id, school_year_id, grading_period")
  .eq("id", classId);

// Get grading period
const { data: period } = await supabase
  .from("grading_periods")
  .select("id")
  .eq("school_year_id", classData.school_year_id)
  .eq("period_number", classData.grading_period);

// Fetch grades
const { data: grades } = await supabase
  .from("grades")
  .select("*, students:student_id(lrn, first_name, last_name)")
  .eq("grading_period_id", period.id);
```

### Save Grade

```typescript
await supabase.from("grades").upsert(
  {
    student_id,
    subject_id,
    grading_period_id,
    written_work_score,
    quarterly_grade,
    entered_by: authStore.user.id,
  },
  {
    onConflict: "student_id,subject_id,grading_period_id",
  }
);
```

### Finalize Grades

```typescript
await supabase.from("grade_finalization_status").upsert(
  {
    student_id,
    school_year_id,
    semester: "1",
    is_finalized: true,
    finalized_by: authStore.user.id,
    finalized_at: new Date().toISOString(),
  },
  {
    onConflict: "student_id,school_year_id,semester",
  }
);
```

## Grade Calculation Reference

### Component Weightings (Default)

- **Written Work:** 30%
- **Performance Task:** 50%
- **Quarterly Assessment:** 20%
- **Total:** 100%

### Passing Grade

- Default: **75**
- Configurable in `system_settings` table

### Grade Ranges

- **90-100:** With Highest Honors / Excellent
- **85-89:** With High Honors / Very Satisfactory
- **80-84:** With Honors / Satisfactory
- **75-79:** Passed / Fairly Satisfactory
- **Below 75:** Failed / Did Not Meet Expectations

## Known Limitations

- Semester determination hardcoded to '1' (needs grading period mapping)
- No GPA calculation yet (Phase 8)
- No document generation (Phase 9)
- No grade history/versioning (shows latest only)
- Bulk import not implemented (manual entry only)
- No grade distribution analytics (future enhancement)

## Next Steps (Phase 8)

- [ ] Calculate GPA across all subjects
- [ ] Implement final grade entry (semester/year-end)
- [ ] Add honor roll computation (90+, 85+, etc.)
- [ ] Show GPA on student dashboard
- [ ] Generate grade reports

## Security Notes

- Grade finalization checked before every save operation
- All modifications logged with user_id and timestamp
- Teachers cannot bypass lock (database constraint prevents)
- Lock status verified server-side, not just UI-disabled
- Audit trail captures old/new values for grade changes

## UI/UX Notes

- **Sticky columns:** Student number and name stay visible during horizontal scroll
- **Auto-save indicator:** Loading spinner on individual save buttons
- **Keyboard navigation:** Tab through inputs in logical order
- **Number input validation:** Browser prevents non-numeric entry
- **Responsive:** Table scrolls horizontally on mobile
- **Color accessibility:** Chips use distinct colors with sufficient contrast
