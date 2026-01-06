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
        <div class="text-body-1 mt-4">Loading SF9...</div>
      </v-col>
    </v-row>

    <!-- SF9 Available - Show Watermarked PDF -->
    <v-row v-else-if="sf9Available && watermarkedPdfUrl">
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon start color="primary">mdi-file-pdf-box</v-icon>
            SF9 Report Card - {{ studentInfo.name }}
            <v-spacer />
            <v-chip color="info" variant="tonal" size="small" class="mr-2">
              Version {{ documentInfo.version }}
            </v-chip>
            <v-chip color="success" variant="tonal" size="small">
              {{ documentInfo.generatedDate }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-0">
            <!-- PDF Embed with Watermark -->
            <div class="pdf-container">
              <iframe
                :src="watermarkedPdfUrl"
                width="100%"
                height="700"
                style="border: none"
              />
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 bg-grey-lighten-4">
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="flex-grow-1 mr-4"
            >
              This document contains an official watermark for student viewing.
            </v-alert>
            <v-btn
              color="primary"
              prepend-icon="mdi-download"
              @click="downloadWatermarkedPDF"
              :loading="downloading"
            >
              Download PDF
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- SF9 Preview Only (No Document Generated Yet) -->
    <v-row v-else-if="hasGrades">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal" class="mb-4">
          <v-alert-title>Preview Mode</v-alert-title>
          Your official SF9 document has not been generated yet. Below is a
          preview based on your current grades. Please contact your adviser to
          generate your official SF9.
        </v-alert>

        <v-card elevation="4">
          <v-card-text class="pa-0">
            <div class="sf9-preview pa-8">
              <!-- Watermark -->
              <div class="watermark">PREVIEW ONLY - NOT OFFICIAL</div>

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
            </div>
          </v-card-text>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

const authStore = useAuthStore();

interface Grade {
  subject: string;
  sem1: number | null;
  sem2: number | null;
  final: number | null;
}

const loading = ref(true);
const downloading = ref(false);
const sf9Available = ref(false);
const hasGrades = ref(false);
const studentId = ref<number | null>(null);
const documentFilePath = ref<string | null>(null);
const watermarkedPdfUrl = ref<string | null>(null);
const watermarkedPdfBlob = ref<Blob | null>(null);

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
      address: data.address || "",
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

  // Check if SF9 document exists (only active ones for student view)
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
    documentFilePath.value = doc.file_path;
    return true;
  }

  return false;
}

async function loadGrades() {
  if (!studentId.value) return;

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

  grades.value = Object.entries(subjectGrades).map(([subject, g]) => ({
    subject,
    sem1: g.sem1,
    sem2: g.sem2,
    final:
      g.sem1 !== null && g.sem2 !== null
        ? Math.round((g.sem1 + g.sem2) / 2)
        : g.sem1 ?? g.sem2,
  }));

  hasGrades.value = grades.value.length > 0;
}

async function addWatermarkToPdf(pdfBytes: ArrayBuffer): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Draw diagonal watermark text
    page.drawText("Official Copy – Student View", {
      x: width / 2 - 150,
      y: height / 2,
      size: 40,
      font,
      color: rgb(0.7, 0.7, 0.7),
      rotate: degrees(45),
      opacity: 0.35,
    });

    // Add secondary watermarks
    page.drawText("Official Copy – Student View", {
      x: width / 2 - 150,
      y: height / 2 + 200,
      size: 30,
      font,
      color: rgb(0.8, 0.8, 0.8),
      rotate: degrees(45),
      opacity: 0.25,
    });

    page.drawText("Official Copy – Student View", {
      x: width / 2 - 150,
      y: height / 2 - 200,
      size: 30,
      font,
      color: rgb(0.8, 0.8, 0.8),
      rotate: degrees(45),
      opacity: 0.25,
    });

    // Add footer with student info
    page.drawText(
      `Student: ${studentInfo.value.name} | LRN: ${studentInfo.value.lrn}`,
      {
        x: 50,
        y: 15,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.8,
      }
    );
  }

  const watermarkedBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(watermarkedBytes)], {
    type: "application/pdf",
  });
}

async function loadWatermarkedPdf() {
  if (!documentFilePath.value) return;

  try {
    // Download original PDF from storage
    const { data, error } = await supabase.storage
      .from("documents")
      .download(documentFilePath.value);

    if (error || !data) {
      console.error("Error downloading PDF:", error);
      notify("Failed to load SF9 document", "error");
      return;
    }

    // Add watermark using pdf-lib
    const pdfBytes = await data.arrayBuffer();
    const watermarkedBlob = await addWatermarkToPdf(pdfBytes);

    watermarkedPdfBlob.value = watermarkedBlob;
    watermarkedPdfUrl.value = URL.createObjectURL(watermarkedBlob);
  } catch (error) {
    console.error("Error processing PDF:", error);
    notify("Failed to process SF9 document", "error");
  }
}

function downloadWatermarkedPDF() {
  if (!watermarkedPdfBlob.value) {
    notify("No PDF available to download", "warning");
    return;
  }

  downloading.value = true;

  const url = URL.createObjectURL(watermarkedPdfBlob.value);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SF9_${studentInfo.value.lrn}_official_copy.pdf`;
  a.click();
  URL.revokeObjectURL(url);

  notify("Watermarked PDF downloaded successfully", "success");
  downloading.value = false;
}

async function fetchSF9Data() {
  loading.value = true;

  try {
    await loadSchoolInfo();
    const hasStudent = await loadStudentInfo();

    if (hasStudent) {
      const hasSF9 = await loadSF9Document();
      await loadGrades();

      if (hasSF9 && documentFilePath.value) {
        // Load and watermark the PDF for display
        await loadWatermarkedPdf();
        sf9Available.value = true;
      }
    }
  } catch (error) {
    console.error("Error loading SF9 data:", error);
    notify("Failed to load SF9 data", "error");
  }

  loading.value = false;
}

onMounted(fetchSF9Data);

onUnmounted(() => {
  // Cleanup blob URL
  if (watermarkedPdfUrl.value) {
    URL.revokeObjectURL(watermarkedPdfUrl.value);
  }
});
</script>

<style scoped>
.pdf-container {
  background: #f5f5f5;
  min-height: 700px;
}

.sf9-preview {
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
  .v-card-actions,
  .v-alert {
    display: none !important;
  }
}
</style>
