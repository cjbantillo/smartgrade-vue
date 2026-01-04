<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Document Center</h1>
        <p class="text-body-1 text-grey-darken-1">
          Generate and manage SF9 documents for your advisory section.
        </p>
      </v-col>
    </v-row>

    <!-- Section Selector -->
    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSection"
          :items="sections"
          item-title="name"
          item-value="section_id"
          label="Select Section"
          variant="outlined"
          prepend-inner-icon="mdi-account-group"
          :loading="loadingSections"
          @update:model-value="loadStudents"
        />
      </v-col>
      <v-col cols="12" md="8" class="d-flex align-center">
        <v-chip v-if="selectedSection" color="info" variant="tonal" class="mr-2">
          <v-icon start>mdi-account-multiple</v-icon>
          {{ students.length }} Students
        </v-chip>
        <v-chip v-if="selectedSection" color="success" variant="tonal">
          <v-icon start>mdi-file-document-check</v-icon>
          {{ students.filter(s => s.sf9_count > 0).length }} with SF9
        </v-chip>
      </v-col>
    </v-row>

    <!-- Students Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon start color="primary">mdi-file-document-multiple</v-icon>
            Student Documents
            <v-spacer />
            <v-btn
              v-if="selectedSection && students.length"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-file-document-plus"
              @click="generateAllSF9"
              :loading="generatingAll"
            >
              Generate All SF9
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              v-if="selectedSection"
              :headers="headers"
              :items="students"
              :loading="loadingStudents"
              :items-per-page="10"
              class="elevation-0"
            >
              <template v-slot:item.name="{ item }">
                <div>
                  <span class="font-weight-medium">{{ item.first_name }} {{ item.last_name }}</span>
                </div>
              </template>

              <template v-slot:item.sf9_count="{ item }">
                <v-chip
                  :color="item.sf9_count > 0 ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ item.sf9_count }} SF9{{ item.sf9_count !== 1 ? 's' : '' }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex ga-2">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-file-document-plus"
                    @click="generateSF9(item)"
                    :loading="item.generating"
                  >
                    Generate
                  </v-btn>
                  <v-btn
                    v-if="item.sf9_count > 0"
                    size="small"
                    color="info"
                    variant="tonal"
                    prepend-icon="mdi-eye"
                    @click="viewLatestSF9(item)"
                    :loading="item.viewing"
                  >
                    View
                  </v-btn>
                  <v-btn
                    v-if="item.sf9_count > 0"
                    size="small"
                    color="error"
                    variant="tonal"
                    prepend-icon="mdi-close-circle"
                    @click="openRevokeDialog(item)"
                  >
                    Revoke
                  </v-btn>
                </div>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-6 text-grey">
                  No students found in this section.
                </div>
              </template>
            </v-data-table>

            <div v-else class="text-center py-8 text-grey">
              <v-icon size="64" color="grey-lighten-1">mdi-school-outline</v-icon>
              <p class="mt-4 text-h6">Select a section to manage documents</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revoke Confirmation Dialog -->
    <v-dialog v-model="revokeDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon start>mdi-alert</v-icon>
          Revoke SF9 Document
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-1">
            Are you sure you want to revoke the latest SF9 document for:
          </p>
          <p class="text-h6 font-weight-bold mt-2" v-if="studentToRevoke">
            {{ studentToRevoke.first_name }} {{ studentToRevoke.last_name }}
          </p>
          <p class="text-body-2 text-grey mt-2">
            This action will mark the document as inactive. The student will no longer be able to view this SF9.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="revokeDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmRevoke"
            :loading="revoking"
          >
            Revoke Document
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

const authStore = useAuthStore();

interface Section {
  section_id: number;
  name: string;
}

interface Student {
  student_id: number;
  lrn: string;
  first_name: string;
  last_name: string;
  sf9_count: number;
  latest_document_id: number | null;
  generating?: boolean;
  viewing?: boolean;
}

interface SchoolInfo {
  school_name: string;
  address: string;
  principal_name: string;
  logo_path: string | null;
}

interface GradeData {
  subject: string;
  sem1: number | null;
  sem2: number | null;
  final: number | null;
}

const sections = ref<Section[]>([]);
const students = ref<Student[]>([]);
const selectedSection = ref<number | null>(null);
const teacherId = ref<number | null>(null);

const loadingSections = ref(false);
const loadingStudents = ref(false);
const generatingAll = ref(false);
const revoking = ref(false);

const revokeDialog = ref(false);
const studentToRevoke = ref<Student | null>(null);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const headers = [
  { title: "LRN", key: "lrn", width: "150px" },
  { title: "Name", key: "name", sortable: true },
  { title: "SF9 Count", key: "sf9_count", align: "center" as const, width: "120px" },
  { title: "Actions", key: "actions", sortable: false, width: "300px" },
];

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

onMounted(async () => {
  await loadTeacherId();
  await loadSections();
});

async function loadTeacherId() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  const { data: teacher } = await supabase
    .from("teachers")
    .select("teacher_id")
    .eq("user_id", userId)
    .single();

  if (teacher) {
    teacherId.value = teacher.teacher_id;
  }
}

async function loadSections() {
  if (!teacherId.value) return;
  loadingSections.value = true;

  const { data } = await supabase
    .from("sections")
    .select("section_id, name")
    .eq("adviser_teacher_id", teacherId.value);

  sections.value = data || [];
  loadingSections.value = false;
}

async function loadStudents() {
  if (!selectedSection.value) {
    students.value = [];
    return;
  }

  loadingStudents.value = true;

  // Get section_subject_ids for this section
  const { data: sectionSubjects } = await supabase
    .from("section_subjects")
    .select("section_subject_id")
    .eq("section_id", selectedSection.value);

  if (!sectionSubjects?.length) {
    students.value = [];
    loadingStudents.value = false;
    return;
  }

  const ssIds = sectionSubjects.map((s) => s.section_subject_id);

  // Get students enrolled in this section
  const { data } = await supabase
    .from("enrollments")
    .select(`
      student_id,
      students(student_id, lrn, first_name, last_name)
    `)
    .in("section_subject_id", ssIds);

  // Deduplicate students
  const seen = new Set();
  const uniqueStudents: Student[] = [];

  (data || []).forEach((e: any) => {
    if (seen.has(e.student_id)) return;
    seen.add(e.student_id);

    uniqueStudents.push({
      student_id: e.students?.student_id || e.student_id,
      lrn: e.students?.lrn || "",
      first_name: e.students?.first_name || "",
      last_name: e.students?.last_name || "",
      sf9_count: 0,
      latest_document_id: null,
    });
  });

  // Get SF9 count and latest document for each student
  for (const student of uniqueStudents) {
    const { data: docs, count } = await supabase
      .from("documents")
      .select("document_id", { count: "exact" })
      .eq("student_id", student.student_id)
      .eq("document_type", "SF9")
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1);

    student.sf9_count = count || 0;
    student.latest_document_id = docs?.[0]?.document_id || null;
  }

  students.value = uniqueStudents;
  loadingStudents.value = false;
}

async function getSchoolInfo(): Promise<SchoolInfo | null> {
  const { data } = await supabase.from("schools").select("*").limit(1).single();
  return data as SchoolInfo | null;
}

async function getStudentGrades(studentId: number): Promise<GradeData[]> {
  const { data } = await supabase
    .from("enrollments")
    .select(`
      semester_id,
      section_subjects(subjects(subject_name)),
      grades(final_grade)
    `)
    .eq("student_id", studentId);

  if (!data) return [];

  // Group grades by subject
  const subjectGrades: Record<string, { sem1: number | null; sem2: number | null }> = {};

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

  return Object.entries(subjectGrades).map(([subject, g]) => ({
    subject,
    sem1: g.sem1,
    sem2: g.sem2,
    final: g.sem1 !== null && g.sem2 !== null
      ? Math.round((g.sem1 + g.sem2) / 2)
      : g.sem1 ?? g.sem2,
  }));
}

async function getStudentInfo(studentId: number) {
  const { data } = await supabase
    .from("students")
    .select(`
      lrn, first_name, last_name, gender,
      enrollments(
        section_subjects(
          sections(name, school_years(year_label))
        )
      )
    `)
    .eq("student_id", studentId)
    .single();

  return data;
}

async function generateSF9(student: Student) {
  student.generating = true;

  try {
    const schoolInfo = await getSchoolInfo();
    const studentInfo = await getStudentInfo(student.student_id);
    const grades = await getStudentGrades(student.student_id);

    if (!schoolInfo || !studentInfo) {
      notify("Failed to fetch required data", "error");
      student.generating = false;
      return;
    }

    // Get section info
    const enrollment = (studentInfo.enrollments as any[])?.[0];
    const section = enrollment?.section_subjects?.sections;

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(schoolInfo.school_name || "School Name", pageWidth / 2, y, { align: "center" });
    y += 6;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(schoolInfo.address || "", pageWidth / 2, y, { align: "center" });
    y += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("LEARNER'S PROGRESS REPORT CARD", pageWidth / 2, y, { align: "center" });
    y += 5;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("School Form 9 (SF9) - Senior High School", pageWidth / 2, y, { align: "center" });
    y += 12;

    // Student Info
    pdf.setFontSize(10);
    const leftCol = 20;
    const rightCol = pageWidth / 2 + 10;

    pdf.text(`LRN: ${studentInfo.lrn || "N/A"}`, leftCol, y);
    pdf.text(`Grade Level: Grade 11`, rightCol, y);
    y += 6;

    pdf.text(`Name: ${studentInfo.first_name} ${studentInfo.last_name}`, leftCol, y);
    pdf.text(`Section: ${section?.name || "N/A"}`, rightCol, y);
    y += 6;

    pdf.text(`Gender: ${studentInfo.gender || "N/A"}`, leftCol, y);
    pdf.text(`School Year: ${section?.school_years?.year_label || "N/A"}`, rightCol, y);
    y += 12;

    // Grades Table
    const COL_W_SUBJECT = 70;
    const COL_W_SEM1 = 25;
    const COL_W_SEM2 = 25;
    const COL_W_FINAL = 25;
    const COL_W_REMARKS = 25;
    const totalTableWidth = COL_W_SUBJECT + COL_W_SEM1 + COL_W_SEM2 + COL_W_FINAL + COL_W_REMARKS;
    const tableHeaders = ["Learning Areas", "1st Sem", "2nd Sem", "Final", "Remarks"];
    const colWidthsArr = [COL_W_SUBJECT, COL_W_SEM1, COL_W_SEM2, COL_W_FINAL, COL_W_REMARKS];

    // Table header
    pdf.setFillColor(63, 81, 181);
    pdf.rect(leftCol - 2, y - 5, totalTableWidth + 4, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    let x = leftCol;
    tableHeaders.forEach((header, i) => {
      pdf.text(header, x + 2, y);
      x += colWidthsArr[i] ?? 25;
    });

    y += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");

    // Table rows
    grades.forEach((grade) => {
      x = leftCol;
      pdf.text(grade.subject.substring(0, 30), x + 2, y);
      x += COL_W_SUBJECT;
      pdf.text(grade.sem1?.toString() || "N/A", x + 8, y);
      x += COL_W_SEM1;
      pdf.text(grade.sem2?.toString() || "N/A", x + 8, y);
      x += COL_W_SEM2;
      pdf.text(grade.final?.toString() || "N/A", x + 8, y);
      x += COL_W_FINAL;
      pdf.text((grade.final ?? 0) >= 75 ? "PASSED" : "FAILED", x + 2, y);

      y += 6;

      // Draw row border
      pdf.setDrawColor(200, 200, 200);
      pdf.line(leftCol - 2, y - 3, leftCol - 2 + totalTableWidth + 4, y - 3);
    });

    // General Average
    const validGrades = grades.filter((g) => g.final !== null);
    const avgFinal = validGrades.length
      ? (validGrades.reduce((sum, g) => sum + (g.final ?? 0), 0) / validGrades.length).toFixed(2)
      : "N/A";

    y += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(240, 240, 240);
    pdf.rect(leftCol - 2, y - 5, totalTableWidth + 4, 8, "F");

    x = leftCol;
    pdf.text("General Average", x + 2, y);
    x += COL_W_SUBJECT + COL_W_SEM1 + COL_W_SEM2;
    pdf.text(avgFinal, x + 8, y);
    x += COL_W_FINAL;
    pdf.text(Number(avgFinal) >= 75 ? "PROMOTED" : "RETAINED", x + 2, y);

    y += 20;

    // Signatures
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pdf.line(leftCol, y, leftCol + 50, y);
    pdf.text("Class Adviser", leftCol + 15, y + 5);

    pdf.line(pageWidth / 2 - 25, y, pageWidth / 2 + 25, y);
    pdf.text("Parent/Guardian", pageWidth / 2 - 10, y + 5);

    pdf.line(pageWidth - 70, y, pageWidth - 20, y);
    pdf.text(schoolInfo.principal_name || "School Principal", pageWidth - 65, y + 5);
    pdf.text("School Principal", pageWidth - 55, y + 10);

    // Footer
    y = pdf.internal.pageSize.getHeight() - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      "This is an official document. Any erasure or alteration renders it invalid.",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    // Generate PDF blob
    const pdfOutput = pdf.output("blob");
    const fileName = `sf9_${student.lrn}_${Date.now()}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfOutput, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      notify("Failed to upload PDF to storage", "error");
      student.generating = false;
      return;
    }

    // Get current max version
    const { data: existingDocs } = await supabase
      .from("documents")
      .select("version")
      .eq("student_id", student.student_id)
      .eq("document_type", "SF9")
      .order("version", { ascending: false })
      .limit(1);

    const newVersion = (existingDocs?.[0]?.version || 0) + 1;

    // Insert document record
    const { error: insertError } = await supabase.from("documents").insert({
      student_id: student.student_id,
      document_type: "SF9",
      version: newVersion,
      file_path: fileName,
      generated_by_user_id: authStore.user?.user_id,
      is_active: true,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      notify("Failed to save document record", "error");
      student.generating = false;
      return;
    }

    // Insert audit log
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.user_id,
      action: `Generated SF9 v${newVersion} for student ${student.first_name} ${student.last_name}`,
      target_table: "documents",
      target_id: student.student_id,
    });

    notify(`SF9 v${newVersion} generated successfully for ${student.first_name}`);
    await loadStudents();
  } catch (error) {
    console.error("Error generating SF9:", error);
    notify("Failed to generate SF9", "error");
  }

  student.generating = false;
}

async function generateAllSF9() {
  generatingAll.value = true;
  let generated = 0;

  for (const student of students.value) {
    try {
      await generateSF9(student);
      generated++;
    } catch (error) {
      console.error(`Failed to generate SF9 for ${student.first_name}:`, error);
    }
  }

  notify(`Generated ${generated} SF9 documents`);
  generatingAll.value = false;
}

async function viewLatestSF9(student: Student) {
  if (!student.latest_document_id) {
    notify("No active SF9 found", "warning");
    return;
  }

  student.viewing = true;

  try {
    // Get document file path
    const { data: doc } = await supabase
      .from("documents")
      .select("file_path")
      .eq("document_id", student.latest_document_id)
      .single();

    if (!doc?.file_path) {
      notify("Document file not found", "error");
      student.viewing = false;
      return;
    }

    // Get public URL and open in new tab (clean PDF for adviser)
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(doc.file_path);

    if (data?.publicUrl) {
      window.open(data.publicUrl, "_blank");
    } else {
      notify("Failed to get document URL", "error");
    }
  } catch (error) {
    console.error("Error viewing SF9:", error);
    notify("Failed to load PDF", "error");
  }

  student.viewing = false;
}

function openRevokeDialog(student: Student) {
  studentToRevoke.value = student;
  revokeDialog.value = true;
}

async function confirmRevoke() {
  if (!studentToRevoke.value?.latest_document_id) return;

  revoking.value = true;

  try {
    // Update document to inactive
    const { error } = await supabase
      .from("documents")
      .update({ is_active: false })
      .eq("document_id", studentToRevoke.value.latest_document_id);

    if (error) {
      notify("Failed to revoke document", "error");
      revoking.value = false;
      return;
    }

    // Insert audit log
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.user_id,
      action: `Revoked SF9 for student ${studentToRevoke.value.first_name} ${studentToRevoke.value.last_name}`,
      target_table: "documents",
      target_id: studentToRevoke.value.latest_document_id,
    });

    notify(`SF9 revoked for ${studentToRevoke.value.first_name}`);
    revokeDialog.value = false;
    await loadStudents();
  } catch (error) {
    console.error("Error revoking document:", error);
    notify("Failed to revoke document", "error");
  }

  revoking.value = false;
}
</script>

<style scoped>
.v-data-table :deep(th) {
  font-weight: 600 !important;
  background: rgb(var(--v-theme-surface-variant)) !important;
}
</style>
