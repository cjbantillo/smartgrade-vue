<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Manage Students</h1>
            <p class="text-grey">Enroll and manage students in your sections</p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-account-plus"
            @click="enrollDialog = true"
          >
            Enroll Student
          </v-btn>
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
          @update:model-value="fetchEnrolledStudents"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search students"
          variant="outlined"
          density="comfortable"
          clearable
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title>Enrolled Students</v-card-title>
          <v-card-text class="pa-0">
            <v-table v-if="filteredStudents.length" density="comfortable">
              <thead>
                <tr>
                  <th>LRN</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Enrolled Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in filteredStudents" :key="student.id">
                  <td class="text-grey">{{ student.lrn }}</td>
                  <td class="font-weight-medium">{{ student.name }}</td>
                  <td>{{ student.gender }}</td>
                  <td class="text-grey">{{ student.enrolled_date }}</td>
                  <td>
                    <v-btn
                      size="small"
                      variant="text"
                      color="error"
                      @click="confirmRemove(student)"
                    >
                      Remove
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-else type="info" variant="tonal" class="ma-4">
              {{
                selectedSection
                  ? "No students enrolled in this section."
                  : "Select a section to view students."
              }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Enroll Dialog -->
    <v-dialog v-model="enrollDialog" max-width="600">
      <v-card>
        <v-card-title>Enroll Students</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="enrollSearch"
            prepend-inner-icon="mdi-magnify"
            label="Search by LRN or Name"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            @update:model-value="searchStudents"
          />

          <v-list
            v-if="availableStudents.length"
            density="compact"
            max-height="300"
            class="overflow-auto"
          >
            <v-list-item
              v-for="student in availableStudents"
              :key="student.id"
              :title="student.name"
              :subtitle="student.lrn"
            >
              <template #append>
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  :loading="enrolling === student.id"
                  @click="enrollStudent(student)"
                >
                  Enroll
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-grey text-center py-4">
            {{
              enrollSearch
                ? "No matching students found"
                : "Search for students to enroll"
            }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="enrollDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Confirmation -->
    <v-dialog v-model="removeDialog" max-width="400">
      <v-card>
        <v-card-title>Remove Student</v-card-title>
        <v-card-text>
          Are you sure you want to remove
          <strong>{{ studentToRemove?.name }}</strong> from this section?
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

interface Student {
  id: number;
  enrollment_id?: number;
  lrn: string;
  name: string;
  gender?: string;
  enrolled_date?: string;
}

const sections = ref<any[]>([]);
const students = ref<Student[]>([]);
const availableStudents = ref<Student[]>([]);
const selectedSection = ref<number | null>(null);
const search = ref("");
const enrollSearch = ref("");

const enrollDialog = ref(false);
const enrolling = ref<number | null>(null);

const removeDialog = ref(false);
const studentToRemove = ref<Student | null>(null);
const removing = ref(false);

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
}

async function fetchEnrolledStudents() {
  if (!selectedSection.value) {
    students.value = [];
    return;
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      created_at,
      students(id, lrn, first_name, last_name, gender)
    `
    )
    .eq("section_id", selectedSection.value);

  if (error) {
    notify(error.message, "error");
    return;
  }

  const seen = new Set<number>();
  students.value = (data || [])
    .filter((e: any) => {
      if (!e.students || seen.has(e.students.id)) return false;
      seen.add(e.students.id);
      return true;
    })
    .map((e: any) => ({
      id: e.students.id,
      enrollment_id: e.id,
      lrn: e.students.lrn,
      name: `${e.students.last_name}, ${e.students.first_name}`,
      gender: e.students.gender || "N/A",
      enrolled_date: new Date(e.created_at).toLocaleDateString(),
    }));
}

async function searchStudents() {
  if (!enrollSearch.value || enrollSearch.value.length < 2) {
    availableStudents.value = [];
    return;
  }

  const term = `%${enrollSearch.value}%`;
  const { data } = await supabase
    .from("students")
    .select("id, lrn, first_name, last_name")
    .or(`lrn.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`)
    .limit(20);

  const enrolledIds = new Set(students.value.map((s) => s.id));
  availableStudents.value = (data || [])
    .filter((s: any) => !enrolledIds.has(s.id))
    .map((s: any) => ({
      id: s.id,
      lrn: s.lrn,
      name: `${s.last_name}, ${s.first_name}`,
    }));
}

async function enrollStudent(student: Student) {
  if (!selectedSection.value) {
    notify("Please select a section first", "warning");
    return;
  }

  enrolling.value = student.id;

  const { error } = await supabase.from("enrollments").insert({
    student_id: student.id,
    section_id: selectedSection.value,
  });

  if (error) {
    notify(error.message, "error");
  } else {
    notify(`${student.name} enrolled successfully`);
    availableStudents.value = availableStudents.value.filter(
      (s) => s.id !== student.id
    );
    fetchEnrolledStudents();
  }

  enrolling.value = null;
}

function confirmRemove(student: Student) {
  studentToRemove.value = student;
  removeDialog.value = true;
}

async function removeStudent() {
  if (!studentToRemove.value) return;
  removing.value = true;

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("id", studentToRemove.value.enrollment_id);

  if (error) {
    notify(error.message, "error");
  } else {
    notify(`${studentToRemove.value.name} removed from section`);
    removeDialog.value = false;
    fetchEnrolledStudents();
  }

  removing.value = false;
}

onMounted(fetchSections);
</script>
