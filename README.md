# SMARTGRADE-Vue

**SMARTGRADE-Vue** is a modern, DepEd-compliant School Management System for Philippine Senior High Schools. Built with Vue 3 + TypeScript + Vuetify 3 + Supabase.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [User Roles](#user-roles)
4. [Admin Role](#admin-role)
5. [Adviser/Teacher Role](#adviserteacher-role)
6. [Student Role](#student-role)
7. [Implementation Status](#implementation-status)
8. [Database Schema](#database-schema)
9. [Getting Started](#getting-started)

---

## Overview

SMARTGRADE-Vue is designed to streamline:

- **Final Grade Encoding** – Teachers enter only final grades (no component breakdown)
- **SF9 Report Card Generation** – Official DepEd Form 9 with versioning
- **Immutable Documents** – Once generated, SF9 cannot be edited (revoke + regenerate workflow)
- **Watermarked Student View** – Students see SF9 with permanent watermark
- **Multi-Role Access** – Admin, Adviser, Student with strict permissions

---

## Technology Stack

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Frontend         | Vue 3 (Composition API + `<script setup>`) |
| Language         | TypeScript                                 |
| UI Framework     | Vuetify 3 + MDI Icons                      |
| State Management | Pinia                                      |
| Routing          | Vue Router 4                               |
| Backend/Database | Supabase (PostgreSQL)                      |
| Build Tool       | Vite                                       |
| Deployment       | Vercel                                     |

---

## User Roles

| Role                  | Access Level                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| **Admin**             | Full system control - users, sections, subjects, school years, settings |
| **Adviser** (Teacher) | Manage assigned classes, encode grades, enroll students, generate SF9   |
| **Student**           | View-only access to own grades and SF9                                  |

---

## Admin Role

### Dashboard (`/admin`)

**Status: 🟢 Dynamic**

| Feature            | UI Element                                                 | Data Source                           |
| ------------------ | ---------------------------------------------------------- | ------------------------------------- |
| Stats Cards        | 4 cards (Students, Teachers, Sections, Active School Year) | 🟢 Supabase count queries             |
| Quick Actions      | Navigation buttons to all management pages                 | 🟢 Vue Router links                   |
| Recent Activity    | Audit logs table (action, user, target, time)              | 🟢 Supabase `audit_logs` table        |
| System Overview    | List (Subjects, Documents, Grades counts)                  | 🟢 Supabase count queries             |
| School Information | Logo preview, school name, principal                       | 🟢 Supabase `schools` table + Storage |
| Access Control     | Checks if `role === 'admin'`, shows "Access Denied" if not | 🟢 Pinia auth store                   |

**Data Fetched:**

- `students` count
- `teachers` count
- `sections` count
- `subjects` count
- `documents` count
- `grades` count
- `school_years` where `is_active = true`
- `schools` (single record)
- `audit_logs` (last 10, ordered by `created_at` desc)

**Workflow:**

1. Admin logs in → redirected to `/admin`
2. Dashboard fetches all stats in parallel
3. Quick action buttons navigate to management pages
4. Recent activity shows audit trail

---

### Users Page (`/admin/users`)

**Status: 🟢 Dynamic**

| Feature     | UI Element                                   | Data Source               |
| ----------- | -------------------------------------------- | ------------------------- |
| User List   | Data table with pagination                   | 🟢 Supabase `users` table |
| Search      | Text field filter                            | 🟢 Client-side filter     |
| Role Filter | Dropdown (All/Admin/Adviser/Teacher/Student) | 🟢 Client-side filter     |
| Add User    | Dialog form                                  | 🟢 Supabase insert        |
| Edit User   | Dialog form                                  | 🟢 Supabase update        |
| Delete User | Confirmation dialog                          | 🟢 Supabase delete        |

---

### Sections Page (`/admin/sections`)

**Status: 🟢 Dynamic**

| Feature              | UI Element    | Data Source                      |
| -------------------- | ------------- | -------------------------------- |
| Section Cards        | Grid of cards | 🟢 Supabase `sections` table     |
| Adviser Dropdown     | Select input  | 🟢 Supabase `teachers` + `users` |
| School Year Dropdown | Select input  | 🟢 Supabase `school_years`       |
| Add/Edit/Delete      | Dialog forms  | 🟢 Supabase CRUD                 |

---

### Subjects Page (`/admin/subjects`)

**Status: 🟢 Dynamic**

| Feature         | UI Element               | Data Source                  |
| --------------- | ------------------------ | ---------------------------- |
| Subject List    | Data table               | 🟢 Supabase `subjects` table |
| Type Chips      | Core/Applied/Specialized | 🟢 `subject_type` field      |
| Add/Edit/Delete | Dialog forms             | 🟢 Supabase CRUD             |

---

### School Years Page (`/admin/school-years`)

**Status: 🟢 Dynamic**

| Feature         | UI Element             | Data Source                |
| --------------- | ---------------------- | -------------------------- |
| Year Cards      | Grid with Active badge | 🟢 Supabase `school_years` |
| Set Active      | Button action          | 🟢 Supabase update         |
| Add/Edit/Delete | Dialog forms           | 🟢 Supabase CRUD           |

---

### Settings Page (`/admin/settings`)

**Status: 🟢 Dynamic**

| Feature     | UI Element       | Data Source                 |
| ----------- | ---------------- | --------------------------- |
| School Info | Form inputs      | 🟢 Supabase `schools` table |
| Logo Upload | File input       | 🟢 Supabase Storage `logos` |
| Quick Stats | List with counts | 🟢 Supabase count queries   |

---

## Adviser/Teacher Role

### Dashboard (`/adviser`)

**Status: 🟢 Dynamic**

| Feature              | UI Element                                             | Data Source                                      |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Stats Cards          | 4 cards (Classes, Students, Pending Grades, Documents) | 🟢 Computed from queries                         |
| Assigned Classes     | Grid of cards with section/subject/semester            | 🟢 `section_subjects` where `teacher_id` matches |
| Student Count        | Per class                                              | 🟢 Count from `enrollments`                      |
| Encode Grades Button | Per class card                                         | 🟢 Links to `/adviser/grades?ss=<id>`            |
| Advised Sections     | List                                                   | 🟢 `sections` where `adviser_teacher_id` matches |
| Quick Actions        | Encode Grades, Documents, Students, Enroll             | 🟢 Vue Router links                              |

**Data Fetched:**

- `teachers` where `user_id` matches (to get `teacher_id`)
- `section_subjects` with joins to `sections`, `subjects`, `semesters`, `school_years`
- `enrollments` count per `section_subject_id`
- `sections` where adviser
- `documents` count where `generated_by` matches

---

### Encode Grades Page (`/adviser/grades`)

**Status: 🟢 Dynamic**

| Feature          | UI Element              | Data Source                              |
| ---------------- | ----------------------- | ---------------------------------------- |
| Section Dropdown | Select input            | 🟢 Adviser's sections                    |
| Subject Dropdown | Select input            | 🟢 `section_subjects` for section        |
| Student List     | Table with grade inputs | 🟢 `enrollments` + `students` + `grades` |
| Grade Input      | Number input (0-100)    | 🟢 Two-way binding                       |
| Remarks          | Auto-calculated chip    | 🟢 Computed (≥75 = Passed)               |
| Save All Grades  | Button                  | 🟢 Supabase upsert to `grades`           |

**Workflow:**

1. Adviser selects section → loads subjects
2. Adviser selects subject → loads enrolled students with existing grades
3. Adviser enters/edits final grades
4. Click "Save All Grades" → upserts to `grades` table with `onConflict: 'enrollment_id'`

---

### Document Center Page (`/adviser/documents`)

**Status: 🟡 Partially Dynamic**

| Feature          | UI Element                     | Data Source                    |
| ---------------- | ------------------------------ | ------------------------------ |
| Section Dropdown | Select input                   | 🟢 Adviser's sections          |
| Student List     | Table (LRN, Name, Status)      | 🟢 `enrollments` + `students`  |
| SF9 Status       | Chip (Generated/Not Generated) | 🟢 Checks `documents` table    |
| Generate/View    | Action buttons                 | ⚪ UI only (no PDF generation) |

---

### Enroll Students Page (`/adviser/enroll`)

**Status: 🟢 Dynamic**

| Feature            | UI Element               | Data Source                           |
| ------------------ | ------------------------ | ------------------------------------- |
| Section Dropdown   | Select input             | 🟢 Sections where adviser             |
| Semester Dropdown  | Select input             | 🟢 `semesters` table                  |
| Available Students | Table with checkboxes    | 🟢 `students` NOT IN enrolled         |
| Enrolled Students  | Table with Remove button | 🟢 `enrollments` for section          |
| Search             | Filter inputs            | 🟢 Client-side filter                 |
| Enroll Selected    | Bulk action button       | 🟢 Supabase insert to `enrollments`   |
| Remove Student     | Confirmation dialog      | 🟢 Supabase delete from `enrollments` |

**Workflow:**

1. Adviser selects section and semester
2. Available students shown (not already enrolled)
3. Select students → click "Enroll Selected"
4. Creates enrollments for ALL `section_subjects` in that section
5. Remove button deletes enrollments for that student in section

---

### Students Page (`/adviser/students`)

**Status: 🟢 Dynamic**

| Feature          | UI Element   | Data Source                   |
| ---------------- | ------------ | ----------------------------- |
| Section Dropdown | Select input | 🟢 Adviser's sections         |
| Student List     | Table        | 🟢 `enrollments` + `students` |

---

## Student Role

### Dashboard (`/student`)

**Status: 🟢 Dynamic**

| Feature         | UI Element                        | Data Source                         |
| --------------- | --------------------------------- | ----------------------------------- |
| Welcome Message | Heading with student name         | 🟢 `students` where `user_id`       |
| Stats Cards     | Subjects, GWA, Passed, Documents  | 🟢 Computed from enrollments/grades |
| Grades Table    | Subject, Final Grade, Remarks     | 🟢 `enrollments` + `grades`         |
| Quick Actions   | View All Grades, View SF9 buttons | 🟢 Vue Router links                 |

**Data Fetched:**

- `students` profile (name, student_id)
- `enrollments` with `section_subjects.subjects`, `grades`
- `documents` count for student

---

### Grades Page (`/student/grades`)

**Status: 🟢 Dynamic**

| Feature             | UI Element                   | Data Source                              |
| ------------------- | ---------------------------- | ---------------------------------------- |
| Semester Dropdown   | Select input                 | 🟢 `semesters` table                     |
| Grades Table        | Code, Name, Units, Grade     | 🟢 `enrollments` + `subjects` + `grades` |
| GWA Calculation     | Footer row                   | 🟢 Computed (weighted by units)          |
| Performance Summary | Highest/Lowest/Failed counts | 🟢 Computed                              |
| Grade Legend        | Info card                    | 🟢 Static                                |

---

### SF9 Page (`/student/sf9`)

**Status: 🟢 Dynamic**

| Feature       | UI Element                      | Data Source                         |
| ------------- | ------------------------------- | ----------------------------------- |
| School Header | Logo, name, address, principal  | 🟢 `schools` table + Storage        |
| Student Info  | LRN, Name, Section, School Year | 🟢 `students` + `enrollments`       |
| Grades Table  | Per-semester grades with final  | 🟢 `enrollments` + `grades` grouped |
| Watermark     | "OFFICIAL COPY - STUDENT VIEW"  | 🟢 CSS overlay                      |
| Document Info | Version, generated date         | 🟢 `documents` table                |
| Print Button  | Browser print                   | 🟢 Functional                       |
| Download PDF  | Button                          | ⚪ Placeholder (TODO)               |

**Data Fetched:**

- `schools` (logo, name, principal)
- `students` profile with section info
- `documents` where `student_id` and `type='SF9'` and `is_active=true`
- `enrollments` with grades for both semesters

---

## Implementation Status

### Legend

- 🟢 **Dynamic** – Fetches/saves data from Supabase
- 🟡 **Partially Dynamic** – Some features use database, others pending
- ⚪ **Static** – UI only, no database connection

### Summary Table

| Page               | Route                 | Status     | Notes                      |
| ------------------ | --------------------- | ---------- | -------------------------- |
| Login              | `/login`              | 🟢 Dynamic | Auth via `users` table     |
| Admin Dashboard    | `/admin`              | 🟢 Dynamic | All stats from Supabase    |
| Admin Users        | `/admin/users`        | 🟢 Dynamic | Full CRUD                  |
| Admin Sections     | `/admin/sections`     | 🟢 Dynamic | Full CRUD with joins       |
| Admin Subjects     | `/admin/subjects`     | 🟢 Dynamic | Full CRUD                  |
| Admin School Years | `/admin/school-years` | 🟢 Dynamic | Full CRUD                  |
| Admin Settings     | `/admin/settings`     | 🟢 Dynamic | Settings + logo upload     |
| Adviser Dashboard  | `/adviser`            | 🟢 Dynamic | Section_subjects + counts  |
| Adviser Grades     | `/adviser/grades`     | 🟢 Dynamic | Full grade encoding        |
| Adviser Documents  | `/adviser/documents`  | 🟡 Partial | Status checks, no PDF gen  |
| Adviser Students   | `/adviser/students`   | 🟢 Dynamic | Student list               |
| Adviser Enroll     | `/adviser/enroll`     | 🟢 Dynamic | Full enrollment management |
| Student Dashboard  | `/student`            | 🟢 Dynamic | Grades + stats             |
| Student Grades     | `/student/grades`     | 🟢 Dynamic | Semester filter + GWA      |
| Student SF9        | `/student/sf9`        | 🟢 Dynamic | Full SF9 with data         |

---

## Database Schema

### Core Tables

| Table              | Purpose                       | Key Fields                                                                        |
| ------------------ | ----------------------------- | --------------------------------------------------------------------------------- |
| `users`            | Authentication & roles        | `user_id`, `email`, `role`, `school_id`, `is_active`                              |
| `students`         | Student profiles              | `student_id`, `lrn`, `first_name`, `last_name`, `user_id`                         |
| `teachers`         | Teacher profiles              | `teacher_id`, `user_id`                                                           |
| `schools`          | School branding               | `school_id`, `school_name`, `principal_name`, `logo_path`                         |
| `school_years`     | Academic years                | `id`, `year_label`, `start_date`, `end_date`, `is_active`                         |
| `semesters`        | 1st/2nd Semester              | `semester_id`, `name`, `school_year_id`                                           |
| `sections`         | Class sections                | `section_id`, `name`, `adviser_teacher_id`, `school_year_id`                      |
| `subjects`         | Subject catalog               | `subject_id`, `subject_code`, `subject_name`, `units`, `subject_type`             |
| `section_subjects` | Subject offerings per section | `section_subject_id`, `section_id`, `subject_id`, `teacher_id`, `semester_id`     |
| `enrollments`      | Student-subject enrollment    | `enrollment_id`, `student_id`, `section_subject_id`, `semester_id`                |
| `grades`           | Final grades only             | `grade_id`, `enrollment_id`, `final_grade`, `is_final`                            |
| `documents`        | SF9 versioning                | `document_id`, `student_id`, `document_type`, `version`, `is_active`, `file_path` |
| `audit_logs`       | Activity tracking             | `audit_id`, `user_id`, `action`, `target_type`, `target_id`, `created_at`         |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project

### Installation

```bash
# Clone repository
git clone https://github.com/cjbantillo/smartgrade-vue.git
cd smartgrade-vue

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```


---

## Deployment

Deployed on **Vercel** with automatic builds from `main` branch.

Configuration in `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

_Last Updated: January 4, 2026_
