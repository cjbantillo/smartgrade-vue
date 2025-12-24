<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 font-weight-bold mb-2">Student Dashboard</h1>
        <p class="text-h6 text-medium-emphasis mb-6" v-if="studentInfo">
          Welcome, {{ studentInfo.first_name }} {{ studentInfo.last_name }}!
        </p>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="text-h6 mt-4">Loading your dashboard...</p>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Dashboard Content -->
    <template v-else>
      <!-- Student Information Card -->
      <v-row>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="bg-primary">
              <v-icon start>mdi-account-circle</v-icon>
              Student Information
            </v-card-title>
            <v-card-text class="pa-4" v-if="studentInfo">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis"
                    >LRN</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-h6">{{
                    studentInfo.lrn
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis"
                    >Full Name</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-body-1">
                    {{ studentInfo.first_name }} {{ studentInfo.middle_name }}
                    {{ studentInfo.last_name }}
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis"
                    >Grade Level</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-h6">{{
                    studentInfo.grade_level
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis"
                    >Track</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-h6">{{
                    studentInfo.track
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis"
                    >Strand</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-h6">{{
                    studentInfo.strand
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="studentInfo.section">
                  <v-list-item-title class="text-caption text-medium-emphasis"
                    >Section</v-list-item-title
                  >
                  <v-list-item-subtitle class="text-h6">{{
                    studentInfo.section
                  }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Current GPA Card -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="bg-success">
              <v-icon start>mdi-chart-line</v-icon>
              Academic Performance
            </v-card-title>
            <v-card-text class="pa-6 text-center" v-if="currentGPA">
              <p class="text-body-2 text-medium-emphasis mb-2">
                School Year {{ currentGPA.school_year_code }}
              </p>
              <p class="text-h1 font-weight-bold mb-2" :class="gpaColor">
                {{ currentGPA.general_average.toFixed(2) }}
              </p>
              <p class="text-h6 text-medium-emphasis mb-4">General Average</p>

              <v-chip
                v-if="currentGPA.honors_designation"
                :color="honorsColor"
                size="large"
                variant="elevated"
                class="mb-2"
              >
                <v-icon start>mdi-medal</v-icon>
                {{ currentGPA.honors_designation }}
              </v-chip>

              <v-chip
                v-else-if="currentGPA.is_finalized"
                color="blue"
                variant="tonal"
              >
                Grades Finalized
              </v-chip>

              <v-chip v-else color="grey" variant="tonal">
                Grades Not Yet Finalized
              </v-chip>
            </v-card-text>
            <v-card-text class="pa-6 text-center" v-else>
              <v-icon size="64" color="grey-lighten-1"
                >mdi-chart-line-variant</v-icon
              >
              <p class="text-body-1 text-medium-emphasis mt-4">
                No GPA data available yet
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Quick Stats Card -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="bg-secondary">
              <v-icon start>mdi-file-document-multiple</v-icon>
              Available Documents
            </v-card-title>
            <v-card-text class="pa-4">
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-file-document</v-icon>
                  </template>
                  <v-list-item-title>SF9 Reports</v-list-item-title>
                  <v-list-item-subtitle
                    >{{ sf9Count }} available</v-list-item-subtitle
                  >
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="secondary">mdi-folder-open</v-icon>
                  </template>
                  <v-list-item-title>SF10 Record</v-list-item-title>
                  <v-list-item-subtitle>{{
                    sf10Available ? "Available" : "Not available"
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="purple">mdi-certificate</v-icon>
                  </template>
                  <v-list-item-title>Certificates</v-list-item-title>
                  <v-list-item-subtitle
                    >{{ certificatesCount }} earned</v-list-item-subtitle
                  >
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-4">
        <v-col cols="12">
          <h2 class="text-h5 font-weight-bold mb-4">Quick Access</h2>
        </v-col>
        <v-col cols="12" md="3">
          <v-card hover @click="router.push('/student/grades')">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="primary">mdi-book-open-variant</v-icon>
              <h3 class="text-h6 mt-4">View Grades</h3>
              <p class="text-caption text-medium-emphasis">
                See your quarterly and final grades
              </p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card hover @click="router.push('/student/documents')">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="secondary"
                >mdi-file-document-multiple</v-icon
              >
              <h3 class="text-h6 mt-4">Documents</h3>
              <p class="text-caption text-medium-emphasis">
                Access SF9 and SF10 reports
              </p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card hover @click="router.push('/student/certificates')">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="purple">mdi-certificate</v-icon>
              <h3 class="text-h6 mt-4">Certificates</h3>
              <p class="text-caption text-medium-emphasis">
                View your earned certificates
              </p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card hover @click="router.push('/verify')">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="info">mdi-shield-check</v-icon>
              <h3 class="text-h6 mt-4">Verify</h3>
              <p class="text-caption text-medium-emphasis">
                Verify certificate authenticity
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- GPA History -->
      <v-row class="mt-4" v-if="gpaHistory.length > 0">
        <v-col cols="12">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">
              <v-icon start>mdi-history</v-icon>
              GPA History
            </v-card-title>
            <v-card-text class="pa-4">
              <v-list>
                <v-list-item
                  v-for="gpa in gpaHistory"
                  :key="gpa.school_year_id"
                >
                  <template v-slot:prepend>
                    <v-icon :color="getGPAColorByValue(gpa.general_average)">
                      mdi-chart-box
                    </v-icon>
                  </template>
                  <v-list-item-title>{{
                    gpa.school_year_code
                  }}</v-list-item-title>
                  <v-list-item-subtitle>
                    GPA: {{ gpa.general_average.toFixed(2) }}
                    <v-chip
                      v-if="gpa.honors_designation"
                      size="small"
                      :color="getHonorsColorByValue(gpa.general_average)"
                      class="ml-2"
                    >
                      {{ gpa.honors_designation }}
                    </v-chip>
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip
                      :color="gpa.is_finalized ? 'success' : 'grey'"
                      size="small"
                      variant="tonal"
                    >
                      {{ gpa.is_finalized ? "Finalized" : "Draft" }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  useStudent,
  type StudentInfo,
  type StudentGPA,
} from "@/composables/useStudent";

const router = useRouter();
const {
  loading,
  error,
  fetchStudentInfo,
  fetchStudentGPA,
  fetchStudentDocuments,
  fetchStudentCertificates,
} = useStudent();

// Component state
const studentInfo = ref<StudentInfo | null>(null);
const gpaHistory = ref<StudentGPA[]>([]);
const documents = ref<any[]>([]);
const certificates = ref<any[]>([]);

// Computed properties
const currentGPA = computed(() => {
  return (
    gpaHistory.value.find((gpa) => gpa.is_finalized) ||
    gpaHistory.value[0] ||
    null
  );
});

const gpaColor = computed(() => {
  if (!currentGPA.value) return "text-grey";
  return getGPAColorClass(currentGPA.value.general_average);
});

const honorsColor = computed(() => {
  if (!currentGPA.value) return "grey";
  return getHonorsColorByValue(currentGPA.value.general_average);
});

const sf9Count = computed(() => {
  return documents.value.filter((d) => d.type === "SF9").length;
});

const sf10Available = computed(() => {
  return documents.value.some((d) => d.type === "SF10");
});

const certificatesCount = computed(() => {
  return certificates.value.length;
});

// Methods
function getGPAColorClass(gpa: number): string {
  if (gpa >= 98) return "text-purple";
  if (gpa >= 95) return "text-deep-purple";
  if (gpa >= 90) return "text-indigo";
  if (gpa >= 85) return "text-blue";
  if (gpa >= 75) return "text-green";
  return "text-grey";
}

function getGPAColorByValue(gpa: number): string {
  if (gpa >= 98) return "purple";
  if (gpa >= 95) return "deep-purple";
  if (gpa >= 90) return "indigo";
  if (gpa >= 85) return "blue";
  if (gpa >= 75) return "green";
  return "grey";
}

function getHonorsColorByValue(gpa: number): string {
  if (gpa >= 98) return "purple";
  if (gpa >= 95) return "deep-purple";
  if (gpa >= 90) return "indigo";
  return "grey";
}

async function loadDashboardData() {
  // Fetch all data in parallel
  const [info, gpa, docs, certs] = await Promise.all([
    fetchStudentInfo(),
    fetchStudentGPA(),
    fetchStudentDocuments(),
    fetchStudentCertificates(),
  ]);

  studentInfo.value = info;
  gpaHistory.value = gpa;
  documents.value = docs;
  certificates.value = certs;
}

onMounted(() => {
  loadDashboardData();
});
</script>

<route lang="yaml">
meta:
  requiresAuth: true
  requiresRole: student
  layout: student
</route>

<style scoped>
.v-card:hover {
  cursor: pointer;
  transform: translateY(-2px);
  transition: transform 0.2s;
}
</style>
