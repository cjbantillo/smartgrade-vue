<template>
  <div class="pa-6">
    <v-card>
      <v-card-title>Grade Entry & Management</v-card-title>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate />

        <v-alert
          v-if="error"
          type="error"
          closable
          class="mb-4"
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Class Selection -->
        <v-select
          v-model="selectedClassId"
          label="Select Class"
          :items="classes"
          item-title="subject_name"
          item-value="id"
          @update:model-value="loadClassGrades"
        />

        <div v-if="selectedClassId" class="mt-6">
          <!-- Grade Entry Table -->
          <v-data-table
            :headers="headers"
            :items="grades"
            items-per-page="10"
            hover
          >
            <template #item.student_name="{ item }">
              {{ item.student_first_name }} {{ item.student_last_name }}
            </template>

            <template #item.written_work_score="{ item }">
              <v-text-field
                :model-value="item.written_work_score"
                type="number"
                min="0"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateScore(item.id, 'written_work', (e.target as any).value, item.written_work_total)"
              />
            </template>

            <template #item.written_work_total="{ item }">
              <v-text-field
                :model-value="item.written_work_total"
                type="number"
                min="0"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateScore(item.id, 'written_work', item.written_work_score, (e.target as any).value)"
              />
            </template>

            <template #item.performance_task_score="{ item }">
              <v-text-field
                :model-value="item.performance_task_score"
                type="number"
                min="0"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateScore(item.id, 'performance_task', (e.target as any).value, item.performance_task_total)"
              />
            </template>

            <template #item.performance_task_total="{ item }">
              <v-text-field
                :model-value="item.performance_task_total"
                type="number"
                min="0"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateScore(item.id, 'performance_task', item.performance_task_score, (e.target as any).value)"
              />
            </template>

            <template #item.quarterly_assessment_score="{ item }">
              <v-text-field
                :model-value="item.quarterly_assessment_score"
                type="number"
                min="0"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateScore(item.id, 'quarterly_assessment', (e.target as any).value, item.quarterly_assessment_total)"
              />
            </template>

            <template #item.quarterly_assessment_total="{ item }">
              <v-text-field
                :model-value="item.quarterly_assessment_total"
                type="number"
                min="0"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateScore(item.id, 'quarterly_assessment', item.quarterly_assessment_score, (e.target as any).value)"
              />
            </template>

            <template #item.quarterly_grade="{ item }">
              <strong>{{
                item.quarterly_grade ? item.quarterly_grade.toFixed(2) : "N/A"
              }}</strong>
            </template>

            <template #item.final_grade="{ item }">
              <v-text-field
                :model-value="item.final_grade"
                type="number"
                min="0"
                max="100"
                size="small"
                class="ma-0 pa-0"
                @blur="(e) => updateFinalGrade(item.id, (e.target as any).value)"
              />
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                :loading="deleting === item.id"
                @click="handleDeleteGrade(item.id)"
              />
            </template>
          </v-data-table>

          <!-- Action Buttons -->
          <div class="d-flex gap-2 justify-end mt-6">
            <v-btn color="warning" @click="openUnlockRequest">
              <v-icon start>mdi-lock-open</v-icon>
              Request Unlock
            </v-btn>
            <v-btn
              color="success"
              :loading="finalizing"
              @click="handleFinalizeGrades"
            >
              <v-icon start>mdi-check</v-icon>
              Finalize Grades
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Unlock Request Dialog -->
    <v-dialog v-model="unlockDialog" max-width="500">
      <v-card>
        <v-card-title>Request Grade Unlock</v-card-title>

        <v-card-text>
          <p class="mb-4">
            You can request to unlock finalized grades if you discover errors
            that need correction.
          </p>

          <v-text-field
            v-model="unlockReason"
            label="Reason for Unlock Request"
            type="textarea"
            rows="4"
            required
            hint="Provide detailed explanation of the error or correction needed"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="unlockDialog = false">Cancel</v-btn>
          <v-btn
            color="warning"
            :loading="submittingUnlock"
            @click="handleSubmitUnlockRequest"
          >
            Submit Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useGrades, type GradeEntry } from "@/composables/useGrades";
import { useTeacher } from "@/composables/useTeacher";

const gradesComposable = useGrades();
const teacherComposable = useTeacher();

const classes = ref<any[]>([]);
const selectedClassId = ref("");
const grades = ref<GradeEntry[]>([]);
const loading = ref(false);
const finalizing = ref(false);
const deleting = ref<string | null>(null);
const unlockDialog = ref(false);
const unlockReason = ref("");
const submittingUnlock = ref(false);

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const headers = [
  { title: "Student Name", key: "student_name" },
  { title: "WW Score", key: "written_work_score" },
  { title: "WW Total", key: "written_work_total" },
  { title: "PT Score", key: "performance_task_score" },
  { title: "PT Total", key: "performance_task_total" },
  { title: "QA Score", key: "quarterly_assessment_score" },
  { title: "QA Total", key: "quarterly_assessment_total" },
  { title: "Quarterly Grade", key: "quarterly_grade" },
  { title: "Final Grade", key: "final_grade" },
  { title: "Actions", key: "actions" },
];

const loadClasses = async () => {
  classes.value = await teacherComposable.fetchTeacherClasses();
};

const loadClassGrades = async () => {
  if (!selectedClassId.value) return;
  grades.value = await gradesComposable.fetchClassGrades(selectedClassId.value);
};

const updateScore = async (
  gradeId: string,
  component: "written_work" | "performance_task" | "quarterly_assessment",
  score: number | string,
  total: number | string
) => {
  const success = await gradesComposable.updateGradeComponent(
    gradeId,
    component,
    Number(score) || 0,
    Number(total) || 0
  );

  if (success) {
    // Recalculate quarterly grade
    const grade = grades.value.find((g) => g.id === gradeId);
    if (grade) {
      grade.quarterly_grade = gradesComposable.computeQuarterlyGrade(
        grade.written_work_score,
        grade.written_work_total,
        grade.performance_task_score,
        grade.performance_task_total,
        grade.quarterly_assessment_score,
        grade.quarterly_assessment_total
      );
    }

    snackbar.value = {
      show: true,
      message: "Score updated",
      color: "success",
    };
  } else {
    snackbar.value = {
      show: true,
      message: gradesComposable.error.value || "Failed to update score",
      color: "error",
    };
  }
};

const updateFinalGrade = async (
  gradeId: string,
  finalGrade: number | string
) => {
  // Save final grade
  const grade = grades.value.find((g) => g.id === gradeId);
  if (grade) {
    grade.quarterly_grade = Number(finalGrade) || null;
    const success = await gradesComposable.saveGrade(grade);

    if (success) {
      snackbar.value = {
        show: true,
        message: "Final grade saved",
        color: "success",
      };
    }
  }
};

const handleDeleteGrade = async (gradeId: string) => {
  deleting.value = gradeId;
  const success = await gradesComposable.deleteGrade(gradeId);
  deleting.value = null;

  if (success) {
    grades.value = grades.value.filter((g) => g.id !== gradeId);
    snackbar.value = {
      show: true,
      message: "Grade deleted",
      color: "success",
    };
  } else {
    snackbar.value = {
      show: true,
      message: gradesComposable.error.value || "Failed to delete grade",
      color: "error",
    };
  }
};

const handleFinalizeGrades = async () => {
  finalizing.value = true;
  try {
    const success = await gradesComposable.finalizeClassGrades(
      selectedClassId.value,
      grades.value
    );

    if (success) {
      snackbar.value = {
        show: true,
        message: "Grades finalized successfully",
        color: "success",
      };
      await loadClassGrades();
    } else {
      snackbar.value = {
        show: true,
        message: gradesComposable.error.value || "Failed to finalize grades",
        color: "error",
      };
    }
  } finally {
    finalizing.value = false;
  }
};

const openUnlockRequest = () => {
  unlockDialog.value = true;
  unlockReason.value = "";
};

const handleSubmitUnlockRequest = async () => {
  if (!unlockReason.value.trim()) {
    snackbar.value = {
      show: true,
      message: "Please provide a reason for the unlock request",
      color: "warning",
    };
    return;
  }

  submittingUnlock.value = true;
  try {
    // Get first student from grades to determine school year
    const firstGrade = grades.value[0];
    if (!firstGrade) {
      snackbar.value = {
        show: true,
        message: "No grades to unlock",
        color: "warning",
      };
      return;
    }

    const requestId = await gradesComposable.requestGradeUnlock(
      firstGrade.student_id,
      firstGrade.school_year_id,
      "1",
      unlockReason.value
    );

    if (requestId) {
      snackbar.value = {
        show: true,
        message: "Unlock request submitted. Admin will review shortly.",
        color: "success",
      };
      unlockDialog.value = false;
      unlockReason.value = "";
    } else {
      snackbar.value = {
        show: true,
        message: gradesComposable.error.value || "Failed to submit request",
        color: "error",
      };
    }
  } finally {
    submittingUnlock.value = false;
  }
};

// Load initial data
loadClasses();
</script>
