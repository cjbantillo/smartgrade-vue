<route lang="yaml">
meta:
  layout: teacher
</route>

<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <h1 class="text-h4">My Classes</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          Manage your classes and student enrollments
        </p>
      </v-col>
      <v-col cols="12" md="4" class="text-md-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createDialog = true"
        >
          Create Class
        </v-btn>
      </v-col>
    </v-row>

    <!-- Class Cards Grid -->
    <v-row v-if="!loading && classes.length > 0">
      <v-col v-for="cls in classes" :key="cls.id" cols="12" md="6" lg="4">
        <v-card hover>
          <v-card-title class="bg-primary">
            <div class="d-flex align-center justify-space-between">
              <span class="text-white">{{ cls.subject_code }}</span>
              <v-chip size="small" color="white" variant="flat">
                {{ cls.section }}
              </v-chip>
            </div>
          </v-card-title>

          <v-card-subtitle class="mt-2">
            {{ cls.subject_name }}
          </v-card-subtitle>

          <v-card-text>
            <div class="mb-2">
              <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
              <span class="text-grey-darken-1">{{ cls.school_year }}</span>
            </div>
            <div class="mb-2">
              <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
              <span class="text-grey-darken-1"
                >{{ cls.student_count }} students</span
              >
            </div>
            <div>
              <v-icon size="small" class="mr-1">mdi-book-open-variant</v-icon>
              <span class="text-grey-darken-1"
                >Quarter {{ cls.grading_period }}</span
              >
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-eye"
              @click="$router.push(`/teacher/classes/${cls.id}`)"
            >
              View Roster
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn variant="text" icon="mdi-dots-vertical"> </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-if="!loading && classes.length === 0">
      <v-col>
        <v-card class="text-center pa-8">
          <v-icon size="80" color="grey-lighten-1">mdi-google-classroom</v-icon>
          <h2 class="text-h5 mt-4 mb-2">No Classes Yet</h2>
          <p class="text-grey-darken-1 mb-4">
            Create your first class to start managing student enrollments and
            grades.
          </p>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="createDialog = true"
          >
            Create Your First Class
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col>
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </v-col>
    </v-row>

    <!-- Create Class Dialog -->
    <v-dialog v-model="createDialog" max-width="600">
      <v-card>
        <v-card-title class="bg-primary text-white">
          Create New Class
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="createForm">
            <v-autocomplete
              v-model="newClass.subject_id"
              :items="subjects"
              item-title="name"
              item-value="id"
              label="Subject *"
              prepend-icon="mdi-book"
              :rules="[(v) => !!v || 'Subject is required']"
              required
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    {{ item.raw.code }} - {{ item.raw.name }}
                  </template>
                  <template v-slot:subtitle v-if="item.raw.track">
                    {{ item.raw.track }}
                    {{ item.raw.strand ? `- ${item.raw.strand}` : "" }}
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <v-text-field
              v-model="newClass.section"
              label="Section *"
              prepend-icon="mdi-google-classroom"
              placeholder="e.g., STEM A, ABM 1, HUMSS B"
              :rules="[(v) => !!v || 'Section is required']"
              required
            ></v-text-field>

            <v-select
              v-model="newClass.school_year_id"
              :items="schoolYears"
              item-title="year"
              item-value="id"
              label="School Year *"
              prepend-icon="mdi-calendar"
              :rules="[(v) => !!v || 'School year is required']"
              required
            ></v-select>

            <v-select
              v-model="newClass.grading_period"
              :items="[1, 2, 3, 4]"
              label="Grading Period *"
              prepend-icon="mdi-numeric"
              :rules="[(v) => v !== null || 'Grading period is required']"
              required
            ></v-select>
          </v-form>

          <v-alert v-if="error" type="error" class="mt-4">
            {{ error }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeCreateDialog" :disabled="loading">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="handleCreateClass" :loading="loading">
            Create Class
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useTeacher } from "@/composables/useTeacher";

const {
  loading,
  error,
  fetchTeacherClasses,
  createClass,
  fetchSubjects,
  fetchSchoolYears,
} = useTeacher();

const classes = ref<any[]>([]);
const subjects = ref<any[]>([]);
const schoolYears = ref<any[]>([]);
const createDialog = ref(false);
const createForm = ref<any>(null);

const newClass = ref({
  subject_id: "",
  section: "",
  school_year_id: "",
  grading_period: null as number | null,
});

async function loadData() {
  classes.value = await fetchTeacherClasses();
  subjects.value = await fetchSubjects();
  schoolYears.value = await fetchSchoolYears();

  // Pre-select active school year if available
  const activeYear = schoolYears.value.find((y) => y.is_active);
  if (activeYear) {
    newClass.value.school_year_id = activeYear.id;
  }
}

async function handleCreateClass() {
  const { valid } = await createForm.value.validate();
  if (!valid) return;

  const result = await createClass({
    subject_id: newClass.value.subject_id,
    section: newClass.value.section,
    school_year_id: newClass.value.school_year_id,
    grading_period: newClass.value.grading_period!,
  });

  if (result) {
    classes.value.unshift(result);
    closeCreateDialog();
  }
}

function closeCreateDialog() {
  createDialog.value = false;
  createForm.value?.reset();
  newClass.value = {
    subject_id: "",
    section: "",
    school_year_id: schoolYears.value.find((y) => y.is_active)?.id || "",
    grading_period: null,
  };
  error.value = null;
}

onMounted(() => {
  loadData();
});
</script>
