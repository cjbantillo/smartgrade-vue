# SMARTGRADE-Vue Project Overview

## Purpose

**SMARTGRADE-Vue** is the modern frontend rewrite of the original SMARTGRADE system — a **DepEd-compliant School Management System** for Philippine Senior High Schools. It preserves **100% of the original logic, rules, roles, and document workflow** while delivering a fast, beautiful, and responsive user experience.

The goal is to maintain **exact feature parity** with the PHP version (immutability, auditability, versioning, watermarking) while upgrading to a modern stack for better maintainability, performance, and future extensibility.

## Core Architecture

- **Frontend**: Vue 3 (Composition API + `<script setup>`) + TypeScript + Vuetify 3 + Vite
- **Backend**: Supabase (PostgreSQL database + Authentication + Storage)
- **PDF Generation**: Client-side (jsPDF or pdf-lib) or Supabase Edge Functions for server-side rendering
- **Storage**: Supabase Storage buckets (`logos`, `documents`, `snapshots`)
- **Design principles**: 
  - Exact replication of original PHP rules (no hard deletes, adviser as assignment, immutable documents)
  - Role-based access strictly enforced
  - Watermarked student views
  - Multi-school support via Supabase project or `school_id`

## Roles & Permissions (Identical to PHP Version)

| Role       | Permissions (Same as Original)                                      |
|------------|--------------------------------------------------------------------|
| **Admin**  | Full control: school settings (logo, name, principal), user management, sections, subjects, school years, audit logs |
| **Adviser** (Teacher with assignment) | Manage own sections: enroll/remove students, encode final grades, generate/view/revoke SF9, preview templates |
| **Teacher** | Can be created but inactive until assigned as adviser |
| **Student** | Read-only: view own final grades per semester, download watermarked SF9 |

## Document System (Exact Match)

- **Supported Documents**: SF9 (Report Card), SF10 (Permanent Record), Certificates
- **Workflow**:
  - Adviser generates → immutable snapshot (JSON) + PDF saved
  - Versioning (v1, v2 on regenerate)
  - Revoke → marks old version inactive → allows new generation
  - Student view → permanent watermark "Official Copy – Student View"
- **Templates**: Same HTML structure as PHP version, stored in `src/templates/` or fetched from Supabase
- **Storage**: Supabase Storage (`documents/school_{id}/students/{id}/sf9/sf9_vX.pdf`)

## Key Directories

- `src/` 
  - `components/` – Reusable Vuetify components (tables, cards, modals)
  - `views/` – Role-based pages (AdminDashboard.vue, AdviserDocumentCenter.vue, StudentDashboard.vue)
  - `router/` – Vue Router with role-based routes
  - `stores/` – Pinia stores (auth, user, grades, documents)
  - `lib/` – Supabase client, utilities
  - `assets/` – Logos, icons
  - `templates/` – Document HTML templates (mirrored from PHP version)
- `public/` – Favicon, index.html
- `supabase/` – Optional local functions or types

## Dependencies (package.json)

- `vue` ^3
- `vue-router` ^4
- `pinia`
- `vuetify` ^3 + `@mdi/font`
- `@supabase/supabase-js`
- `vite` + `@vitejs/plugin-vue`
- Optional: `jsPDF`, `pdf-lib`, `html2canvas` (for client-side PDF/watermark)

## Setup Summary

1. `npm create vite@latest smartgrade-vue -- --template vue-ts`
2. `cd smartgrade-vue && npm install`
3. Install Vuetify: `npm install vuetify @mdi/font`
4. Install Supabase: `npm install @supabase/supabase-js`
5. Create Supabase project → import original `smartgrade_db.sql` (converted to PostgreSQL)
6. Add `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
7. Run `npm run dev`

## Operational Notes (Same as PHP Version)

- **No hard deletes** — records are soft-deleted or versioned
- **Adviser is an assignment**, not a user role
- **Final grade only** — no component breakdown in encoding or student view
- **Immutable documents** — revoke + regenerate required for corrections
- **Watermark mandatory** for all student downloads
- **Audit trail** preserved via Supabase table or Edge Functions

## Reference Docs

- `ARCHITECTURE.md` – Original principles (still valid)
- `DOCUMENT_GENERATION_FLOW.md` – Workflow mirrored exactly
- `SETUP.md` – Development and deployment guide
- `ROLES.md` – Detailed role permissions

## Vision

SMARTGRADE-Vue keeps the **trusted, battle-tested logic** of the original PHP system while delivering a **modern, delightful experience** teachers and students will love.

It is fully prepared for:
- Mobile responsiveness
- Real-time updates (Supabase Realtime)
- Future PWA / mobile app
- SaaS multi-school deployment

**SMARTGRADE-Vue — The future of SMARTGRADE, today.**

Built with pride for Philippine education.  
January 03, 2026  
*Your name — Creator of SMARTGRADE* 🚀