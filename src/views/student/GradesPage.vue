<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My Grades</h1>
        <p class="text-grey mb-6">View your final grades for all subjects</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSemester"
          :items="semesters"
          item-title="name"
          item-value="semester_id"
          label="Select Semester"
          variant="outlined"
          density="comfortable"
          @update:model-value="fetchGrades"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-text class="pa-0">
            <v-table density="comfortable" v-if="grades.length">
              <thead>
                <tr class="bg-primary">
                  <th class="text-white">Subject Code</th>
                  <th class="text-white">Subject Name</th>
                  <th class="text-white text-center">Units</th>
                  <th class="text-white text-center">Final Grade</th>
                  <th class="text-white">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in grades" :key="grade.enrollment_id">
                  <td class="text-grey">{{ grade.subject_code }}</td>
                  <td class="font-weight-medium">{{ grade.subject_name }}</td>
                  <td class="text-center">{{ grade.units }}</td>
                  <td class="text-center">
                    <span class="text-h6 font-weight-bold">{{
                      grade.final_grade ?? "N/A"
                    }}</span>
                  </td>
                  <td>
                    <v-chip
                      :color="
                        (grade.final_grade ?? 0) >= 75 ? 'success' : 'error'
                      "
                      size="small"
                      label
                    >
                      {{ (grade.final_grade ?? 0) >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-3">
                  <td colspan="2" class="font-weight-bold">
                    General Weighted Average
                  </td>
                  <td class="text-center font-weight-bold">{{ totalUnits }}</td>
                  <td class="text-center">
                    <span class="text-h5 font-weight-bold text-primary">{{
                      gwa
                    }}</span>
                  </td>
                  <td>
                    <v-chip
                      :color="
                        Number(gwa) >= 90
                          ? 'warning'
                          : Number(gwa) >= 75
                          ? 'success'
                          : 'error'
                      "
                      size="small"
                      label
                    >
                      {{
                        Number(gwa) >= 90
                          ? "With Honors"
                          : Number(gwa) >= 75
                          ? "Passed"
                          : "Failed"
                      }}
                    </v-chip>
                  </td>
                </tr>
              </tfoot>
            </v-table>
            <div v-else class="text-center py-8 text-grey">
              <v-icon size="48" color="grey" class="mb-2"
                >mdi-clipboard-text-outline</v-icon
              >
              <div>No grades available for this semester.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title>Grade Legend</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td>90-100</td>
                  <td>
                    <v-chip color="warning" size="x-small">With Honors</v-chip>
                  </td>
                </tr>
                <tr>
                  <td>75-89</td>
                  <td>
                    <v-chip color="success" size="x-small">Passed</v-chip>
                  </td>
                </tr>
                <tr>
                  <td>Below 75</td>
                  <td><v-chip color="error" size="x-small">Failed</v-chip></td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title>Performance Summary</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <span>Highest Grade:</span>
              <strong class="text-success">{{ highestGrade || "N/A" }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span>Lowest Grade:</span>
              <strong class="text-warning">{{ lowestGrade || "N/A" }}</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span>Subjects Failed:</span>
              <strong
                :class="failedCount > 0 ? 'text-error' : 'text-success'"
                >{{ failedCount }}</strong
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const authStore = useAuthStore();

interface Grade {
  enrollment_id: number;
  subject_code: string;
  subject_name: string;
  units: number;
  final_grade: number | null;
}

interface Semester {
  semester_id: number;
  name: string;
}

const semesters = ref<Semester[]>([]);
const selectedSemester = ref<number | null>(null);
const grades = ref<Grade[]>([]);
const studentId = ref<number | null>(null);

const totalUnits = computed(() =>
  grades.value.reduce((sum, g) => sum + g.units, 0)
);

const gwa = computed(() => {
  const validGrades = grades.value.filter((g) => g.final_grade !== null);
  if (!validGrades.length) return "0.00";
  const totalWeighted = validGrades.reduce(
    (sum, g) => sum + (g.final_grade ?? 0) * g.units,
    0
  );
  const totalValidUnits = validGrades.reduce((sum, g) => sum + g.units, 0);
  return (totalWeighted / totalValidUnits).toFixed(2);
});

const highestGrade = computed(() => {
  const validGrades = grades.value.filter((g) => g.final_grade !== null);
  if (!validGrades.length) return 0;
  return Math.max(...validGrades.map((g) => g.final_grade ?? 0));
});

const lowestGrade = computed(() => {
  const validGrades = grades.value.filter((g) => g.final_grade !== null);
  if (!validGrades.length) return 0;
  return Math.min(...validGrades.map((g) => g.final_grade ?? 0));
});

const failedCount = computed(
  () =>
    grades.value.filter(
      (g) => (g.final_grade ?? 0) < 75 && g.final_grade !== null
    ).length
);

async function loadSemesters() {
  const { data } = await supabase
    .from("semesters")
    .select("semester_id, name")
    .order("semester_id");

  semesters.value = data || [];
  if (semesters.value.length > 0 && semesters.value[0]) {
    selectedSemester.value = semesters.value[0].semester_id;
  }
}

async function loadStudentId() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  const { data: student } = await supabase
    .from("students")
    .select("student_id")
    .eq("user_id", userId)
    .single();

  if (student) {
    studentId.value = student.student_id;
  }
}

async function fetchGrades() {
  if (!studentId.value || !selectedSemester.value) return;

  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      enrollment_id,
      section_subjects(
        subjects(subject_code, subject_name, units)
      ),
      grades(final_grade)
    `
    )
    .eq("student_id", studentId.value)
    .eq("semester_id", selectedSemester.value);

  if (data) {
    grades.value = data.map((e: any) => {
      const subject = e.section_subjects?.subjects;
      const gradeData = e.grades?.[0];

      return {
        enrollment_id: e.enrollment_id,
        subject_code: subject?.subject_code || "N/A",
        subject_name: subject?.subject_name || "Unknown Subject",
        units: subject?.units || 0,
        final_grade: gradeData?.final_grade ?? null,
      };
    });
  } else {
    grades.value = [];
  }
}

onMounted(async () => {
  await loadStudentId();
  await loadSemesters();
  await fetchGrades();
});
</script>
