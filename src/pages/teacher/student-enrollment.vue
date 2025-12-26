<template>
  <div class="pa-6">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h2>{{ selectedClass?.subject_name }}</h2>
          <p class="text-subtitle-2 text-medium-emphasis">
            Section {{ selectedClass?.section }} -
            {{ selectedClass?.school_year }}
          </p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="enrollDialog = true"
        >
          Enroll Student
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

        <!-- Enrolled Students List -->
        <v-empty-state
          v-if="!loading && enrolledStudents.length === 0"
          icon="mdi-account-multiple"
          headline="No Students Enrolled"
          text="Start by enrolling students to this class"
        />

        <v-table v-else hover>
          <thead>
            <tr>
              <th>LRN</th>
              <th>Name</th>
              <th>Grade Level</th>
              <th>Track/Strand</th>
              <th>Enrolled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in enrolledStudents" :key="student.id">
              <td>{{ student.lrn }}</td>
              <td>{{ student.first_name }} {{ student.last_name }}</td>
              <td>{{ student.grade_level }}</td>
              <td>
                {{ student.track }}
                <span v-if="student.strand">/ {{ student.strand }}</span>
              </td>
              <td>{{ formatDate(student.enrolled_at) }}</td>
              <td>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  :loading="unenrolling === student.id"
                  @click="handleUnenroll(student.id)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Enroll Student Dialog -->
    <v-dialog v-model="enrollDialog" max-width="600">
      <v-card>
        <v-card-title>Enroll Student</v-card-title>

        <v-card-text>
          <v-text-field
            v-model="searchQuery"
            label="Search by LRN, name, or email"
            prepend-icon="mdi-magnify"
            clearable
            @update:model-value="handleSearch"
          />

          <v-list v-if="searchResults.length > 0" class="mt-4">
            <v-list-item
              v-for="student in searchResults"
              :key="student.id"
              @click="handleEnroll(student)"
            >
              <v-list-item-title>
                {{ student.first_name }} {{ student.last_name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                LRN: {{ student.lrn }} | Grade {{ student.grade_level }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-empty-state
            v-else
            icon="mdi-magnify"
            headline="No Results"
            text="Search for students to enroll"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="enrollDialog = false">Close</v-btn>
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
import { useRoute } from "vue-router";
import {
  useTeacher,
  type ClassStudent,
  type StudentSearchResult,
  type TeacherClass,
} from "@/composables/useTeacher";

const route = useRoute();
const classId = route.params.id as string;

const {
  loading,
  error,
  fetchTeacherClasses,
  fetchClassStudents,
  searchStudents,
  enrollStudent,
  unenrollStudent,
} = useTeacher();

const selectedClass = ref<TeacherClass | null>(null);
const enrolledStudents = ref<ClassStudent[]>([]);
const searchResults = ref<StudentSearchResult[]>([]);
const enrollDialog = ref(false);
const searchQuery = ref("");
const unenrolling = ref<string | null>(null);

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const loadClassDetails = async () => {
  const classes = await fetchTeacherClasses();
  selectedClass.value = classes.find((c) => c.id === classId) || null;
};

const loadEnrolledStudents = async () => {
  enrolledStudents.value = await fetchClassStudents(classId);
};

const handleSearch = async (query: string) => {
  if (!query || query.trim().length < 2) {
    searchResults.value = [];
    return;
  }

  searchResults.value = await searchStudents(query);
};

const handleEnroll = async (student: StudentSearchResult) => {
  const success = await enrollStudent(classId, student.id);

  if (success) {
    snackbar.value = {
      show: true,
      message: `${student.first_name} ${student.last_name} enrolled successfully`,
      color: "success",
    };
    searchQuery.value = "";
    searchResults.value = [];
    await loadEnrolledStudents();
  } else {
    snackbar.value = {
      show: true,
      message: error.value || "Failed to enroll student",
      color: "error",
    };
  }
};

const handleUnenroll = async (enrollmentId: string) => {
  unenrolling.value = enrollmentId;
  const success = await unenrollStudent(enrollmentId);
  unenrolling.value = null;

  if (success) {
    snackbar.value = {
      show: true,
      message: "Student unenrolled successfully",
      color: "success",
    };
    await loadEnrolledStudents();
  } else {
    snackbar.value = {
      show: true,
      message: error.value || "Failed to unenroll student",
      color: "error",
    };
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(async () => {
  await Promise.all([loadClassDetails(), loadEnrolledStudents()]);
});
</script>
