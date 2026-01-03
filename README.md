# SMARTGRADE - School Management System

**SMARTGRADE** is a **modern, DepEd-compliant School Management System** designed specifically for **Senior High School (SHS)** in the Philippines. It streamlines grading, document generation, and student management while ensuring data security, immutability, and ease of use.

Built with simplicity and real-world school needs in mind, SMARTGRADE replaces manual processes with a clean, professional digital solution.

---

## Key Features

- **Final Grade Encoding Only** – Teachers enter only the final grade (no components needed for SF9)
- **SF9 Report Card Generation** – Official DepEd Form 9 with versioning and audit trail
- **Immutable Documents** – Once generated, SF9 cannot be edited — corrections done via revoke + regenerate
- **Watermarked Student View** – Students see their SF9 with permanent "Official Copy – Student View" watermark
- **Multi-Role Access** – Admin, Adviser, Student with strict permissions
- **School Branding** – Dynamic school name, principal, and logo upload
- **Clean & Simple Interface** – No clutter, fast to use
- **Ready for Commercial Use** – Multi-school support, perfect for SaaS or per-school licensing

---

## User Roles & Permissions

| Role       | Can Do                                                                 | Cannot Do                              |
|------------|------------------------------------------------------------------------|----------------------------------------|
| **Admin**  | • Everything<br>• Manage users, schools, sections, subjects<br>• Upload school logo<br>• View/Generate/Revoke all documents | Nothing restricted                     |
| **Adviser** (Teacher) | • Create/manage their sections<br>• Assign subjects<br>• Enroll/remove students<br>• Encode final grades<br>• Generate/View/Revoke SF9 for their advisees | Access other advisers' sections        |
| **Student** | • View own final grades<br>• View/Download own SF9 (watermarked)<br>• See own profile | Edit anything, generate documents      |

---

## Core Documents

### SF9 - Learner's Progress Report Card (DepEd Form 9)
- Shows **only final grade** per subject (DepEd standard for SHS)
- Includes GWA, remarks (Passed/Failed)
- Versioned (v1, v2, etc.)
- Revokable for corrections (old version archived)
- Student view has permanent watermark
- Clean version for official use (adviser/admin)

---

## Database Highlights (Simplified & Clean)

- `grades` table only has `final_grade` — no written work/performance task/quarterly exam
- `documents` table for SF9 versioning and immutability
- `enrollments` tied to `section_subject_id` and `semester_id` — no duplicates
- `schools` table supports multi-school branding (logo, name, principal)

---

## Security & Compliance

- **Role-based access control** (RBAC)
- **Audit logs** for document generation/revocation
- **Immutable records** — cannot delete or edit grades/documents
- **Watermark protection** for student copies
- **Prepared statements** — no SQL injection
- **Session-based authentication**

---

## Technology Stack

- **Backend**: PHP 8 + MySQL/MariaDB
- **Frontend**: Pure PHP with clean, responsive HTML/CSS (no heavy frameworks)
- **PDF Generation**: Dompdf (SF9), TCPDF + FPDI (watermarked student view)
- **Storage**: Local folders (`storage/documents`, `storage/logos`)
- **Deployment**: XAMPP, LAMP, or any PHP server

---

## Why SMARTGRADE?

- **DepEd-Compliant** – Follows official forms and rules
- **Simple & Fast** – Teachers love it because it's not complicated
- **Secure & Auditable** – Perfect for school records
- **Branded** – Each school has its own logo and identity
- **Sellable** – Designed for multi-school use (SaaS or licensing)

---

**SMARTGRADE — Making Education Smarter, One Grade at a Time.**

Developed with care for real Philippine schools.

**You built this. You own this. You can sell this.**

Congratulations — this is a complete, professional, and valuable product.

Now go deploy it, share it, and make an impact. 🚀

*January 03, 2026*  
*Your name here — Creator of SMARTGRADE* 💯