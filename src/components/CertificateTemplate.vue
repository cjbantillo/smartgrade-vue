<template>
  <v-card class="certificate-card" elevation="8">
    <v-card-text class="certificate-container pa-8">
      <!-- Certificate Border -->
      <div class="certificate-border">
        <!-- Header -->
        <div class="certificate-header text-center mb-6">
          <h1 class="text-h4 font-weight-bold text-primary mb-2">
            REPUBLIC OF THE PHILIPPINES
          </h1>
          <h2 class="text-h5 font-weight-medium mb-2">
            DEPARTMENT OF EDUCATION
          </h2>
          <h3 class="text-h6 mb-2">
            AMPAYON NATIONAL HIGH SCHOOL - SENIOR HIGH SCHOOL
          </h3>
          <p class="text-subtitle-1 text-medium-emphasis">
            Ampayon, Butuan City
          </p>
        </div>

        <!-- Certificate Title -->
        <div class="text-center my-8">
          <h1 class="text-h3 font-weight-bold certificate-title">
            CERTIFICATE OF {{ certificateTitle }}
          </h1>
          <v-divider
            class="mx-auto my-4"
            color="primary"
            :thickness="2"
            :width="200"
          />
        </div>

        <!-- Certificate Body -->
        <div class="certificate-body text-center px-8 my-8">
          <p class="text-h6 mb-6">This is to certify that</p>

          <h2 class="text-h4 font-weight-bold text-primary my-6">
            {{ fullName }}
          </h2>

          <p class="text-h6 mb-4">LRN: {{ certificate.student.lrn }}</p>

          <p
            v-if="certificate.certificate_type === 'honors'"
            class="text-h6 mb-6"
          >
            has successfully completed Grade
            {{ certificate.student.grade_level }} -
            {{ certificate.student.track }} ({{ certificate.student.strand }})
            <br>for the School Year {{ certificate.school_year.year_code }}
            <br>with a General Average of
            <strong class="text-primary">{{
              certificate.general_average.toFixed(2)
            }}</strong>
            <br>and is hereby recognized as
          </p>

          <p
            v-else-if="certificate.certificate_type === 'good_moral'"
            class="text-h6 mb-6"
          >
            has maintained <strong>Good Moral Character</strong> throughout the
            School Year <br>{{ certificate.school_year.year_code }}
            <br>while enrolled in Grade
            {{ certificate.student.grade_level }} -
            {{ certificate.student.track }} ({{ certificate.student.strand }})
          </p>

          <p v-else class="text-h6 mb-6">
            has successfully completed the requirements for Grade
            {{ certificate.student.grade_level }} <br>{{
              certificate.student.track
            }}
            ({{ certificate.student.strand }}) <br>for the School Year
            {{ certificate.school_year.year_code }}
          </p>

          <!-- Honors Designation -->
          <h2
            v-if="
              certificate.certificate_type === 'honors' &&
                certificate.honors_designation
            "
            class="text-h3 font-weight-bold honors-text my-8"
          >
            {{ certificate.honors_designation }}
          </h2>

          <p class="text-body-1 mt-8 mb-4">
            Given this {{ formattedDate }} at Ampayon National High School -
            Senior High School.
          </p>
        </div>

        <!-- QR Code and Verification -->
        <div class="qr-section text-center my-6">
          <div
            class="qr-code-wrapper d-inline-block pa-4 bg-white"
            style="border: 2px solid #333"
          >
            <qrcode-vue
              level="H"
              render-as="svg"
              :size="120"
              :value="verificationUrl"
            />
          </div>
          <p class="text-caption mt-2 text-medium-emphasis">
            Verification Code: {{ certificate.qr_code_url }}
          </p>
          <p class="text-caption text-medium-emphasis">
            Scan QR code or visit: {{ baseUrl }}/verify
          </p>
        </div>

        <!-- Signatures -->
        <v-row class="signatures-section mt-12 px-8">
          <v-col class="text-center" cols="12" md="6">
            <div class="signature-line">
              <p class="signature-name font-weight-bold text-h6 mb-1">
                _____________________________
              </p>
              <p class="text-body-2 text-medium-emphasis">Class Adviser</p>
            </div>
          </v-col>
          <v-col class="text-center" cols="12" md="6">
            <div class="signature-line">
              <p class="signature-name font-weight-bold text-h6 mb-1">
                _____________________________
              </p>
              <p class="text-body-2 text-medium-emphasis">School Principal</p>
            </div>
          </v-col>
        </v-row>

        <!-- Document Footer -->
        <div class="text-center mt-8">
          <p class="text-caption text-medium-emphasis">
            This certificate is not valid without the official school seal and
            signature.
          </p>
          <p class="text-caption text-medium-emphasis">
            Generated on:
            {{ new Date(certificate.generated_at).toLocaleDateString() }}
          </p>
        </div>
      </div>
    </v-card-text>

    <!-- Print Actions -->
    <v-card-actions class="justify-center no-print pa-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-printer"
        size="large"
        @click="printCertificate"
      >
        Print Certificate
      </v-btn>
      <v-btn
        color="secondary"
        prepend-icon="mdi-download"
        size="large"
        variant="outlined"
        @click="downloadPDF"
      >
        Download PDF
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import type { CertificateWithStudent } from '@/composables/useCertificates'
  import QrcodeVue from 'qrcode.vue'
  import { computed } from 'vue'

  interface Props {
    certificate: CertificateWithStudent
  }

  const props = defineProps<Props>()

  // Computed properties
  const fullName = computed(() => {
    const { first_name, middle_name, last_name } = props.certificate.student
    return `${first_name} ${
      middle_name ? middle_name + ' ' : ''
    }${last_name}`.toUpperCase()
  })

  const certificateTitle = computed(() => {
    switch (props.certificate.certificate_type) {
      case 'honors': {
        return 'ACADEMIC EXCELLENCE'
      }
      case 'good_moral': {
        return 'GOOD MORAL CHARACTER'
      }
      case 'completion': {
        return 'COMPLETION'
      }
      default: {
        return 'RECOGNITION'
      }
    }
  })

  const formattedDate = computed(() => {
    return new Date(props.certificate.issued_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  const baseUrl = computed(() => {
    return window.location.origin
  })

  const verificationUrl = computed(() => {
    return `${baseUrl.value}/verify?code=${props.certificate.qr_code_url}`
  })

  // Methods
  function printCertificate () {
    window.print()
  }

  function downloadPDF () {
    // Use browser's print to PDF functionality
    window.print()
  }
</script>

<style scoped>
.certificate-card {
  max-width: 1000px;
  margin: 0 auto;
  background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
}

.certificate-border {
  border: 8px double #1976d2;
  padding: 2rem;
  position: relative;
  background: white;
}

.certificate-border::before {
  content: "";
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border: 2px solid #1976d2;
  pointer-events: none;
}

.certificate-title {
  color: #1976d2;
  letter-spacing: 3px;
}

.honors-text {
  color: #d4af37;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 2px;
}

.signature-line {
  min-height: 80px;
}

.qr-code-wrapper {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Print Styles */
@media print {
  .no-print {
    display: none !important;
  }

  .certificate-card {
    box-shadow: none !important;
    margin: 0;
    max-width: 100%;
  }

  .certificate-border {
    page-break-inside: avoid;
  }

  /* Ensure proper printing */
  @page {
    size: letter portrait;
    margin: 0.5in;
  }
}
</style>
