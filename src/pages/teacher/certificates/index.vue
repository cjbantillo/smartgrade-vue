<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">
          <v-icon class="mr-2" icon="mdi-certificate" size="large" />
          Generate Certificates
        </h1>
      </v-col>
    </v-row>

    <!-- Selection Controls -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="bg-primary">
            <v-icon class="mr-2" icon="mdi-cog" />
            Certificate Settings
          </v-card-title>
          <v-card-text class="pa-6">
            <!-- Student Selector -->
            <v-autocomplete
              v-model="selectedStudentId"
              class="mb-4"
              clearable
              :disabled="loadingStudents"
              hint="Search by name or LRN"
              item-title="displayName"
              item-value="id"
              :items="students"
              label="Select Student"
              :loading="loadingStudents"
              persistent-hint
              prepend-inner-icon="mdi-account-search"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item
                  v-bind="itemProps"
                  :subtitle="`LRN: ${item.raw.lrn} | Grade ${item.raw.grade_level} - ${item.raw.track}`"
                />
              </template>
            </v-autocomplete>

            <!-- School Year Selector -->
            <v-select
              v-model="selectedSchoolYearId"
              class="mb-4"
              :disabled="!selectedStudentId || loadingSchoolYears"
              item-title="year_code"
              item-value="id"
              :items="schoolYears"
              label="School Year"
              :loading="loadingSchoolYears"
              prepend-inner-icon="mdi-calendar"
            />

            <!-- Certificate Type Selector -->
            <v-select
              v-model="selectedCertificateType"
              class="mb-4"
              :disabled="!selectedStudentId || !selectedSchoolYearId"
              item-title="label"
              item-value="value"
              :items="certificateTypes"
              label="Certificate Type"
              prepend-inner-icon="mdi-certificate-outline"
            />

            <!-- Gating Warnings -->
            <v-alert
              v-if="!isFinalized && selectedStudentId && selectedSchoolYearId"
              class="mb-4"
              type="warning"
              variant="tonal"
            >
              <v-alert-title>Grades Not Finalized</v-alert-title>
              Grades must be finalized before generating certificates for this
              student.
            </v-alert>

            <v-alert
              v-if="
                selectedCertificateType === 'honors' &&
                !qualifiesForHonors &&
                selectedStudentId
              "
              class="mb-4"
              type="error"
              variant="tonal"
            >
              <v-alert-title>Does Not Qualify</v-alert-title>
              Student does not qualify for Honors certificate (GPA &lt; 90).
              Current GPA: {{ studentGPA.toFixed(2) }}
            </v-alert>

            <v-alert
              v-if="generationSuccess"
              class="mb-4"
              closable
              type="success"
              variant="tonal"
              @click:close="generationSuccess = false"
            >
              <v-alert-title>Certificate Generated</v-alert-title>
              Certificate has been successfully generated and saved.
              <div class="mt-2">
                <v-btn
                  v-if="generatedPdfUrl"
                  color="success"
                  :href="generatedPdfUrl"
                  prepend-icon="mdi-open-in-new"
                  size="small"
                  target="_blank"
                >
                  View PDF
                </v-btn>
              </div>
            </v-alert>

            <!-- Action Buttons -->
            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                :disabled="!canGenerate"
                :loading="generating"
                prepend-icon="mdi-check-circle"
                size="large"
                @click="handleGenerate"
              >
                Generate & Save
              </v-btn>
              <v-btn
                color="secondary"
                :disabled="!previewData"
                prepend-icon="mdi-printer"
                size="large"
                variant="outlined"
                @click="handlePrintPreview"
              >
                Print Preview
              </v-btn>
            </div>

            <!-- Student Info Summary -->
            <v-card v-if="selectedStudent" class="mt-4" variant="outlined">
              <v-card-text>
                <div class="text-subtitle-2 text-medium-emphasis mb-2">
                  Student Information
                </div>
                <div>
                  <strong>Name:</strong> {{ selectedStudent.displayName }}
                </div>
                <div><strong>LRN:</strong> {{ selectedStudent.lrn }}</div>
                <div>
                  <strong>Grade Level:</strong>
                  {{ selectedStudent.grade_level }}
                </div>
                <div>
                  <strong>Track/Strand:</strong> {{ selectedStudent.track }} -
                  {{ selectedStudent.strand }}
                </div>
                <div v-if="studentGPA > 0">
                  <strong>GPA:</strong> {{ studentGPA.toFixed(2) }}
                </div>
                <div v-if="honorsDesignation">
                  <strong>Honors:</strong> {{ honorsDesignation }}
                </div>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Preview Area -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="bg-secondary">
            <v-icon class="mr-2" icon="mdi-eye" />
            Preview
          </v-card-title>
          <v-card-text class="pa-6">
            <div
              v-if="!previewData"
              class="text-center pa-12 text-medium-emphasis"
            >
              <v-icon class="mb-4" icon="mdi-certificate" size="64" />
              <p>Select a student and certificate type to preview</p>
            </div>
            <div v-else ref="certificateRef" class="certificate-preview">
              <CertificateTemplate :certificate="previewData" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import CertificateTemplate from "@/components/CertificateTemplate.vue";
import {
  type CertificateType,
  type CertificateWithStudent,
  useCertificates,
} from "@/composables/useCertificates";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

// Composables
const authStore = useAuthStore();
const { generateCertificate, checkFinalization } = useCertificates();

// Refs
const loadingStudents = ref(false);
const loadingSchoolYears = ref(false);
const generating = ref(false);
const generationSuccess = ref(false);
const generatedPdfUrl = ref<string | null>(null);

const students = ref<
  Array<{
    id: string;
    lrn: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    grade_level: number;
    track: string;
    strand: string;
    displayName: string;
  }>
>([]);

const schoolYears = ref<
  Array<{
    id: string;
    year_code: string;
  }>
>([]);

const selectedStudentId = ref<string | null>(null);
const selectedSchoolYearId = ref<string | null>(null);
const selectedCertificateType = ref<CertificateType>("honors");

const isFinalized = ref(false);
const studentGPA = ref(0);
const honorsDesignation = ref<string | null>(null);

const certificateRef = ref<HTMLElement | null>(null);

// Certificate types
const certificateTypes = [
  { label: "Honors Certificate", value: "honors" },
  { label: "Good Moral Certificate", value: "good_moral" },
  { label: "Completion Certificate", value: "completion" },
];

// Computed
const selectedStudent = computed(() => {
  return students.value.find((s) => s.id === selectedStudentId.value);
});

const qualifiesForHonors = computed(() => {
  return studentGPA.value >= 90;
});

const canGenerate = computed(() => {
  if (
    !selectedStudentId.value ||
    !selectedSchoolYearId.value ||
    !selectedCertificateType.value
  ) {
    return false;
  }
  if (!isFinalized.value) {
    return false;
  }
  if (selectedCertificateType.value === "honors" && !qualifiesForHonors.value) {
    return false;
  }
  return !generating.value;
});

const previewData = computed<CertificateWithStudent | null>(() => {
  if (
    !selectedStudent.value ||
    !selectedSchoolYearId.value ||
    !selectedCertificateType.value
  ) {
    return null;
  }

  const schoolYear = schoolYears.value.find(
    (sy) => sy.id === selectedSchoolYearId.value
  );
  if (!schoolYear) return null;

  // Create mock preview data
  return {
    id: "preview",
    student_id: selectedStudent.value.id,
    certificate_type: selectedCertificateType.value,
    school_year_id: selectedSchoolYearId.value,
    issued_date: new Date().toISOString(),
    pdf_url: null,
    qr_code_url: "PREVIEW-CODE",
    is_revoked: false,
    revoked_by: null,
    revoked_at: null,
    revocation_reason: null,
    generated_by: authStore.user?.id || "",
    generated_at: new Date().toISOString(),
    student: {
      lrn: selectedStudent.value.lrn,
      first_name: selectedStudent.value.first_name,
      last_name: selectedStudent.value.last_name,
      middle_name: selectedStudent.value.middle_name || null,
      grade_level: selectedStudent.value.grade_level.toString(),
      track: selectedStudent.value.track,
      strand: selectedStudent.value.strand,
    },
    school_year: {
      year_code: schoolYear.year_code,
    },
    general_average: studentGPA.value,
    honors_designation: honorsDesignation.value,
  };
});

// Methods
async function fetchEnrolledStudents() {
  loadingStudents.value = true;
  try {
    const user = authStore.user;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get teacher ID from profile
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (teacherError || !teacherData) {
      throw new Error("Teacher profile not found");
    }

    // Get all students enrolled in teacher's classes
    const { data, error } = await supabase
      .from("class_enrollments")
      .select(
        `
        student:students!inner (
          id,
          lrn,
          first_name,
          middle_name,
          last_name,
          grade_level,
          track,
          strand
        ),
        teacher_classes!inner (
          teacher_id
        )
      `
      )
      .eq("teacher_classes.teacher_id", teacherData.id)
      .eq("is_active", true);

    if (error) throw error;

    // Extract unique students
    const uniqueStudents = new Map();
    if (data) {
      for (const enrollment of data) {
        const student = (enrollment as any).student;
        if (!uniqueStudents.has(student.id)) {
          uniqueStudents.set(student.id, {
            ...student,
            displayName: `${student.first_name} ${student.middle_name || ""} ${
              student.last_name
            }`.trim(),
          });
        }
      }
    }

    students.value = Array.from(uniqueStudents.values());
  } catch (error) {
    console.error("Error fetching students:", error);
    students.value = [];
  } finally {
    loadingStudents.value = false;
  }
}

async function fetchSchoolYears() {
  loadingSchoolYears.value = true;
  try {
    const { data, error } = await supabase
      .from("school_years")
      .select("id, year_code")
      .order("year_code", { ascending: false });

    if (error) throw error;

    schoolYears.value = data || [];

    // Auto-select current school year
    if (schoolYears.value.length > 0 && !selectedSchoolYearId.value) {
      selectedSchoolYearId.value = schoolYears.value[0].id;
    }
  } catch (error) {
    console.error("Error fetching school years:", error);
    schoolYears.value = [];
  } finally {
    loadingSchoolYears.value = false;
  }
}

async function checkStudentFinalization() {
  if (!selectedStudentId.value || !selectedSchoolYearId.value) {
    isFinalized.value = false;
    studentGPA.value = 0;
    honorsDesignation.value = null;
    return;
  }

  try {
    // Check finalization status
    const finalized = await checkFinalization(
      selectedStudentId.value,
      selectedSchoolYearId.value
    );
    isFinalized.value = finalized;

    if (finalized) {
      // Fetch GPA and honors
      const { data, error } = await supabase
        .from("grade_finalization_status")
        .select("general_average")
        .eq("student_id", selectedStudentId.value)
        .eq("school_year_id", selectedSchoolYearId.value)
        .eq("semester", "1")
        .single();

      if (!error && data) {
        studentGPA.value = data.general_average || 0;

        // Determine honors designation
        if (studentGPA.value >= 98) {
          honorsDesignation.value = "With Highest Honors";
        } else if (studentGPA.value >= 95) {
          honorsDesignation.value = "With High Honors";
        } else if (studentGPA.value >= 90) {
          honorsDesignation.value = "With Honors";
        } else {
          honorsDesignation.value = null;
        }
      }
    }
  } catch (error) {
    console.error("Error checking finalization:", error);
    isFinalized.value = false;
  }
}

async function handleGenerate() {
  if (
    !selectedStudentId.value ||
    !selectedSchoolYearId.value ||
    !selectedCertificateType.value
  ) {
    return;
  }

  generating.value = true;
  generationSuccess.value = false;
  generatedPdfUrl.value = null;

  try {
    const htmlElement = certificateRef.value;

    const result = await generateCertificate(
      selectedStudentId.value,
      selectedSchoolYearId.value,
      selectedCertificateType.value,
      htmlElement || undefined
    );

    if (result) {
      generationSuccess.value = true;
      generatedPdfUrl.value = result.pdf_url;
    }
  } catch (error) {
    console.error("Error generating certificate:", error);
  } finally {
    generating.value = false;
  }
}

function handlePrintPreview() {
  window.print();
}

// Watchers
watch([selectedStudentId, selectedSchoolYearId], () => {
  checkStudentFinalization();
  generationSuccess.value = false;
  generatedPdfUrl.value = null;
});

// Lifecycle
onMounted(() => {
  fetchEnrolledStudents();
  fetchSchoolYears();
});
</script>

<style scoped>
.certificate-preview {
  max-width: 100%;
  overflow: auto;
  transform: scale(0.8);
  transform-origin: top center;
}

@media print {
  .v-container,
  .v-row > :first-child {
    display: none !important;
  }

  .certificate-preview {
    transform: scale(1) !important;
  }
}
</style>
