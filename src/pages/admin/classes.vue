/** * Class/Section Management Page * * Admin capability: Manage classes and
sections for the school * Teachers can also create classes for their own
teaching */

<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
</route>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useClasses } from "@/composables/useClasses";
import { useSystemSettings } from "@/composables/useSystemSettings";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/services/supabase";

const authStore = useAuthStore();
const {
  loading,
  error,
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
  assignTeacher,
  getClassStudents,
} = useClasses();
const { fetchSchoolYears } = useSystemSettings();

// State
const classes = ref<any[]>([]);
const schoolYears = ref<any[]>([]);
const teachers = ref<any[]>([]);
const selectedSchoolYear = ref<string>("");
const dialog = ref(false);
const deleteDialog = ref(false);
const studentsDialog = ref(false);
const editingClass = ref<any>(null);
const classStudents = ref<any[]>([]);

const classForm = ref({
  section_name: "",
  grade_level: "11",
  track: "Academic",
  strand: "",
  room: "",
  capacity: 40,
  teacher_id: "",
  school_year_id: "",
  semester: "1",
});

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Options
const gradeLevels = ["11", "12"];
const tracks = ["Academic", "TVL", "Sports", "Arts and Design"];
const semesters = ["1", "2"];

// Headers
const headers = [
  { title: "Section", value: "section_name", key: "section_name" },
  { title: "Grade", value: "grade_level", key: "grade_level" },
  { title: "Track", value: "track", key: "track" },
  { title: "Strand", value: "strand", key: "strand" },
  { title: "Room", value: "room", key: "room" },
  { title: "Students", value: "student_count", key: "student_count" },
  { title: "Capacity", value: "capacity", key: "capacity" },
  { title: "Homeroom Teacher", value: "teacher", key: "teacher" },
  { title: "Actions", value: "actions", key: "actions", sortable: false },
];

const activeSchoolYear = computed(() => {
  return schoolYears.value.find((y) => y.is_active);
});

// Methods
async function loadData() {
  schoolYears.value = await fetchSchoolYears();
  selectedSchoolYear.value = activeSchoolYear.value?.id || "";

  if (selectedSchoolYear.value) {
    await loadClasses();
  }

  await loadTeachers();
}

async function loadClasses() {
  if (!selectedSchoolYear.value) {
    return;
  }
  classes.value = await fetchClasses(selectedSchoolYear.value);
}

async function loadTeachers() {
  const { data } = await supabase
    .from("teachers")
    .select(
      `
      *,
      profiles (
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("profiles.is_active", true);

  teachers.value = data || [];
}

function openCreateDialog() {
  editingClass.value = null;
  classForm.value = {
    section_name: "",
    grade_level: "11",
    track: "Academic",
    strand: "",
    room: "",
    capacity: 40,
    teacher_id: "",
    school_year_id: selectedSchoolYear.value,
    semester: "1",
  };
  dialog.value = true;
}

function openEditDialog(classItem: any) {
  editingClass.value = classItem;
  classForm.value = {
    section_name: classItem.section_name,
    grade_level: classItem.grade_level,
    track: classItem.track,
    strand: classItem.strand || "",
    room: classItem.room || "",
    capacity: classItem.capacity,
    teacher_id: classItem.teacher_id || "",
    school_year_id: classItem.school_year_id,
    semester: classItem.semester,
  };
  dialog.value = true;
}

async function saveClass() {
  if (!authStore.profile?.user_id) {
    showSnackbar("Admin user not found", "error");
    return;
  }

  let success = false;

  if (editingClass.value) {
    success = await updateClass(
      editingClass.value.id,
      classForm.value,
      authStore.profile.user_id
    );
  } else {
    success = await createClass(classForm.value, authStore.profile.user_id);
  }

  if (success) {
    showSnackbar(
      editingClass.value
        ? "Class updated successfully"
        : "Class created successfully",
      "success"
    );
    dialog.value = false;
    await loadClasses();
  } else {
    showSnackbar(error.value || "Failed to save class", "error");
  }
}

function openDeleteDialog(classItem: any) {
  editingClass.value = classItem;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!editingClass.value || !authStore.profile?.user_id) {
    return;
  }

  const success = await deleteClass(
    editingClass.value.id,
    authStore.profile.user_id
  );

  if (success) {
    showSnackbar("Class deleted successfully", "success");
    deleteDialog.value = false;
    await loadClasses();
  } else {
    showSnackbar(error.value || "Failed to delete class", "error");
  }
}

async function viewStudents(classItem: any) {
  editingClass.value = classItem;
  classStudents.value = await getClassStudents(classItem.id);
  studentsDialog.value = true;
}

function getTeacherName(classItem: any) {
  if (!classItem.teacher) {
    return "Not assigned";
  }
  return `${classItem.teacher.first_name} ${classItem.teacher.last_name}`;
}

function showSnackbar(
  message: string,
  color: "success" | "error" | "warning" = "success"
) {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <v-container fluid>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col>
        <v-btn
          class="mb-4"
          prepend-icon="mdi-arrow-left"
          to="/admin"
          variant="text"
        >
          Back to Dashboard
        </v-btn>
        <h1 class="text-h4 font-weight-bold">Classes & Sections</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Manage class sections for Ampayon National High School - SHS
        </p>
      </v-col>
      <v-col cols="auto" class="d-flex align-center">
        <v-select
          v-model="selectedSchoolYear"
          :items="schoolYears"
          item-title="year_code"
          item-value="id"
          label="School Year"
          variant="outlined"
          density="compact"
          class="mr-4"
          style="min-width: 200px"
          @update:model-value="loadClasses"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Add Class
        </v-btn>
      </v-col>
    </v-row>

    <!-- Classes Table -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="classes"
          :loading="loading"
          class="elevation-1"
          item-value="id"
        >
          <template #[`item.student_count`]="{ item }">
            <v-chip
              :color="item.student_count >= item.capacity ? 'error' : 'success'"
              size="small"
              @click="viewStudents(item)"
              style="cursor: pointer"
            >
              {{ item.student_count || 0 }} / {{ item.capacity }}
            </v-chip>
          </template>

          <template #[`item.teacher`]="{ item }">
            {{ getTeacherName(item) }}
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              color="info"
              size="small"
              variant="tonal"
              icon="mdi-account-group"
              class="mr-2"
              @click="viewStudents(item)"
            >
              <v-tooltip activator="parent" location="top">
                View Students
              </v-tooltip>
            </v-btn>
            <v-btn
              color="primary"
              size="small"
              variant="tonal"
              icon="mdi-pencil"
              class="mr-2"
              @click="openEditDialog(item)"
            />
            <v-btn
              color="error"
              size="small"
              variant="tonal"
              icon="mdi-delete"
              @click="openDeleteDialog(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title class="text-h5">
          {{ editingClass ? "Edit Class" : "Add Class" }}
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="classForm.section_name"
                  label="Section Name *"
                  placeholder="e.g., Einstein, Newton"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="classForm.grade_level"
                  :items="gradeLevels"
                  label="Grade Level *"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="classForm.semester"
                  :items="semesters"
                  label="Semester *"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="classForm.track"
                  :items="tracks"
                  label="Track *"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="classForm.strand"
                  label="Strand"
                  placeholder="STEM, HUMSS, ABM, etc."
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="classForm.room"
                  label="Room"
                  placeholder="Room 101"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="classForm.capacity"
                  label="Capacity *"
                  type="number"
                  min="1"
                  max="100"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="classForm.teacher_id"
                  :items="teachers"
                  item-title="profiles.first_name"
                  item-value="user_id"
                  label="Homeroom Teacher"
                  variant="outlined"
                >
                  <template #item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="`${item.raw.profiles?.first_name} ${item.raw.profiles?.last_name}`"
                      :subtitle="item.raw.profiles?.email"
                    />
                  </template>
                  <template #selection="{ item }">
                    {{ item.raw.profiles?.first_name }}
                    {{ item.raw.profiles?.last_name }}
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="saveClass"
          >
            {{ editingClass ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5"> Confirm Delete </v-card-title>
        <v-card-text>
          <p>
            Are you sure you want to delete class
            <strong>{{ editingClass?.section_name }}</strong
            >?
          </p>
          <v-alert class="mt-4" color="warning" variant="tonal">
            This action cannot be undone. The class cannot be deleted if it has
            enrolled students.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false"> Cancel </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="loading"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Students Dialog -->
    <v-dialog v-model="studentsDialog" max-width="800px">
      <v-card>
        <v-card-title class="text-h5">
          Students in {{ editingClass?.section_name }}
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="classStudents.length === 0"
            color="info"
            variant="tonal"
          >
            No students enrolled in this class yet.
          </v-alert>
          <v-list v-else>
            <v-list-item
              v-for="(enrollment, index) in classStudents"
              :key="enrollment.id"
            >
              <template #prepend>
                <v-avatar color="primary">
                  {{ index + 1 }}
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ enrollment.student?.first_name }}
                {{ enrollment.student?.middle_name }}
                {{ enrollment.student?.last_name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                LRN: {{ enrollment.student?.lrn }} | Grade
                {{ enrollment.student?.grade_level }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="studentsDialog = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
