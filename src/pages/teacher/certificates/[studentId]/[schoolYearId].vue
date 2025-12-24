<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">Generate Certificate</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          Generate official certificates for students with finalized grades
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
        <p class="text-h6 mt-4">Loading student information...</p>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
        <v-btn color="primary" class="mt-4" @click="router.back()">
          Go Back
        </v-btn>
      </v-col>
    </v-row>

    <!-- Certificate Generation Form -->
    <template v-else-if="!generatedCertificate">
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="bg-primary">
              <span class="text-h6">Student Information</span>
            </v-card-title>
            <v-card-text class="pa-6" v-if="studentInfo">
              <v-row>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">Full Name</p>
                  <p class="text-h6">{{ studentFullName }}</p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">LRN</p>
                  <p class="text-h6">{{ studentInfo.lrn }}</p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Grade Level
                  </p>
                  <p class="text-h6">{{ studentInfo.grade_level }}</p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-body-2 text-medium-emphasis mb-1">Track</p>
                  <p class="text-h6">{{ studentInfo.track }}</p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-body-2 text-medium-emphasis mb-1">Strand</p>
                  <p class="text-h6">{{ studentInfo.strand }}</p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    School Year
                  </p>
                  <p class="text-h6">{{ schoolYearInfo?.year_code }}</p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    General Average
                  </p>
                  <p class="text-h6">
                    <v-chip :color="gpaColor" variant="elevated" size="large">
                      {{ gpa.toFixed(2) }}
                    </v-chip>
                  </p>
                </v-col>
                <v-col cols="12" v-if="honorsDesignation">
                  <v-alert type="success" variant="tonal">
                    <strong>{{ honorsDesignation }}</strong>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="bg-secondary">
              <span class="text-h6">Select Certificate Type</span>
            </v-card-title>
            <v-card-text class="pa-4">
              <v-radio-group v-model="selectedType">
                <v-radio
                  value="honors"
                  :disabled="!honorsDesignation"
                  color="primary"
                >
                  <template v-slot:label>
                    <div>
                      <strong>Honors Certificate</strong>
                      <p class="text-caption text-medium-emphasis">
                        For students with GPA ≥ 90
                      </p>
                    </div>
                  </template>
                </v-radio>
                <v-divider class="my-2"></v-divider>
                <v-radio value="good_moral" color="primary">
                  <template v-slot:label>
                    <div>
                      <strong>Good Moral Character</strong>
                      <p class="text-caption text-medium-emphasis">
                        Certificate of good conduct
                      </p>
                    </div>
                  </template>
                </v-radio>
                <v-divider class="my-2"></v-divider>
                <v-radio value="completion" color="primary">
                  <template v-slot:label>
                    <div>
                      <strong>Certificate of Completion</strong>
                      <p class="text-caption text-medium-emphasis">
                        Completion of grade level
                      </p>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-alert
                v-if="selectedType === 'honors' && !honorsDesignation"
                type="warning"
                variant="tonal"
                class="mt-4"
              >
                Student does not qualify for honors (GPA must be 90 or above)
              </v-alert>

              <v-btn
                color="primary"
                size="large"
                block
                class="mt-4"
                :disabled="
                  !selectedType ||
                  (selectedType === 'honors' && !honorsDesignation) ||
                  generating
                "
                :loading="generating"
                @click="handleGenerate"
              >
                <v-icon start>mdi-certificate</v-icon>
                Generate Certificate
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Existing Certificates -->
          <v-card class="mt-4" v-if="existingCertificates.length > 0">
            <v-card-title class="bg-grey-lighten-3">
              <span class="text-subtitle-1">Existing Certificates</span>
            </v-card-title>
            <v-list>
              <v-list-item v-for="cert in existingCertificates" :key="cert.id">
                <template v-slot:prepend>
                  <v-icon color="success">mdi-certificate</v-icon>
                </template>
                <v-list-item-title>{{
                  getCertificateTypeName(cert.certificate_type)
                }}</v-list-item-title>
                <v-list-item-subtitle>
                  Issued: {{ new Date(cert.issued_date).toLocaleDateString() }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    @click="viewCertificate(cert)"
                  >
                    View
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Generated Certificate Display -->
    <v-row v-else>
      <v-col cols="12">
        <v-alert type="success" variant="tonal" class="mb-4">
          <v-icon start>mdi-check-circle</v-icon>
          Certificate generated successfully!
        </v-alert>

        <CertificateTemplate :certificate="generatedCertificate" />

        <div class="text-center mt-6">
          <v-btn
            color="secondary"
            variant="outlined"
            size="large"
            @click="generateAnother"
          >
            Generate Another Certificate
          </v-btn>
          <v-btn
            color="primary"
            size="large"
            class="ml-2"
            @click="router.back()"
          >
            Back to Class
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  useCertificates,
  type CertificateType,
  type CertificateWithStudent,
} from "@/composables/useCertificates";
import { supabase } from "@/services/supabase";
import CertificateTemplate from "@/components/CertificateTemplate.vue";

const route = useRoute();
const router = useRouter();
const {
  loading: certLoading,
  error: certError,
  generateCertificate,
  fetchStudentCertificates,
  getStudentGPA,
} = useCertificates();

// Route params
const studentId = route.params.studentId as string;
const schoolYearId = route.params.schoolYearId as string;

// Component state
const loading = ref(true);
const error = ref<string | null>(null);
const generating = ref(false);
const studentInfo = ref<any>(null);
const schoolYearInfo = ref<any>(null);
const gpa = ref(0);
const honorsDesignation = ref<string | null>(null);
const selectedType = ref<CertificateType>("good_moral");
const generatedCertificate = ref<CertificateWithStudent | null>(null);
const existingCertificates = ref<CertificateWithStudent[]>([]);

// Computed properties
const studentFullName = computed(() => {
  if (!studentInfo.value) return "";
  const { first_name, middle_name, last_name } = studentInfo.value;
  return `${first_name} ${middle_name ? middle_name + " " : ""}${last_name}`;
});

const gpaColor = computed(() => {
  if (gpa.value >= 98) return "purple";
  if (gpa.value >= 95) return "deep-purple";
  if (gpa.value >= 90) return "indigo";
  if (gpa.value >= 85) return "blue";
  if (gpa.value >= 75) return "green";
  return "grey";
});

// Methods
async function loadStudentData() {
  loading.value = true;
  error.value = null;

  try {
    // Fetch student info
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      error.value = "Student not found";
      return;
    }

    studentInfo.value = student;

    // Fetch school year info
    const { data: schoolYear, error: schoolYearError } = await supabase
      .from("school_years")
      .select("*")
      .eq("id", schoolYearId)
      .single();

    if (schoolYearError || !schoolYear) {
      error.value = "School year not found";
      return;
    }

    schoolYearInfo.value = schoolYear;

    // Get GPA and honors
    const gpaData = await getStudentGPA(studentId, schoolYearId);
    gpa.value = gpaData.gpa;
    honorsDesignation.value = gpaData.honors;

    // Set default certificate type based on honors
    if (honorsDesignation.value) {
      selectedType.value = "honors";
    }

    // Fetch existing certificates
    const certificates = await fetchStudentCertificates(
      studentId,
      schoolYearId
    );
    existingCertificates.value = certificates;
  } catch (err) {
    console.error("Error loading student data:", err);
    error.value = "Failed to load student information";
  } finally {
    loading.value = false;
  }
}

async function handleGenerate() {
  generating.value = true;

  try {
    const certificate = await generateCertificate(
      studentId,
      schoolYearId,
      selectedType.value
    );

    if (certificate) {
      // Fetch the full certificate with student info
      const certificates = await fetchStudentCertificates(
        studentId,
        schoolYearId
      );
      const fullCertificate = certificates.find((c) => c.id === certificate.id);

      if (fullCertificate) {
        generatedCertificate.value = fullCertificate;
      }
    } else if (certError.value) {
      error.value = certError.value;
    }
  } catch (err) {
    console.error("Error generating certificate:", err);
    error.value = "An unexpected error occurred";
  } finally {
    generating.value = false;
  }
}

function generateAnother() {
  generatedCertificate.value = null;
  selectedType.value = "good_moral";
  loadStudentData(); // Refresh to show new certificate in existing list
}

function viewCertificate(cert: CertificateWithStudent) {
  generatedCertificate.value = cert;
}

function getCertificateTypeName(type: string): string {
  switch (type) {
    case "honors":
      return "Academic Excellence (Honors)";
    case "good_moral":
      return "Good Moral Character";
    case "completion":
      return "Certificate of Completion";
    default:
      return type;
  }
}

onMounted(() => {
  loadStudentData();
});
</script>

<route lang="yaml">
meta:
  requiresAuth: true
  requiresRole: teacher
  layout: teacher
</route>
