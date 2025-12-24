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
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="$router.back()"
          class="mb-2"
        >
          Back
        </v-btn>
        <h1 class="text-h4">SF9 - Report Card Generator</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          School Form 9 (Official Report Card)
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-printer"
          @click="printDocument"
          :disabled="!sf9Data"
        >
          Print / Export PDF
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      class="mb-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Not Finalized Warning -->
    <v-alert
      v-if="!loading && !sf9Data && !error"
      type="warning"
      variant="tonal"
      class="mb-4"
      prominent
    >
      <v-row align="center">
        <v-col>
          <div class="d-flex align-center">
            <v-icon size="large" class="mr-2">mdi-lock-alert</v-icon>
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

    <!-- SF9 Document -->
    <v-card v-if="sf9Data" id="sf9-document" class="document-card">
      <!-- Document Header -->
      <v-card-text class="document-header">
        <div class="text-center mb-4">
          <h2 class="text-h5">Republic of the Philippines</h2>
          <h3 class="text-h6">Department of Education</h3>
          <p class="text-subtitle-1 font-weight-bold">
            AMPAYON NATIONAL HIGH SCHOOL - SENIOR HIGH SCHOOL
          </p>
          <p class="text-caption">Ampayon, Butuan City</p>
        </div>

        <div class="text-center my-4">
          <h1 class="text-h4 font-weight-bold">SCHOOL FORM 9 (SF9)</h1>
          <p class="text-h6">LEARNER'S PROGRESS REPORT CARD</p>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Student Information -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <div class="info-field">
              <span class="label">Learner's Name:</span>
              <span class="value font-weight-bold">
                {{ sf9Data.last_name }}, {{ sf9Data.first_name }}
                {{ sf9Data.middle_name || "" }}
              </span>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="info-field">
              <span class="label">LRN:</span>
              <span class="value font-weight-bold">{{ sf9Data.lrn }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">Grade Level:</span>
              <span class="value">{{ sf9Data.grade_level }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">Section:</span>
              <v-text-field
                v-model="editableData.section"
                density="compact"
                variant="outlined"
                hide-details
                @change="
                  logEdit('section', sf9Data.section, editableData.section)
                "
              />
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">School Year:</span>
              <span class="value">{{ sf9Data.school_year }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="6" v-if="sf9Data.track">
            <div class="info-field">
              <span class="label">Track:</span>
              <span class="value">{{ sf9Data.track }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="6" v-if="sf9Data.strand">
            <div class="info-field">
              <span class="label">Strand:</span>
              <span class="value">{{ sf9Data.strand }}</span>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Grades Table -->
      <v-card-text>
        <h3 class="text-h6 mb-4">Academic Performance</h3>
        <div class="table-responsive">
          <table class="grades-table">
            <thead>
              <tr>
                <th rowspan="2" class="text-left">Learning Areas</th>
                <th colspan="4" class="text-center">Quarterly Ratings</th>
                <th rowspan="2" class="text-center">Final Rating</th>
                <th rowspan="2" class="text-center">Remarks</th>
              </tr>
              <tr>
                <th class="text-center">1st</th>
                <th class="text-center">2nd</th>
                <th class="text-center">3rd</th>
                <th class="text-center">4th</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="subject in sf9Data.subjects"
                :key="subject.subject_code"
              >
                <td>{{ subject.subject_name }}</td>
                <td class="text-center">{{ subject.q1_grade || "-" }}</td>
                <td class="text-center">{{ subject.q2_grade || "-" }}</td>
                <td class="text-center">{{ subject.q3_grade || "-" }}</td>
                <td class="text-center">{{ subject.q4_grade || "-" }}</td>
                <td class="text-center font-weight-bold">
                  {{ subject.final_grade || "-" }}
                </td>
                <td class="text-center">{{ subject.remarks || "-" }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="summary-row">
                <td colspan="5" class="text-right font-weight-bold">
                  General Average:
                </td>
                <td class="text-center font-weight-bold text-h6">
                  {{ sf9Data.general_average?.toFixed(2) || "-" }}
                </td>
                <td class="text-center font-weight-bold">
                  {{ sf9Data.remarks || "-" }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Editable Metadata -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="editableData.adviser_name"
              label="Class Adviser"
              variant="outlined"
              prepend-icon="mdi-account-tie"
              @change="logEdit('adviser_name', '', editableData.adviser_name)"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="editableData.principal_name"
              label="School Principal"
              variant="outlined"
              prepend-icon="mdi-account-star"
              @change="
                logEdit('principal_name', '', editableData.principal_name)
              "
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="editableData.date_issued"
              label="Date Issued"
              type="date"
              variant="outlined"
              prepend-icon="mdi-calendar"
              @change="logEdit('date_issued', '', editableData.date_issued)"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="editableData.remarks_text"
              label="Additional Remarks (Optional)"
              variant="outlined"
              rows="3"
              prepend-icon="mdi-note-text"
              @change="logEdit('remarks_text', '', editableData.remarks_text)"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Document Footer -->
      <v-card-text class="document-footer">
        <v-row>
          <v-col cols="4" class="text-center">
            <div class="signature-line">
              <p class="signature-name">
                {{ editableData.adviser_name || "_________________" }}
              </p>
              <p class="signature-label">Class Adviser</p>
            </div>
          </v-col>
          <v-col cols="4" class="text-center">
            <div class="signature-line">
              <p class="signature-name">_________________</p>
              <p class="signature-label">Parent/Guardian</p>
            </div>
          </v-col>
          <v-col cols="4" class="text-center">
            <div class="signature-line">
              <p class="signature-name">
                {{ editableData.principal_name || "_________________" }}
              </p>
              <p class="signature-label">School Principal</p>
            </div>
          </v-col>
        </v-row>

        <div class="text-center mt-4 text-caption text-grey">
          <p>This is a computer-generated document. No signature required.</p>
          <p>Generated on: {{ new Date().toLocaleDateString() }}</p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Edit History -->
    <v-card v-if="sf9Data && documentEdits.length > 0" class="mt-4">
      <v-card-title class="bg-info text-white">
        <v-icon class="mr-2">mdi-history</v-icon>
        Edit History
      </v-card-title>
      <v-list>
        <v-list-item
          v-for="edit in documentEdits"
          :key="edit.id"
          :subtitle="`Changed from '${edit.old_value || '(empty)'}' to '${
            edit.new_value
          }'`"
        >
          <template #title>
            <strong>{{ edit.field_name }}:</strong> Edited on
            {{ formatDate(edit.edited_at) }}
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  useDocuments,
  type SF9Data,
  type DocumentEdit,
} from "@/composables/useDocuments";

const route = useRoute();
const { loading, error, generateSF9, logDocumentEdit, fetchDocumentEdits } =
  useDocuments();

const studentId = ref(route.params.studentId as string);
const schoolYearId = ref(route.params.schoolYearId as string);

const sf9Data = ref<SF9Data | null>(null);
const documentEdits = ref<DocumentEdit[]>([]);

const editableData = ref({
  section: "",
  adviser_name: "",
  principal_name: "",
  date_issued: new Date().toISOString().split("T")[0],
  remarks_text: "",
});

async function loadSF9() {
  sf9Data.value = await generateSF9(studentId.value, schoolYearId.value);

  if (sf9Data.value) {
    editableData.value.section = sf9Data.value.section;
    documentEdits.value = await fetchDocumentEdits(
      "SF9",
      studentId.value,
      schoolYearId.value
    );
  }
}

async function logEdit(
  fieldName: string,
  oldValue: string | undefined,
  newValue: string | undefined
) {
  await logDocumentEdit(
    "SF9",
    studentId.value,
    schoolYearId.value,
    fieldName,
    oldValue || null,
    newValue || null
  );

  // Reload edit history
  documentEdits.value = await fetchDocumentEdits(
    "SF9",
    studentId.value,
    schoolYearId.value
  );
}

function printDocument() {
  window.print();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(() => {
  loadSF9();
});
</script>

<style scoped>
.document-card {
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.document-header {
  background-color: #f9f9f9;
}

.info-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-field .label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
}

.info-field .value {
  color: #000;
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.grades-table th,
.grades-table td {
  border: 1px solid #ddd;
  padding: 12px 8px;
}

.grades-table thead th {
  background-color: #1976d2;
  color: white;
  font-weight: 600;
}

.grades-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.grades-table tfoot .summary-row {
  background-color: #e3f2fd;
  font-size: 1.1rem;
}

.signature-line {
  margin-top: 40px;
}

.signature-name {
  border-top: 2px solid #000;
  padding-top: 4px;
  font-weight: 600;
  margin-bottom: 4px;
}

.signature-label {
  font-size: 0.875rem;
  color: #666;
}

.document-footer {
  background-color: #f9f9f9;
}

.table-responsive {
  overflow-x: auto;
}

@media print {
  .v-btn,
  .v-alert,
  .edit-history {
    display: none !important;
  }

  .document-card {
    box-shadow: none;
  }

  .v-text-field,
  .v-textarea {
    border: none !important;
  }
}
</style>
