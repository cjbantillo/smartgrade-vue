# Step One: Policy Adjustments and Official Requirements

## Document Authority and Purpose

This document contains **official policy requirements** provided directly by the ICT-in-charge of Ampayon National High School – Senior High School. These policies supersede any conflicting assumptions, requirements, or design decisions documented in the legacy system analysis ([step-one-process.md](step-one-process.md)).

**Authoritative Status:**

- All requirements herein are mandatory and non-negotiable
- Legacy system behaviors that conflict with these policies are REJECTED
- Future implementation MUST comply with these specifications
- Deviation requires explicit written approval from school administration

**Scope:**

- Authentication mechanisms
- Role-based access control (RBAC) redefinition
- Grade finalization and locking workflows
- Document generation rules and gating conditions
- Administrative override procedures

---

## 1. Authentication Policy (DepEd Email Enforcement)

### 1.1 Official Requirement

**All system authentication MUST use official DepEd email addresses exclusively.**

**Email Format:**

```
<firstname>.<lastname>@deped.gov.ph
```

**Examples:**

- Valid: `johnmark.jarencio@deped.gov.ph`
- Valid: `maria.santos@deped.gov.ph`
- Invalid: `teacher123` (username not permitted)
- Invalid: `john@gmail.com` (non-DepEd domain)
- Invalid: `student@ampayon.edu.ph` (non-DepEd domain)

### 1.2 Enforcement Mechanism

**Supabase Auth Configuration:**

- Email provider MUST be the only enabled authentication method
- Domain whitelist: `@deped.gov.ph` only
- Email verification required before account activation
- Password reset flows use DepEd email exclusively

**Implementation Rules:**

1. Supabase Auth email validation must reject non-`@deped.gov.ph` addresses at sign-up
2. Existing accounts with non-compliant emails are invalid and must be migrated or deleted
3. Student accounts MUST also use DepEd-provisioned email addresses (school IT responsibility)
4. No username/password fallback mechanism permitted

### 1.3 Rationale

**Security Justification:**

- DepEd email addresses provide verifiable institutional affiliation
- Reduces risk of unauthorized account creation
- Aligns with Department of Education's identity management policies
- Enables centralized account deactivation when personnel leave the institution

**Operational Impact:**

- School IT department must provision DepEd email accounts for all students prior to enrollment
- Teachers and administrators already possess DepEd accounts (standard government requirement)
- Email-based login ensures single source of identity truth

### 1.4 Conflicts Resolved

**Legacy System Assumption (REJECTED):**

> "System shall authenticate users via username and password" (FR1.1)

**Official Policy (ACCEPTED):**

> System shall authenticate users via DepEd email and password only.

**Migration Consequence:**
Legacy `users.username` field is deprecated. The `email` field (validated as `@deped.gov.ph`) becomes the primary identifier.

---

## 2. Role Definitions and Responsibility Matrix

### 2.1 Admin Role (Reduced Scope)

The Admin role is intentionally LIMITED compared to the legacy system. Admins serve as system overseers and exception handlers, NOT primary operators.

#### Admin Permissions (ALLOWED)

| Permission                  | Description                                                                            | Justification                                       |
| --------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Approve Teachers**        | Review and approve teacher accounts affiliated with Ampayon National High School – SHS | Ensures only authorized personnel access the system |
| **Unlock Finalized Grades** | Upon formal request, unlock grades for correction                                      | Provides escalation path for legitimate errors      |
| **View Audit Logs**         | Access complete system activity history                                                | Accountability and compliance monitoring            |
| **Manage System Settings**  | Configure school-wide parameters (passing grade, honor thresholds, school year)        | Centralized configuration management                |
| **Generate System Reports** | Export aggregated analytics (grade distribution, enrollment statistics)                | Administrative oversight                            |

#### Admin Restrictions (FORBIDDEN)

| Restriction                            | Legacy Behavior (REJECTED)                | Reason for Prohibition                                            |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| **Cannot Assign Students to Sections** | Legacy: Admin creates section assignments | Delegated to Teachers (see 2.2)                                   |
| **Cannot Enroll Students in Classes**  | Legacy: Admin manages class rosters       | Teachers own their class lists                                    |
| **Cannot Edit Grades Directly**        | Legacy: Admin has full grade access       | Prevents unilateral grade modification; must unlock first         |
| **Cannot Generate Certificates**       | Legacy: Admin-only certificate workflow   | Certificates are Teacher-generated (see Section 4)                |
| **Cannot Generate SF9/SF10 Directly**  | Legacy: Admin access to all forms         | SF9/SF10 are Teacher-generated after finalization (see Section 5) |

#### Security Rationale

**Principle:** Admins are system custodians, not academic operators.

By restricting Admin capabilities:

- Reduces single point of failure for grade tampering
- Creates clear separation of duties (Admin = oversight, Teacher = operations)
- Enforces formal unlock process (audit trail requirement)
- Prevents silent grade modifications without teacher knowledge

### 2.2 Teacher Role (Expanded Scope)

Teachers are the PRIMARY OPERATORS of the system. Responsibilities are significantly EXPANDED compared to the legacy model.

#### Teacher Permissions (ALLOWED)

| Permission                   | Description                                                                 | Workflow Implication                             |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| **Create Class Lists**       | Define the roster of students for each subject they teach                   | Teacher-driven enrollment (see Section 3)        |
| **Enroll/Link Students**     | Manually add students to their class by LRN or student ID                   | Teachers control class composition               |
| **Enter Component Grades**   | Input Written Work, Performance Task, Quarterly Assessment scores           | Core grading function                            |
| **Compute Quarterly Grades** | Trigger automatic grade computation per DepEd formula                       | System-assisted calculation                      |
| **Enter Final Grades**       | Input final grades for each subject (semester/year-end)                     | Required for GPA calculation                     |
| **Calculate GPA**            | View computed General Point Average after all final grades entered          | Automatic upon data completeness                 |
| **Finalize Grades**          | Explicitly lock grades via "FINALIZED" button                               | State transition (see Section 4)                 |
| **Generate Certificates**    | Create PDF certificates for students with finalized grades                  | Teacher-initiated document workflow              |
| **Generate SF9**             | Create School Form 9 (Report Card) for students with finalized grades       | DepEd compliance document                        |
| **Generate SF10**            | Create School Form 10 (Permanent Record) for students with finalized grades | DepEd compliance document                        |
| **Edit SF9/SF10 Content**    | Modify generated document fields (names, clerical errors) before PDF export | Document correction capability (see Section 5.2) |
| **View Own Audit Logs**      | Access logs related to their own grade entries and modifications            | Transparency for teachers                        |

#### Teacher Restrictions (FORBIDDEN)

| Restriction                                          | Reason                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- |
| **Cannot Modify Finalized Grades**                   | Grades are locked once finalized; requires Admin unlock |
| **Cannot Unlock Grades**                             | Escalation to Admin required                            |
| **Cannot Access Other Teachers' Classes**            | Data isolation per teacher                              |
| **Cannot View System-Wide Audit Logs**               | Admin-only privilege                                    |
| **Cannot Modify Students Outside Own Classes**       | Data integrity and ownership boundaries                 |
| **Cannot Generate Documents for Unfinalized Grades** | Enforces data quality gate (see Section 4.3)            |

#### Security Rationale

**Principle:** Teachers own their data but are constrained by workflow states.

By expanding Teacher capabilities:

- Reduces administrative bottleneck (Admin not required for routine tasks)
- Empowers teachers with direct control over their class composition
- Creates accountability (teachers cannot blame "system errors" for roster issues)
- Maintains data integrity through finalization locks

### 2.3 Student Role (Unchanged)

Student permissions remain consistent with legacy system:

| Permission                 | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| **View Own Grades**        | Read-only access to quarterly and final grades                              |
| **View Own GPA**           | After grades are finalized by teacher                                       |
| **View Honors/Awards**     | If applicable (e.g., With Honors designation)                               |
| **Download Own Documents** | Access to generated SF9, SF10, certificates (if permitted by school policy) |

Students CANNOT:

- View other students' records
- Modify any data
- Access teacher or admin functions

### 2.4 Role Comparison Matrix

| Capability                 | Admin | Teacher | Student |
| -------------------------- | ----- | ------- | ------- |
| Approve Teacher Accounts   | ✅    | ❌      | ❌      |
| Create Class Lists         | ❌    | ✅      | ❌      |
| Enroll Students in Classes | ❌    | ✅      | ❌      |
| Enter Grades               | ❌    | ✅      | ❌      |
| Finalize Grades            | ❌    | ✅      | ❌      |
| Unlock Finalized Grades    | ✅    | ❌      | ❌      |
| Generate Certificates      | ❌    | ✅      | ❌      |
| Generate SF9/SF10          | ❌    | ✅      | ❌      |
| View System Audit Logs     | ✅    | Partial | ❌      |
| Modify System Settings     | ✅    | ❌      | ❌      |
| View Own Grades            | N/A   | N/A     | ✅      |

---

## 3. Teacher-Driven Enrollment Workflow

### 3.1 Policy Statement

**There is NO administrator-driven section assignment.**

Student enrollment into teacher classes is the exclusive responsibility of teachers. Admins do not participate in class roster creation or student-to-section mapping.

### 3.2 Workflow Description

**Step 1: Teacher Creates Class**

- Teacher navigates to "My Classes" section
- Creates a new class entry:
  - Subject (selected from subject catalog)
  - Section identifier (e.g., "Einstein", "Newton")
  - School year
  - Semester
  - Grading period

**Step 2: Teacher Enrolls Students**

- Teacher searches for students by:
  - Learner Reference Number (LRN)
  - Student name
  - Grade level + track/strand filter
- Teacher clicks "Enroll" to add student to class list
- Repeat until class roster is complete

**Step 3: System Validation**

- System checks for duplicate enrollments (same student in same subject/period)
- System warns if student's track/strand does not match subject requirements
- System allows override with teacher confirmation (for special cases)

**Step 4: Roster Finalization**

- Teacher reviews complete class list
- Teacher can add/remove students at any time before grade finalization
- Once grades are finalized, roster modifications require grade unlock

### 3.3 Rationale

**Why Teacher-Driven?**

- Teachers have direct knowledge of class composition and student attendance
- Reduces dependency on administrative staff for routine operations
- Enables immediate correction of enrollment errors without ticket escalation
- Aligns with actual school practice (teachers track class attendance daily)

**Admin Role Eliminated:**

- Admin involvement in enrollment creates bottlenecks
- Admin lacks real-time knowledge of student transfers, dropouts, or section changes
- Teacher autonomy improves data accuracy and timeliness

### 3.4 Conflicts Resolved

**Legacy System Assumption (REJECTED):**

> "Admin shall manage subjects and class assignments" (FR2.3)
> "class_assignments table maps teacher_id + subject_id + section (Admin-controlled)"

**Official Policy (ACCEPTED):**

> Teachers create and own their class rosters.
> Class assignments are teacher-initiated, not admin-assigned.

**Database Implication:**
The `class_assignments` table concept is revised:

- `teacher_id` + `subject_id` + `section` still exists
- BUT: Created and managed by the teacher, not admin
- Admin has read-only access for reporting purposes

---

## 4. Grade Finalization and Locking State Machine

### 4.1 Critical Requirement

**Final grades MUST be entered for every subject before GPA calculation.**

**GPA is displayed ONLY after all subject final grades are complete.**

**Teacher MUST explicitly finalize grades via a dedicated action.**

### 4.2 State Machine Definition

#### State 1: DRAFT (Initial State)

**Characteristics:**

- Grades are editable
- Teacher can modify any score (WW, PT, QA, final grade)
- GPA is NOT displayed (or shows "Incomplete")
- SF9/SF10 generation is DISABLED
- Certificate generation is DISABLED

**Allowed Actions:**

- Enter/update grades
- Add/remove students from class
- Compute quarterly grades
- Preview draft reports (non-official)

**Transition Condition:**
Teacher enters final grades for all subjects → System computes GPA → State remains DRAFT until explicit finalization

---

#### State 2: READY FOR FINALIZATION

**Characteristics:**

- All final grades have been entered
- GPA is calculated and displayed
- "FINALIZE GRADES" button is ENABLED
- Grades are still editable
- SF9/SF10 generation is DISABLED (until finalized)
- Certificate generation is DISABLED (until finalized)

**UI Requirements:**

- Prominent visual indicator: "All grades entered. Review GPA before finalizing."
- Button label: **"FINALIZE GRADES"** or **"LOCK GRADES"**
- Warning message: "Once finalized, grades cannot be edited without Admin approval. Proceed?"

**Allowed Actions:**

- Review computed GPA
- Verify all grade entries
- Make corrections before finalization
- Click "FINALIZE GRADES" button

**Transition Condition:**
Teacher clicks "FINALIZE GRADES" button and confirms → State transitions to FINALIZED

---

#### State 3: FINALIZED (Locked State)

**Characteristics:**

- Grades are READ-ONLY
- GPA is locked
- SF9 generation is ENABLED
- SF10 generation is ENABLED
- Certificate generation is ENABLED
- Teacher cannot modify any grade values
- Timestamp of finalization is recorded
- Finalized by (teacher ID) is logged

**UI Requirements:**

- All grade input fields are disabled (grayed out)
- Visual indicator: "Grades Finalized on [Date] by [Teacher Name]"
- "Request Unlock" button is available (triggers Admin notification)

**Allowed Actions:**

- Generate SF9 (with editable content, see Section 5)
- Generate SF10 (with editable content, see Section 5)
- Generate certificates (PDF)
- View finalized grades (read-only)
- Request unlock from Admin

**Forbidden Actions:**

- Edit any grade value
- Add/remove students (roster is locked)
- Recalculate GPA

**Transition Condition:**
Admin unlocks grades → State transitions to UNLOCKED

---

#### State 4: UNLOCKED (Admin Override State)

**Characteristics:**

- Grades return to editable state
- GPA recalculation is enabled
- SF9/SF10/Certificate generation is DISABLED (until re-finalized)
- Unlock action is logged in audit trail
- Unlock reason (Admin-provided) is recorded
- Original finalization timestamp is preserved

**UI Requirements:**

- Prominent warning: "Grades have been unlocked by Admin. Reason: [Admin's explanation]"
- "RE-FINALIZE GRADES" button available after corrections

**Allowed Actions:**

- Edit grades (same as DRAFT state)
- Correct errors that necessitated unlock
- Re-finalize grades (returns to FINALIZED state)

**Transition Condition:**
Teacher clicks "RE-FINALIZE GRADES" → State transitions back to FINALIZED

---

### 4.3 Document Generation Gating Rules

**Absolute Requirements:**

| Document Type            | Generation Allowed ONLY When                                                     |
| ------------------------ | -------------------------------------------------------------------------------- |
| SF9 (Report Card)        | Grades are in FINALIZED state                                                    |
| SF10 (Permanent Record)  | Grades are in FINALIZED state                                                    |
| Honors Certificate       | Grades are in FINALIZED state AND student qualifies for honors (GPA ≥ threshold) |
| Good Moral Certificate   | Grades are in FINALIZED state (GPA not required)                                 |
| Grade Summary (Informal) | Any state (draft reports permitted)                                              |

**Enforcement Mechanism:**

- Generate buttons are UI-disabled when state ≠ FINALIZED
- API endpoints reject requests if grade finalization check fails
- Supabase RLS policies prevent data access for document generation unless `is_finalized = true`

**Rationale:**
Preventing document generation for non-finalized grades ensures:

- No premature distribution of unofficial grades
- Compliance with DepEd record-keeping standards
- Reduction of clerical errors (teachers review before finalizing)
- Legal defensibility (finalized grades are official and auditable)

### 4.4 Data Model Requirements

**New Fields Required on `grades` or `grade_summaries` Table:**

```
is_finalized: BOOLEAN DEFAULT false
finalized_at: TIMESTAMPTZ NULL
finalized_by: UUID REFERENCES auth.users(id)
unlock_count: INTEGER DEFAULT 0
last_unlocked_at: TIMESTAMPTZ NULL
last_unlocked_by: UUID REFERENCES auth.users(id)
unlock_reason: TEXT NULL
```

**Audit Log Entries Required:**

| Event                             | Action Code          | Captured Data                                       |
| --------------------------------- | -------------------- | --------------------------------------------------- |
| Teacher finalizes grades          | `grades_finalized`   | teacher_id, student_id, subject_id, timestamp, GPA  |
| Admin unlocks grades              | `grades_unlocked`    | admin_id, teacher_id, student_id, reason, timestamp |
| Teacher re-finalizes after unlock | `grades_refinalized` | teacher_id, student_id, subject_id, timestamp, GPA  |

---

## 5. Admin Unlock Escalation Process

### 5.1 Workflow

**Step 1: Teacher Identifies Error**

- Teacher discovers an error in finalized grades (e.g., typo, incorrect score entry)
- Teacher clicks "Request Unlock" button in system UI

**Step 2: System Generates Unlock Request**

- System creates unlock request record:
  - Requesting teacher
  - Student ID
  - Subject ID
  - Reason (teacher must provide text explanation)
  - Timestamp
- System notifies Admin (email or in-app notification)

**Step 3: Admin Reviews Request**

- Admin views unlock request queue
- Admin reviews:
  - Teacher's reason
  - Affected student/subject
  - Grade history (previous values)
- Admin makes decision: APPROVE or DENY

**Step 4: Admin Approves Unlock**

- Admin enters administrative reason/justification
- Admin clicks "APPROVE UNLOCK"
- System transitions grade state to UNLOCKED
- System logs unlock in audit trail
- System notifies teacher (grades are now editable)

**Step 5: Teacher Makes Corrections**

- Teacher edits grades as needed
- Teacher reviews corrected GPA
- Teacher clicks "RE-FINALIZE GRADES"
- System transitions state back to FINALIZED
- System logs re-finalization

**Step 6: Audit Trail Capture**

- Old grade values (before unlock)
- New grade values (after correction)
- Admin approval reason
- Teacher correction reason
- Complete timestamp chain

### 5.2 Denial Workflow

If Admin DENIES unlock request:

- System logs denial in audit trail
- System notifies teacher with denial reason
- Grades remain FINALIZED (no changes permitted)
- Teacher may submit a new unlock request with additional justification

### 5.3 Security Controls

**Unlock Frequency Limits:**

- System tracks `unlock_count` per student/subject
- If `unlock_count > 3`, system flags for administrative review (potential pattern of errors)

**Mandatory Fields:**

- Teacher MUST provide reason for unlock request (cannot be blank)
- Admin MUST provide approval/denial reason (cannot be blank)

**Audit Immutability:**

- Unlock audit logs are append-only
- No deletion or modification permitted
- Retained indefinitely for compliance

### 5.4 Rationale

**Why Not Allow Teacher Self-Unlock?**

- Prevents unauthorized grade changes without oversight
- Creates accountability through two-party approval (teacher + admin)
- Deters casual or frequent grade modifications
- Provides audit trail for external review (e.g., DepEd inspections)

**Why Allow Unlock At All?**

- Legitimate errors occur (typos, transcription mistakes)
- Absolute immutability would require manual record corrections outside the system
- Controlled unlock preserves data integrity while enabling error correction

---

## 6. Certificate Generation Rules

### 6.1 Policy Statement

**A dedicated "Certificates" menu MUST exist on the Teacher Dashboard.**

**Certificates are generated by Teachers, NOT Admins.**

### 6.2 Certificate Types and Requirements

| Certificate Type           | Eligibility Criteria                                                                    | Generation Trigger                         | Output Format     |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------- |
| **Honors Certificate**     | GPA ≥ 90 (With Honors)<br>GPA ≥ 95 (With High Honors)<br>GPA ≥ 98 (With Highest Honors) | Teacher-initiated after grade finalization | PDF (print-ready) |
| **Good Moral Character**   | No GPA requirement<br>Student in good standing                                          | Teacher-initiated after grade finalization | PDF (print-ready) |
| **Completion Certificate** | All subjects passed (grade ≥ 75)                                                        | Teacher-initiated after grade finalization | PDF (print-ready) |

### 6.3 Generation Workflow

**Step 1: Teacher Navigates to Certificates Menu**

- "Certificates" link visible in Teacher Dashboard sidebar
- Certificate menu displays list of students with finalized grades

**Step 2: Teacher Selects Student and Certificate Type**

- Teacher clicks student name
- Teacher selects certificate type from dropdown:
  - Honors Certificate (if GPA qualifies)
  - Good Moral Character Certificate
  - Completion Certificate
- System validates finalization status

**Step 3: System Pre-Populates Certificate Template**

- Student name, LRN, grade level, track/strand
- GPA (for honors certificates)
- Graduation date, ceremony details
- Adviser name, School Head name (from system settings or editable fields)

**Step 4: Teacher Reviews and Customizes (If Applicable)**

- Teacher verifies data accuracy
- Teacher may edit:
  - Ceremony date/location
  - Signatory names (if not auto-populated)
  - Honorific titles
- Grade data is READ-ONLY (cannot be edited in certificate view)

**Step 5: Teacher Generates PDF**

- Teacher clicks "Generate PDF" button
- System renders certificate as PDF
- PDF is saved to Supabase Storage
- PDF URL is logged in certificate generation history

**Step 6: Teacher Downloads or Prints**

- Teacher downloads PDF for printing
- System optionally generates QR code for certificate verification (see Section 6.4)

### 6.4 QR Code Verification (Optional Enhancement)

**Requirement from Legacy Analysis:**

> "generate a qr code to access the certificate and can be accessed by all user just by scanning"

**Implementation:**

- Each generated certificate receives a unique UUID
- QR code encodes URL: `https://<app-domain>/verify/certificate/<uuid>`
- Public verification page displays:
  - Certificate metadata (student name, honor type, issue date)
  - Validity status (active/revoked)
  - School seal/logo
- No authentication required for verification (public access)

**Security:**

- Rate limiting on verification endpoint
- Optional CAPTCHA for high-frequency access
- Revocation mechanism (Admin can mark certificate as revoked)

### 6.5 Bulk Certificate Generation (Future Enhancement)

**Use Case:** Graduation ceremony (entire class)

**Workflow:**

- Teacher selects "Bulk Generate Certificates"
- Teacher selects certificate type and target students (filtered by finalized status)
- System generates PDFs for all selected students asynchronously
- Teacher receives notification when batch is complete
- All PDFs are available for download as ZIP archive

### 6.6 Conflicts Resolved

**Legacy System Assumption (REJECTED):**

> "System shall support bulk certificate generation" (FR5.4) — IMPLIED admin role

**Official Policy (ACCEPTED):**

> Certificate generation is a Teacher function.
> Bulk generation is permitted but teacher-initiated, not admin-initiated.

---

## 7. SF9 / SF10 Generation and Editable Content

### 7.1 Policy Statement

**SF9 (School Form 9 - Report Card) and SF10 (School Form 10 - Permanent Record) are automatically generated from finalized grades.**

**HOWEVER: Document content MUST be editable before final PDF export.**

### 7.2 Rationale for Editable Content

**Problem:**
Automated systems may introduce errors:

- Name misspellings (students with special characters, ñ, etc.)
- Incorrect title case (ALL CAPS vs Proper Case)
- Formatting issues (extra spaces, truncated text)
- Clerical data errors (birthdate, LRN typos)

**Solution:**
Allow teachers to edit the GENERATED DOCUMENT (not the underlying grade records) before PDF export.

### 7.3 Editable vs Immutable Distinction

**IMMUTABLE (Grade Data):**

- Quarterly grades (WW, PT, QA components)
- Final grades per subject
- GPA
- Passing/failing status
- Honor designation

These values are sourced from finalized grade records and CANNOT be edited in the SF9/SF10 generation interface.

**EDITABLE (Metadata and Formatting):**

- Student name (spelling corrections)
- Address (updated after data entry)
- Guardian name (corrections)
- Subject names (formatting fixes)
- Teacher names/signatures
- School official names (Principal, Registrar)
- Remarks field (textual notes, e.g., "Transferee from X School")
- Date fields (ceremony date, issuance date)

### 7.4 Generation and Editing Workflow

**Step 1: Teacher Initiates SF9/SF10 Generation**

- Teacher navigates to "Documents" menu
- Teacher selects student with finalized grades
- Teacher clicks "Generate SF9" or "Generate SF10"

**Step 2: System Generates Draft Document**

- System queries finalized grades from database
- System pre-populates SF9/SF10 template with:
  - Student personal information
  - Grade data (read-only)
  - School information
  - Teacher/adviser information
- System displays draft in editable form view (NOT PDF yet)

**Step 3: Teacher Reviews and Edits Metadata**

- Teacher reviews all fields
- Teacher edits any non-grade fields as needed:
  - Corrects name spelling: "MARIA SANTOS" → "Maria N. Santos"
  - Updates address: "Brgy. Ampayon" → "Brgy. Ampayon, Butuan City, Agusan del Norte"
  - Fixes guardian name: "ROSA SANTOS" → "Rosa G. Santos"
- Grade fields are displayed but GRAYED OUT (read-only, no edit controls)

**Step 4: System Validates Edits**

- System logs all metadata changes:
  - Old value
  - New value
  - Edited by (teacher ID)
  - Edited at (timestamp)
- System does NOT modify underlying student records or grade records

**Step 5: Teacher Finalizes Document**

- Teacher clicks "Generate PDF" button
- System renders SF9/SF10 as PDF with edited metadata
- PDF is saved to Supabase Storage
- PDF URL is logged in document generation history

**Step 6: Teacher Downloads or Prints**

- Teacher downloads PDF
- Teacher may re-generate PDF if additional edits needed (without changing grades)

### 7.5 Audit Logging for Document Edits

**Required Audit Entries:**

| Field Edited  | Audit Log Entry                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Student Name  | `sf9_metadata_edited` → old_value: "MARIA SANTOS", new_value: "Maria N. Santos", field: "student_name"        |
| Address       | `sf9_metadata_edited` → old_value: "Brgy. Ampayon", new_value: "Brgy. Ampayon, Butuan City", field: "address" |
| Guardian Name | `sf9_metadata_edited` → old_value: "ROSA SANTOS", new_value: "Rosa G. Santos", field: "guardian_name"         |

**Audit Context:**

- `document_type`: "SF9" or "SF10"
- `student_id`: UUID
- `edited_by`: Teacher UUID
- `edited_at`: Timestamp
- `grade_data_modified`: FALSE (always, grades are immutable)

### 7.6 Security Controls

**What Prevents Grade Tampering?**

1. **UI Enforcement:**

   - Grade input fields are disabled (no edit controls rendered)
   - JavaScript validation prevents grade field modifications

2. **API Enforcement:**

   - Document generation API accepts metadata changes ONLY
   - API rejects requests that include grade modifications
   - API re-queries finalized grades from database (ignores client-submitted grade values)

3. **Audit Trail:**
   - All edits are logged with field-level granularity
   - Audit logs distinguish metadata edits from grade edits
   - Abnormal edit patterns trigger Admin alerts

**Example Security Flow:**

```
Teacher submits SF9 with edited student_name and altered quarterly_grade (malicious attempt)

→ API receives request
→ API extracts metadata edits (student_name)
→ API IGNORES quarterly_grade field in request payload
→ API re-queries grades table for authoritative grade values
→ API generates PDF with edited metadata but original grades
→ API logs metadata edit (student_name change)
→ API does NOT log grade change (because it was rejected)
```

### 7.7 Conflicts Resolved

**Legacy System Assumption (AMBIGUOUS):**

> "System shall generate SF9 (Report Card) forms" (FR5.1)
> No mention of editability

**Official Policy (CLARIFIED):**

> SF9/SF10 are generated from finalized grades.
> Metadata is editable; grades are immutable.
> Edits affect document presentation only, not underlying records.

---

## 8. Security Rationale for Restrictions

### 8.1 DepEd Email Enforcement

**Threat Mitigated:** Unauthorized account creation, identity spoofing

**Mechanism:**

- Only verified DepEd employees can access the system
- Domain restriction prevents external threat actors
- Government-managed email accounts are revoked when personnel leave

**Risk if Not Enforced:**

- Students could create fake teacher accounts
- External parties could impersonate school officials
- Data breaches through compromised non-official email accounts

---

### 8.2 Admin Role Reduction

**Threat Mitigated:** Single point of failure for grade tampering

**Mechanism:**

- Admin cannot silently modify grades (must unlock first)
- Unlock process creates audit trail visible to teachers
- Separation of duties prevents unilateral grade changes

**Risk if Not Enforced:**

- Admin could alter grades without teacher knowledge
- No accountability for unauthorized changes
- Potential for corruption or coercion

---

### 8.3 Teacher-Driven Enrollment

**Threat Mitigated:** Enrollment errors, class roster inaccuracies

**Mechanism:**

- Teachers have direct knowledge of daily attendance
- Teachers can immediately correct enrollment mistakes
- No dependency on administrative bottlenecks

**Risk if Not Enforced:**

- Students enrolled in wrong classes receive incorrect grades
- Graduation delays due to missing course credits
- DepEd compliance issues (student records mismatch)

---

### 8.4 Grade Finalization Lock

**Threat Mitigated:** Grade tampering after official reporting

**Mechanism:**

- Finalized grades are read-only
- Modifications require Admin approval (audit logged)
- SF9/SF10/Certificates only generate from finalized grades

**Risk if Not Enforced:**

- Teachers could retroactively alter grades after parents receive reports
- No clear "official record" timestamp
- Legal disputes over grade changes

---

### 8.5 Document Metadata Editability

**Threat Mitigated:** Clerical errors in official documents

**Mechanism:**

- Metadata edits are logged but do not affect grade records
- Grade values are re-queried from database (not user input)
- Audit trail distinguishes cosmetic edits from data changes

**Risk if Not Enforced:**

- Documents with name/address errors are invalid for college applications
- Reprinting requires full re-generation (inefficient)
- Accumulation of unusable documents due to minor typos

---

## 9. Conflicts Resolved from Legacy Assumptions

### 9.1 Summary of Major Conflicts

| Legacy Requirement                                   | Official Policy                        | Resolution                                            |
| ---------------------------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| Username-based login (FR1.1)                         | DepEd email-only authentication        | **REJECTED:** Username field deprecated               |
| Admin manages class assignments (FR2.3)              | Teacher-driven enrollment              | **REJECTED:** Admin cannot assign students            |
| Admin generates certificates (FR5)                   | Teacher generates certificates         | **REJECTED:** Admin has no certificate access         |
| SF9/SF10 access unclear (FR4.3 vs reportcard readme) | Teacher-only access after finalization | **CLARIFIED:** Adviser (teacher role) generates forms |
| Grades editable by Admin                             | Admin must unlock first                | **MODIFIED:** Unlock workflow enforced                |
| No document editing mentioned                        | SF9/SF10 metadata editable             | **ADDED:** Metadata edit capability required          |

### 9.2 Requirement Contradiction: Student Access to SF9/SF10

**Legacy FR4.3 States:**

> "Students shall access their SF9 and SF10 forms"

**Legacy reportcard-sample readme.md States:**

> "this SF9 and SF10 should only appear in Adviser side"

**Official Policy (RESOLUTION):**

> SF9 and SF10 are TEACHER-GENERATED documents.
> Students MAY be granted view-only access AFTER teacher releases the document (optional school policy).
> Students CANNOT generate or edit SF9/SF10.

**Implementation Note:**
Design permission flag: `allow_student_sf9_download` (configurable by Admin).
If enabled: Students can download finalized SF9/SF10 PDFs.
If disabled: Students can only view grades in dashboard (no official forms).

### 9.3 Database Schema Implications

**Legacy `class_assignments` Table (Admin-Owned):**

```sql
class_assignments (
  teacher_id,
  subject_id,
  school_year_id,
  section
)
-- Inserted by Admin
```

**Updated `class_enrollments` Table (Teacher-Owned):**

```sql
class_enrollments (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  school_year_id UUID REFERENCES school_years(id),
  section VARCHAR,
  enrolled_at TIMESTAMPTZ,
  enrolled_by UUID REFERENCES auth.users(id), -- Must be teacher
  is_active BOOLEAN DEFAULT true
)
```

**New Table: `grade_finalization_status`:**

```sql
grade_finalization_status (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  school_year_id UUID REFERENCES school_years(id),
  semester INT,
  is_finalized BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES teachers(id),
  unlock_count INT DEFAULT 0,
  last_unlocked_by UUID REFERENCES auth.users(id),
  last_unlocked_at TIMESTAMPTZ,
  unlock_reason TEXT
)
```

---

## 10. Implications for Supabase RLS and Audit Logs

### 10.1 Row Level Security (RLS) Policies (Conceptual)

**Authentication Enforcement:**

```sql
-- Conceptual policy (not implementation)
-- Ensure all users have @deped.gov.ph emails
CREATE POLICY email_domain_check ON auth.users
FOR ALL
USING (email LIKE '%@deped.gov.ph');
```

**Grade Finalization Enforcement:**

```sql
-- Teachers can UPDATE grades only if NOT finalized
CREATE POLICY teacher_grade_update ON grades
FOR UPDATE
USING (
  auth.uid() = teacher_id
  AND NOT EXISTS (
    SELECT 1 FROM grade_finalization_status
    WHERE student_id = grades.student_id
    AND is_finalized = true
  )
);

-- Admin can UPDATE finalization status (unlock)
CREATE POLICY admin_unlock_grades ON grade_finalization_status
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

**Class Enrollment Ownership:**

```sql
-- Teachers can INSERT students into their own classes
CREATE POLICY teacher_enroll_students ON class_enrollments
FOR INSERT
WITH CHECK (
  auth.uid() = teacher_id
);

-- Teachers can SELECT only their own class rosters
CREATE POLICY teacher_view_own_classes ON class_enrollments
FOR SELECT
USING (
  auth.uid() = teacher_id
);

-- Admin can SELECT all enrollments (read-only)
CREATE POLICY admin_view_all_enrollments ON class_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

**Document Generation Access:**

```sql
-- Teachers can SELECT finalized grades for document generation
CREATE POLICY teacher_generate_documents ON grades
FOR SELECT
USING (
  auth.uid() = teacher_id
  AND EXISTS (
    SELECT 1 FROM grade_finalization_status
    WHERE student_id = grades.student_id
    AND is_finalized = true
  )
);
```

### 10.2 Audit Log Requirements (Conceptual)

**Critical Events to Log:**

| Event                             | Action Code             | Required Fields                                                     | Retention  |
| --------------------------------- | ----------------------- | ------------------------------------------------------------------- | ---------- |
| Teacher finalizes grades          | `grades_finalized`      | teacher_id, student_id, school_year_id, semester, gpa, timestamp    | Indefinite |
| Admin unlocks grades              | `grades_unlocked`       | admin_id, teacher_id, student_id, unlock_reason, timestamp          | Indefinite |
| Teacher re-finalizes after unlock | `grades_refinalized`    | teacher_id, student_id, unlock_count, timestamp                     | Indefinite |
| Teacher enrolls student           | `student_enrolled`      | teacher_id, student_id, subject_id, section, timestamp              | Indefinite |
| Teacher removes student           | `student_unenrolled`    | teacher_id, student_id, subject_id, reason, timestamp               | Indefinite |
| SF9 metadata edited               | `sf9_metadata_edited`   | teacher_id, student_id, field_name, old_value, new_value, timestamp | Indefinite |
| Certificate generated             | `certificate_generated` | teacher_id, student_id, certificate_type, pdf_url, timestamp        | Indefinite |
| Grade modified (pre-finalization) | `grade_updated`         | teacher_id, student_id, subject_id, old_grade, new_grade, timestamp | Indefinite |

**Audit Log Table Structure (Conceptual):**

```sql
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL, -- 'grade', 'enrollment', 'finalization', 'document'
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB, -- Additional context (e.g., unlock_reason)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Audit Log RLS (Conceptual):**

```sql
-- Admin can SELECT all logs
-- Teachers can SELECT logs related to their own actions
-- Students cannot SELECT logs
```

---

## 11. Implementation Checklist (For Future Steps)

This section provides a high-level roadmap for implementing these policies in subsequent steps.

### 11.1 Authentication Implementation

- [ ] Configure Supabase Auth to accept only `@deped.gov.ph` emails
- [ ] Disable username/password authentication
- [ ] Enable email verification workflow
- [ ] Create user migration script for legacy accounts (email validation required)

### 11.2 Role-Based Access Control

- [ ] Create `profiles` table linked to `auth.users`
- [ ] Define `role` enum: `admin`, `teacher`, `student`
- [ ] Implement RLS policies per Section 10.1
- [ ] Create role assignment workflow (Admin approves teacher accounts)

### 11.3 Teacher Enrollment Workflow

- [ ] Design "My Classes" UI for teachers
- [ ] Implement student search/filter interface
- [ ] Create `class_enrollments` table
- [ ] Build enrollment validation logic (duplicate detection)
- [ ] Implement audit logging for enrollment actions

### 11.4 Grade Finalization System

- [ ] Create `grade_finalization_status` table
- [ ] Implement finalization state machine (DRAFT → READY → FINALIZED → UNLOCKED)
- [ ] Build "FINALIZE GRADES" button with confirmation dialog
- [ ] Create unlock request workflow (teacher → admin notification → approval)
- [ ] Implement re-finalization workflow
- [ ] Add finalization status indicators to UI (badges, color coding)

### 11.5 Document Generation

- [ ] Build certificate generation interface (Teacher Dashboard)
- [ ] Implement SF9 template with editable metadata
- [ ] Implement SF10 template with editable metadata
- [ ] Create PDF rendering service (Edge Function or client-side)
- [ ] Build QR code generation for certificates
- [ ] Implement public verification endpoint
- [ ] Add document generation gating (finalization check)

### 11.6 Audit Logging

- [ ] Create `audit_logs` table with RLS
- [ ] Implement database triggers for automatic logging
- [ ] Build Admin audit log viewer UI
- [ ] Create audit log export functionality (CSV/PDF)
- [ ] Implement log retention policy (indefinite for grade changes)

### 11.7 Security Hardening

- [ ] Implement rate limiting on public endpoints (QR verification)
- [ ] Add CAPTCHA to verification page
- [ ] Configure Content Security Policy (CSP)
- [ ] Implement session timeout (Supabase Auth)
- [ ] Add IP address logging to audit trail

---

## 12. Conclusion

This document establishes the authoritative policy framework for the SmartGrade system recreation. All subsequent design, development, and testing activities MUST comply with these requirements.

**Key Takeaways:**

1. **Authentication is DepEd email-only** — no usernames permitted
2. **Teachers are primary operators** — expanded responsibilities for enrollment and document generation
3. **Admin role is reduced** — oversight and exception handling only
4. **Grade finalization is mandatory** — explicit lock mechanism prevents tampering
5. **Document generation requires finalized grades** — SF9/SF10/Certificates are gated
6. **Metadata is editable; grades are not** — distinction between presentation and data integrity
7. **Audit logging is comprehensive** — all critical actions are logged indefinitely

**Conflict Resolution:**
Where this document conflicts with legacy system analysis ([step-one-process.md](step-one-process.md)), **this document takes precedence**.

---

## Document Revision History

| Version | Date       | Author           | Changes                                                     |
| ------- | ---------- | ---------------- | ----------------------------------------------------------- |
| 1.0     | 2025-12-23 | System Architect | Initial policy document based on ICT-in-charge requirements |

---

**END OF POLICY ADJUSTMENTS DOCUMENT**
