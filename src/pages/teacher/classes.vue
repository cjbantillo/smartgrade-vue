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
      <v-col class="text-md-right" cols="12" md="4">
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
      <v-col v-for="cls in classes" :key="cls.id" cols="12" lg="4" md="6">
        <v-card hover>
          <v-card-title class="bg-primary">
            <div class="d-flex align-center justify-space-between">
              <span class="text-white">{{ cls.subject_code }}</span>
              <v-chip color="white" size="small" variant="flat">
                {{ cls.section }}
              </v-chip>
            </div>
          </v-card-title>

          <v-card-subtitle class="mt-2">
            {{ cls.subject_name }}
          </v-card-subtitle>

          <v-card-text>
            <div class="mb-2">
              <v-icon class="mr-1" size="small">mdi-calendar</v-icon>
              <span class="text-grey-darken-1">{{ cls.school_year }}</span>
            </div>
            <div class="mb-2">
              <v-icon class="mr-1" size="small">mdi-account-group</v-icon>
              <span class="text-grey-darken-1"
                >{{ cls.student_count }} students</span
              >
            </div>
            <div>
              <v-icon class="mr-1" size="small">mdi-book-open-variant</v-icon>
              <span class="text-grey-darken-1"
                >Quarter {{ cls.grading_period }}</span
              >
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              prepend-icon="mdi-eye"
              variant="text"
              @click="$router.push(`/teacher/classes/${cls.id}`)"
            >
              View Roster
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-dots-vertical" variant="text" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-if="!loading && classes.length === 0">
      <v-col>
        <v-card class="text-center pa-8">
          <v-icon color="grey-lighten-1" size="80">mdi-google-classroom</v-icon>
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
        <v-progress-linear color="primary" indeterminate />
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
              item-title="subject_name"
              item-value="id"
              :items="subjects"
              label="Subject *"
              prepend-icon="mdi-book"
              required
              :rules="[(v) => !!v || 'Subject is required']"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #title>
                    {{ item.raw.subject_code }} - {{ item.raw.subject_name }}
                  </template>
                  <template v-if="item.raw.track" #subtitle>
                    {{ item.raw.track }}
                    {{ item.raw.strand ? `- ${item.raw.strand}` : "" }}
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <v-text-field
              v-model="newClass.section"
              label="Section *"
              placeholder="e.g., STEM A, ABM 1, HUMSS B"
              prepend-icon="mdi-google-classroom"
              required
              :rules="[(v) => !!v || 'Section is required']"
            />

            <v-select
              v-model="newClass.school_year_id"
              item-title="year_code"
              item-value="id"
              :items="schoolYears"
              label="School Year *"
              prepend-icon="mdi-calendar"
              required
              :rules="[(v) => !!v || 'School year is required']"
            />

            <v-select
              v-model="newClass.grading_period"
              :items="[1, 2, 3, 4]"
              label="Grading Period *"
              prepend-icon="mdi-numeric"
              required
              :rules="[(v) => v !== null || 'Grading period is required']"
            />
          </v-form>

          <v-alert v-if="error" class="mt-4" type="error">
            {{ error }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="loading" variant="text" @click="closeCreateDialog">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="loading" @click="handleCreateClass">
            Create Class
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
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
