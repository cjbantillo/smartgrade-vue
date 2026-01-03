<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">
          Welcome, {{ studentName }}!
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          View your grades and documents.
        </p>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card elevation="4" class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey-darken-1">
                {{ stat.title }}
              </div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
            </div>
            <v-avatar :color="stat.color" size="44" variant="tonal">
              <v-icon>{{ stat.icon }}</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card elevation="4">
          <v-card-title>My Grades</v-card-title>
          <v-card-text>
            <v-table v-if="grades.length">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Final Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in grades" :key="grade.enrollment_id">
                  <td>{{ grade.subject_name }}</td>
                  <td>{{ grade.final_grade ?? "N/A" }}</td>
                  <td>
                    <v-chip
                      :color="
                        (grade.final_grade ?? 0) >= 75 ? 'success' : 'error'
                      "
                      size="small"
                    >
                      {{ (grade.final_grade ?? 0) >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-6 text-grey">
              No grades available yet.
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="4">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text class="d-flex flex-column gap-2">
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-clipboard-text"
              to="/student/grades"
            >
              View All Grades
            </v-btn>
            <v-btn
              block
              color="secondary"
              prepend-icon="mdi-file-document"
              to="/student/sf9"
            >
              View SF9
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const authStore = useAuthStore();

interface Grade {
  enrollment_id: number;
  subject_name: string;
  final_grade: number | null;
}

const studentData = ref<{ first_name: string; last_name: string } | null>(null);
const grades = ref<Grade[]>([]);

const studentName = computed(() => {
  if (studentData.value) {
    return `${studentData.value.first_name} ${studentData.value.last_name}`;
  }
  return authStore.user?.email ?? "Student";
});

const stats = ref([
  {
    title: "Subjects",
    value: "0",
    icon: "mdi-book-open-variant",
    color: "primary",
  },
  { title: "GWA", value: "N/A", icon: "mdi-chart-line", color: "success" },
  { title: "Passed", value: "0", icon: "mdi-check-circle", color: "info" },
  {
    title: "Documents",
    value: "0",
    icon: "mdi-file-document",
    color: "warning",
  },
]);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  // Get student profile
  const { data: student } = await supabase
    .from("students")
    .select("student_id, first_name, last_name")
    .eq("user_id", userId)
    .single();

  if (!student) return;
  studentData.value = student;

  // Get enrollments with grades
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      enrollment_id,
      section_subjects(subjects(subject_name)),
      grades(final_grade)
    `
    )
    .eq("student_id", student.student_id);

  if (enrollments) {
    grades.value = enrollments.map((e) => {
      const sectionSubject = e.section_subjects as {
        subjects: { subject_name: string };
      } | null;
      const gradeData = e.grades as { final_grade: number }[] | null;

      return {
        enrollment_id: e.enrollment_id,
        subject_name: sectionSubject?.subjects?.subject_name ?? "Unknown",
        final_grade: gradeData?.[0]?.final_grade ?? null,
      };
    });
  }

  // Update stats
  stats.value[0].value = String(grades.value.length);

  const validGrades = grades.value.filter((g) => g.final_grade !== null);
  if (validGrades.length > 0) {
    const avg =
      validGrades.reduce((sum, g) => sum + (g.final_grade ?? 0), 0) /
      validGrades.length;
    stats.value[1].value = avg.toFixed(2);
  }

  const passed = grades.value.filter((g) => (g.final_grade ?? 0) >= 75).length;
  stats.value[2].value = String(passed);

  // Count documents
  const { count } = await supabase
    .from("documents")
    .select("document_id", { count: "exact", head: true })
    .eq("student_id", student.student_id)
    .eq("is_active", true);

  stats.value[3].value = String(count ?? 0);
}
</script>

<style scoped>
.pa-6 {
  padding: 24px !important;
}

.mb-2 {
  margin-bottom: 8px !important;
}

.text-grey-darken-1 {
  color: #616161 !important;
}

.text-h4 {
  font-size: 1.5rem !important;
}

.text-h5 {
  font-size: 1.25rem !important;
}

.text-caption {
  font-size: 0.75rem !important;
}

.v-card {
  border-radius: 8px;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-table {
  border-collapse: collapse;
  width: 100%;
}

.v-table th,
.v-table td {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
}

.v-table th {
  background-color: #f5f5f5;
  font-weight: 500;
}

.v-chip {
  font-size: 0.875rem;
}
</style>
