<route lang="yaml">
meta:
  layout: teacher
</route>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="$router.push(`/teacher/classes/${classId}`)"
          class="mb-2"
        >
          Back to Class
        </v-btn>
        <h1 class="text-h4">Grade Entry</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          {{ classInfo?.subject_code }} - {{ classInfo?.section }} • Quarter
          {{ classInfo?.grading_period }}
        </p>
      </v-col>
    </v-row>

    <!-- Lock Status Alert -->
    <v-alert
      v-if="isFinalized"
      type="warning"
      variant="tonal"
      class="mb-4"
      prominent
    >
      <v-row align="center">
        <v-col>
          <div class="d-flex align-center">
            <v-icon size="large" class="mr-2">mdi-lock</v-icon>
            <div>
              <strong>Grades are finalized and locked</strong>
              <p class="text-caption mt-1">
                These grades cannot be modified. Contact admin to request unlock
                if corrections are needed.
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-alert>

    <!-- Grade Entry Instructions -->
    <v-card class="mb-4" v-if="!isFinalized">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon color="info" class="mr-2">mdi-information</v-icon>
          <div>
            <strong>DepEd Grading Formula:</strong>
            Written Work (30%) + Performance Task (50%) + Quarterly Assessment
            (20%) = Quarterly Grade
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Grade Entry Table -->
    <v-card>
      <v-card-title class="bg-primary text-white">
        <div class="d-flex align-center justify-space-between">
          <span>
            <v-icon class="mr-2">mdi-table-edit</v-icon>
            Student Grades
          </span>
          <v-chip v-if="isFinalized" color="warning" prepend-icon="mdi-lock">
            Finalized
          </v-chip>
          <v-chip v-else color="success" prepend-icon="mdi-pencil">
            Editable
          </v-chip>
        </div>
      </v-card-title>

      <v-card-text
        v-if="grades.length === 0 && !loading"
        class="text-center pa-8"
      >
        <v-icon size="80" color="grey-lighten-1"
          >mdi-account-off-outline</v-icon
        >
        <h3 class="text-h6 mt-4 mb-2">No Students Enrolled</h3>
        <p class="text-grey-darken-1">
          Enroll students first before entering grades.
        </p>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          class="mt-4"
          @click="$router.push(`/teacher/classes/${classId}`)"
        >
          Manage Enrollments
        </v-btn>
      </v-card-text>

      <div v-if="grades.length > 0" class="table-responsive">
        <table class="grade-table">
          <thead>
            <tr>
              <th rowspan="2" class="sticky-col">#</th>
              <th rowspan="2" class="sticky-col name-col">Student Name</th>
              <th rowspan="2">LRN</th>
              <th colspan="2" class="text-center bg-blue-lighten-4">
                Written Work (30%)
              </th>
              <th colspan="2" class="text-center bg-green-lighten-4">
                Performance Task (50%)
              </th>
              <th colspan="2" class="text-center bg-orange-lighten-4">
                Quarterly Assessment (20%)
              </th>
              <th rowspan="2" class="text-center">Quarterly Grade</th>
              <th rowspan="2" class="text-center">Actions</th>
            </tr>
            <tr>
              <th class="text-center bg-blue-lighten-5">Score</th>
              <th class="text-center bg-blue-lighten-5">Total</th>
              <th class="text-center bg-green-lighten-5">Score</th>
              <th class="text-center bg-green-lighten-5">Total</th>
              <th class="text-center bg-orange-lighten-5">Score</th>
              <th class="text-center bg-orange-lighten-5">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(grade, index) in grades" :key="grade.student_id">
              <td class="sticky-col">{{ index + 1 }}</td>
              <td class="sticky-col name-col">
                {{ grade.student_last_name }}, {{ grade.student_first_name }}
                {{
                  grade.student_middle_name
                    ? grade.student_middle_name.charAt(0) + "."
                    : ""
                }}
              </td>
              <td>{{ grade.student_lrn }}</td>

              <!-- Written Work -->
              <td>
                <input
                  type="number"
                  v-model.number="grade.written_work_score"
                  :disabled="isFinalized"
                  class="grade-input"
                  min="0"
                  step="0.01"
                  @blur="handleGradeChange(grade)"
                />
              </td>
              <td>
                <input
                  type="number"
                  v-model.number="grade.written_work_total"
                  :disabled="isFinalized"
                  class="grade-input"
                  min="0"
                  step="0.01"
                  @blur="handleGradeChange(grade)"
                />
              </td>

              <!-- Performance Task -->
              <td>
                <input
                  type="number"
                  v-model.number="grade.performance_task_score"
                  :disabled="isFinalized"
                  class="grade-input"
                  min="0"
                  step="0.01"
                  @blur="handleGradeChange(grade)"
                />
              </td>
              <td>
                <input
                  type="number"
                  v-model.number="grade.performance_task_total"
                  :disabled="isFinalized"
                  class="grade-input"
                  min="0"
                  step="0.01"
                  @blur="handleGradeChange(grade)"
                />
              </td>

              <!-- Quarterly Assessment -->
              <td>
                <input
                  type="number"
                  v-model.number="grade.quarterly_assessment_score"
                  :disabled="isFinalized"
                  class="grade-input"
                  min="0"
                  step="0.01"
                  @blur="handleGradeChange(grade)"
                />
              </td>
              <td>
                <input
                  type="number"
                  v-model.number="grade.quarterly_assessment_total"
                  :disabled="isFinalized"
                  class="grade-input"
                  min="0"
                  step="0.01"
                  @blur="handleGradeChange(grade)"
                />
              </td>

              <!-- Quarterly Grade (Computed) -->
              <td class="text-center">
                <v-chip
                  v-if="grade.quarterly_grade !== null"
                  :color="getGradeColor(grade.quarterly_grade)"
                  size="small"
                >
                  {{ grade.quarterly_grade }}
                </v-chip>
                <span v-else class="text-grey">-</span>
              </td>

              <!-- Actions -->
              <td class="text-center">
                <v-btn
                  size="small"
                  color="success"
                  variant="text"
                  icon="mdi-calculator"
                  :disabled="isFinalized"
                  @click="computeGrade(grade)"
                  title="Compute Grade"
                />
                <v-btn
                  size="small"
                  color="primary"
                  variant="text"
                  icon="mdi-content-save"
                  :disabled="isFinalized"
                  @click="saveStudentGrade(grade)"
                  :loading="savingGrades.has(grade.student_id)"
                  title="Save Grade"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="primary" />
    </v-card>

    <!-- Actions -->
    <v-row class="mt-4" v-if="grades.length > 0 && !isFinalized">
      <v-col class="d-flex justify-space-between">
        <v-btn
          color="info"
          prepend-icon="mdi-calculator-variant"
          @click="computeAllGrades"
          :disabled="loading"
        >
          Compute All Grades
        </v-btn>

        <div class="d-flex gap-2">
          <v-btn
            color="warning"
            prepend-icon="mdi-content-save-all"
            @click="saveAllGrades"
            :loading="loading"
          >
            Save All Changes
          </v-btn>

          <v-btn
            color="error"
            prepend-icon="mdi-lock"
            @click="finalizeDialog = true"
            :disabled="!canFinalize"
          >
            Finalize Grades
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Document Generation (After Finalization) -->
    <v-row class="mt-4" v-if="grades.length > 0 && isFinalized">
      <v-col>
        <v-card>
          <v-card-title class="bg-success text-white">
            <v-icon class="mr-2">mdi-file-document-multiple</v-icon>
            Generate Official Documents
          </v-card-title>
          <v-card-text class="pt-4">
            <p class="mb-4">
              Grades are finalized. You can now generate official documents for
              each student:
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <v-btn
                color="primary"
                prepend-icon="mdi-file-document"
                @click="generateSF9Documents"
              >
                Generate SF9 (Report Cards)
              </v-btn>
              <v-btn
                color="secondary"
                prepend-icon="mdi-folder-open"
                @click="generateSF10Documents"
              >
                Generate SF10 (Permanent Records)
              </v-btn>
              <v-btn
                color="purple"
                prepend-icon="mdi-certificate"
                @click="generateCertificates"
              >
                Generate Certificates
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      class="mt-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSuccess" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <!-- Finalization Confirmation Dialog -->
    <v-dialog v-model="finalizeDialog" max-width="600">
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon class="mr-2">mdi-lock-alert</v-icon>
          Finalize Grades - Confirm Action
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert type="warning" variant="tonal" class="mb-4">
            <strong>This action will lock all grades for this class!</strong>
          </v-alert>

          <p class="mb-2">You are about to finalize grades for:</p>
          <ul class="mb-4">
            <li>
              <strong>Class:</strong> {{ classInfo?.subject_code }} -
              {{ classInfo?.section }}
            </li>
            <li><strong>Students:</strong> {{ grades.length }}</li>
            <li>
              <strong>Grading Period:</strong> Quarter
              {{ classInfo?.grading_period }}
            </li>
          </ul>

          <p class="mb-2"><strong>After finalization:</strong></p>
          <ul>
            <li>✅ Grades will be visible to students</li>
            <li>✅ Documents (SF9/SF10) can be generated</li>
            <li>❌ You cannot edit grades without admin unlock</li>
            <li>❌ All changes will be permanently logged</li>
          </ul>

          <v-alert type="info" variant="tonal" class="mt-4">
            <strong>Incomplete Grades:</strong> {{ incompleteCount }} student(s)
            <p v-if="incompleteCount > 0" class="text-caption mt-1">
              You cannot finalize until all students have complete grades.
            </p>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="finalizeDialog = false"
            :disabled="loading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="handleFinalize"
            :loading="loading"
            :disabled="incompleteCount > 0"
          >
            Confirm & Finalize
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGrades, type GradeEntry } from "@/composables/useGrades";
import { useTeacher } from "@/composables/useTeacher";

const route = useRoute();
const router = useRouter();
const {
  loading,
  error,
  fetchClassGrades,
  saveGrade,
  computeQuarterlyGrade,
  finalizeClassGrades,
  fetchSystemSettings,
} = useGrades();

const { fetchTeacherClasses } = useTeacher();

const classId = ref(route.params.id as string);
const classInfo = ref<any>(null);
const grades = ref<GradeEntry[]>([]);
const isFinalized = ref(false);
const finalizeDialog = ref(false);
const showSuccess = ref(false);
const successMessage = ref("");
const savingGrades = ref(new Set<string>());
const systemSettings = ref<any>(null);

const incompleteCount = computed(() => {
  return grades.value.filter((g) => g.quarterly_grade === null).length;
});

const canFinalize = computed(() => {
  return grades.value.length > 0 && incompleteCount.value === 0;
});

async function loadData() {
  // Get class info
  const classes = await fetchTeacherClasses();
  classInfo.value = classes.find((c) => c.id === classId.value);

  if (!classInfo.value) {
    error.value = "Class not found or access denied";
    return;
  }

  // Load grades
  grades.value = await fetchClassGrades(classId.value);

  // Load system settings
  systemSettings.value = await fetchSystemSettings();

  // Check if grades are finalized for first student (assumption: all same status)
  if (grades.value.length > 0 && grades.value[0].school_year_id) {
    const { checkGradeFinalization } = useGrades();
    isFinalized.value = await checkGradeFinalization(
      grades.value[0].student_id,
      grades.value[0].school_year_id,
      "1" // TODO: Determine semester from grading period
    );
  }
}

function computeGrade(grade: GradeEntry) {
  const computed = computeQuarterlyGrade(
    grade.written_work_score,
    grade.written_work_total,
    grade.performance_task_score,
    grade.performance_task_total,
    grade.quarterly_assessment_score,
    grade.quarterly_assessment_total,
    systemSettings.value
  );

  if (computed !== null) {
    grade.quarterly_grade = computed;
    grade.remarks =
      computed >= (systemSettings.value?.passing_grade || 75)
        ? "PASSED"
        : "FAILED";
  }
}

function computeAllGrades() {
  grades.value.forEach((grade) => {
    computeGrade(grade);
  });
  successMessage.value = "All grades computed successfully";
  showSuccess.value = true;
}

async function handleGradeChange(grade: GradeEntry) {
  // Auto-compute when all fields are filled
  if (
    grade.written_work_score !== null &&
    grade.written_work_total !== null &&
    grade.performance_task_score !== null &&
    grade.performance_task_total !== null &&
    grade.quarterly_assessment_score !== null &&
    grade.quarterly_assessment_total !== null
  ) {
    computeGrade(grade);
  }
}

async function saveStudentGrade(grade: GradeEntry) {
  savingGrades.value.add(grade.student_id);

  const success = await saveGrade(grade);

  savingGrades.value.delete(grade.student_id);

  if (success) {
    successMessage.value = "Grade saved successfully";
    showSuccess.value = true;
  }
}

async function saveAllGrades() {
  for (const grade of grades.value) {
    await saveGrade(grade);
  }

  successMessage.value = `All grades saved (${grades.value.length} students)`;
  showSuccess.value = true;

  // Reload to get IDs
  await loadData();
}

async function handleFinalize() {
  const success = await finalizeClassGrades(classId.value, grades.value);

  if (success) {
    finalizeDialog.value = false;
    successMessage.value = "Grades finalized and locked successfully!";
    showSuccess.value = true;
    isFinalized.value = true;

    setTimeout(() => {
      router.push(`/teacher/classes/${classId.value}`);
    }, 2000);
  }
}

function getGradeColor(grade: number): string {
  const passing = systemSettings.value?.passing_grade || 75;

  if (grade >= 90) return "success";
  if (grade >= passing) return "info";
  return "error";
}

function generateSF9Documents() {
  // Open SF9 generator for first student as example
  // In production, this would show a student selector dialog
  if (grades.value.length > 0 && classInfo.value) {
    const firstStudent = grades.value[0];
    router.push(
      `/teacher/documents/sf9/${firstStudent.student_id}/${classInfo.value.school_year_id}`
    );
  }
}

function generateSF10Documents() {
  // Open SF10 generator for first student as example
  // In production, this would show a student selector dialog
  if (grades.value.length > 0) {
    const firstStudent = grades.value[0];
    router.push(`/teacher/documents/sf10/${firstStudent.student_id}`);
  }
}

function generateCertificates() {
  // Open certificate generator for first student as example
  // In production, this would show a student selector dialog
  if (grades.value.length > 0) {
    const firstStudent = grades.value[0];
    router.push(
      `/teacher/certificates/${firstStudent.student_id}/${classInfo.value.school_year_id}`
    );
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.grade-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.grade-table th,
.grade-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: left;
}

.grade-table thead th {
  background-color: #f5f5f5;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.grade-table .sticky-col {
  position: sticky;
  left: 0;
  background-color: white;
  z-index: 5;
}

.grade-table thead .sticky-col {
  z-index: 15;
  background-color: #f5f5f5;
}

.grade-table .name-col {
  left: 40px;
  min-width: 200px;
}

.grade-input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}

.grade-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.grade-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.table-responsive {
  overflow-x: auto;
  max-height: calc(100vh - 400px);
}

.gap-2 {
  gap: 8px;
}
</style>
