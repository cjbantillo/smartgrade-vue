# Role
You are a Senior Vue 3 + Supabase Developer working on the "SmartGrade" system.

# Context
We are in **Phase 12: Production Hardening**. The database schema is complete (17 tables with RLS), but we are missing critical composables for certificate/document generation. The build is currently failing due to missing types and functions.

# Configuration & Constraints
1.  **PDF Engine:** Use `html2pdf.js` (Client-side rendering).
2.  **Storage:** Files must be uploaded to Supabase Storage buckets (`certificates`, `documents`).
3.  **Verification URL:** Use `window.location.origin` to construct QR code URLs dynamically.
4.  **Strict Gating:** All document generation MUST check `grade_finalization_status.is_finalized` before proceeding.

# Tasks

## 1. Storage Setup (SQL)
Create a new file `supabase/storage_policies.sql` with SQL commands to:
* Insert two new public buckets: `certificates` and `documents`.
* Add storage policies allowing:
    * **Authenticated users** to upload/insert files.
    * **Public (Anon)** to read/download files (required for QR verification).

## 2. Create `src/composables/useCertificates.ts`
This resolves the TypeScript errors in `CertificateTemplate.vue`.
* **Imports:** Use `html2pdf.js`, Supabase client, and `src/utils/errorHandling.ts`.
* **Type Definition:** Export `CertificateWithStudent` (join `certificates` -> `students`, `school_years`).
* **State:** Reactive `loading`, `error` (using ErrorDisplay format), `certificates` list.
* **Action `generateCertificate(payload)`:**
    1.  Check `is_finalized` for the student/term. If false, throw "Grades not finalized".
    2.  Render the DOM element to PDF blob using `html2pdf`.
    3.  Upload blob to `certificates` bucket: path `student_id/year_id/type.pdf`.
    4.  Insert record into `certificates` table with the returned public URL.
    5.  Log to `audit_logs` (action: `certificate_generated`).
* **Action `verifyCertificate(id)`:** Fetch certificate by ID (allow anon/public access).

## 3. Create `src/composables/useDocuments.ts`
* **State:** `isEditing` (boolean), `metadataEdits` (object).
* **Action `fetchDocumentData(studentId, type)`:**
    * Check `is_finalized` first.
    * Fetch `final_grades` (for SF9) or grade history (for SF10).
    * Fetch any existing `document_edits` to apply metadata overrides.
* **Action `saveMetadataEdit(payload)`:**
    * Payload: `{ student_id, field_name, new_value }`.
    * Upsert into `document_edits`.
    * **Constraint:** Do not allow editing grade values, only metadata (names, dates).

## 4. Update `src/components/CertificateTemplate.vue`
* Fix imports to use the new `useCertificates`.
* Ensure the QR code component points to `${window.location.origin}/verify/${certificateId}`.

# Tech Stack
* Vue 3 (Composition API)
* Supabase JS Client
* TypeScript
* Vuetify (for UI feedback)

# Next Step
After this code is generated, run the SQL file in the Supabase SQL Editor to initialize the storage buckets.