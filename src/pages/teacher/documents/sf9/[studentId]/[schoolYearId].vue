<route lang="yaml">
meta:
  layout: teacher
</route>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <v-btn
          class="mb-2"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="$router.back()"
        >
          Back
        </v-btn>
        <h1 class="text-h4">SF9 - Report Card Generator</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          School Form 9 (Official Report Card)
        </p>
      </v-col>
      <v-col class="d-flex gap-2" cols="auto">
        <v-btn
          color="primary"
          :disabled="!sf9TemplateData"
          prepend-icon="mdi-printer"
          @click="printDocument"
        >
          Print
        </v-btn>
        <v-btn
          color="success"
          :disabled="!sf9TemplateData || generatingPDF"
          :loading="generatingPDF"
          prepend-icon="mdi-file-pdf-box"
          @click="generatePDF"
        >
          Generate PDF
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-progress-linear
      v-if="loading"
      class="mb-4"
      color="primary"
      indeterminate
    />

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      class="mb-4"
      closable
      type="error"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Not Finalized Warning -->
    <v-alert
      v-if="!loading && !sf9TemplateData && !error"
      class="mb-4"
      prominent
      type="warning"
      variant="tonal"
    >
      <v-row align="center">
        <v-col>
          <div class="d-flex align-center">
            <v-icon class="mr-2" size="large">mdi-lock-alert</v-icon>
            <div>
              <strong>Cannot Generate SF9</strong>
              <p class="text-caption mt-1">
                Grades must be finalized before generating official documents.
                Please finalize grades first.
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-alert>

    <!-- SF9 Document with Template -->
    <div v-if="sf9TemplateData" id="sf9-print-area">
      <!-- Metadata Editor (not printed) -->
      <v-card class="mb-4 no-print">
        <v-card-title class="bg-blue-grey-lighten-5">
          <v-icon class="mr-2">mdi-pencil</v-icon>
          Editable Metadata (Attendance & Values)
        </v-card-title>
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">
                Attendance Records
              </h3>
            </v-col>
            <v-col
              v-for="(month, index) in metadata.attendance"
              :key="index"
              cols="6"
              md="3"
            >
              <v-text-field
                v-model.number="month.days_present"
                density="compact"
                hide-details
                :label="`${month.month} - Present`"
                type="number"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row>
            <v-col cols="12">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">
                Core Values (Sem 1)
              </h3>
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makadiyos_1_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Maka-Diyos #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makadiyos_2_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Maka-Diyos #2"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makatao_1_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makatao #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makatao_2_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makatao #2"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makakalikasan_1_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makakalikasan #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makabansa_1_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makabansa #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makabansa_2_sem1"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makabansa #2"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <v-row class="mt-4">
            <v-col cols="12">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">
                Core Values (Sem 2)
              </h3>
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makadiyos_1_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Maka-Diyos #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makadiyos_2_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Maka-Diyos #2"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makatao_1_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makatao #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makatao_2_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makatao #2"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makakalikasan_1_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makakalikasan #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makabansa_1_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makabansa #1"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="metadata.values.makabansa_2_sem2"
                density="compact"
                hide-details
                :items="['AO', 'SO', 'RO', 'NO', '-']"
                label="Makabansa #2"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- SF9 Template Component -->
      <SF9Template
        :grades="sf9TemplateData"
        :metadata="metadata"
        :verification-id="metadataId || undefined"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, reactive, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import SF9Template from '@/components/documents/SF9Template.vue'
  import { useDocuments } from '@/composables/useDocuments'

  const route = useRoute()
  const {
    loading,
    error,
    generateSF9,
    generatePDF: genPDF,
    getMetadata,
    saveMetadata,
  } = useDocuments()

  const studentId = ref(route.params.studentId as string)
  const schoolYearId = ref(route.params.schoolYearId as string)

  const sf9TemplateData = ref<any | null>(null)
  const generatingPDF = ref(false)
  const metadataId = ref<string | null>(null)

  // Metadata for attendance and values
  const metadata = reactive({
    attendance: [
      { month: 'June', school_days: 20, days_present: 20, days_absent: 0 },
      { month: 'July', school_days: 22, days_present: 22, days_absent: 0 },
      { month: 'August', school_days: 23, days_present: 23, days_absent: 0 },
      { month: 'September', school_days: 21, days_present: 21, days_absent: 0 },
      { month: 'October', school_days: 22, days_present: 22, days_absent: 0 },
      { month: 'November', school_days: 19, days_present: 19, days_absent: 0 },
      { month: 'December', school_days: 15, days_present: 15, days_absent: 0 },
      { month: 'January', school_days: 20, days_present: 20, days_absent: 0 },
      { month: 'February', school_days: 20, days_present: 20, days_absent: 0 },
      { month: 'March', school_days: 22, days_present: 22, days_absent: 0 },
    ],
    values: {
      makadiyos_1_sem1: '-',
      makadiyos_2_sem1: '-',
      makatao_1_sem1: '-',
      makatao_2_sem1: '-',
      makakalikasan_1_sem1: '-',
      makabansa_1_sem1: '-',
      makabansa_2_sem1: '-',
      makadiyos_1_sem2: '-',
      makadiyos_2_sem2: '-',
      makatao_1_sem2: '-',
      makatao_2_sem2: '-',
      makakalikasan_1_sem2: '-',
      makabansa_1_sem2: '-',
      makabansa_2_sem2: '-',
    },
  })

  async function loadSF9 () {
    const data = await generateSF9(studentId.value, schoolYearId.value)

    if (data) {
      // Transform the data to match SF9Template props
      sf9TemplateData.value = {
        student_name: `${data.last_name}, ${data.first_name} ${
          data.middle_name || ''
        }`,
        lrn: data.lrn,
        grade_level: data.grade_level,
        section: data.section,
        school_year: data.school_year,
        track: data.track || null,
        subjects: data.subjects.map((s: any) => ({
          subject_name: s.subject_name,
          semester_1_q1: s.q1_grade,
          semester_1_q2: s.q2_grade,
          semester_1_final: s.q2_grade, // Use Q2 as semester 1 final
          semester_2_q1: s.q3_grade,
          semester_2_q2: s.q4_grade,
          semester_2_final: s.q4_grade, // Use Q4 as semester 2 final
          final_rating: s.final_grade,
        })),
        general_average: data.general_average,
      }

      // Load existing metadata (if any)
      const savedMetadata = await getMetadata(
        studentId.value,
        'SF9',
        schoolYearId.value,
      )

      if (savedMetadata?.data) {
        // Update metadata from saved data
        if (savedMetadata.data.attendance) {
          Object.assign(metadata.attendance, savedMetadata.data.attendance)
        }
        if (savedMetadata.data.values) {
          Object.assign(metadata.values, savedMetadata.data.values)
        }
        // Store the metadata ID for QR code
        metadataId.value = savedMetadata.id
      } else {
        // Save initial metadata to get an ID
        const saved = await saveMetadata(
          studentId.value,
          'SF9',
          schoolYearId.value,
          {
            attendance: metadata.attendance,
            values: metadata.values,
          },
        )
        if (saved?.id) {
          metadataId.value = saved.id
        }
      }
    }
  }

  function printDocument () {
    window.print()
  }

  async function generatePDF () {
    generatingPDF.value = true
    try {
      // Save metadata first to ensure we have an ID
      const saved = await saveMetadata(
        studentId.value,
        'SF9',
        schoolYearId.value,
        {
          attendance: metadata.attendance,
          values: metadata.values,
        },
      )

      if (saved?.id && !metadataId.value) {
        metadataId.value = saved.id
      }

      const pdfElement = document.querySelector('#sf9-print-area')
      if (!pdfElement) {
        throw new Error('SF9 template element not found')
      }

      const url = await genPDF(
        pdfElement,
        'SF9',
        studentId.value,
        schoolYearId.value,
      )
      if (url) {
        alert(`PDF generated successfully! URL: ${url}`)
      }
    } catch (error_) {
      const errorMessage
        = error_ instanceof Error ? error_.message : 'Unknown error occurred'
      alert(`Failed to generate PDF: ${errorMessage}`)
    } finally {
      generatingPDF.value = false
    }
  }

  onMounted(() => {
    loadSF9()
  })
</script>

<style scoped>
@media print {
  .no-print,
  .v-btn,
  .v-alert {
    display: none !important;
  }
}
</style>
