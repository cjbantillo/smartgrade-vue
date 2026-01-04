<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My SF9 Report Card</h1>
        <p class="text-grey mb-6">View your official DepEd School Form 9</p>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="48" />
        <div class="text-body-1 mt-4">Loading SF9 data...</div>
      </v-col>
    </v-row>

    <!-- SF9 Available -->
    <v-row v-else-if="sf9Available">
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-text class="pa-0">
            <div class="sf9-container pa-8">
              <!-- Watermark -->
              <div class="watermark">OFFICIAL COPY - STUDENT VIEW</div>

              <!-- Header -->
              <div class="text-center mb-6">
                <v-avatar size="80" color="grey-lighten-3" class="mb-2">
                  <v-img v-if="schoolInfo.logo" :src="schoolInfo.logo" />
                  <v-icon v-else size="48" color="primary">mdi-school</v-icon>
                </v-avatar>
                <h2 class="text-h5 font-weight-bold">{{ schoolInfo.name }}</h2>
                <p class="text-subtitle-2 text-grey">
                  {{ schoolInfo.address }}
                </p>
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
                        <td>{{ studentInfo.gender || "N/A" }}</td>
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
                    <th class="text-white">Learning Areas</th>
                    <th class="text-white text-center">1st Sem</th>
                    <th class="text-white text-center">2nd Sem</th>
                    <th class="text-white text-center">Final Grade</th>
                    <th class="text-white text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="grade in grades" :key="grade.subject">
                    <td>{{ grade.subject }}</td>
                    <td class="text-center">{{ grade.sem1 ?? "N/A" }}</td>
                    <td class="text-center">{{ grade.sem2 ?? "N/A" }}</td>
                    <td class="text-center font-weight-bold">
                      {{ grade.final ?? "N/A" }}
                    </td>
                    <td class="text-center">
                      <span
                        :class="
                          (grade.final ?? 0) >= 75
                            ? 'text-success'
                            : 'text-error'
                        "
                      >
                        {{ (grade.final ?? 0) >= 75 ? "PASSED" : "FAILED" }}
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
                    {{ schoolInfo.principal }}
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
                  Document Version: {{ documentInfo.version }} | Generated:
                  {{ documentInfo.generatedDate }}
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

    <!-- No SF9 Available -->
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
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const authStore = useAuthStore();

interface Grade {
  subject: string;
  sem1: number | null;
  sem2: number | null;
  final: number | null;
}

const loading = ref(true);
const sf9Available = ref(false);
const studentId = ref<number | null>(null);

const schoolInfo = ref({
  name: "",
  address: "",
  principal: "",
  logo: "",
});

const studentInfo = ref({
  lrn: "",
  name: "",
  gender: "",
  grade_level: "Grade 11",
  section: "",
  school_year: "",
});

const documentInfo = ref({
  version: 1,
  generatedDate: "",
});

const grades = ref<Grade[]>([]);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("info");

const sem1Average = computed(() => {
  const validGrades = grades.value.filter((g) => g.sem1 !== null);
  if (!validGrades.length) return "N/A";
  const sum = validGrades.reduce((acc, g) => acc + (g.sem1 ?? 0), 0);
  return (sum / validGrades.length).toFixed(0);
});

const sem2Average = computed(() => {
  const validGrades = grades.value.filter((g) => g.sem2 !== null);
  if (!validGrades.length) return "N/A";
  const sum = validGrades.reduce((acc, g) => acc + (g.sem2 ?? 0), 0);
  return (sum / validGrades.length).toFixed(0);
});

const finalAverage = computed(() => {
  const validGrades = grades.value.filter((g) => g.final !== null);
  if (!validGrades.length) return "0";
  const sum = validGrades.reduce((acc, g) => acc + (g.final ?? 0), 0);
  return (sum / validGrades.length).toFixed(2);
});

function notify(message: string, color = "info") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function loadSchoolInfo() {
  const { data } = await supabase.from("schools").select("*").limit(1).single();

  if (data) {
    schoolInfo.value = {
      name: data.school_name || "School Name",
      address: data.school_address || "",
      principal: data.principal_name || "Principal",
      logo: data.logo_path
        ? supabase.storage.from("logos").getPublicUrl(data.logo_path).data
            .publicUrl
        : "",
    };
  }
}

async function loadStudentInfo() {
  const userId = authStore.user?.user_id;
  if (!userId) return false;

  const { data: student } = await supabase
    .from("students")
    .select(
      `
      student_id, lrn, first_name, last_name, gender,
      enrollments(
        section_subjects(
          sections(name, school_years(year_label))
        )
      )
    `
    )
    .eq("user_id", userId)
    .single();

  if (!student) return false;

  studentId.value = student.student_id;

  // Get section info from first enrollment
  const enrollment = (student.enrollments as any[])?.[0];
  const section = enrollment?.section_subjects?.sections;

  studentInfo.value = {
    lrn: student.lrn || "",
    name: `${student.first_name} ${student.last_name}`,
    gender: student.gender || "",
    grade_level: "Grade 11",
    section: section?.name || "",
    school_year: section?.school_years?.year_label || "",
  };

  return true;
}

async function loadSF9Document() {
  if (!studentId.value) return false;

  // Check if SF9 document exists
  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("student_id", studentId.value)
    .eq("document_type", "SF9")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (doc) {
    documentInfo.value = {
      version: doc.version || 1,
      generatedDate: new Date(doc.created_at).toLocaleDateString(),
    };
    return true;
  }

  return false;
}

async function loadGrades() {
  if (!studentId.value) return;

  // Get all enrollments with grades grouped by subject
  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      semester_id,
      section_subjects(subjects(subject_name)),
      grades(final_grade)
    `
    )
    .eq("student_id", studentId.value);

  if (!data) return;

  // Group grades by subject
  const subjectGrades: Record<
    string,
    { sem1: number | null; sem2: number | null }
  > = {};

  data.forEach((e: any) => {
    const subjectName = e.section_subjects?.subjects?.subject_name || "Unknown";
    const grade = e.grades?.[0]?.final_grade ?? null;
    const semesterId = e.semester_id;

    if (!subjectGrades[subjectName]) {
      subjectGrades[subjectName] = { sem1: null, sem2: null };
    }

    if (semesterId === 1) {
      subjectGrades[subjectName].sem1 = grade;
    } else if (semesterId === 2) {
      subjectGrades[subjectName].sem2 = grade;
    }
  });

  // Convert to grades array
  grades.value = Object.entries(subjectGrades).map(([subject, g]) => ({
    subject,
    sem1: g.sem1,
    sem2: g.sem2,
    final:
      g.sem1 !== null && g.sem2 !== null
        ? Math.round((g.sem1 + g.sem2) / 2)
        : g.sem1 ?? g.sem2,
  }));
}

function printSF9() {
  window.print();
}

function downloadSF9() {
  notify("Downloading watermarked PDF...");
  // TODO: Implement PDF generation with watermark
}

async function fetchSF9Data() {
  loading.value = true;

  try {
    await loadSchoolInfo();
    const hasStudent = await loadStudentInfo();

    if (hasStudent) {
      const hasSF9 = await loadSF9Document();
      await loadGrades();

      // Show SF9 if document exists OR if student has grades
      sf9Available.value = hasSF9 || grades.value.length > 0;

      if (!hasSF9 && grades.value.length > 0) {
        documentInfo.value = {
          version: 0,
          generatedDate: "Preview Only - Not Yet Generated",
        };
      }
    }
  } catch (error) {
    console.error("Error loading SF9 data:", error);
  }

  loading.value = false;
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
