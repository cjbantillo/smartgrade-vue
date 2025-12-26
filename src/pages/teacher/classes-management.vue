<template>
  <div class="pa-6">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>My Classes</span>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createClassDialog = true"
        >
          Create Class
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate />

        <v-alert
          v-if="error"
          type="error"
          closable
          class="mb-4"
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <!-- Classes Grid -->
        <v-empty-state
          v-if="!loading && classes.length === 0"
          icon="mdi-folder-outline"
          headline="No Classes Yet"
          text="Create your first class to get started"
        />

        <v-row v-else class="mt-0">
          <v-col v-for="cls in classes" :key="cls.id" cols="12" md="6" lg="4">
            <v-card
              :to="`/teacher/classes/${cls.id}`"
              class="cursor-pointer h-100"
            >
              <v-card-item>
                <v-card-title>{{ cls.subject_name }}</v-card-title>
                <v-card-subtitle>Section: {{ cls.section }}</v-card-subtitle>
              </v-card-item>

              <v-card-text>
                <p><strong>Code:</strong> {{ cls.subject_code }}</p>
                <p><strong>School Year:</strong> {{ cls.school_year }}</p>
                <p><strong>Students:</strong> {{ cls.student_count }}</p>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click.prevent="openEditClass(cls)"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click.prevent="openDeleteClass(cls)"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Class Dialog -->
    <v-dialog v-model="createClassDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingClass ? "Edit Class" : "Create New Class" }}
        </v-card-title>

        <v-card-text>
          <v-form ref="classForm" @submit.prevent="handleSaveClass">
            <v-select
              v-model="classFormData.subject_id"
              label="Subject"
              :items="subjects"
              item-title="name"
              item-value="id"
              required
            />

            <v-text-field
              v-model="classFormData.section"
              label="Section (e.g., Einstein, Newton)"
              required
            />

            <v-select
              v-model="classFormData.school_year_id"
              label="School Year"
              :items="schoolYears"
              item-title="year"
              item-value="id"
              required
            />

            <v-select
              v-model="classFormData.grading_period"
              label="Grading Period"
              :items="[
                { title: '1st Quarter', value: 1 },
                { title: '2nd Quarter', value: 2 },
                { title: '3rd Quarter', value: 3 },
                { title: '4th Quarter', value: 4 },
              ]"
              item-title="title"
              item-value="value"
              required
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="createClassDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="handleSaveClass">
            {{ editingClass ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Class</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ selectedClass?.subject_name }}</strong
          >? This will also remove all associated grade records.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteClass">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTeacher, type TeacherClass } from "@/composables/useTeacher";

const {
  loading,
  error,
  fetchTeacherClasses,
  createClass,
  updateClass,
  deleteClass,
  fetchSubjects,
  fetchSchoolYears,
} = useTeacher();

const classes = ref<TeacherClass[]>([]);
const subjects = ref<any[]>([]);
const schoolYears = ref<any[]>([]);
const createClassDialog = ref(false);
const deleteDialog = ref(false);
const selectedClass = ref<TeacherClass | null>(null);
const editingClass = ref<TeacherClass | null>(null);
const saving = ref(false);
const deleting = ref(false);

const classFormData = ref({
  subject_id: "",
  section: "",
  school_year_id: "",
  grading_period: 1,
});

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const loadClasses = async () => {
  classes.value = await fetchTeacherClasses();
};

const loadSubjects = async () => {
  subjects.value = await fetchSubjects();
};

const loadSchoolYears = async () => {
  schoolYears.value = await fetchSchoolYears();
};

const openEditClass = (cls: TeacherClass) => {
  editingClass.value = cls;
  classFormData.value = {
    subject_id: cls.subject_id,
    section: cls.section,
    school_year_id: cls.school_year_id,
    grading_period: cls.grading_period,
  };
  createClassDialog.value = true;
};

const openDeleteClass = (cls: TeacherClass) => {
  selectedClass.value = cls;
  deleteDialog.value = true;
};

const handleSaveClass = async () => {
  saving.value = true;
  try {
    if (editingClass.value) {
      // Update
      const success = await updateClass(editingClass.value.id, {
        section: classFormData.value.section,
        grading_period: classFormData.value.grading_period,
      });

      if (success) {
        snackbar.value = {
          show: true,
          message: "Class updated successfully",
          color: "success",
        };
        createClassDialog.value = false;
        editingClass.value = null;
        await loadClasses();
      }
    } else {
      // Create
      const result = await createClass(classFormData.value);
      if (result) {
        snackbar.value = {
          show: true,
          message: "Class created successfully",
          color: "success",
        };
        createClassDialog.value = false;
        await loadClasses();
      }
    }

    classFormData.value = {
      subject_id: "",
      section: "",
      school_year_id: "",
      grading_period: 1,
    };
  } finally {
    saving.value = false;
  }
};

const handleDeleteClass = async () => {
  if (!selectedClass.value) return;

  deleting.value = true;
  try {
    const success = await deleteClass(selectedClass.value.id);
    if (success) {
      snackbar.value = {
        show: true,
        message: "Class deleted successfully",
        color: "success",
      };
      deleteDialog.value = false;
      selectedClass.value = null;
      await loadClasses();
    }
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadClasses(), loadSubjects(), loadSchoolYears()]);
});
</script>
