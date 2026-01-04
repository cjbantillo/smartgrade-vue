<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Enroll Students</h1>
        <p class="text-body-1 text-grey-darken-1">
          Add or remove students from your sections.
        </p>
      </v-col>
    </v-row>

    <!-- Section Selector -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedSection"
          :items="sections"
          item-title="name"
          item-value="section_id"
          label="Select Section"
          variant="outlined"
          prepend-inner-icon="mdi-google-classroom"
          @update:model-value="loadSectionData"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedSemester"
          :items="semesters"
          item-title="name"
          item-value="semester_id"
          label="Select Semester"
          variant="outlined"
          prepend-inner-icon="mdi-calendar"
          @update:model-value="loadSectionData"
        />
      </v-col>
    </v-row>

    <v-row v-if="selectedSection && selectedSemester" class="mt-4">
      <!-- Available Students -->
      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold"
              >Available Students</span
            >
            <v-chip size="small" color="info" variant="tonal">
              {{ filteredAvailable.length }} available
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="searchAvailable"
              prepend-inner-icon="mdi-magnify"
              label="Search by LRN or Name"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-4"
            />

            <v-table density="compact" v-if="filteredAvailable.length">
              <thead>
                <tr>
                  <th style="width: 50px">
                    <v-checkbox
                      v-model="selectAllAvailable"
                      hide-details
                      density="compact"
                      @update:model-value="toggleSelectAll"
                    />
                  </th>
                  <th>LRN</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in filteredAvailable"
                  :key="student.student_id"
                >
                  <td>
                    <v-checkbox
                      v-model="selectedToEnroll"
                      :value="student.student_id"
                      hide-details
                      density="compact"
                    />
                  </td>
                  <td class="text-caption">{{ student.lrn }}</td>
                  <td>{{ student.first_name }} {{ student.last_name }}</td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-6 text-grey">
              No available students found.
            </div>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn
              color="primary"
              :disabled="!selectedToEnroll.length"
              :loading="enrolling"
              prepend-icon="mdi-account-plus"
              @click="enrollSelected"
            >
              Enroll Selected ({{ selectedToEnroll.length }})
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Enrolled Students -->
      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-subtitle-1 font-weight-bold"
              >Enrolled Students</span
            >
            <v-chip size="small" color="success" variant="tonal">
              {{ enrolledStudents.length }} enrolled
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="searchEnrolled"
              prepend-inner-icon="mdi-magnify"
              label="Search enrolled students"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-4"
            />

            <v-table density="compact" v-if="filteredEnrolled.length">
              <thead>
                <tr>
                  <th>LRN</th>
                  <th>Name</th>
                  <th style="width: 100px">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in filteredEnrolled"
                  :key="student.student_id"
                >
                  <td class="text-caption">{{ student.lrn }}</td>
                  <td>{{ student.first_name }} {{ student.last_name }}</td>
                  <td>
                    <v-btn
                      size="x-small"
                      color="error"
                      variant="text"
                      @click="confirmRemove(student)"
                    >
                      Remove
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <div v-else class="text-center py-6 text-grey">
              No students enrolled in this section.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else class="mt-4">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          Select a section and semester to manage student enrollment.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="removeDialog" max-width="400">
      <v-card>
        <v-card-title>Remove Student</v-card-title>
        <v-card-text>
          Are you sure you want to remove
          <strong
            >{{ studentToRemove?.first_name }}
            {{ studentToRemove?.last_name }}</strong
          >
          from this section? This will remove all their enrollments in this
          section for the selected semester.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="removeDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="removeStudent"
            >Remove</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const authStore = useAuthStore();

interface Student {
  student_id: number;
  lrn: string;
  first_name: string;
  last_name: string;
}

interface Section {
  section_id: number;
  name: string;
}

interface Semester {
  semester_id: number;
  name: string;
}

const sections = ref<Section[]>([]);
const semesters = ref<Semester[]>([]);
const availableStudents = ref<Student[]>([]);
const enrolledStudents = ref<Student[]>([]);

const selectedSection = ref<number | null>(null);
const selectedSemester = ref<number | null>(null);
const selectedToEnroll = ref<number[]>([]);
const selectAllAvailable = ref(false);

const searchAvailable = ref("");
const searchEnrolled = ref("");

const enrolling = ref(false);
const removing = ref(false);
const removeDialog = ref(false);
const studentToRemove = ref<Student | null>(null);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const filteredAvailable = computed(() => {
  if (!searchAvailable.value) return availableStudents.value;
  const term = searchAvailable.value.toLowerCase();
  return availableStudents.value.filter(
    (s) =>
      s.lrn.toLowerCase().includes(term) ||
      s.first_name.toLowerCase().includes(term) ||
      s.last_name.toLowerCase().includes(term)
  );
});

const filteredEnrolled = computed(() => {
  if (!searchEnrolled.value) return enrolledStudents.value;
  const term = searchEnrolled.value.toLowerCase();
  return enrolledStudents.value.filter(
    (s) =>
      s.lrn.toLowerCase().includes(term) ||
      s.first_name.toLowerCase().includes(term) ||
      s.last_name.toLowerCase().includes(term)
  );
});

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

function toggleSelectAll(value: boolean | null) {
  if (value) {
    selectedToEnroll.value = filteredAvailable.value.map((s) => s.student_id);
  } else {
    selectedToEnroll.value = [];
  }
}

async function loadSections() {
  const userId = authStore.user?.user_id;
  if (!userId) return;

  // Get teacher_id
  const { data: teacher } = await supabase
    .from("teachers")
    .select("teacher_id")
    .eq("user_id", userId)
    .single();

  if (!teacher) return;

  // Get sections where user is adviser
  const { data } = await supabase
    .from("sections")
    .select("section_id, name")
    .eq("adviser_teacher_id", teacher.teacher_id);

  sections.value = data || [];
}

async function loadSemesters() {
  const { data } = await supabase
    .from("semesters")
    .select("semester_id, name")
    .order("semester_id");

  semesters.value = data || [];
}

async function loadSectionData() {
  if (!selectedSection.value || !selectedSemester.value) return;

  // Get section_subjects for this section
  const { data: sectionSubjects } = await supabase
    .from("section_subjects")
    .select("section_subject_id")
    .eq("section_id", selectedSection.value);

  if (!sectionSubjects?.length) {
    enrolledStudents.value = [];
    await loadAvailableStudents([]);
    return;
  }

  const ssIds = sectionSubjects.map((s) => s.section_subject_id);

  // Get enrolled students
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, students(student_id, lrn, first_name, last_name)")
    .in("section_subject_id", ssIds)
    .eq("semester_id", selectedSemester.value);

  const seen = new Set();
  enrolledStudents.value = (enrollments || [])
    .filter((e: any) => {
      if (seen.has(e.student_id)) return false;
      seen.add(e.student_id);
      return true;
    })
    .map((e: any) => ({
      student_id: e.students?.student_id || e.student_id,
      lrn: e.students?.lrn || "",
      first_name: e.students?.first_name || "",
      last_name: e.students?.last_name || "",
    }));

  await loadAvailableStudents(enrolledStudents.value.map((s) => s.student_id));
}

async function loadAvailableStudents(enrolledIds: number[]) {
  let query = supabase
    .from("students")
    .select("student_id, lrn, first_name, last_name")
    .order("last_name");

  if (enrolledIds.length > 0) {
    query = query.not("student_id", "in", `(${enrolledIds.join(",")})`);
  }

  const { data } = await query;
  availableStudents.value = data || [];
  selectedToEnroll.value = [];
  selectAllAvailable.value = false;
}

async function enrollSelected() {
  if (!selectedSection.value || !selectedSemester.value) return;
  if (!selectedToEnroll.value.length) return;

  enrolling.value = true;

  try {
    // Get all section_subjects for this section
    const { data: sectionSubjects } = await supabase
      .from("section_subjects")
      .select("section_subject_id")
      .eq("section_id", selectedSection.value);

    if (!sectionSubjects?.length) {
      notify("No subjects assigned to this section", "error");
      enrolling.value = false;
      return;
    }

    // Create enrollments for each student in each section_subject
    const enrollments = [];
    for (const studentId of selectedToEnroll.value) {
      for (const ss of sectionSubjects) {
        enrollments.push({
          student_id: studentId,
          section_subject_id: ss.section_subject_id,
          semester_id: selectedSemester.value,
        });
      }
    }

    const { error } = await supabase.from("enrollments").insert(enrollments);

    if (error) {
      notify(error.message, "error");
    } else {
      notify(
        `${selectedToEnroll.value.length} student(s) enrolled successfully`
      );
      await loadSectionData();
    }
  } catch (error) {
    console.error("Error enrolling students:", error);
    notify("Failed to enroll students", "error");
  }

  enrolling.value = false;
}

function confirmRemove(student: Student) {
  studentToRemove.value = student;
  removeDialog.value = true;
}

async function removeStudent() {
  if (
    !studentToRemove.value ||
    !selectedSection.value ||
    !selectedSemester.value
  )
    return;

  removing.value = true;

  try {
    // Get section_subjects for this section
    const { data: sectionSubjects } = await supabase
      .from("section_subjects")
      .select("section_subject_id")
      .eq("section_id", selectedSection.value);

    if (sectionSubjects?.length) {
      const ssIds = sectionSubjects.map((s) => s.section_subject_id);

      // Delete enrollments
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("student_id", studentToRemove.value.student_id)
        .eq("semester_id", selectedSemester.value)
        .in("section_subject_id", ssIds);

      if (error) {
        notify(error.message, "error");
      } else {
        notify("Student removed from section");
        removeDialog.value = false;
        await loadSectionData();
      }
    }
  } catch (error) {
    console.error("Error removing student:", error);
    notify("Failed to remove student", "error");
  }

  removing.value = false;
}

onMounted(async () => {
  await Promise.all([loadSections(), loadSemesters()]);
});
</script>
