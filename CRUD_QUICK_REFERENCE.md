# SmartGrade CRUD Quick Reference

## File Locations

### Composables (Business Logic)

```
src/composables/
├── useAdmin.ts                 # Admin: Teachers, unlocks, settings
├── useTeacher.ts               # Teachers: Classes, students, enrollment
├── useGrades.ts                # Grades: Entry, finalization, unlock
├── useCRUDDocuments.ts         # Documents: SF9, SF10, Certificates
├── useProfileSettings.ts       # Profiles: Users, students, school settings
├── useAuth.ts                  # Authentication (existing)
├── useCertificates.ts          # Certificates (existing)
└── useDocuments.ts             # Documents (existing)
```

### Pages (UI Components)

#### Admin Pages

```
src/pages/admin/
├── index.vue                   # Admin dashboard
├── teachers.vue                # Teacher management
├── unlock-requests.vue         # Grade unlock requests
├── settings.vue                # System settings
└── audit-logs.vue              # Audit trail
```

#### Teacher Pages

```
src/pages/teacher/
├── index.vue                   # Teacher dashboard
├── classes-management.vue      # Class CRUD
├── student-enrollment.vue      # Enrollment CRUD
├── grades-management.vue       # Grade entry & management
├── classes.vue                 # Class list (existing)
├── certificates.vue            # Certificate generation (existing)
└── classes/                    # Class detail pages
```

---

## Quick CRUD Reference

### Admin Operations

#### Approve/Reject Teachers

```typescript
import { useAdmin } from "@/composables/useAdmin";
const { approveTeacher, rejectTeacher } = useAdmin();

await approveTeacher(teacherId); // ✓ Approve
await rejectTeacher(teacherId, "reason"); // ✗ Reject
```

#### Manage Unlock Requests

```typescript
const { fetchUnlockRequests, approveUnlockRequest, rejectUnlockRequest } =
  useAdmin();

const requests = await fetchUnlockRequests("pending");
await approveUnlockRequest(requestId, "notes");
await rejectUnlockRequest(requestId, "notes");
```

#### Manage System Settings

```typescript
const { fetchSystemSettings, createSystemSettings, updateSystemSettings } = useAdmin()

const settings = await fetchSystemSettings()
const created = await createSystemSettings({...})
const updated = await updateSystemSettings({...})
```

---

### Teacher Operations

#### Class CRUD

```typescript
import { useTeacher } from "@/composables/useTeacher";
const {
  fetchTeacherClasses,
  createClass,
  updateClass,
  deleteClass,
  fetchClassStudents,
} = useTeacher();

// Create
const cls = await createClass({
  subject_id: "subj-123",
  section: "Einstein",
  school_year_id: "sy-123",
  grading_period: 1,
});

// Read
const classes = await fetchTeacherClasses();
const students = await fetchClassStudents(classId);

// Update
const updated = await updateClass(classId, {
  section: "Newton",
  grading_period: 2,
});

// Delete
const success = await deleteClass(classId);
```

#### Student Enrollment

```typescript
const { searchStudents, enrollStudent, unenrollStudent } = useTeacher();

// Search
const results = await searchStudents("john");

// Create enrollment
const success = await enrollStudent(classId, studentId);

// Delete enrollment
const success = await unenrollStudent(enrollmentId);
```

---

### Grade Operations

#### Grade Entry

```typescript
import { useGrades } from "@/composables/useGrades";
const {
  fetchClassGrades,
  updateGradeComponent,
  saveGrade,
  deleteGrade,
  computeQuarterlyGrade,
} = useGrades();

// Read grades
const grades = await fetchClassGrades(classId);

// Update component score
const success = await updateGradeComponent(
  gradeId,
  "written_work", // 'written_work' | 'performance_task' | 'quarterly_assessment'
  45, // score
  50 // total
);

// Save full grade
const success = await saveGrade(gradeEntry);

// Delete grade
const success = await deleteGrade(gradeId);

// Compute quarterly
const qGrade = computeQuarterlyGrade(
  wwScore,
  wwTotal,
  ptScore,
  ptTotal,
  qaScore,
  qaTotal,
  systemSettings
);
```

#### Grade Finalization

```typescript
const {
  finalizeGrades,
  finalizeClassGrades,
  computeStudentGPA,
  requestGradeUnlock,
  checkGradeFinalization,
} = useGrades();

// Finalize single student
const success = await finalizeGrades(studentId, schoolYearId, "1");

// Finalize all class grades
const success = await finalizeClassGrades(classId, gradeEntries);

// Compute GPA
const gpa = await computeStudentGPA(studentId, schoolYearId);

// Request unlock
const requestId = await requestGradeUnlock(
  studentId,
  schoolYearId,
  "1",
  "Calculation error"
);

// Check if locked
const isLocked = await checkGradeFinalization(studentId, schoolYearId, "1");
```

---

### Document Operations

```typescript
import { useDocuments } from '@/composables/useCRUDDocuments'
const {
  createSF9Document,
  updateSF9Document,
  deleteSF9Document,
  createSF10Document,
  updateSF10Document,
  deleteSF10Document,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  fetchStudentSF9s,
  fetchStudentSF10s,
  fetchStudentCertificates
} = useDocuments()

// SF9 (Report Card)
const sf9 = await createSF9Document(studentId, schoolYearId, '1', {...})
const updated = await updateSF9Document(sf9Id, {...})
const success = await deleteSF9Document(sf9Id)
const sf9s = await fetchStudentSF9s(studentId)

// SF10 (Permanent Record)
const sf10 = await createSF10Document(studentId, schoolYearId, {...})
const updated = await updateSF10Document(sf10Id, {...})
const success = await deleteSF10Document(sf10Id)
const sf10s = await fetchStudentSF10s(studentId)

// Certificates
const cert = await createCertificate(
  studentId,
  schoolYearId,
  'highest_honors',  // 'honors' | 'high_honors' | 'highest_honors' | 'good_moral'
  {...}
)
const updated = await updateCertificate(certId, {...})
const success = await deleteCertificate(certId)
const certs = await fetchStudentCertificates(studentId)
```

---

### Profile & Settings Operations

```typescript
import { useProfileSettings } from '@/composables/useProfileSettings'
const {
  fetchCurrentProfile,
  updateProfile,
  changePassword,
  fetchUserProfile,
  fetchStudentProfile,
  updateStudentProfile,
  fetchSchoolSettings,
  createSchoolSettings,
  updateSchoolSettings,
  fetchAllUsers,
  fetchAllStudents,
  searchUsers,
  searchStudents
} = useProfileSettings()

// User Profile
const profile = await fetchCurrentProfile()
const updated = await updateProfile({...})
const success = await changePassword('newPassword')

// Student Profile
const student = await fetchStudentProfile(studentId)
const updated = await updateStudentProfile(studentId, {...})

// School Settings
const settings = await fetchSchoolSettings()
const created = await createSchoolSettings({...})
const updated = await updateSchoolSettings({...})

// Search & Fetch
const users = await fetchAllUsers('teacher')
const students = await fetchAllStudents(11)  // Grade level
const userResults = await searchUsers('john')
const studentResults = await searchStudents('12345')
```

---

## Common Patterns

### Loading & Error Handling

```typescript
const { loading, error } = useComposable()

// In template
<v-progress-linear v-if="loading" indeterminate />
<v-alert v-if="error" type="error" closable @click:close="error = null" />
```

### Snackbar Feedback

```typescript
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

// Usage
snackbar.value = {
  show: true,
  message: "Operation successful",
  color: "success", // or 'error', 'warning', 'info'
};
```

### Dialog Management

```typescript
const dialog = ref(false);
const saving = ref(false);

const handleSave = async () => {
  saving.value = true;
  try {
    const success = await operation();
    if (success) {
      dialog.value = false;
      // Refresh data
    }
  } finally {
    saving.value = false;
  }
};
```

### Search Implementation

```typescript
const searchQuery = ref("");
const searchResults = ref([]);

const handleSearch = async (query: string) => {
  if (!query || query.trim().length < 2) {
    searchResults.value = [];
    return;
  }
  searchResults.value = await searchFunction(query);
};
```

---

## State Management

### Composable State Pattern

```typescript
const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<ItemType[]>([]);
const selectedItem = ref<ItemType | null>(null);
const dialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
```

### Vuex/Pinia Integration

Auth store is already configured:

```typescript
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
// Access: authStore.user, authStore.profile, authStore.role
```

---

## Validation Rules

### Email Validation

```typescript
// Must be @deped.gov.ph
const isValidEmail = (email: string) => email.endsWith("@deped.gov.ph");
```

### Grade Percentages

```typescript
// Must sum to 100%
const validPercentages = (ww: number, pt: number, qa: number) => {
  return ww + pt + qa === 100;
};
```

### Grade Components

```typescript
// Score must be between 0 and total
const validScore = (score: number, total: number) => {
  return score >= 0 && total > 0 && score <= total;
};
```

### GPA Thresholds

```typescript
// Certificate eligibility
const isHonors = (gpa: number) => gpa >= 90;
const isHighHonors = (gpa: number) => gpa >= 95;
const isHighestHonors = (gpa: number) => gpa >= 98;
```

---

## Debugging Tips

### Console Logging

```typescript
// In composables
console.error("Operation failed:", err);
console.log("Fetched data:", data);

// In components
console.log("Current state:", {
  loading: loading.value,
  error: error.value,
  items: items.value,
});
```

### Inspect Supabase Responses

```typescript
const { data, error: fetchError } = await supabase.from("table").select();
if (fetchError) {
  console.error("Supabase error:", {
    code: fetchError.code,
    message: fetchError.message,
    details: fetchError.details,
  });
}
```

### Test Audit Logs

```typescript
// Check that operations are logged
const logs = await adminComposable.fetchAuditLogs({
  user_id: authStore.profile?.user_id,
  limit: 10,
});
console.log("Recent operations:", logs);
```

---

## Common Issues & Solutions

### Issue: "Cannot modify finalized grades"

**Solution:** Check finalization status before allowing edits

```typescript
const isLocked = await checkGradeFinalization(
  studentId,
  schoolYearId,
  semester
);
if (isLocked) {
  // Show "Request unlock" button instead of edit
}
```

### Issue: "Permission denied" on updates

**Solution:** Verify role and teacher ownership

```typescript
// Ensure logged-in as teacher
if (authStore.profile?.role !== "teacher") throw new Error("Access denied");

// Ensure class belongs to teacher
const cls = await fetchTeacherClasses();
if (!cls.find((c) => c.id === classId)) throw new Error("Not your class");
```

### Issue: "Cannot delete class with enrolled students"

**Solution:** Unenroll students first

```typescript
const students = await fetchClassStudents(classId);
if (students.length > 0) {
  // Show message: "Please unenroll all students first"
}
```

### Issue: Stale data after operations

**Solution:** Reload data after successful operations

```typescript
if (success) {
  await loadData(); // Refresh
}
```

---

## Next Steps

1. **Testing:** Run comprehensive CRUD tests on each page
2. **Integration:** Test role-based access control flows
3. **Documentation:** Generate API documentation from composables
4. **Performance:** Optimize queries for large datasets
5. **Error Messages:** Refine user-facing error messages
6. **Accessibility:** Ensure WCAG compliance for all forms

---

## Support

For issues or questions:

- Check `CRUD_IMPLEMENTATION_GUIDE.md` for detailed documentation
- Review composable method signatures
- Check Supabase console for RLS policy errors
- Verify user roles and permissions in `profiles` table
