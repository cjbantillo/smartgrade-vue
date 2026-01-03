<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <v-card elevation="4" color="primary" class="mb-6">
          <v-card-text class="pa-6">
            <div class="d-flex align-center">
              <v-avatar size="64" color="white" class="mr-4">
                <v-icon size="36" color="primary">mdi-account-school</v-icon>
              </v-avatar>
              <div>
                <h1 class="text-h4 font-weight-bold white--text">
                  Welcome, {{ studentName }}!
                </h1>
                <p class="text-subtitle-1 white--text opacity-80">
                  LRN: {{ studentLRN }} | {{ currentSchoolYear }}
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-clipboard-text</v-icon>
            My Final Grades
            <v-spacer />
            <v-select
              v-model="selectedSemester"
              :items="semesters"
              item-title="name"
              item-value="id"
              density="compact"
              hide-details
              style="max-width: 180px"
              @update:model-value="fetchGrades"
            />
          </v-card-title>

          <v-card-text class="pa-0">
            <v-table v-if="grades.length" density="comfortable">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th class="text-center">Final Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in grades" :key="grade.subject">
                  <td class="font-weight-medium">{{ grade.subject }}</td>
                  <td class="text-center text-h6">{{ grade.final_grade }}</td>
                  <td>
                    <v-chip
                      :color="grade.final_grade >= 75 ? 'success' : 'error'"
                      size="small"
                      label
                    >
                      {{ grade.final_grade >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-4">
                  <td class="font-weight-bold">General Weighted Average</td>
                  <td class="text-center text-h6 font-weight-bold">
                    {{ gwaFormatted }}
                  </td>
                  <td>
                    <v-chip
                      :color="gwa >= 75 ? 'success' : 'warning'"
                      size="small"
                      label
                    >
                      {{
                        gwa >= 90
                          ? "With Honors"
                          : gwa >= 75
                          ? "Passed"
                          : "Needs Improvement"
                      }}
                    </v-chip>
                  </td>
                </tr>
              </tfoot>
            </v-table>

            <v-alert v-else type="info" variant="tonal" class="ma-4">
              No grades available for this semester.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="4" class="mb-4">
          <v-card-title>
            <v-icon color="success" class="mr-2">mdi-file-document</v-icon>
            My SF9
          </v-card-title>
          <v-card-text>
            <div v-if="latestSF9" class="text-center">
              <v-icon size="64" color="primary" class="mb-2"
                >mdi-file-document-check</v-icon
              >
              <p class="text-body-1 mb-2">Version {{ latestSF9.version }}</p>
              <p class="text-caption text-grey mb-4">
                Generated: {{ latestSF9.generated_at }}
              </p>
              <v-btn
                color="primary"
                block
                prepend-icon="mdi-eye"
                @click="viewSF9"
              >
                View SF9
              </v-btn>
            </div>
            <div v-else class="text-center text-grey py-4">
              <v-icon size="48" color="grey" class="mb-2"
                >mdi-file-document-outline</v-icon
              >
              <p>No SF9 available yet</p>
            </div>
          </v-card-text>
        </v-card>

        <v-card elevation="4">
          <v-card-title>Academic Summary</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-grey">Subjects Enrolled</span>
              <span class="text-h6 font-weight-bold">{{ grades.length }}</span>
            </div>
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-grey">Subjects Passed</span>
              <span class="text-h6 font-weight-bold text-success">{{
                passedCount
              }}</span>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span class="text-grey">Current GWA</span>
              <span class="text-h6 font-weight-bold">{{ gwa }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- SF9 Viewer Dialog -->
    <v-dialog v-model="sf9Dialog" max-width="900" scrollable>
      <v-card>
        <v-card-title
          class="d-flex align-center justify-space-between bg-primary"
        >
          <span class="white--text">SF9 - Report Card</span>
          <v-btn icon variant="text" color="white" @click="sf9Dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <div class="sf9-document pa-6">
            <!-- Watermark -->
            <div class="watermark">OFFICIAL COPY - STUDENT VIEW</div>

            <div class="text-center mb-4">
              <h2 class="text-h5 font-weight-bold">
                LEARNER'S PROGRESS REPORT CARD
              </h2>
              <p class="text-subtitle-1 text-grey">
                School Form 9 (SF9) - Senior High School
              </p>
            </div>

            <v-divider class="mb-4" />

            <v-row class="mb-4">
              <v-col cols="6">
                <p><strong>LRN:</strong> {{ studentLRN }}</p>
                <p><strong>Name:</strong> {{ studentName }}</p>
              </v-col>
              <v-col cols="6">
                <p><strong>Section:</strong> {{ sectionName }}</p>
                <p><strong>School Year:</strong> {{ currentSchoolYear }}</p>
              </v-col>
            </v-row>

            <v-table density="compact" class="mb-4">
              <thead>
                <tr class="bg-primary">
                  <th class="white--text">Subject</th>
                  <th class="white--text text-center">Final Grade</th>
                  <th class="white--text">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in grades" :key="grade.subject">
                  <td>{{ grade.subject }}</td>
                  <td class="text-center font-weight-bold">
                    {{ grade.final_grade }}
                  </td>
                  <td>{{ grade.final_grade >= 75 ? "Passed" : "Failed" }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-3">
                  <td class="font-weight-bold">General Weighted Average</td>
                  <td class="text-center font-weight-bold">{{ gwa }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </v-table>

            <div class="text-caption text-grey text-right">
              Document Version: {{ latestSF9?.version || 1 }} | Generated:
              {{ latestSF9?.generated_at || "N/A" }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="sf9Dialog = false">Close</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadSF9"
          >
            Download PDF
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

interface Grade {
  subject: string;
  final_grade: number;
}

interface SF9 {
  version: number;
  generated_at: string;
}

const studentName = ref("");
const studentLRN = ref("");
const sectionName = ref("");
const currentSchoolYear = ref("2025-2026");

const semesters = ref([
  { id: 1, name: "1st Semester" },
  { id: 2, name: "2nd Semester" },
]);
const selectedSemester = ref(1);

const grades = ref<Grade[]>([]);
const latestSF9 = ref<SF9 | null>(null);
const sf9Dialog = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const gwa = computed(() => {
  if (!grades.value.length) return 0;
  const sum = grades.value.reduce((acc, g) => acc + g.final_grade, 0);
  return sum / grades.value.length;
});

const gwaFormatted = computed(() => gwa.value.toFixed(2));

const passedCount = computed(
  () => grades.value.filter((g) => g.final_grade >= 75).length
);

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function fetchStudentInfo() {
  const { data: studentData } = await supabase
    .from("students")
    .select("id, lrn, first_name, last_name")
    .eq("user_id", authStore.user?.id)
    .single();

  if (studentData) {
    studentName.value = `${studentData.first_name} ${studentData.last_name}`;
    studentLRN.value = studentData.lrn;

    // Get latest SF9
    const { data: docData } = await supabase
      .from("documents")
      .select("version, created_at")
      .eq("student_id", studentData.id)
      .eq("document_type", "SF9")
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (docData) {
      latestSF9.value = {
        version: docData.version,
        generated_at: new Date(docData.created_at).toLocaleDateString(),
      };
    }
  }
}

async function fetchGrades() {
  // Mock data for demonstration
  grades.value = [
    { subject: "Oral Communication", final_grade: 88 },
    { subject: "Reading and Writing", final_grade: 85 },
    { subject: "Komunikasyon at Pananaliksik", final_grade: 90 },
    { subject: "General Mathematics", final_grade: 82 },
    { subject: "Earth and Life Science", final_grade: 87 },
    { subject: "Personal Development", final_grade: 92 },
    { subject: "Physical Education and Health", final_grade: 95 },
    { subject: "21st Century Literature", final_grade: 89 },
  ];
}

function viewSF9() {
  sf9Dialog.value = true;
}

function downloadSF9() {
  notify("Downloading watermarked PDF...", "info");
  // In production, this would generate actual PDF with watermark
}

onMounted(async () => {
  await fetchStudentInfo();
  await fetchGrades();
});
</script>

<style scoped>
.sf9-document {
  position: relative;
  background: white;
  min-height: 500px;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 48px;
  color: rgba(0, 0, 0, 0.08);
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
  font-weight: bold;
}

.opacity-80 {
  opacity: 0.8;
}
</style>
