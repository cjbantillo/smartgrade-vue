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
        <h1 class="text-h4">SF10 - Permanent Record Generator</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          School Form 10 (Learner's Permanent Academic Record)
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-printer"
          @click="printDocument"
          :disabled="!sf10Data"
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

    <!-- SF10 Document -->
    <v-card v-if="sf10Data" id="sf10-document" class="document-card">
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
          <h1 class="text-h4 font-weight-bold">SCHOOL FORM 10 (SF10)</h1>
          <p class="text-h6">LEARNER'S PERMANENT ACADEMIC RECORD</p>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Student Information -->
      <v-card-text>
        <h3 class="text-h6 mb-3">LEARNER'S INFORMATION</h3>
        <v-row>
          <v-col cols="12" md="8">
            <div class="info-field">
              <span class="label">Name:</span>
              <span class="value font-weight-bold">
                {{ sf10Data.last_name }}, {{ sf10Data.first_name }}
                {{ sf10Data.middle_name || "" }}
              </span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">LRN:</span>
              <span class="value font-weight-bold">{{ sf10Data.lrn }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">Birthdate:</span>
              <v-text-field
                v-model="editableData.birthdate"
                density="compact"
                type="date"
                variant="outlined"
                hide-details
                @change="logEdit('birthdate', '', editableData.birthdate)"
              />
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">Birthplace:</span>
              <v-text-field
                v-model="editableData.birthplace"
                density="compact"
                variant="outlined"
                hide-details
                @change="logEdit('birthplace', '', editableData.birthplace)"
              />
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="info-field">
              <span class="label">Gender:</span>
              <v-select
                v-model="editableData.gender"
                :items="['Male', 'Female']"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="logEdit('gender', '', editableData.gender)"
              />
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="info-field">
              <span class="label">Parent/Guardian:</span>
              <v-text-field
                v-model="editableData.parent_guardian"
                density="compact"
                variant="outlined"
                hide-details
                @change="
                  logEdit('parent_guardian', '', editableData.parent_guardian)
                "
              />
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="info-field">
              <span class="label">Contact Number:</span>
              <v-text-field
                v-model="editableData.contact_number"
                density="compact"
                variant="outlined"
                hide-details
                @change="
                  logEdit('contact_number', '', editableData.contact_number)
                "
              />
            </div>
          </v-col>
          <v-col cols="12">
            <div class="info-field">
              <span class="label">Address:</span>
              <v-textarea
                v-model="editableData.address"
                density="compact"
                variant="outlined"
                rows="2"
                hide-details
                @change="logEdit('address', '', editableData.address)"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Academic History -->
      <v-card-text>
        <h3 class="text-h6 mb-3">ACADEMIC HISTORY</h3>

        <div
          v-for="(sy, index) in sf10Data.school_years"
          :key="index"
          class="school-year-section mb-6"
        >
          <v-card variant="outlined">
            <v-card-title class="bg-primary text-white">
              School Year: {{ sy.year }} - Grade {{ sy.grade_level }}
            </v-card-title>

            <v-card-text>
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
                      v-for="subject in sy.subjects"
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
                        {{ sy.general_average?.toFixed(2) || "-" }}
                      </td>
                      <td class="text-center font-weight-bold">
                        {{ sy.remarks || "-" }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Additional Remarks -->
      <v-card-text>
        <v-textarea
          v-model="editableData.remarks_text"
          label="Additional Remarks / Notes"
          variant="outlined"
          rows="4"
          prepend-icon="mdi-note-text"
          @change="logEdit('remarks_text', '', editableData.remarks_text)"
        />
      </v-card-text>

      <!-- Document Footer -->
      <v-card-text class="document-footer">
        <v-row>
          <v-col cols="6" class="text-center">
            <div class="signature-line">
              <p class="signature-name">_________________</p>
              <p class="signature-label">Class Adviser</p>
            </div>
          </v-col>
          <v-col cols="6" class="text-center">
            <div class="signature-line">
              <p class="signature-name">_________________</p>
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
    <v-card v-if="sf10Data && documentEdits.length > 0" class="mt-4">
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
  type SF10Data,
  type DocumentEdit,
} from "@/composables/useDocuments";

const route = useRoute();
const { loading, error, generateSF10, logDocumentEdit, fetchDocumentEdits } =
  useDocuments();

const studentId = ref(route.params.studentId as string);

const sf10Data = ref<SF10Data | null>(null);
const documentEdits = ref<DocumentEdit[]>([]);

const editableData = ref({
  birthdate: "",
  birthplace: "",
  gender: "",
  parent_guardian: "",
  contact_number: "",
  address: "",
  remarks_text: "",
});

async function loadSF10() {
  sf10Data.value = await generateSF10(studentId.value);

  if (sf10Data.value && sf10Data.value.school_years.length > 0) {
    // Load edits for most recent school year
    const latestSchoolYear = sf10Data.value.school_years[0];
    // We'd need to get the school_year_id somehow - for now use empty string
    // In production, fetch from database
    documentEdits.value = await fetchDocumentEdits("SF10", studentId.value, "");
  }
}

async function logEdit(
  fieldName: string,
  oldValue: string | undefined,
  newValue: string | undefined
) {
  if (!sf10Data.value?.school_years[0]) return;

  await logDocumentEdit(
    "SF10",
    studentId.value,
    "", // school_year_id - would need to fetch properly
    fieldName,
    oldValue || null,
    newValue || null
  );

  // Reload edit history
  documentEdits.value = await fetchDocumentEdits("SF10", studentId.value, "");
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
  loadSF10();
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
  min-width: 140px;
}

.info-field .value {
  color: #000;
}

.school-year-section {
  page-break-inside: avoid;
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
  .v-textarea,
  .v-select {
    border: none !important;
  }

  .school-year-section {
    page-break-after: always;
  }
}
</style>
