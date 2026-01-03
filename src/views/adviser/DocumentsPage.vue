<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Document Center</h1>
            <p class="text-grey">Generate, view, and manage SF9 report cards</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSection"
          :items="sections"
          item-title="name"
          item-value="id"
          label="Select Section"
          variant="outlined"
          density="comfortable"
          @update:model-value="fetchStudents"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search by LRN or Name"
          variant="outlined"
          density="comfortable"
          clearable
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title>Students</v-card-title>
          <v-card-text class="pa-0">
            <v-table v-if="filteredStudents.length" density="comfortable">
              <thead>
                <tr>
                  <th>LRN</th>
                  <th>Student Name</th>
                  <th>SF9 Count</th>
                  <th>Latest Version</th>
                  <th style="width: 280px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in filteredStudents" :key="student.id">
                  <td class="text-grey">{{ student.lrn }}</td>
                  <td class="font-weight-medium">{{ student.name }}</td>
                  <td>
                    <v-chip size="small" color="primary" variant="tonal">
                      {{ student.sf9_count }} versions
                    </v-chip>
                  </td>
                  <td>
                    <span v-if="student.latest_version"
                      >v{{ student.latest_version }}</span
                    >
                    <span v-else class="text-grey">—</span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        prepend-icon="mdi-file-document-plus"
                        :loading="generating === student.id"
                        @click="generateSF9(student)"
                      >
                        Generate
                      </v-btn>
                      <v-btn
                        v-if="student.sf9_count > 0"
                        size="small"
                        variant="tonal"
                        color="success"
                        prepend-icon="mdi-eye"
                        @click="viewSF9(student)"
                      >
                        View
                      </v-btn>
                      <v-btn
                        v-if="student.sf9_count > 0"
                        size="small"
                        variant="tonal"
                        color="error"
                        prepend-icon="mdi-close-circle"
                        @click="confirmRevoke(student)"
                      >
                        Revoke
                      </v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-else type="info" variant="tonal" class="ma-4">
              Select a section to view students.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revoke Confirmation -->
    <v-dialog v-model="revokeDialog" max-width="450">
      <v-card>
        <v-card-title>Revoke SF9</v-card-title>
        <v-card-text>
          Are you sure you want to revoke the latest SF9 for
          <strong>{{ studentToRevoke?.name }}</strong
          >? This will mark the current version as inactive and allow you to
          generate a new one.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="revokeDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="revoking" @click="revokeSF9"
            >Revoke</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SF9 Viewer -->
    <v-dialog v-model="viewerDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>SF9 - {{ viewingStudent?.name }}</span>
          <v-btn icon variant="text" @click="viewerDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div v-if="sf9Data" class="sf9-preview pa-4">
            <div class="text-center mb-4">
              <h2 class="text-h5 font-weight-bold">
                LEARNER'S PROGRESS REPORT CARD
              </h2>
              <p class="text-subtitle-1">School Form 9 (SF9)</p>
            </div>

            <v-table density="compact" class="mb-4">
              <tbody>
                <tr>
                  <td><strong>LRN:</strong> {{ sf9Data.student.lrn }}</td>
                  <td><strong>Name:</strong> {{ sf9Data.student.name }}</td>
                </tr>
                <tr>
                  <td><strong>Section:</strong> {{ sf9Data.section }}</td>
                  <td>
                    <strong>School Year:</strong> {{ sf9Data.school_year }}
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-table density="compact">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Final Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in sf9Data.grades" :key="grade.subject">
                  <td>{{ grade.subject }}</td>
                  <td class="text-center">{{ grade.final_grade }}</td>
                  <td>
                    <v-chip
                      :color="grade.final_grade >= 75 ? 'success' : 'error'"
                      size="x-small"
                    >
                      {{ grade.final_grade >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="font-weight-bold">General Weighted Average</td>
                  <td class="text-center font-weight-bold">
                    {{ sf9Data.gwa }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </v-table>

            <div class="text-caption text-grey mt-4 text-right">
              Generated: {{ sf9Data.generated_at }} | Version:
              {{ sf9Data.version }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="viewerDialog = false">Close</v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadSF9"
            >Download PDF</v-btn
          >
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
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

interface Student {
  id: number;
  lrn: string;
  name: string;
  sf9_count: number;
  latest_version: number | null;
}

interface SF9Data {
  student: { lrn: string; name: string };
  section: string;
  school_year: string;
  grades: { subject: string; final_grade: number }[];
  gwa: number;
  generated_at: string;
  version: number;
}

const sections = ref<any[]>([]);
const students = ref<Student[]>([]);
const selectedSection = ref<number | null>(null);
const search = ref("");

const generating = ref<number | null>(null);
const revokeDialog = ref(false);
const studentToRevoke = ref<Student | null>(null);
const revoking = ref(false);

const viewerDialog = ref(false);
const viewingStudent = ref<Student | null>(null);
const sf9Data = ref<SF9Data | null>(null);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const filteredStudents = computed(() => {
  if (!search.value) return students.value;
  const term = search.value.toLowerCase();
  return students.value.filter(
    (s) =>
      s.lrn.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)
  );
});

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function fetchSections() {
  const { data: teacherData } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", authStore.user?.id)
    .single();

  if (!teacherData) return;

  const { data } = await supabase
    .from("sections")
    .select("id, name")
    .eq("adviser_teacher_id", teacherData.id);

  sections.value = data || [];

  if (route.query.section) {
    selectedSection.value = Number(route.query.section);
    fetchStudents();
  }
}

async function fetchStudents() {
  if (!selectedSection.value) {
    students.value = [];
    return;
  }

  // Get students enrolled in section
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      students(id, lrn, first_name, last_name)
    `
    )
    .eq("section_id", selectedSection.value);

  const studentMap = new Map<number, Student>();

  for (const e of enrollments || []) {
    const s = (e as any).students;
    if (s && !studentMap.has(s.id)) {
      // Get document count
      const { count } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("student_id", s.id)
        .eq("document_type", "SF9")
        .eq("is_active", true);

      const { data: latestDoc } = await supabase
        .from("documents")
        .select("version")
        .eq("student_id", s.id)
        .eq("document_type", "SF9")
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      studentMap.set(s.id, {
        id: s.id,
        lrn: s.lrn,
        name: `${s.last_name}, ${s.first_name}`,
        sf9_count: count || 0,
        latest_version: latestDoc?.version || null,
      });
    }
  }

  students.value = Array.from(studentMap.values());
}

async function generateSF9(student: Student) {
  generating.value = student.id;

  // Get next version number
  const nextVersion = (student.latest_version || 0) + 1;

  // Create document record
  const { error } = await supabase.from("documents").insert({
    student_id: student.id,
    document_type: "SF9",
    version: nextVersion,
    file_path: `sf9/${student.id}/sf9_v${nextVersion}.pdf`,
    snapshot_data: JSON.stringify({ generated_at: new Date().toISOString() }),
    is_active: true,
  });

  if (error) {
    notify(error.message, "error");
  } else {
    notify(`SF9 v${nextVersion} generated for ${student.name}`);
    fetchStudents();
  }

  generating.value = null;
}

async function viewSF9(student: Student) {
  viewingStudent.value = student;

  // Fetch SF9 data (mock for now)
  sf9Data.value = {
    student: { lrn: student.lrn, name: student.name },
    section:
      sections.value.find((s) => s.id === selectedSection.value)?.name || "",
    school_year: "2025-2026",
    grades: [
      { subject: "Oral Communication", final_grade: 88 },
      { subject: "Reading and Writing", final_grade: 85 },
      { subject: "Komunikasyon at Pananaliksik", final_grade: 90 },
      { subject: "General Mathematics", final_grade: 82 },
      { subject: "Earth and Life Science", final_grade: 87 },
      { subject: "Personal Development", final_grade: 92 },
      { subject: "Physical Education", final_grade: 95 },
    ],
    gwa: 88.43,
    generated_at: new Date().toLocaleDateString(),
    version: student.latest_version || 1,
  };

  viewerDialog.value = true;
}

function confirmRevoke(student: Student) {
  studentToRevoke.value = student;
  revokeDialog.value = true;
}

async function revokeSF9() {
  if (!studentToRevoke.value) return;
  revoking.value = true;

  const { error } = await supabase
    .from("documents")
    .update({ is_active: false })
    .eq("student_id", studentToRevoke.value.id)
    .eq("document_type", "SF9")
    .eq("is_active", true);

  if (error) {
    notify(error.message, "error");
  } else {
    notify(`SF9 revoked for ${studentToRevoke.value.name}`);
    revokeDialog.value = false;
    fetchStudents();
  }

  revoking.value = false;
}

function downloadSF9() {
  // In production, this would generate/download actual PDF
  notify("PDF download started", "info");
}

onMounted(fetchSections);
</script>

<style scoped>
.gap-1 {
  gap: 0.25rem;
}

.sf9-preview {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}
</style>
