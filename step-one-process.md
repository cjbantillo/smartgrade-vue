# Step One Process: Legacy System Analysis and Requirements Extraction

## 1. Purpose of Step One

This document outlines the first critical phase in recreating the SmartGrade automated grading system for Ampayon Senior High School using a modern technology stack.

**Primary Objectives:**

- Conduct comprehensive analysis and audit of the legacy SmartGrade system
- Extract functional and non-functional requirements from existing PHP/MySQL/Bootstrap implementation
- Map legacy architecture to modern Vue 3 + Supabase stack
- Identify migration risks and technical debt
- Document business logic, validation rules, and data structures that must be preserved

**Technology Migration Context:**

| Legacy Stack           | Modern Stack                                    |
| ---------------------- | ----------------------------------------------- |
| PHP 8.2+               | Vue 3 (Composition API) + TypeScript            |
| MySQL 8.0              | Supabase (PostgreSQL)                           |
| Bootstrap 5            | Vuetify 3 + Tailwind CSS                        |
| Server-side rendering  | SPA with client-side routing                    |
| TCPDF (PDF generation) | Supabase Edge Functions / Client-side rendering |
| Session-based auth     | Supabase Auth (JWT)                             |

This step is **analysis-only**. No infrastructure provisioning, code generation, or UI design occurs at this stage.

---

## 2. Legacy System Overview

SmartGrade is a web-based grading automation system designed specifically for Ampayon Senior High School to replace manual Excel-based grade management. The system implements the Department of Education (DepEd) K-12 grading formula and provides role-based workflows for administrators, teachers, and students.

### 2.1 Core Functional Modules

**Authentication & Authorization (RBAC)**

- Three distinct user roles: Admin (ICT Coordinator), Teacher, Student
- Password hashing using PHP's `password_hash()` with bcrypt
- Session-based authentication with security controls
- Role-specific dashboards and feature access

**Grade Computation Engine**

- Implements DepEd Order No. 8, s. 2015 grading formula:
  - Written Work: 30%
  - Performance Tasks: 50%
  - Quarterly Assessment: 20%
- Automatic transmutation from raw percentages to 60-100 scale
- Quarterly and final grade calculation
- Grade history tracking with modification logs

**Academic Records Management**

- Student information compliant with DepEd SF9/SF10 requirements
- Learner Reference Number (LRN) tracking
- Multi-track support: Academic (STEM, ABM, HUMSS), TVL, Sports, Arts & Design
- School year and grading period management

**Document Generation**

- **SF9 (Report Card)**: Quarterly grade reports per subject
- **SF10 (Permanent Record)**: Comprehensive academic history
- **Certificates**: Honors (With Highest Honors, With High Honors, With Honors), Good Moral Character
- Bulk certificate generation for graduation ceremonies
- PDF export functionality using TCPDF

**Audit Trail System**

- Comprehensive logging of all grade entries and modifications
- User action tracking with IP address and user agent
- JSON-based old/new value comparison
- Tamper-proof log design for accountability

**Archival System**

- Graduated student record archival with JSON snapshots
- Maintains accessibility while marking records as historical
- Searchable archive with graduation date indexing

### 2.2 Key Business Rules

- Passing grade: 75 (configurable via system settings)
- Honors thresholds:
  - With Honors: ≥90 general average
  - With High Honors: ≥95 general average
  - With Highest Honors: ≥98 general average
- Grades are immutable once finalized (modifications require audit logging)
- One grade record per student-subject-grading period (enforced by unique constraint)
- Semester-based subject organization (2 semesters per school year, 2 quarters per semester)

### 2.3 Non-Functional Characteristics

- **Security**: Prepared statements for SQL injection prevention, XSS input validation
- **Performance**: Optimized database indexing, bulk operations support
- **Reliability**: Foreign key constraints, transaction support
- **Usability**: Intuitive navigation (≤3 clicks for common tasks)
- **Deployment**: XAMPP local environment (offline-capable)

---

## 3. File-by-File Purpose Explanation

### 3.1 `certificate-ampayon-high-school/`

**Purpose:**
Sample HTML/CSS/JavaScript implementation of certificate generation for Ampayon Senior High School. Demonstrates the visual layout, branding, and formatting requirements for official school certificates.

**Contents:**

- `index.html`: Certificate template structure with editable fields
- `styles.css`: School branding (colors, fonts, layouts)
- `script.js`: Dynamic field population logic
- `readme.md`: Migration notes highlighting Supabase Storage requirements

**Critical Information to Extract:**

1. **Visual Design Specifications**

   - School logo placement and dimensions
   - Official color scheme and typography
   - Certificate border and seal positioning
   - Signature block layout (Adviser, School Head)

2. **Dynamic Content Fields**

   - Student name, LRN, grade level, track/strand
   - Honor type (With Highest Honors, With High Honors, With Honors)
   - Graduation date and ceremony details
   - Adviser name and School Head name (editable in admin panel)

3. **Business Requirements**

   - Certificates must be print-ready PDFs
   - Support for bulk generation (entire graduating class)
   - Admin-only editing of signatory names
   - QR code generation for certificate verification (noted in readme)

4. **Migration Considerations**
   - Transition from server-side PDF generation to client-side or Supabase Edge Function
   - Implement certificate storage in Supabase Storage buckets
   - QR code linking to public verification endpoint (unauthenticated access requirement)
   - Evaluate Vue PDF generation libraries (jsPDF, pdfmake) vs Edge Functions

**Why This Matters:**
Certificates represent the primary deliverable output of the grading system. Template fidelity and PDF generation reliability are critical to school administration workflows. The QR code requirement introduces a public API surface that must be considered in Supabase architecture.

---

### 3.2 `former-db-smartgrade-old/`

**Purpose:**
Complete MySQL database schema representing the legacy system's data model. This is the authoritative source for understanding entity relationships, constraints, indexes, and default data.

**Contents:**

- `smartgrade_db.sql`: 443-line schema definition with sample data
- `readme.md`: Migration requirements and Supabase-specific adaptations

**Critical Information to Extract:**

1. **Entity Definitions (12 Tables)**

   **Core Entities:**

   - `users`: Authentication and RBAC foundation
   - `students`: Extended student profile with DepEd-specific fields (LRN, track/strand)
   - `teachers`: Employee records with department assignments
   - `subjects`: Course catalog with track/strand/semester granularity

   **Academic Workflow:**

   - `school_years`: Academic year management with active flag
   - `grading_periods`: Quarters within school years (1-4)
   - `class_assignments`: Many-to-many teacher-subject-section mapping
   - `grades`: Individual quarterly grade components and computed results
   - `final_grades`: Semester/year-end grade aggregation
   - `honors`: Academic distinction tracking for certificate generation

   **System Management:**

   - `audit_logs`: Comprehensive change tracking with JSON diffs
   - `archived_students`: Graduated student snapshots with JSON data
   - `system_settings`: Key-value configuration store

2. **Relationships and Constraints**

   - Foreign keys enforce referential integrity across all entities
   - Unique constraints prevent duplicate grade entries (`unique_grade_entry`)
   - Cascading deletes for dependent records (e.g., grades delete when student deleted)
   - Index strategy optimizes common queries (student lookups, grade filtering)

3. **DepEd Grading Schema**

   ```
   grades table structure:
   - written_work_score / written_work_total (30% weight)
   - performance_task_score / performance_task_total (50% weight)
   - quarterly_assessment_score / quarterly_assessment_total (20% weight)
   - quarterly_grade (computed: 60-100 scale)
   ```

   This mirrors official DepEd forms and must be preserved exactly.

4. **Audit Trail Implementation**

   ```
   audit_logs columns:
   - action (e.g., 'grade_updated', 'student_created')
   - old_values / new_values (JSON diff)
   - ip_address, user_agent (forensic data)
   ```

   Demonstrates accountability requirements for grade changes.

5. **Data Types and Validation**

   - LRN: VARCHAR(12) — must validate 12-digit DepEd format
   - Grades: DECIMAL(5,2) — precision requirements (e.g., 89.75)
   - ENUMs: Role definitions, grade levels, tracks — static value lists
   - JSON fields: Flexible storage for complex data (audit logs, archives)

6. **Default/Sample Data**
   - System settings (passing grade thresholds, grade component weights)
   - Default admin account (migration note: password handling)
   - Sample school year 2024-2025 with grading periods
   - Sample subjects for STEM track (demonstrating strand-specific courses)
   - Sample teacher/student accounts with realistic data

**Migration Considerations:**

1. **MySQL → PostgreSQL Translation**

   - ENUM types → CHECK constraints or Supabase enums
   - AUTO_INCREMENT → PostgreSQL SERIAL or IDENTITY
   - JSON type → PostgreSQL jsonb (better performance)
   - TIMESTAMP → PostgreSQL timestamptz (timezone-aware)

2. **Supabase-Specific Enhancements**

   - Row Level Security (RLS) policies for role-based data access
   - Triggers for audit logging automation
   - Foreign key actions preserved (CASCADE deletes)
   - Materialized views for grade computation performance

3. **Authentication Migration**

   - `users` table → Supabase Auth system
   - Map custom roles (admin/teacher/student) to Supabase metadata
   - Password hashing handled by Supabase (bcrypt compatible)

4. **Storage Requirements** (from readme.md)
   - Certificate PDFs → Supabase Storage bucket
   - Student photos → Future enhancement
   - QR code images → Generated on-demand or cached

**Why This Matters:**
The database schema is the single source of truth for data structure. Every relationship, constraint, and data type represents a business rule or DepEd compliance requirement. Improper migration could result in data loss, broken grade calculations, or regulatory non-compliance.

---

### 3.3 `reportcard-sample-to-be-generated/`

**Purpose:**
Defines requirements and constraints for SF9 (Report Card) and SF10 (Permanent Record) generation. These are official DepEd forms with strict formatting requirements.

**Contents:**

- `readme.md`: Single requirement statement

**Critical Information to Extract:**

1. **Access Control Requirement**

   ```
   "this SF9 and SF10 should only appear in Adviser side"
   ```

   **Implications:**

   - Teachers cannot generate these forms (only view individual grades)
   - Students cannot access these forms directly
   - Admin and Adviser roles must be differentiated or merged
   - Consider separate permission: `can_generate_official_forms`

2. **Form Types**

   **SF9 (Report Card)**

   - Student quarterly grades per subject
   - General average calculation per grading period
   - Remarks (PASSED, FAILED, INC, DROPPED)
   - Teacher signatures and dates

   **SF10 (Permanent Record)**

   - Cumulative academic record across all school years
   - Final grades per subject per year
   - Scholastic record (elementary and junior high if applicable)
   - Eligibility for senior high completion
   - Principal certification and seal

3. **Business Logic Constraints**
   - Forms must use official DepEd templates (strict layout compliance)
   - Data must be read-only once generated (no inline editing)
   - Watermarking or digital signatures may be required
   - PDF output required for printing and archival

**Migration Considerations:**

1. **Role Mapping**

   - Determine if "Adviser" is a separate role or permission flag on Teacher role
   - Supabase RLS policy: `role = 'adviser' OR has_permission('generate_forms')`

2. **Template Storage**

   - Official DepEd SF9/SF10 templates → Store as Vue components or HTML templates
   - Version control for template updates (DepEd occasionally revises forms)

3. **Data Assembly**
   - SF9 requires current year grades only
   - SF10 requires historical data across multiple years
   - Efficient queries to aggregate grade history

**Why This Matters:**
SF9 and SF10 are legal documents required for student transfers, college applications, and government compliance. Incorrect formatting or unauthorized access could have serious consequences for the school. The Adviser-only restriction indicates a trust/authority model that must be preserved in the new system.

---

### 3.4 `project-recreation-old-smartgrade-using-old-tech-stack.md`

**Purpose:**
Comprehensive software engineering documentation of the legacy system. Serves as the primary requirements specification, design document, and technical reference.

**Contents:**
Complete Software Requirements Specification (SRS) including:

- Abstract and executive summary
- Project objectives and scope
- Literature review and related works
- Functional and non-functional requirements
- Use cases and data flow diagrams
- Architecture and database design
- Implementation details
- Testing and deployment procedures

**Critical Information to Extract:**

1. **Functional Requirements (FR1-FR6)**

   **FR1: Authentication and Authorization**

   - Username/password authentication
   - Bcrypt password hashing
   - Role-based access control (Admin, Teacher, Student)
   - Session security and timeout

   **FR2: User Management (Admin)**

   - CRUD operations on user accounts
   - School year and grading period management
   - Subject and class assignment configuration
   - Audit log viewing

   **FR3: Grade Management (Teacher)**

   - Score entry for WW, PT, QA components
   - Automatic grade computation per DepEd formula
   - Final grade calculation from quarterly averages
   - Grade history viewing and correction workflow
   - Mandatory audit logging of all modifications

   **FR4: Student Portal**

   - View own grades only (data isolation)
   - View honors and awards received
   - Access SF9/SF10 forms (contradicts reportcard-sample readme — requires clarification)

   **FR5: Document Generation**

   - SF9 form generation
   - SF10 form generation
   - Certificate generation (honors, good moral character)
   - Bulk certificate processing
   - PDF export

   **FR6: Data Archival**

   - Graduated student record archiving
   - Archive accessibility with visual markers
   - Archive search functionality

2. **Non-Functional Requirements (NFR1-NFR5)**

   **NFR1: Security**

   - Prepared statements (prevent SQL injection)
   - Input validation (prevent XSS)
   - Session hijacking prevention
   - Tamper-proof audit logs

   **NFR2: Performance**

   - Page load time: <2 seconds under normal load
   - Bulk operations: Handle ≥100 records efficiently
   - Database query optimization with indexes

   **NFR3: Usability**

   - Intuitive interface (minimal training required)
   - Clear error messages
   - ≤3 clicks for common tasks

   **NFR4: Maintainability**

   - MVC architecture
   - Modular, reusable functions
   - Inline code documentation

   **NFR5: Reliability**

   - 99% uptime during school hours
   - Data backup mechanisms
   - Graceful error handling (no data loss)

3. **DepEd K-12 Grading Formula**

   **Component Weights:**

   ```
   Written Work (WW):           30%
   Performance Tasks (PT):      50%
   Quarterly Assessment (QA):   20%
   ```

   **Computation Process:**

   ```
   1. Calculate percentage score for each component:
      WW% = (WW Score / WW Total) × 100
      PT% = (PT Score / PT Total) × 100
      QA% = (QA Score / QA Total) × 100

   2. Apply weights:
      Weighted Score = (WW% × 0.30) + (PT% × 0.50) + (QA% × 0.20)

   3. Transmute to 60-100 scale:
      Initial Grade = Weighted Score
      Quarterly Grade = Transmutation[Initial Grade]
      (Transmutation table maps raw percentages to DepEd scale)
   ```

   **Final Grade Calculation:**

   ```
   Semester Final Grade = (Q1 Grade + Q2 Grade) / 2
   School Year Final Grade = (Sem1 Final + Sem2 Final) / 2
   General Average = Average of all Final Grades
   ```

4. **Architecture Patterns**

   **MVC Structure:**

   - Models: Grade computation, data validation
   - Views: Role-specific dashboards (admin/, teacher/, student/)
   - Controllers: Business logic handlers
   - Helpers: Reusable utilities (security, grade_helper, utils)

   **Directory Organization:**

   ```
   /smartgrade-v/
   ├── app/
   │   ├── config/          # DB connection
   │   ├── models/          # Grade.php
   │   ├── views/           # UI templates
   │   ├── helpers/         # Utilities
   │   └── middleware/      # Auth filters
   ├── auth/                # Login/logout
   ├── public/              # Assets (CSS, JS, images)
   └── database/            # SQL schemas
   ```

   **Migration to Vue 3 Architecture:**

   ```
   /src/
   ├── components/          # Reusable UI components
   ├── views/               # Page-level components (Admin, Teacher, Student)
   ├── composables/         # Business logic (useGradeComputation, useAuth)
   ├── services/            # API layer (Supabase client)
   ├── stores/              # Pinia state management
   ├── router/              # Vue Router with guards
   └── types/               # TypeScript interfaces
   ```

5. **Use Cases**

   **Primary Actors:**

   - Admin (ICT Coordinator)
   - Teacher
   - Student

   **Main Use Cases:**

   - Manage Users (Admin)
   - Manage School Year/Periods (Admin)
   - Enter Grades (Teacher)
   - View Grades (Teacher, Student)
   - Generate Reports (Admin, Adviser)
   - Generate Certificates (Admin)
   - Archive Records (Admin)
   - View Audit Logs (Admin)

6. **Scope and Limitations**

   **In Scope:**

   - Grades 11-12 only (Senior High School)
   - All tracks: Academic, TVL, Sports, Arts & Design
   - DepEd K-12 grading formula
   - User management (Admin, Teacher, Student)
   - SF9/SF10 generation
   - Certificate generation
   - Audit logging
   - Archival system

   **Out of Scope:**

   - Attendance tracking
   - Discipline/behavior management
   - DepEd LIS integration
   - Mobile applications (web-only)
   - Tuition/financial transactions
   - Elementary and Junior High School (Grades 1-10)

**Migration Considerations:**

1. **Requirement Conflicts to Resolve**

   - FR4 states students can access SF9/SF10, but reportcard-sample readme restricts to Adviser only
   - Determine if "Adviser" is a distinct role or a Teacher with additional permissions
   - Clarify bulk certificate generation workflow (initiated by whom?)

2. **Technology Mapping**

   - Session-based auth → Supabase Auth JWT tokens
   - PHP password_hash → Supabase handles (transparent migration)
   - MVC controllers → Vue composables + Supabase RPC functions
   - TCPDF → Client-side PDF libraries or Edge Functions
   - MySQL prepared statements → Supabase client (automatic parameterization)

3. **Performance Targets**

   - Maintain <2 second page load (Supabase cold start considerations)
   - Bulk operations for 100+ records (batch inserts, Edge Function optimization)

4. **Security Enhancements**
   - Leverage Supabase RLS for row-level access control
   - Implement rate limiting for public endpoints (QR code verification)
   - Use Content Security Policy (CSP) in Vue app

**Why This Matters:**
This document represents institutional knowledge about requirements, design decisions, and constraints. It captures the "why" behind implementation choices and ensures DepEd compliance. Any deviation during migration could break critical workflows or violate regulatory requirements.

---

## 4. Data & Logic Extraction Plan

### 4.1 Database Entities → Supabase Tables

**Entity Migration Strategy:**

| Legacy Entity       | Supabase Table      | Migration Notes                                                                                             |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `users`             | `profiles`          | Integrate with Supabase Auth; store extended attributes in `profiles` table linked to `auth.users` via UUID |
| `students`          | `students`          | Preserve LRN uniqueness; add `user_id` FK to Supabase auth                                                  |
| `teachers`          | `teachers`          | Preserve employee_number uniqueness; add `user_id` FK                                                       |
| `subjects`          | `subjects`          | Maintain track/strand/semester hierarchy                                                                    |
| `school_years`      | `school_years`      | Active flag determines current year                                                                         |
| `grading_periods`   | `grading_periods`   | FK to `school_years`; active flag for current quarter                                                       |
| `class_assignments` | `class_assignments` | Many-to-many mapping with unique constraint                                                                 |
| `grades`            | `grades`            | Core grading data; preserve all component scores                                                            |
| `final_grades`      | `final_grades`      | Computed from `grades`; consider materialized view                                                          |
| `honors`            | `honors`            | Certificate generation dependency                                                                           |
| `audit_logs`        | `audit_logs`        | Append-only table; never delete                                                                             |
| `archived_students` | `archived_students` | JSON snapshots; consider JSONB for queryability                                                             |
| `system_settings`   | `system_settings`   | Key-value config; consider app-level constants for static values                                            |

**Row Level Security (RLS) Policies to Implement:**

1. **students table:**

   - Students can SELECT only their own record (`auth.uid() = user_id`)
   - Teachers can SELECT students in their assigned classes
   - Admins can SELECT/INSERT/UPDATE/DELETE all records

2. **grades table:**

   - Students can SELECT only their own grades
   - Teachers can SELECT grades for classes they teach; INSERT/UPDATE only for current grading period
   - Admins can SELECT all; UPDATE with audit logging

3. **audit_logs table:**

   - Admins can SELECT all
   - Teachers and Students cannot access

4. **system_settings table:**
   - All authenticated users can SELECT
   - Only Admins can UPDATE

**Foreign Key Preservation:**

All foreign key relationships must be recreated in Supabase with appropriate `ON DELETE` actions:

- `CASCADE`: grades delete when student deleted
- `RESTRICT`: prevent deletion of school_year with active grading_periods
- `SET NULL`: optional for non-critical references

**Index Strategy:**

Preserve existing MySQL indexes and add Supabase-specific optimizations:

- B-tree indexes for foreign keys (automatic in PostgreSQL)
- Composite indexes for common filter combinations:
  - `(student_id, school_year_id, grading_period_id)` on grades
  - `(track, strand, grade_level)` on subjects
- GIN indexes for JSONB columns (audit_logs, archived_students)

### 4.2 PHP Business Logic → TypeScript Composables/Services

**Grade Computation Logic:**

**Legacy PHP Implementation** (conceptual):

```php
function computeQuarterlyGrade($ww_score, $ww_total, $pt_score, $pt_total, $qa_score, $qa_total) {
    $ww_percentage = ($ww_score / $ww_total) * 100;
    $pt_percentage = ($pt_score / $pt_total) * 100;
    $qa_percentage = ($qa_score / $qa_total) * 100;

    $weighted_score = ($ww_percentage * 0.30) + ($pt_percentage * 0.50) + ($qa_percentage * 0.20);

    return transmute($weighted_score); // Maps to 60-100 scale
}
```

**Target TypeScript Composable** (`useGradeComputation.ts`):

```typescript
// Conceptual structure (no implementation in Step One)
interface GradeComponents {
  writtenWork: { score: number; total: number };
  performanceTask: { score: number; total: number };
  quarterlyAssessment: { score: number; total: number };
}

interface GradeWeights {
  writtenWork: number; // 30
  performanceTask: number; // 50
  quarterlyAssessment: number; // 20
}

// To be implemented:
// - computeQuarterlyGrade(components: GradeComponents, weights: GradeWeights): number
// - computeFinalGrade(quarterGrades: number[]): number
// - computeGeneralAverage(finalGrades: number[]): number
// - transmute(rawPercentage: number): number
// - determineHonorType(generalAverage: number): HonorType | null
```

**Validation Logic:**

**Legacy PHP**: Server-side validation in controllers

- LRN format: `/^\d{12}$/`
- Grade range: 60-100 (or NULL for incomplete)
- Email format: `filter_var($email, FILTER_VALIDATE_EMAIL)`

**Target TypeScript**: Client-side and server-side validation

- Vuelidate or VeeValidate for form validation
- Supabase RPC functions for server-side business rules
- TypeScript interfaces for type safety

**Authentication Logic:**

**Legacy**: Session-based with `$_SESSION` superglobal
**Target**: JWT-based with Supabase Auth

- Login → `supabase.auth.signInWithPassword()`
- Session persistence → Automatic token refresh
- Role checks → `user.user_metadata.role` or `profiles.role`

### 4.3 PDF Generation Strategy

**Legacy Approach:**

- TCPDF library (PHP server-side)
- HTML to PDF conversion on server
- Direct file download to client

**Modern Approach Options:**

**Option 1: Client-Side PDF Generation**

- Libraries: jsPDF, pdfmake, html2pdf.js
- Pros: No server load, immediate generation
- Cons: Limited layout control, browser compatibility issues

**Option 2: Supabase Edge Functions**

- Deno-based serverless functions
- Use Deno PDF libraries (e.g., pdfkit, puppeteer)
- Pros: Server-side control, consistent output
- Cons: Cold start latency, function timeout limits

**Option 3: Hybrid Approach**

- Simple certificates → Client-side (jsPDF)
- Complex forms (SF9/SF10) → Edge Functions
- Store generated PDFs in Supabase Storage

**Recommendation for Step Two Planning:**
Evaluate Edge Functions for SF9/SF10 (DepEd compliance requires pixel-perfect accuracy), client-side for certificates (simpler layouts, faster generation).

### 4.4 Audit Logging Migration

**Legacy Implementation:**
PHP middleware captures requests, compares old/new values, inserts into `audit_logs`.

**Target Implementation:**
Supabase Database Triggers (PostgreSQL functions):

```sql
-- Conceptual trigger structure (no implementation in Step One)
CREATE TRIGGER grades_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON grades
FOR EACH ROW EXECUTE FUNCTION log_grade_change();
```

Trigger function captures:

- User ID from JWT context
- Action type (INSERT/UPDATE/DELETE)
- Old and new row values (as JSONB)
- Client IP (from request headers if available)
- Timestamp

**Challenge:** Supabase triggers don't have direct access to client IP/user agent. Solution: Pass metadata via RPC function parameters or use Edge Functions as proxy.

### 4.5 Certificate QR Code System

**Requirement** (from former-db readme):
"generate a qr code to access the certificate and can be accessed by all user just by scanning"

**Implementation Plan:**

1. **QR Code Content:**

   - URL format: `https://<app-domain>/verify/certificate/<certificate_id>`
   - Certificate ID: UUID v4 for security (prevent enumeration)

2. **Certificate Table Extension:**

   ```sql
   -- Conceptual schema addition
   CREATE TABLE certificates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     student_id INT REFERENCES students(id),
     certificate_type VARCHAR(50), -- 'honors', 'good_moral'
     school_year_id INT REFERENCES school_years(id),
     issued_date DATE,
     pdf_url TEXT, -- Supabase Storage URL
     qr_code_url TEXT, -- Generated QR code image
     is_revoked BOOLEAN DEFAULT false
   );
   ```

3. **QR Code Generation:**

   - Library: qrcode.js (client-side) or qrcode (Deno/Edge Function)
   - Generate during certificate creation
   - Store QR code image in Supabase Storage

4. **Public Verification Endpoint:**

   - Supabase RLS policy: Allow anonymous SELECT on `certificates` by ID
   - Verification page displays certificate metadata (student name, honor type, issue date)
   - Option to download PDF (if permitted)

5. **Security Considerations:**
   - Rate limiting on verification endpoint (prevent scraping)
   - Optional: Require CAPTCHA for verification
   - Revocation mechanism (mark `is_revoked = true`)

---

## 5. What Is Explicitly OUT OF SCOPE for Step One

This step is **analysis and planning only**. The following activities are deferred to subsequent steps:

### 5.1 Infrastructure and Deployment

- ❌ Supabase project creation
- ❌ Database provisioning
- ❌ Environment variable configuration
- ❌ Hosting setup (Vercel, Netlify, etc.)
- ❌ Domain and SSL configuration

### 5.2 Code Implementation

- ❌ Vue 3 component development
- ❌ TypeScript interface/type definitions
- ❌ Vuetify component integration
- ❌ Tailwind CSS styling
- ❌ Vue Router configuration
- ❌ Pinia store implementation
- ❌ Composable function implementation
- ❌ Service layer implementation

### 5.3 UI/UX Design

- ❌ Wireframes or mockups
- ❌ Design system creation
- ❌ Component library selection
- ❌ Responsive layout implementation
- ❌ Accessibility testing

### 5.4 Testing

- ❌ Unit test setup
- ❌ Integration test creation
- ❌ E2E test scenarios
- ❌ Performance testing

### 5.5 Data Migration

- ❌ ETL script development
- ❌ Data cleaning and validation
- ❌ Migration execution
- ❌ Data reconciliation

---

## 6. Expected Output of Step One

Upon completion of this analysis phase, the following deliverables should be produced:

### 6.1 Finalized Entity List

**Deliverable:** Comprehensive entity-relationship diagram (ERD) for Supabase PostgreSQL implementation.

**Contents:**

- All 12+ tables with column definitions, data types, constraints
- Foreign key relationships mapped
- Indexes documented
- RLS policies outlined (conceptual, not implemented)
- Enum types defined
- Triggers and functions identified

**Format:** Markdown table or visual diagram (draw.io, dbdiagram.io)

### 6.2 Grade Computation Rules Confirmed

**Deliverable:** Formal specification of DepEd K-12 grading formula implementation.

**Contents:**

- Step-by-step calculation process
- Component weights (WW 30%, PT 50%, QA 20%)
- Transmutation table (if available from DepEd documentation)
- Rounding rules
- Edge cases:
  - Missing scores (NULL handling)
  - Incomplete grades
  - Dropped subjects
  - Transfer students (mid-year entry)

**Format:** Markdown document with pseudocode

### 6.3 Document Templates Identified

**Deliverable:** Catalog of all document types with generation requirements.

**Contents:**

| Document Type           | Purpose             | Access Control  | Generation Method | Priority |
| ----------------------- | ------------------- | --------------- | ----------------- | -------- |
| SF9 (Report Card)       | Quarterly grades    | Adviser only    | Edge Function     | High     |
| SF10 (Permanent Record) | Cumulative record   | Adviser only    | Edge Function     | High     |
| Honors Certificate      | Academic awards     | Admin           | Client-side       | High     |
| Good Moral Certificate  | Character reference | Admin           | Client-side       | Medium   |
| Grade Summary           | Student report      | Student/Teacher | Client-side       | Medium   |

**Additional Details:**

- Official DepEd SF9/SF10 templates obtained (or noted as pending)
- Certificate design specifications (from certificate-ampayon folder)
- QR code requirements documented
- Bulk generation workflow defined

**Format:** Markdown table with links to template files

### 6.4 Migration Risks Noted

**Deliverable:** Risk assessment matrix with mitigation strategies.

**Contents:**

| Risk Category             | Description                                                       | Likelihood | Impact   | Mitigation Strategy                                               |
| ------------------------- | ----------------------------------------------------------------- | ---------- | -------- | ----------------------------------------------------------------- |
| **Data Integrity**        | Grade data corruption during migration                            | Medium     | High     | Checksum validation, dry-run migrations, rollback plan            |
| **Authentication**        | Password migration from bcrypt to Supabase                        | Low        | High     | Supabase supports bcrypt (verify compatibility)                   |
| **Grade Formula**         | Incorrect TypeScript translation of PHP logic                     | Medium     | Critical | Unit tests with known inputs/outputs, peer review                 |
| **PDF Generation**        | Edge Function timeout for SF10 (complex document)                 | Medium     | Medium   | Optimize template, implement async generation with status polling |
| **RLS Performance**       | Complex policies slow down queries                                | Medium     | Medium   | Index optimization, policy profiling, caching strategy            |
| **Requirement Conflicts** | SF9/SF10 access (Student vs Adviser-only)                         | High       | Low      | Stakeholder clarification meeting                                 |
| **Offline Capability**    | Legacy system works offline (XAMPP), new system requires internet | High       | Medium   | PWA with service workers, local-first architecture evaluation     |
| **DepEd Compliance**      | SF9/SF10 templates not pixel-perfect                              | Low        | High     | Obtain official templates, legal review                           |

**Format:** Markdown table with detailed risk descriptions

### 6.5 Technical Debt and Modernization Opportunities

**Deliverable:** List of improvements beyond direct migration.

**Contents:**

- **Type Safety:** TypeScript prevents runtime type errors (legacy PHP is dynamically typed)
- **Real-Time Updates:** Supabase Realtime for live grade updates (legacy requires page refresh)
- **Optimistic UI:** Client-side state updates before server confirmation
- **Progressive Web App:** Offline grade viewing with service workers
- **Mobile Responsiveness:** Tailwind + Vuetify ensure mobile compatibility (legacy Bootstrap 5 has limitations)
- **Automated Testing:** Jest/Vitest for composables, Playwright for E2E (legacy has no tests)
- **Dark Mode:** User preference support
- **Accessibility:** WCAG 2.1 AA compliance (legacy not audited)
- **Analytics:** Grade distribution insights, usage metrics
- **Internationalization:** Multi-language support (English/Filipino)

**Format:** Prioritized Markdown list

### 6.6 Open Questions and Clarifications Needed

**Deliverable:** List of unresolved issues requiring stakeholder input.

**Contents:**

1. **Role Clarification:** Is "Adviser" a separate role or a permission on the Teacher role?
2. **SF9/SF10 Access:** Can students view their own SF9/SF10, or is it Adviser-only?
3. **Transmutation Table:** Does DepEd provide an official percentage-to-grade mapping table?
4. **Certificate Signatories:** Are Adviser and School Head names per-certificate or global settings?
5. **QR Code Verification:** Should verification show full certificate or just metadata?
6. **Offline Requirements:** Is offline operation a must-have or nice-to-have?
7. **Data Retention:** How long should archived student records be retained?
8. **Backup Strategy:** Who is responsible for database backups (school IT or Supabase)?
9. **User Onboarding:** How will existing users migrate (password reset required)?
10. **Mobile App:** Is a native mobile app planned for future phases?

**Format:** Numbered Markdown list with context for each question

---

## 7. Next Steps (Step Two Preview)

Step One establishes the foundation. **Step Two** will focus on:

1. **Supabase Project Setup**

   - Create project in Supabase dashboard
   - Configure authentication providers
   - Set up database schema (run migration scripts)
   - Create storage buckets for certificates

2. **Core Type Definitions**

   - Generate TypeScript interfaces from database schema
   - Define enums for roles, tracks, strands, honor types
   - Create Zod schemas for runtime validation

3. **Authentication Implementation**

   - Supabase Auth integration
   - Role-based routing guards
   - User profile management

4. **Grade Computation Composable**

   - Implement DepEd formula in TypeScript
   - Unit tests with sample data from legacy system
   - Validation against PHP implementation results

5. **Basic CRUD Operations**
   - Student management (Admin)
   - Teacher management (Admin)
   - Subject management (Admin)
   - Grade entry (Teacher)

Step Two deliverables will include working prototypes, not just documentation.

---

## Document Revision History

| Version | Date       | Author           | Changes                   |
| ------- | ---------- | ---------------- | ------------------------- |
| 1.0     | 2025-12-23 | System Architect | Initial document creation |

---

**End of Step One Process Documentation**
