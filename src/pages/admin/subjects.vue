/** * Subject Management Page * * Admin capability: Manage curriculum subjects *
Critical for class creation and grading */

<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
</route>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useSystemSettings } from "@/composables/useSystemSettings";

const {
  loading,
  error,
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = useSystemSettings();

// State
const subjects = ref<any[]>([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const editingSubject = ref<any>(null);
const subjectForm = ref({
  subject_code: "",
  subject_name: "",
  grade_level: "11",
  track: "",
  strand: "",
  semester: "1",
  subject_type: "Core",
  units: 1,
  description: "",
});

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Options
const gradeLevelOptions = ["11", "12"];
const trackOptions = ["Academic", "TVL", "Sports", "Arts and Design"];
const semesterOptions = ["1", "2"];
const subjectTypeOptions = ["Core", "Applied", "Specialized"];

// Headers
const headers = [
  { title: "Code", value: "subject_code", key: "subject_code" },
  { title: "Subject Name", value: "subject_name", key: "subject_name" },
  { title: "Grade", value: "grade_level", key: "grade_level" },
  { title: "Track", value: "track", key: "track" },
  { title: "Strand", value: "strand", key: "strand" },
  { title: "Semester", value: "semester", key: "semester" },
  { title: "Type", value: "subject_type", key: "subject_type" },
  { title: "Units", value: "units", key: "units" },
  { title: "Status", value: "is_active", key: "is_active" },
  { title: "Actions", value: "actions", key: "actions", sortable: false },
];

// Methods
async function loadSubjects() {
  subjects.value = await fetchSubjects();
}

function openCreateDialog() {
  editingSubject.value = null;
  subjectForm.value = {
    subject_code: "",
    subject_name: "",
    grade_level: "11",
    track: "",
    strand: "",
    semester: "1",
    subject_type: "Core",
    units: 1,
    description: "",
  };
  dialog.value = true;
}

function openEditDialog(subject: any) {
  editingSubject.value = subject;
  subjectForm.value = {
    subject_code: subject.subject_code,
    subject_name: subject.subject_name,
    grade_level: subject.grade_level,
    track: subject.track,
    strand: subject.strand || "",
    semester: subject.semester,
    subject_type: subject.subject_type,
    units: subject.units,
    description: subject.description || "",
  };
  dialog.value = true;
}

async function saveSubject() {
  let success = false;

  if (editingSubject.value) {
    // Update existing
    success = await updateSubject(editingSubject.value.id, subjectForm.value);
  } else {
    // Create new
    success = await createSubject(subjectForm.value);
  }

  if (success) {
    showSnackbar(
      editingSubject.value
        ? "Subject updated successfully"
        : "Subject created successfully",
      "success"
    );
    dialog.value = false;
    await loadSubjects();
  } else {
    showSnackbar(error.value || "Failed to save subject", "error");
  }
}

function openDeleteDialog(subject: any) {
  editingSubject.value = subject;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!editingSubject.value) {
    return;
  }

  const success = await deleteSubject(editingSubject.value.id);

  if (success) {
    showSnackbar("Subject deleted successfully", "success");
    deleteDialog.value = false;
    await loadSubjects();
  } else {
    showSnackbar(error.value || "Failed to delete subject", "error");
  }
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
  loadSubjects();
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
        <h1 class="text-h4 font-weight-bold">Subject Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Manage curriculum subjects for Ampayon National High School - Senior
          High School
        </p>
      </v-col>
      <v-col cols="auto" class="d-flex align-center">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Add Subject
        </v-btn>
      </v-col>
    </v-row>

    <!-- Subjects Table -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="subjects"
          :loading="loading"
          class="elevation-1"
          item-value="id"
        >
          <template #[`item.is_active`]="{ item }">
            <v-chip
              :color="item.is_active ? 'success' : 'default'"
              size="small"
            >
              {{ item.is_active ? "Active" : "Inactive" }}
            </v-chip>
          </template>

          <template #[`item.subject_type`]="{ item }">
            <v-chip
              :color="
                item.subject_type === 'Core'
                  ? 'primary'
                  : item.subject_type === 'Applied'
                  ? 'info'
                  : 'success'
              "
              size="small"
            >
              {{ item.subject_type }}
            </v-chip>
          </template>

          <template #[`item.actions`]="{ item }">
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
          {{ editingSubject ? "Edit Subject" : "Add Subject" }}
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="subjectForm.subject_code"
                  label="Subject Code *"
                  placeholder="ENG-11"
                  variant="outlined"
                  hint="Unique identifier for the subject"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="subjectForm.subject_name"
                  label="Subject Name *"
                  placeholder="English for Academic and Professional Purposes"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="subjectForm.grade_level"
                  label="Grade Level *"
                  :items="gradeLevelOptions"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="subjectForm.semester"
                  label="Semester *"
                  :items="semesterOptions"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="subjectForm.units"
                  label="Units *"
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.5"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="subjectForm.track"
                  label="Track *"
                  :items="trackOptions"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="subjectForm.strand"
                  label="Strand"
                  placeholder="STEM, HUMSS, ABM, etc."
                  variant="outlined"
                  hint="Leave blank for core subjects"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="subjectForm.subject_type"
                  label="Subject Type *"
                  :items="subjectTypeOptions"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="subjectForm.description"
                  label="Description"
                  placeholder="Brief description of the subject"
                  variant="outlined"
                  rows="3"
                />
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
            @click="saveSubject"
          >
            {{ editingSubject ? "Update" : "Create" }}
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
            Are you sure you want to delete subject
            <strong>{{ editingSubject?.subject_name }}</strong
            >?
          </p>
          <v-alert class="mt-4" color="warning" variant="tonal">
            This action cannot be undone. Classes using this subject may be
            affected.
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

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
