<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Encode Grades</h1>
        <p class="text-body-1 text-grey-darken-1">
          Enter final grades for your students.
        </p>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSection"
          :items="sections"
          item-title="name"
          item-value="section_id"
          label="Select Section"
          variant="outlined"
          @update:model-value="loadStudents"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSubject"
          :items="subjects"
          item-title="subject_name"
          item-value="section_subject_id"
          label="Select Subject"
          variant="outlined"
          @update:model-value="loadStudents"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-text>
            <v-table v-if="students.length">
              <thead>
                <tr>
                  <th>LRN</th>
                  <th>Student Name</th>
                  <th>Final Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.enrollment_id">
                  <td>{{ student.lrn }}</td>
                  <td>{{ student.first_name }} {{ student.last_name }}</td>
                  <td style="width: 120px">
                    <v-text-field
                      v-model.number="student.final_grade"
                      type="number"
                      min="0"
                      max="100"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </td>
                  <td>
                    <v-chip
                      :color="student.final_grade >= 75 ? 'success' : 'error'"
                      size="small"
                    >
                      {{ student.final_grade >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-6 text-grey">
              Select a section and subject to view students.
            </div>
          </v-card-text>
          <v-card-actions v-if="students.length" class="pa-4">
            <v-spacer />
            <v-btn color="primary" :loading="saving" @click="saveGrades">
              Save All Grades
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const authStore = useAuthStore();

const sections = ref<{ section_id: number; name: string }[]>([]);
const subjects = ref<{ section_subject_id: number; subject_name: string }[]>(
  []
);
const students = ref<
  {
    enrollment_id: number;
    student_id: number;
    lrn: string;
    first_name: string;
    last_name: string;
    final_grade: number;
  }[]
>([]);

const selectedSection = ref<number | null>(null);
const selectedSubject = ref<number | null>(null);
const saving = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

onMounted(async () => {
  await loadSections();
});

async function loadSections() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  const { data: teacher } = await supabase
    .from("teachers")
    .select("teacher_id")
    .eq("user_id", userId)
    .single();

  if (!teacher) return;

  const { data } = await supabase
    .from("sections")
    .select("section_id, name")
    .eq("adviser_teacher_id", teacher.teacher_id);

  sections.value = data || [];
}

async function loadStudents() {
  if (!selectedSection.value) return;

  // Load subjects for selected section
  const { data: subjectData } = await supabase
    .from("section_subjects")
    .select("section_subject_id, subjects(subject_name)")
    .eq("section_id", selectedSection.value);

  subjects.value = (subjectData || []).map((s: any) => ({
    section_subject_id: s.section_subject_id,
    subject_name: s.subjects?.subject_name || "Unknown",
  }));

  if (!selectedSubject.value) return;

  // Load students with grades
  const { data } = await supabase
    .from("enrollments")
    .select(
      `
      enrollment_id,
      student_id,
      students(lrn, first_name, last_name),
      grades(final_grade)
    `
    )
    .eq("section_subject_id", selectedSubject.value);

  students.value = (data || []).map((e: any) => ({
    enrollment_id: e.enrollment_id,
    student_id: e.student_id,
    lrn: e.students?.lrn || "",
    first_name: e.students?.first_name || "",
    last_name: e.students?.last_name || "",
    final_grade: e.grades?.[0]?.final_grade || 0,
  }));
}

async function saveGrades() {
  saving.value = true;

  try {
    for (const student of students.value) {
      await supabase.from("grades").upsert(
        {
          enrollment_id: student.enrollment_id,
          final_grade: student.final_grade,
          is_final: true,
        },
        { onConflict: "enrollment_id" }
      );
    }

    snackbarText.value = "Grades saved successfully!";
    snackbarColor.value = "success";
  } catch {
    snackbarText.value = "Failed to save grades.";
    snackbarColor.value = "error";
  }

  snackbar.value = true;
  saving.value = false;
}
</script>
