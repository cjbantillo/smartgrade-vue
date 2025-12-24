<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My Certificates</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          View your earned certificates and verify their authenticity
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
        <p class="text-h6 mt-4">Loading your certificates...</p>
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

    <!-- No Certificates -->
    <v-row v-else-if="certificates.length === 0">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          <v-icon start>mdi-information</v-icon>
          No certificates earned yet. Certificates will be available after your
          teacher generates them based on your academic performance.
        </v-alert>

        <v-card class="mt-6" color="blue-lighten-5">
          <v-card-text class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-3">
              <v-icon start color="info">mdi-certificate</v-icon>
              Types of Certificates
            </h3>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="purple">mdi-medal</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                  >Academic Excellence (Honors)</v-list-item-title
                >
                <v-list-item-subtitle
                  >For students with GPA of 90 or above</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="blue">mdi-shield-check</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                  >Good Moral Character</v-list-item-title
                >
                <v-list-item-subtitle
                  >Recognition of exemplary conduct and
                  behavior</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="green">mdi-school</v-icon>
                </template>
                <v-list-item-title class="font-weight-bold"
                  >Certificate of Completion</v-list-item-title
                >
                <v-list-item-subtitle
                  >Completion of grade level requirements</v-list-item-subtitle
                >
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Certificates List -->
    <template v-else>
      <v-row>
        <v-col
          v-for="cert in certificates"
          :key="cert.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card hover @click="viewCertificate(cert)">
            <v-card-title
              :class="getCertificateHeaderClass(cert.certificate_type)"
            >
              <v-icon start>{{
                getCertificateIcon(cert.certificate_type)
              }}</v-icon>
              {{ getCertificateName(cert.certificate_type) }}
            </v-card-title>
            <v-card-text class="pa-6">
              <p class="text-body-2 text-medium-emphasis mb-2">School Year</p>
              <p class="text-h6 mb-4">{{ cert.school_years?.year_code }}</p>

              <p class="text-body-2 text-medium-emphasis mb-2">Issue Date</p>
              <p class="text-body-1 mb-4">{{ formatDate(cert.issued_date) }}</p>

              <p class="text-body-2 text-medium-emphasis mb-2">
                Verification Code
              </p>
              <v-chip
                color="primary"
                variant="tonal"
                size="small"
                class="mb-4"
                @click.stop="copyVerificationCode(cert.qr_code_url)"
              >
                <v-icon start size="small">mdi-qrcode</v-icon>
                {{ cert.qr_code_url }}
                <v-icon end size="small">mdi-content-copy</v-icon>
              </v-chip>

              <v-divider class="my-4"></v-divider>

              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  size="small"
                  prepend-icon="mdi-eye"
                  @click.stop="viewCertificate(cert)"
                  block
                >
                  View
                </v-btn>
                <v-btn
                  color="secondary"
                  size="small"
                  prepend-icon="mdi-shield-check"
                  @click.stop="verifyCertificate(cert.qr_code_url)"
                  block
                >
                  Verify
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Information Card -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card color="blue-lighten-5">
            <v-card-text class="pa-6">
              <h3 class="text-h6 font-weight-bold mb-3">
                <v-icon start color="info">mdi-information</v-icon>
                About Your Certificates
              </h3>
              <p class="text-body-2 mb-2">
                All certificates issued by Ampayon National High School - Senior
                High School include a unique verification code and QR code for
                authenticity verification.
              </p>
              <p class="text-body-2 mb-2">
                <strong>To verify a certificate:</strong> Click the "Verify"
                button or visit the verification page and enter the code. Anyone
                can verify certificates without logging in.
              </p>
              <p class="text-body-2 mb-2">
                <strong>Printing:</strong> Click "View" to see the full
                certificate, then use your browser's print function to print or
                save as PDF.
              </p>
              <p class="text-body-2">
                <strong>For official purposes:</strong> Printed certificates
                should include the QR code for verification. The official school
                seal will be added by the registrar's office.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showCopySuccess" color="success" timeout="2000">
      Verification code copied to clipboard!
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStudent } from "@/composables/useStudent";

const router = useRouter();
const { loading, error, fetchStudentCertificates, getStudentId } = useStudent();

// Component state
const certificates = ref<any[]>([]);
const studentId = ref<string | null>(null);
const showCopySuccess = ref(false);

// Methods
function getCertificateName(type: string): string {
  switch (type) {
    case "honors":
      return "Academic Excellence";
    case "good_moral":
      return "Good Moral Character";
    case "completion":
      return "Certificate of Completion";
    default:
      return "Certificate";
  }
}

function getCertificateIcon(type: string): string {
  switch (type) {
    case "honors":
      return "mdi-medal";
    case "good_moral":
      return "mdi-shield-check";
    case "completion":
      return "mdi-school";
    default:
      return "mdi-certificate";
  }
}

function getCertificateHeaderClass(type: string): string {
  switch (type) {
    case "honors":
      return "bg-purple text-white";
    case "good_moral":
      return "bg-blue text-white";
    case "completion":
      return "bg-green text-white";
    default:
      return "bg-grey text-white";
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function copyVerificationCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    showCopySuccess.value = true;
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

function viewCertificate(cert: any) {
  if (studentId.value) {
    router.push(
      `/teacher/certificates/${studentId.value}/${cert.school_year_id}`
    );
  }
}

function verifyCertificate(code: string) {
  router.push(`/verify?code=${code}`);
}

async function loadCertificates() {
  studentId.value = await getStudentId();
  const certs = await fetchStudentCertificates();
  certificates.value = certs;
}

onMounted(() => {
  loadCertificates();
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
