<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Encode Final Grades</h1>
            <p class="text-grey">Enter final grades for your students</p>
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
        <v-select
          v-model="selectedSubject"
          :items="subjects"
          item-title="subject_name"
          item-value="id"
          label="Select Subject"
          variant="outlined"
          density="comfortable"
          @update:model-value="fetchStudents"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSemester"
          :items="semesters"
          item-title="name"
          item-value="id"
          label="Select Semester"
          variant="outlined"
          density="comfortable"
          @update:model-value="fetchStudents"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Student Grades</span>
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!students.length"
              prepend-icon="mdi-content-save"
              @click="saveAllGrades"
            >
              Save All Grades
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-table v-if="students.length" density="comfortable">
              <thead>
                <tr>
                  <th>LRN</th>
                  <th>Student Name</th>
                  <th style="width: 150px">Final Grade</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.id">
                  <td class="text-grey">{{ student.lrn }}</td>
                  <td class="font-weight-medium">{{ student.name }}</td>
                  <td>
                    <v-text-field
                      v-model.number="student.final_grade"
                      type="number"
                      min="0"
                      max="100"
                      density="compact"
                      hide-details
                      variant="outlined"
                      style="max-width: 100px"
                      @update:model-value="updateRemarks(student)"
                    />
                  </td>
                  <td>
                    <v-chip
                      :color="student.final_grade >= 75 ? 'success' : 'error'"
                      size="small"
                      label
                    >
                      {{ student.final_grade >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                  <td>
                    <v-icon v-if="student.saved" color="success" size="small"
                      >mdi-check-circle</v-icon
                    >
                    <v-icon
                      v-else-if="student.modified"
                      color="warning"
                      size="small"
                      >mdi-pencil</v-icon
                    >
                    <span v-else class="text-grey">—</span>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-else type="info" variant="tonal" class="ma-4">
              Select a section, subject, and semester to view students.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

interface Student {
  id: number;
  enrollment_id: number;
  lrn: string;
  name: string;
  final_grade: number;
  saved: boolean;
  modified: boolean;
}

const sections = ref<any[]>([]);
const subjects = ref<any[]>([]);
const semesters = ref<any[]>([]);
const students = ref<Student[]>([]);

const selectedSection = ref<number | null>(null);
const selectedSubject = ref<number | null>(null);
const selectedSemester = ref<number | null>(null);

const saving = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

function updateRemarks(student: Student) {
  student.modified = true;
  student.saved = false;
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

  // Pre-select from query param
  if (route.query.section) {
    selectedSection.value = Number(route.query.section);
  }
}

async function fetchSubjects() {
  const { data } = await supabase.from("subjects").select("id, subject_name");

  subjects.value = data || [];
}

async function fetchSemesters() {
  const { data } = await supabase
    .from("semesters")
    .select("id, name")
    .order("id");

  semesters.value = data || [];
  if (semesters.value.length) {
    selectedSemester.value = semesters.value[0].id;
  }
}

async function fetchStudents() {
  if (
    !selectedSection.value ||
    !selectedSubject.value ||
    !selectedSemester.value
  ) {
    students.value = [];
    return;
  }

  // Get section_subject_id
  const { data: sectionSubject } = await supabase
    .from("section_subjects")
    .select("id")
    .eq("section_id", selectedSection.value)
    .eq("subject_id", selectedSubject.value)
    .single();

  if (!sectionSubject) {
    students.value = [];
    return;
  }

  // Get enrollments with students and grades
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      students(id, lrn, first_name, last_name),
      grades(final_grade)
    `
    )
    .eq("section_subject_id", sectionSubject.id)
    .eq("semester_id", selectedSemester.value);

  if (error) {
    notify(error.message, "error");
    return;
  }

  students.value = (enrollments || []).map((e: any) => ({
    id: e.students?.id,
    enrollment_id: e.id,
    lrn: e.students?.lrn || "",
    name: e.students
      ? `${e.students.last_name}, ${e.students.first_name}`
      : "Unknown",
    final_grade: e.grades?.[0]?.final_grade ?? 0,
    saved: !!e.grades?.[0],
    modified: false,
  }));
}

async function saveAllGrades() {
  saving.value = true;

  for (const student of students.value) {
    if (student.final_grade === null || student.final_grade === undefined)
      continue;

    const { error } = await supabase.from("grades").upsert(
      {
        enrollment_id: student.enrollment_id,
        final_grade: student.final_grade,
        is_final: true,
      },
      { onConflict: "enrollment_id" }
    );

    if (error) {
      notify(
        `Error saving grade for ${student.name}: ${error.message}`,
        "error"
      );
    } else {
      student.saved = true;
      student.modified = false;
    }
  }

  notify("All grades saved successfully");
  saving.value = false;
}

onMounted(async () => {
  await fetchSections();
  await fetchSubjects();
  await fetchSemesters();
  if (
    selectedSection.value &&
    selectedSubject.value &&
    selectedSemester.value
  ) {
    fetchStudents();
  }
});
</script>
