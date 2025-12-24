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
        <h1 class="text-h4">SF10 - Permanent Record Generator</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          School Form 10 (Cumulative Scholastic Record)
        </p>
      </v-col>
      <v-col class="d-flex gap-2" cols="auto">
        <v-btn
          color="primary"
          :disabled="!sf10TemplateData || saving"
          :loading="saving"
          prepend-icon="mdi-content-save"
          @click="saveMetadataDraft"
        >
          Save Draft
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!sf10TemplateData"
          prepend-icon="mdi-printer"
          @click="printDocument"
        >
          Print
        </v-btn>
        <v-btn
          color="success"
          :disabled="!sf10TemplateData || generatingPDF"
          :loading="generatingPDF"
          prepend-icon="mdi-file-pdf-box"
          @click="generatePDFDocument"
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
      v-if="!loading && !sf10Data && !error"
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
              <strong>Cannot Generate SF10</strong>
              <p class="text-caption mt-1">
                Grades must be finalized before generating official documents.
                Please finalize grades for all school years first.
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-alert>

    <!-- SF10 Document with Template -->
    <div v-if="sf10TemplateData" id="sf10-print-area">
      <!-- Metadata Editor (not printed) -->
      <v-card class="mb-4 no-print">
        <v-card-title class="bg-blue-grey-lighten-5">
          <v-icon class="mr-2">mdi-pencil</v-icon>
          Editable Metadata
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="metadata.principal_name"
                density="compact"
                hide-details
                label="Principal/School Head Name"
                prepend-icon="mdi-account"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="metadata.school_address"
                density="compact"
                hide-details
                label="School Address"
                prepend-icon="mdi-map-marker"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="metadata.eligibility"
                density="compact"
                hide-details
                :items="eligibilityOptions"
                label="Eligibility for SHS Enrolment"
                prepend-icon="mdi-certificate"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="metadata.admission_to"
                density="compact"
                hide-details
                label="Eligible for Admission to"
                prepend-icon="mdi-school"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- SF10 Template Component -->
      <SF10Template
        :data="sf10TemplateData"
        :metadata="metadata"
        :verification-id="metadataId || undefined"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import SF10Template from "@/components/documents/SF10Template.vue";
import { useDocuments } from "@/composables/useDocuments";

const route = useRoute();
const {
  loading,
  error,
  generateSF10Data,
  generatePDF,
  saveMetadata,
  getMetadata,
} = useDocuments();

const studentId = ref(route.params.studentId as string);
const sf10Data = ref<any | null>(null);
const generatingPDF = ref(false);
const saving = ref(false);
const metadataId = ref<string | null>(null);

// Metadata for editable fields
const metadata = reactive({
  principal_name: "",
  school_address: "Ampayon, Butuan City",
  eligibility: "JHS_COMPLETER" as
    | "HS_COMPLETER"
    | "JHS_COMPLETER"
    | "PEPT_PASSER"
    | "ALS_PASSER",
  admission_to: "",
});

const eligibilityOptions = [
  { title: "High School Completer", value: "HS_COMPLETER" },
  { title: "Junior High School Completer", value: "JHS_COMPLETER" },
  { title: "PEPT Passer", value: "PEPT_PASSER" },
  { title: "ALS A&E Passer", value: "ALS_PASSER" },
];

// Transform data for SF10Template
const sf10TemplateData = computed(() => {
  if (!sf10Data.value) return null;

  return {
    last_name: sf10Data.value.last_name,
    first_name: sf10Data.value.first_name,
    middle_name: sf10Data.value.middle_name,
    lrn: sf10Data.value.lrn,
    date_of_birth: sf10Data.value.birthdate,
    sex: sf10Data.value.gender,
    date_of_admission: sf10Data.value.birthdate, // TODO: Get actual admission date
    eligibility: metadata.eligibility,
    school_address: metadata.school_address,
    scholastic_records: sf10Data.value.school_years.map((sy: any) => ({
      school_name: "Ampayon National High School - SHS",
      school_id: "500000", // TODO: Get actual school ID
      grade_level: sy.grade_level,
      section: sy.section,
      school_year: sy.year,
      semester: 1, // TODO: Determine semester from data
      track_strand: "Academic Track", // TODO: Get from data
      subjects: sy.subjects.map((subj: any) => ({
        indication: "Core" as const,
        subject_name: subj.subject_name,
        quarter_1: subj.q1_grade,
        quarter_2: subj.q2_grade,
        final_grade: subj.final_grade,
        action_taken: (subj.final_grade >= 75
          ? "Passed"
          : subj.final_grade === null
          ? "Incomplete"
          : "Failed") as "Passed" | "Failed" | "Incomplete",
      })),
      remedial_class: [], // TODO: Fetch remedial records
    })),
  };
});

async function loadSF10() {
  // Load SF10 cumulative data
  sf10Data.value = await generateSF10Data(studentId.value);

  if (sf10Data.value && sf10Data.value.school_years.length > 0) {
    // Load existing metadata (if any)
    // Use a placeholder school year ID for SF10 metadata
    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const savedMetadata = await getMetadata(
      studentId.value,
      "SF10",
      placeholderId
    );

    if (savedMetadata?.data) {
      // Update metadata from saved data
      Object.assign(metadata, savedMetadata.data);
      // Store the metadata ID for QR code
      metadataId.value = savedMetadata.id;
    } else {
      // Save initial metadata to get an ID
      const saved = await saveMetadata(
        studentId.value,
        "SF10",
        placeholderId,
        metadata
      );
      if (saved?.id) {
        metadataId.value = saved.id;
      }
    }
  }
}

async function saveMetadataDraft() {
  saving.value = true;
  try {
    // Use a placeholder school year ID for SF10 metadata
    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const saved = await saveMetadata(
      studentId.value,
      "SF10",
      placeholderId,
      metadata
    );

    if (saved) {
      // Update metadata ID if we got one
      if (saved.id && !metadataId.value) {
        metadataId.value = saved.id;
      }
      alert("Metadata saved successfully!");
    } else {
      alert("Failed to save metadata. Please try again.");
    }
  } catch (error_) {
    const errorMessage =
      error_ instanceof Error ? error_.message : "Unknown error occurred";
    alert(`An error occurred while saving metadata: ${errorMessage}`);
  } finally {
    saving.value = false;
  }
}

function printDocument() {
  window.print();
}

async function generatePDFDocument() {
  // Save metadata first
  await saveMetadataDraft();

  generatingPDF.value = true;
  try {
    const pdfElement = document.querySelector("#sf10-print-area");
    if (!pdfElement) {
      throw new Error("SF10 template element not found");
    }

    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const url = await generatePDF(
      pdfElement as HTMLElement,
      "SF10",
      studentId.value,
      placeholderId
    );
    if (url) {
      alert(`PDF generated successfully! URL: ${url}`);
    }
  } catch (error_) {
    const errorMessage =
      error_ instanceof Error ? error_.message : "Unknown error occurred";
    alert(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    generatingPDF.value = false;
  }
}

onMounted(() => {
  loadSF10();
});
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
