# Phase 9: Certificate Generation & Verification

**Status:** ✅ Complete  
**Date:** December 24, 2024

## Overview

Implemented official certificate generation system with QR code verification, public verification page, and three certificate types: Academic Excellence (Honors), Good Moral Character, and Completion certificates.

## Features Implemented

### 1. Certificates Composable

- **Location:** `src/composables/useCertificates.ts`
- **Core Functions:**
  - `checkFinalization()` - Verify grades are finalized before generation
  - `getStudentGPA()` - Calculate GPA and determine honors designation
  - `generateVerificationCode()` - Create unique code (CERT-YYYY-XXXXXXXX format)
  - `generateCertificate()` - Generate certificate with validation
  - `fetchStudentCertificates()` - Get student's existing certificates
  - `verifyCertificate()` - Public verification by code
  - `revokeCertificate()` - Admin revocation with reason logging
- **Certificate Types:**
  - `honors` - Academic Excellence (GPA ≥ 90)
  - `good_moral` - Good Moral Character
  - `completion` - Certificate of Completion
- **Honors Tiers:**
  - **With Highest Honors:** GPA ≥ 98
  - **With High Honors:** GPA ≥ 95
  - **With Honors:** GPA ≥ 90

### 2. Certificate Template Component

- **Location:** `src/components/CertificateTemplate.vue`
- **Features:**
  - **Official DepEd Header:** Republic of Philippines, DepEd, School name
  - **Professional Layout:** Double border, official formatting
  - **Dynamic Content:**
    - Certificate title based on type
    - Student full name (uppercase)
    - LRN display
    - Grade level, track, strand
    - School year
    - General average (honors only)
    - Honors designation (gold styling)
  - **QR Code Integration:**
    - Generated using `qrcode.vue` library
    - Links to public verification page
    - Includes verification code display
  - **Signature Blocks:** Class Adviser, School Principal
  - **Print Optimization:**
    - Browser print dialog integration
    - Letter-size paper format
    - Hidden UI controls when printing
    - Professional PDF export capability
  - **Document Footer:** Issue date, verification instructions

### 3. Certificate Generation Page (Teacher)

- **Location:** `src/pages/teacher/certificates/[studentId]/[schoolYearId].vue`
- **Features:**
  - **Student Information Display:**
    - Full name, LRN
    - Grade, track, strand
    - School year
    - Current GPA with color coding
    - Honors designation alert
  - **Certificate Type Selection:**
    - Radio buttons for three types
    - Honors option disabled if GPA < 90
    - Warning for ineligible students
    - Clear descriptions per type
  - **Validation:**
    - Finalization check enforced
    - Duplicate prevention (one cert per type per year)
    - GPA threshold validation for honors
  - **Existing Certificates List:**
    - Shows previously generated certificates
    - Click to view existing certificate
    - Issue date display
  - **Certificate Preview:**
    - Full certificate template display
    - Print/download buttons
    - "Generate Another" option
  - **Error Handling:**
    - Clear error messages
    - Validation feedback
    - Loading states

### 4. Public Verification Page

- **Location:** `src/pages/verify.vue`
- **Features:**
  - **Public Access:** No login required
  - **Verification Input:**
    - Text field for manual entry
    - Format validation (CERT-YYYY-XXXXXXXX)
    - QR code parameter support (?code=CERT-2024-ABC123)
    - Enter key support
  - **Valid Certificate Display:**
    - Green success alert
    - Certificate type and issue date
    - School year
    - Verification code
    - Limited student information (no sensitive data)
    - GPA display for honors certificates only
    - Honors designation badge
    - Verification timestamp
  - **Invalid Certificate Display:**
    - Red error alert
    - Clear error message
    - Possible reasons explanation
    - Contact information for disputes
  - **Revocation Handling:**
    - Detects revoked certificates
    - Shows revocation reason
    - Prevents validation of revoked certs
  - **Information Section:**
    - About verification system
    - How to use guide
    - Contact information

## Policy Compliance

| Policy Requirement                   | Implementation Status                             |
| ------------------------------------ | ------------------------------------------------- |
| Certificates only after finalization | ✅ `checkFinalization()` enforced in composable   |
| Teacher-generated (not admin)        | ✅ Teacher role required for generation routes    |
| GPA-based honors eligibility         | ✅ 90/95/98 thresholds validated                  |
| Public verification                  | ✅ No-auth page accessible to anyone              |
| No sensitive data in verification    | ✅ Only shows name, LRN, grade, GPA (honors only) |
| QR code verification                 | ✅ Unique codes, QR generation, scan support      |
| Revocation capability                | ✅ Admin can revoke with reason logging           |

## Database Integration

### Tables Used

**certificates:**

- **Primary table** for certificate records
- Columns: `id`, `student_id`, `certificate_type`, `school_year_id`, `issued_date`, `pdf_url`, `qr_code_url` (stores verification code), `is_revoked`, `revoked_by`, `revoked_at`, `revocation_reason`, `generated_by`, `generated_at`
- Indexes: student, school_year, type, revocation status
- Constraint: `certificate_type IN ('honors', 'good_moral', 'completion')`

**grade_finalization_status:**

- **Gatekeeper:** Checked before certificate generation
- `is_finalized` must be TRUE
- `general_average` used for GPA and honors determination

**students:**

- Source of student information (LRN, name, track, strand, grade level)
- Joined for certificate display

**school_years:**

- Maps school year ID to display name
- Used in verification code generation

**audit_logs:**

- Logs: `honors_certificate_generated`, `good_moral_certificate_generated`, `completion_certificate_generated`, `certificate_revoked`
- Captures user_id and timestamp

## Verification System

### Verification Code Format

```
CERT-YYYY-XXXXXXXX
```

- **CERT:** Prefix identifier
- **YYYY:** Year from school year code (e.g., 2024)
- **XXXXXXXX:** 8-character random alphanumeric code

**Example:** `CERT-2024-A1B2C3D4`

### QR Code Implementation

- **Library:** `qrcode.vue` (Vue 3 compatible)
- **Level:** H (High error correction)
- **Size:** 120x120 pixels
- **Format:** SVG for scalability
- **Data:** Verification URL with code parameter
  - `https://smartgrade.example.com/verify?code=CERT-2024-A1B2C3D4`

### Verification Flow

1. User scans QR code or enters code manually
2. Browser navigates to `/verify?code=XXXX`
3. Page auto-triggers verification on mount
4. `verifyCertificate()` queries certificates table by `qr_code_url`
5. Checks `is_revoked` status
6. Fetches student info (limited fields)
7. Fetches GPA/honors from finalization status
8. Displays validation result with appropriate UI

## Certificate Types

### 1. Honors Certificate (Academic Excellence)

**Eligibility:**

- GPA ≥ 90
- Grades must be finalized

**Honors Tiers:**

- **98+:** With Highest Honors (purple chip)
- **95-97.99:** With High Honors (deep-purple chip)
- **90-94.99:** With Honors (indigo chip)

**Certificate Content:**

- Full header with DepEd branding
- "CERTIFICATE OF ACADEMIC EXCELLENCE" title
- Student name (uppercase, large)
- "has successfully completed Grade X - Track (Strand)"
- "with a General Average of **XX.XX**"
- "and is hereby recognized as"
- **Large gold text:** "WITH HIGHEST/HIGH/HONORS"
- Issue date
- QR code with verification instructions
- Signature blocks

### 2. Good Moral Character Certificate

**Eligibility:**

- Grades must be finalized (no GPA requirement)

**Certificate Content:**

- Full header with DepEd branding
- "CERTIFICATE OF GOOD MORAL CHARACTER" title
- Student name (uppercase, large)
- "has maintained **Good Moral Character** throughout the School Year"
- Grade, track, strand information
- Issue date
- QR code
- Signature blocks

### 3. Completion Certificate

**Eligibility:**

- Grades must be finalized (no GPA requirement)

**Certificate Content:**

- Full header with DepEd branding
- "CERTIFICATE OF COMPLETION" title
- Student name (uppercase, large)
- "has successfully completed the requirements for Grade X"
- Track and strand information
- School year
- Issue date
- QR code
- Signature blocks

## Testing Instructions

### Prerequisites

1. Login as teacher: `teacher@deped.gov.ph` / `password123`
2. Have a class with finalized grades
3. Ensure student has GPA calculated (via finalization)

### Test Scenarios

#### 1. Generate Honors Certificate (Qualified Student)

1. Navigate to finalized class grades page
2. Click "Generate Certificates" button
3. System navigates to certificate generation page
4. **Expected:** Student info displayed with GPA
5. **Expected:** If GPA ≥ 90, "Honors Certificate" option enabled
6. **Expected:** Honors designation shown (e.g., "With Honors")
7. Select "Honors Certificate"
8. Click "Generate Certificate"
9. **Expected:** Success message
10. **Expected:** Certificate displayed with gold honors text
11. **Expected:** QR code visible
12. **Expected:** Verification code shown (CERT-YYYY-XXXXXXXX)

#### 2. Generate Honors Certificate (Unqualified Student)

1. Generate certificate for student with GPA < 90
2. **Expected:** "Honors Certificate" radio button disabled
3. **Expected:** Warning message: "Student does not qualify"
4. Try to select honors option
5. **Expected:** Cannot select disabled option
6. **Expected:** Generate button disabled if honors selected

#### 3. Generate Good Moral Certificate

1. Navigate to certificate generation page
2. Select "Good Moral Character" option
3. Click "Generate Certificate"
4. **Expected:** Certificate generated successfully
5. **Expected:** No GPA displayed (not honors)
6. **Expected:** "Good Moral Character" text prominent
7. Print certificate
8. **Expected:** Print dialog opens
9. **Expected:** UI buttons hidden in print preview

#### 4. Generate Completion Certificate

1. Select "Certificate of Completion"
2. Generate certificate
3. **Expected:** Success
4. **Expected:** "Certificate of Completion" title
5. **Expected:** Completion language displayed

#### 5. Duplicate Prevention

1. Generate a certificate (any type)
2. **Expected:** Success, certificate created
3. Try to generate same type again for same student/year
4. **Expected:** Error: "Certificate already exists"
5. **Expected:** No duplicate created
6. Check existing certificates list
7. **Expected:** Shows previously created certificate

#### 6. Public Verification - Valid Certificate

1. Copy verification code from generated certificate
2. Open `/verify` page in **incognito/new session** (no login)
3. Paste verification code
4. Click "Verify Certificate"
5. **Expected:** Green success alert
6. **Expected:** "Certificate is Valid" message
7. **Expected:** Certificate details displayed (type, issue date, school year)
8. **Expected:** Student name, LRN, grade shown
9. **Expected:** For honors: GPA and honors badge displayed
10. **Expected:** Verification timestamp shown

#### 7. Public Verification - Invalid Code

1. Go to `/verify` page
2. Enter fake code: `CERT-2024-FAKECODE`
3. Click verify
4. **Expected:** Red error alert
5. **Expected:** "Certificate is Invalid" message
6. **Expected:** Possible reasons listed
7. **Expected:** Contact information provided

#### 8. Public Verification - QR Code Scan

1. Generate certificate with QR code
2. Use phone camera to scan QR code
3. **Expected:** Browser opens `/verify?code=CERT-XXXX-XXXXXXXX`
4. **Expected:** Auto-verification triggered
5. **Expected:** Results displayed immediately (no manual input)

#### 9. Format Validation

1. Go to `/verify` page
2. Enter invalid formats:
   - `CERT-2024` (too short)
   - `2024-ABC123` (no CERT prefix)
   - `cert-2024-abc12345` (wrong case)
3. **Expected:** Error: "Invalid format. Expected: CERT-YYYY-XXXXXXXX"
4. Enter correct format: `CERT-2024-A1B2C3D4`
5. **Expected:** Format accepted, verification proceeds

#### 10. Multiple Certificate Types

1. Generate honors certificate for student
2. Generate good moral certificate for same student
3. Generate completion certificate for same student
4. **Expected:** All three succeed (different types allowed)
5. Check existing certificates list
6. **Expected:** All three shown with different types
7. Click "View" on each
8. **Expected:** Correct certificate displayed

#### 11. Certificate Revocation (Admin)

1. Login as admin
2. (Implementation note: Admin UI for revocation not yet built)
3. Use database or API to revoke certificate
4. Go to public verification page
5. Enter revoked certificate's code
6. **Expected:** "Certificate has been revoked" error
7. **Expected:** Revocation reason displayed

## File Structure

```
src/
├── composables/
│   └── useCertificates.ts         # Certificate business logic
├── components/
│   └── CertificateTemplate.vue    # Reusable certificate display
├── pages/
│   ├── verify.vue                 # Public verification (no auth)
│   └── teacher/
│       ├── classes/
│       │   └── [id]/
│       │       └── grades.vue     # Updated with certificate button
│       └── certificates/
│           └── [studentId]/
│               └── [schoolYearId].vue  # Certificate generator
```

## API Patterns

### Generate Certificate

```typescript
// Check finalization
const isFinalized = await checkFinalization(studentId, schoolYearId);
if (!isFinalized) throw new Error("Grades not finalized");

// Get GPA and honors
const { gpa, honors } = await getStudentGPA(studentId, schoolYearId);

// Validate honors eligibility
if (type === "honors" && !honors) {
  throw new Error("Student does not qualify");
}

// Generate verification code
const code = generateVerificationCode(yearCode); // CERT-2024-A1B2C3D4

// Create certificate record
await supabase.from("certificates").insert({
  student_id,
  certificate_type: type,
  school_year_id,
  issued_date: new Date().toISOString().split("T")[0],
  generated_by: userId,
  qr_code_url: code, // Store code in this field
});

// Log audit
await supabase.from("audit_logs").insert({
  action: `${type}_certificate_generated`,
  entity_type: "Certificate",
  entity_id: certificateId,
});
```

### Verify Certificate (Public)

```typescript
// Query by verification code
const { data: certificate } = await supabase
  .from("certificates")
  .select(
    `
    *,
    student:student_id (lrn, first_name, last_name, middle_name, grade_level, track, strand),
    school_year:school_year_id (year_code)
  `
  )
  .eq("qr_code_url", verificationCode)
  .single();

// Check revocation
if (certificate.is_revoked) {
  return { valid: false, error: `Revoked: ${certificate.revocation_reason}` };
}

// Get GPA (for honors certificates)
const { gpa, honors } = await getStudentGPA(
  certificate.student_id,
  certificate.school_year_id
);

// Return verification result
return {
  valid: true,
  certificate: {
    ...certificate,
    general_average: gpa,
    honors_designation: honors,
  },
};
```

## QR Code Generation

### Installation

```bash
npm install qrcode.vue
```

### Usage in Template

```vue
<qrcode-vue :value="verificationUrl" :size="120" level="H" render-as="svg" />
```

### URL Format

```typescript
const verificationUrl = `${window.location.origin}/verify?code=${certificate.qr_code_url}`;
// Result: https://smartgrade.example.com/verify?code=CERT-2024-A1B2C3D4
```

### Scanning Flow

1. User scans QR code with phone camera
2. Camera app detects URL
3. Browser opens link with code parameter
4. Verification page loads
5. `onMounted()` hook detects `route.query.code`
6. Auto-triggers verification
7. Results displayed

## Print Styling

### CSS @media print

```css
@media print {
  /* Hide UI controls */
  .no-print {
    display: none !important;
  }

  /* Remove box shadows */
  .certificate-card {
    box-shadow: none !important;
  }

  /* Professional borders */
  .certificate-border {
    page-break-inside: avoid;
    border: 8px double #1976d2;
  }

  /* Page setup */
  @page {
    size: letter portrait;
    margin: 0.5in;
  }
}
```

### Print Behavior

- **Print Button:** Calls `window.print()`
- **Download PDF:** Uses browser "Save as PDF" from print dialog
- **Hidden Elements:** Buttons, alerts, navigation
- **Preserved Elements:** Certificate content, QR code, signatures

## Security & Privacy

### Security Measures

- **Finalization Enforcement:** Cannot generate without locked grades
- **Duplicate Prevention:** One certificate per type per student per year
- **Verification Code Uniqueness:** 8-character random alphanumeric (62^8 combinations)
- **Revocation Support:** Admin can invalidate certificates
- **Audit Logging:** All generation and revocation events logged

### Privacy Considerations

- **Public Verification:** No sensitive data exposed
  - ✅ Shows: Name, LRN, grade level, GPA (honors only)
  - ❌ Hidden: Contact info, address, parent names, grades breakdown
- **No Login Required:** Anyone can verify authenticity (transparency)
- **QR Code Data:** Only contains verification URL (no PII in QR itself)

## Known Limitations

- **Student Selection:** Currently navigates to first student only (needs selector dialog)
- **Batch Generation:** No bulk certificate creation (one at a time)
- **PDF Storage:** Certificates not stored as PDFs (regenerated on demand)
- **Signature Automation:** Uses text signature lines (no e-signature)
- **Template Customization:** Header text hardcoded (should be in settings)
- **Admin Revocation UI:** Database-only revocation (no admin UI yet)
- **Certificate History:** No version tracking for regenerated certificates

## Next Steps (Future Enhancements)

- [ ] Student selector dialog for certificate generation
- [ ] Bulk certificate generation (all students at once)
- [ ] Admin UI for certificate revocation
- [ ] Store generated PDFs in Supabase Storage
- [ ] Digital signature integration (e-signature)
- [ ] Certificate templates in system settings
- [ ] Email certificates to students/parents
- [ ] Certificate redesign with school logo upload
- [ ] Multi-language support (English/Filipino)
- [ ] Certificate printing queue management
- [ ] Analytics: Certificates generated per period

## UI/UX Notes

- **Print-Optimized:** Official document formatting for professional appearance
- **Responsive Design:** Works on desktop/tablet (print is primary use case)
- **Loading States:** Clear spinners during certificate generation
- **Error Handling:** Specific validation messages for each failure case
- **Success Feedback:** Green alerts and certificate preview
- **Public Access:** Verification page works without login (accessibility)
- **Mobile QR Scanning:** QR codes optimized for phone camera detection

## Honors GPA Thresholds

| GPA Range  | Honors Designation  | Certificate Eligibility         | Color Code  |
| ---------- | ------------------- | ------------------------------- | ----------- |
| 98 - 100   | With Highest Honors | Yes                             | Purple      |
| 95 - 97.99 | With High Honors    | Yes                             | Deep Purple |
| 90 - 94.99 | With Honors         | Yes                             | Indigo      |
| 85 - 89.99 | None                | No (good moral/completion only) | Blue        |
| 75 - 84.99 | None                | No (good moral/completion only) | Green       |
| < 75       | None                | No (good moral/completion only) | Grey        |

## Certificate Workflow Summary

1. **Teacher finalizes grades** → GPA calculated
2. **Teacher navigates to grades page** → "Generate Certificates" button appears
3. **Teacher clicks certificate button** → Opens certificate generator
4. **System displays student info** → Shows GPA, honors status, existing certificates
5. **Teacher selects certificate type** → Honors (if qualified), good moral, or completion
6. **System validates eligibility** → Checks finalization, GPA, duplicates
7. **Certificate generated** → Record created, verification code assigned
8. **Certificate displayed** → Print-ready template with QR code
9. **Teacher prints/downloads** → Browser print to PDF
10. **Public verification available** → Anyone can verify via code or QR scan
