<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-lg shadow-lg p-8 text-center">
        <v-progress-circular
          class="mb-4"
          color="primary"
          indeterminate
          size="64"
        />
        <p class="text-gray-600">Verifying certificate...</p>
      </div>

      <!-- Verified Certificate -->
      <div
        v-else-if="certificate && !error"
        class="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <!-- Success Header -->
        <div class="bg-green-600 text-white p-6 text-center">
          <v-icon class="mb-2" size="64">mdi-check-circle</v-icon>
          <h1 class="text-2xl font-bold">VERIFIED AUTHENTIC</h1>
          <p class="text-green-100 mt-2">
            This certificate has been verified as authentic
          </p>
        </div>

        <!-- Certificate Details -->
        <div class="p-8">
          <!-- School Logo Placeholder -->
          <div class="flex justify-center mb-6">
            <div
              class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center"
            >
              <v-icon color="primary" size="48">mdi-school</v-icon>
            </div>
          </div>

          <!-- Certificate Information -->
          <div class="space-y-4">
            <div class="text-center border-b pb-4">
              <h2 class="text-xl font-semibold text-gray-800 mb-1">
                {{ certificate.certificate_type }}
              </h2>
              <p class="text-sm text-gray-500">Certificate Type</p>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="border-l-4 border-blue-500 pl-4">
                <p class="text-sm text-gray-500 mb-1">Student Name</p>
                <p class="font-semibold text-gray-800">
                  {{ certificate.student_name }}
                </p>
              </div>

              <div class="border-l-4 border-blue-500 pl-4">
                <p class="text-sm text-gray-500 mb-1">Certificate ID</p>
                <p class="font-mono text-sm text-gray-800">
                  {{ certificate.certificate_id }}
                </p>
              </div>

              <div class="border-l-4 border-blue-500 pl-4">
                <p class="text-sm text-gray-500 mb-1">Date Issued</p>
                <p class="font-semibold text-gray-800">
                  {{ formatDate(certificate.issued_date) }}
                </p>
              </div>

              <div class="border-l-4 border-blue-500 pl-4">
                <p class="text-sm text-gray-500 mb-1">Status</p>
                <v-chip class="font-semibold" color="green" size="small">
                  <v-icon size="small" start>mdi-check</v-icon>
                  Valid
                </v-chip>
              </div>
            </div>

            <!-- Security Notice -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div class="flex gap-3">
                <v-icon color="blue">mdi-information</v-icon>
                <div class="text-sm text-blue-800">
                  <p class="font-semibold mb-1">Security Information</p>
                  <p>
                    This certificate has been securely verified through our
                    system. The QR code on the certificate links directly to
                    this verification page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Disclaimer -->
          <div class="mt-6 pt-6 border-t text-center">
            <p class="text-xs text-gray-500">
              This is a public verification page. Detailed grades and sensitive
              information are not displayed for privacy protection.
            </p>
            <p class="text-xs text-gray-500 mt-2">
              For official inquiries, please contact the issuing institution
              directly.
            </p>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <!-- Error Header -->
        <div class="bg-red-600 text-white p-6 text-center">
          <v-icon class="mb-2" size="64">mdi-alert-circle</v-icon>
          <h1 class="text-2xl font-bold">INVALID OR REVOKED</h1>
          <p class="text-red-100 mt-2">
            This certificate could not be verified
          </p>
        </div>

        <!-- Error Details -->
        <div class="p-8">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex gap-3">
              <v-icon color="red">mdi-alert</v-icon>
              <div class="text-sm text-red-800">
                <p class="font-semibold mb-2">Verification Failed</p>
                <p>{{ error }}</p>
                <p class="mt-3">Possible reasons:</p>
                <ul class="list-disc ml-5 mt-2 space-y-1">
                  <li>The certificate ID is incorrect or invalid</li>
                  <li>
                    The certificate has been revoked by the issuing institution
                  </li>
                  <li>The certificate does not exist in our records</li>
                  <li>The verification link may have expired</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 mb-4">
              If you believe this is an error, please contact the issuing
              institution with the certificate ID:
            </p>
            <p
              class="font-mono text-sm font-semibold text-gray-800 bg-gray-100 p-2 rounded"
            >
              {{ route.params.id }}
            </p>
          </div>
        </div>
      </div>

      <!-- Back to Home Link -->
      <div class="text-center mt-6">
        <router-link
          class="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
          to="/"
        >
          <v-icon size="small">mdi-arrow-left</v-icon>
          Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useCertificates } from "@/composables/useCertificates";

interface VerifiedCertificate {
  certificate_id: string;
  certificate_type: string;
  student_name: string;
  issued_date: string;
  qr_code_url: string | null;
}

const route = useRoute<"/verify/[id]">();
const { verifyCertificate } = useCertificates();

const loading = ref(true);
const error = ref<string | null>(null);
const certificate = ref<VerifiedCertificate | null>(null);

onMounted(async () => {
  const certificateId = String(route.params.id || "");

  if (!certificateId) {
    error.value = "No certificate ID provided";
    loading.value = false;
    return;
  }

  try {
    const result = await verifyCertificate(certificateId);

    if (result.valid && result.certificate) {
      const cert = result.certificate;
      certificate.value = {
        certificate_id: cert.id,
        certificate_type: formatCertificateType(cert.certificate_type),
        student_name: `${cert.student.first_name} ${
          cert.student.middle_name ? `${cert.student.middle_name} ` : ""
        }${cert.student.last_name}`,
        issued_date: cert.issued_date,
        qr_code_url: cert.qr_code_url,
      };
    } else {
      error.value = result.error || "Certificate verification failed";
    }
  } catch (error_) {
    console.error("Verification error:", error_);
    error.value = "An unexpected error occurred during verification";
  } finally {
    loading.value = false;
  }
});

function formatCertificateType(type: string): string {
  const types: Record<string, string> = {
    honors: "Certificate of Honors",
    good_moral: "Certificate of Good Moral Character",
    completion: "Certificate of Completion",
  };
  return types[type] || type;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
