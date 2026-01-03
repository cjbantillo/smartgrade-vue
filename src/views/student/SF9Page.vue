<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My SF9 Report Card</h1>
        <p class="text-grey mb-6">View your official DepEd School Form 9</p>
      </v-col>
    </v-row>

    <v-row v-if="sf9Available">
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-text class="pa-0">
            <div class="sf9-container pa-8">
              <!-- Watermark -->
              <div class="watermark">OFFICIAL COPY - STUDENT VIEW</div>

              <!-- Header -->
              <div class="text-center mb-6">
                <v-avatar size="80" color="primary" class="mb-2">
                  <v-icon size="48" color="white">mdi-school</v-icon>
                </v-avatar>
                <h2 class="text-h5 font-weight-bold">{{ schoolName }}</h2>
                <p class="text-subtitle-2 text-grey">{{ schoolAddress }}</p>
                <v-divider class="my-4" />
                <h3 class="text-h6 font-weight-bold text-primary">
                  LEARNER'S PROGRESS REPORT CARD
                </h3>
                <p class="text-body-2">
                  School Form 9 (SF9) - Senior High School
                </p>
              </div>

              <!-- Student Info -->
              <v-row class="mb-6">
                <v-col cols="12" md="6">
                  <v-table density="compact">
                    <tbody>
                      <tr>
                        <td class="text-grey" style="width: 120px">LRN</td>
                        <td class="font-weight-bold">{{ studentInfo.lrn }}</td>
                      </tr>
                      <tr>
                        <td class="text-grey">Name</td>
                        <td class="font-weight-bold">{{ studentInfo.name }}</td>
                      </tr>
                      <tr>
                        <td class="text-grey">Gender</td>
                        <td>{{ studentInfo.gender }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
                <v-col cols="12" md="6">
                  <v-table density="compact">
                    <tbody>
                      <tr>
                        <td class="text-grey" style="width: 120px">
                          Grade Level
                        </td>
                        <td class="font-weight-bold">
                          {{ studentInfo.grade_level }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-grey">Section</td>
                        <td class="font-weight-bold">
                          {{ studentInfo.section }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-grey">School Year</td>
                        <td>{{ studentInfo.school_year }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
              </v-row>

              <!-- Grades Table -->
              <v-table density="comfortable" class="grades-table mb-6">
                <thead>
                  <tr class="bg-primary">
                    <th class="white--text">Learning Areas</th>
                    <th class="white--text text-center">1st Sem</th>
                    <th class="white--text text-center">2nd Sem</th>
                    <th class="white--text text-center">Final Grade</th>
                    <th class="white--text text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="grade in grades" :key="grade.subject">
                    <td>{{ grade.subject }}</td>
                    <td class="text-center">{{ grade.sem1 }}</td>
                    <td class="text-center">{{ grade.sem2 }}</td>
                    <td class="text-center font-weight-bold">
                      {{ grade.final }}
                    </td>
                    <td class="text-center">
                      <span
                        :class="
                          grade.final >= 75 ? 'text-success' : 'text-error'
                        "
                      >
                        {{ grade.final >= 75 ? "PASSED" : "FAILED" }}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-grey-lighten-3">
                    <td class="font-weight-bold">General Average</td>
                    <td class="text-center font-weight-bold">
                      {{ sem1Average }}
                    </td>
                    <td class="text-center font-weight-bold">
                      {{ sem2Average }}
                    </td>
                    <td
                      class="text-center font-weight-bold text-primary text-h6"
                    >
                      {{ finalAverage }}
                    </td>
                    <td class="text-center">
                      <span class="text-success font-weight-bold">
                        {{
                          Number(finalAverage) >= 75 ? "PROMOTED" : "RETAINED"
                        }}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </v-table>

              <!-- Signatures -->
              <v-row class="mt-8">
                <v-col cols="4" class="text-center">
                  <v-divider class="mb-1" />
                  <p class="text-caption font-weight-bold">Class Adviser</p>
                </v-col>
                <v-col cols="4" class="text-center">
                  <v-divider class="mb-1" />
                  <p class="text-caption font-weight-bold">Parent/Guardian</p>
                </v-col>
                <v-col cols="4" class="text-center">
                  <v-divider class="mb-1" />
                  <p class="text-caption font-weight-bold">
                    {{ principalName }}
                  </p>
                  <p class="text-caption text-grey">School Principal</p>
                </v-col>
              </v-row>

              <!-- Footer -->
              <div class="text-caption text-grey text-center mt-6">
                <p>
                  This is an official document. Any erasure or alteration
                  renders it invalid.
                </p>
                <p>
                  Document Version: {{ documentVersion }} | Generated:
                  {{ generatedDate }}
                </p>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 bg-grey-lighten-4">
            <v-spacer />
            <v-btn
              variant="outlined"
              prepend-icon="mdi-printer"
              @click="printSF9"
            >
              Print
            </v-btn>
            <v-btn
              color="primary"
              prepend-icon="mdi-download"
              @click="downloadSF9"
            >
              Download PDF
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-card elevation="4" class="text-center pa-8">
          <v-icon size="80" color="grey" class="mb-4"
            >mdi-file-document-outline</v-icon
          >
          <h2 class="text-h5 font-weight-bold mb-2">No SF9 Available</h2>
          <p class="text-grey">
            Your SF9 has not been generated yet. Please contact your adviser.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface Grade {
  subject: string;
  sem1: number;
  sem2: number;
  final: number;
}

const sf9Available = ref(true);
const schoolName = ref("SmartGrade Academy");
const schoolAddress = ref("123 Education Street, Manila, Philippines");
const principalName = ref("Dr. Maria Santos");
const documentVersion = ref(1);
const generatedDate = ref(new Date().toLocaleDateString());

const studentInfo = ref({
  lrn: "123456789012",
  name: "Juan Dela Cruz",
  gender: "Male",
  grade_level: "Grade 11",
  section: "STEM-A",
  school_year: "2025-2026",
});

const grades = ref<Grade[]>([]);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("info");

const sem1Average = computed(() => {
  if (!grades.value.length) return 0;
  const sum = grades.value.reduce((acc, g) => acc + g.sem1, 0);
  return (sum / grades.value.length).toFixed(0);
});

const sem2Average = computed(() => {
  if (!grades.value.length) return 0;
  const sum = grades.value.reduce((acc, g) => acc + g.sem2, 0);
  return (sum / grades.value.length).toFixed(0);
});

const finalAverage = computed(() => {
  if (!grades.value.length) return "0";
  const sum = grades.value.reduce((acc, g) => acc + g.final, 0);
  return (sum / grades.value.length).toFixed(2);
});

function notify(message: string, color = "info") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

function fetchSF9Data() {
  // Mock data
  grades.value = [
    { subject: "Oral Communication", sem1: 88, sem2: 90, final: 89 },
    { subject: "Reading and Writing Skills", sem1: 85, sem2: 87, final: 86 },
    { subject: "Komunikasyon at Pananaliksik", sem1: 90, sem2: 92, final: 91 },
    { subject: "General Mathematics", sem1: 82, sem2: 85, final: 84 },
    { subject: "Earth and Life Science", sem1: 87, sem2: 88, final: 88 },
    { subject: "Personal Development", sem1: 92, sem2: 94, final: 93 },
    { subject: "Physical Education and Health", sem1: 95, sem2: 96, final: 96 },
    { subject: "21st Century Literature", sem1: 89, sem2: 91, final: 90 },
  ];
}

function printSF9() {
  window.print();
}

function downloadSF9() {
  notify("Downloading watermarked PDF...");
  // In production, this would generate actual PDF with watermark
}

onMounted(fetchSF9Data);
</script>

<style scoped>
.sf9-container {
  position: relative;
  background: white;
  max-width: 800px;
  margin: 0 auto;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 42px;
  color: rgba(0, 0, 0, 0.06);
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
  font-weight: bold;
  letter-spacing: 4px;
}

.grades-table {
  border: 1px solid #e0e0e0;
}

@media print {
  .v-card-actions {
    display: none !important;
  }
}
</style>
