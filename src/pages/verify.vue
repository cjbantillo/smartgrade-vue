<template>
  <v-container class="pa-6" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="8" md="10">
        <!-- Header -->
        <div class="text-center mb-8">
          <v-icon color="primary" size="64">mdi-shield-check</v-icon>
          <h1 class="text-h3 font-weight-bold mt-4 mb-2">
            Certificate Verification
          </h1>
          <p class="text-h6 text-medium-emphasis">
            Verify the authenticity of certificates issued by<br>
            Ampayon National High School - Senior High School
          </p>
        </div>

        <!-- Verification Input -->
        <v-card v-if="!verificationResult" class="mb-6">
          <v-card-title class="bg-primary">
            <v-icon start>mdi-magnify</v-icon>
            Enter Verification Code
          </v-card-title>
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4">
              Enter the verification code found on the certificate or scan the
              QR code to verify its authenticity.
            </p>

            <v-text-field
              v-model="verificationCode"
              class="mb-4"
              :error-messages="inputError"
              label="Verification Code"
              placeholder="CERT-2024-XXXXXXXX"
              prepend-inner-icon="mdi-qrcode"
              variant="outlined"
              @keyup.enter="handleVerify"
            />

            <v-btn
              block
              color="primary"
              :disabled="!verificationCode"
              :loading="verifying"
              size="large"
              @click="handleVerify"
            >
              <v-icon start>mdi-shield-check</v-icon>
              Verify Certificate
            </v-btn>

            <v-divider class="my-6" />

            <div class="text-center">
              <p class="text-body-2 text-medium-emphasis mb-2">
                Verification code format: <code>CERT-YYYY-XXXXXXXX</code>
              </p>
              <p class="text-caption text-medium-emphasis">
                Example: CERT-2024-A1B2C3D4
              </p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Verification Result: VALID -->
        <template
          v-else-if="verificationResult.valid && verificationResult.certificate"
        >
          <v-alert class="mb-6" prominent type="success" variant="elevated">
            <v-row align="center">
              <v-col cols="auto">
                <v-icon size="48">mdi-check-circle</v-icon>
              </v-col>
              <v-col>
                <h3 class="text-h5 font-weight-bold">Certificate is Valid</h3>
                <p class="text-body-1 mt-1">
                  This certificate was issued by Ampayon National High School -
                  Senior High School and is authentic.
                </p>
              </v-col>
            </v-row>
          </v-alert>

          <!-- Certificate Details -->
          <v-card class="mb-6">
            <v-card-title class="bg-success">
              <v-icon start>mdi-certificate</v-icon>
              Certificate Details
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Certificate Type
                  </p>
                  <p class="text-h6 font-weight-bold">
                    {{
                      getCertificateTypeName(
                        verificationResult.certificate.certificate_type
                      )
                    }}
                  </p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Issue Date
                  </p>
                  <p class="text-h6">
                    {{
                      new Date(
                        verificationResult.certificate.issued_date
                      ).toLocaleDateString()
                    }}
                  </p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    School Year
                  </p>
                  <p class="text-h6">
                    {{ verificationResult.certificate.school_year.year_code }}
                  </p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Verification Code
                  </p>
                  <p class="text-h6">
                    <code class="bg-grey-lighten-3 pa-1">{{
                      verificationResult.certificate.qr_code_url
                    }}</code>
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Student Information (Limited) -->
          <v-card class="mb-6">
            <v-card-title class="bg-primary">
              <v-icon start>mdi-account</v-icon>
              Student Information
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">Full Name</p>
                  <p class="text-h6 font-weight-bold">{{ studentFullName }}</p>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Learner Reference Number
                  </p>
                  <p class="text-h6">
                    {{ verificationResult.certificate.student.lrn }}
                  </p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Grade Level
                  </p>
                  <p class="text-h6">
                    {{ verificationResult.certificate.student.grade_level }}
                  </p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-body-2 text-medium-emphasis mb-1">Track</p>
                  <p class="text-h6">
                    {{ verificationResult.certificate.student.track }}
                  </p>
                </v-col>
                <v-col cols="12" md="4">
                  <p class="text-body-2 text-medium-emphasis mb-1">Strand</p>
                  <p class="text-h6">
                    {{ verificationResult.certificate.student.strand }}
                  </p>
                </v-col>

                <!-- Show GPA only for honors certificates -->
                <v-col
                  v-if="
                    verificationResult.certificate.certificate_type === 'honors'
                  "
                  cols="12"
                >
                  <v-divider class="my-2" />
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    General Average
                  </p>
                  <p class="text-h4 font-weight-bold text-primary">
                    {{
                      verificationResult.certificate.general_average.toFixed(2)
                    }}
                  </p>
                  <v-chip
                    v-if="verificationResult.certificate.honors_designation"
                    class="mt-2"
                    color="success"
                    size="large"
                    variant="elevated"
                  >
                    {{ verificationResult.certificate.honors_designation }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Verification Timestamp -->
          <v-card class="mb-6">
            <v-card-text class="text-center py-4 bg-grey-lighten-4">
              <p class="text-body-2 text-medium-emphasis mb-1">
                <v-icon class="mr-1" size="small">mdi-clock-outline</v-icon>
                Verified on: {{ new Date().toLocaleString() }}
              </p>
              <p class="text-caption text-medium-emphasis">
                This verification confirms the certificate was issued by the
                school and has not been revoked.
              </p>
            </v-card-text>
          </v-card>

          <!-- Actions -->
          <div class="text-center">
            <v-btn
              color="primary"
              size="large"
              variant="outlined"
              @click="resetVerification"
            >
              Verify Another Certificate
            </v-btn>
          </div>
        </template>

        <!-- Verification Result: INVALID -->
        <template v-else-if="verificationResult && !verificationResult.valid">
          <v-alert class="mb-6" prominent type="error" variant="elevated">
            <v-row align="center">
              <v-col cols="auto">
                <v-icon size="48">mdi-alert-circle</v-icon>
              </v-col>
              <v-col>
                <h3 class="text-h5 font-weight-bold">Certificate is Invalid</h3>
                <p class="text-body-1 mt-1">
                  {{
                    verificationResult.error ||
                      "The verification code could not be validated."
                  }}
                </p>
              </v-col>
            </v-row>
          </v-alert>

          <v-card class="mb-6">
            <v-card-title class="bg-error">
              <v-icon start>mdi-information</v-icon>
              What This Means
            </v-card-title>
            <v-card-text class="pa-6">
              <p class="text-body-1 mb-4">
                The verification code you entered does not match any certificate
                in our system. This could mean:
              </p>
              <ul class="text-body-2">
                <li>The verification code was entered incorrectly</li>
                <li>The certificate has been revoked</li>
                <li>
                  The certificate was not issued by Ampayon National High School
                  - Senior High School
                </li>
                <li>The certificate is fraudulent</li>
              </ul>
              <v-divider class="my-4" />
              <p class="text-body-2 text-medium-emphasis">
                If you believe this is an error, please contact the school
                administration with the verification code:
                <strong>{{ verificationCode }}</strong>
              </p>
            </v-card-text>
          </v-card>

          <div class="text-center">
            <v-btn
              color="primary"
              size="large"
              variant="outlined"
              @click="resetVerification"
            >
              Try Again
            </v-btn>
          </div>
        </template>

        <!-- Info Card -->
        <v-card class="mt-8 bg-blue-lighten-5">
          <v-card-text class="pa-6">
            <h3 class="text-h6 font-weight-bold mb-3">
              <v-icon color="info" start>mdi-information</v-icon>
              About Certificate Verification
            </h3>
            <p class="text-body-2 mb-2">
              This verification system allows anyone to confirm the authenticity
              of certificates issued by Ampayon National High School - Senior
              High School.
            </p>
            <p class="text-body-2 mb-2">
              Each certificate contains a unique verification code and QR code
              that can be scanned or entered here to verify its authenticity.
            </p>
            <p class="text-body-2">
              For questions or concerns, please contact the school registrar's
              office.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    type CertificateVerification,
    useCertificates,
  } from '@/composables/useCertificates'

  const route = useRoute()
  const { loading: verifying, verifyCertificate } = useCertificates()

  // Component state
  const verificationCode = ref('')
  const inputError = ref<string | null>(null)
  const verificationResult = ref<CertificateVerification | null>(null)

  // Computed properties
  const studentFullName = computed(() => {
    if (!verificationResult.value?.certificate?.student) return ''
    const { first_name, middle_name, last_name }
      = verificationResult.value.certificate.student
    return `${first_name} ${
      middle_name ? middle_name + ' ' : ''
    }${last_name}`.toUpperCase()
  })

  // Methods
  function validateCode (code: string): boolean {
    // Expected format: CERT-YYYY-XXXXXXXX
    const pattern = /^CERT-\d{4}-[A-Z0-9]{8}$/
    return pattern.test(code.toUpperCase())
  }

  async function handleVerify () {
    inputError.value = null

    // Validate format
    const code = verificationCode.value.trim().toUpperCase()
    if (!validateCode(code)) {
      inputError.value = 'Invalid format. Expected: CERT-YYYY-XXXXXXXX'
      return
    }

    // Perform verification
    const result = await verifyCertificate(code)
    verificationResult.value = result
  }

  function resetVerification () {
    verificationCode.value = ''
    verificationResult.value = null
    inputError.value = null
  }

  function getCertificateTypeName (type: string): string {
    switch (type) {
      case 'honors': {
        return 'Certificate of Academic Excellence (Honors)'
      }
      case 'good_moral': {
        return 'Certificate of Good Moral Character'
      }
      case 'completion': {
        return 'Certificate of Completion'
      }
      default: {
        return type
      }
    }
  }

  onMounted(() => {
    // Check if verification code is in URL query params (from QR code scan)
    const codeParam = route.query.code as string
    if (codeParam) {
      verificationCode.value = codeParam
      handleVerify()
    }
  })
</script>

<route lang="yaml">
meta:
  requiresAuth: false
  layout: default
</route>

<style scoped>
code {
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}
</style>
