<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My Documents</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          Access your SF9 (Report Card) and SF10 (Permanent Record) documents
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
        <p class="text-h6 mt-4">Loading your documents...</p>
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

    <!-- No Documents -->
    <v-row v-else-if="documents.length === 0">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          <v-icon start>mdi-information</v-icon>
          No documents available yet. Documents will be available after your
          teacher finalizes your grades.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Documents List -->
    <template v-else>
      <!-- SF9 Documents -->
      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 font-weight-bold mb-4">
            <v-icon class="mr-2">mdi-file-document</v-icon>
            SF9 - Report Cards
          </h2>
        </v-col>
        <v-col
          v-for="doc in sf9Documents"
          :key="doc.school_year_id"
          cols="12"
          md="4"
        >
          <v-card hover @click="viewSF9(doc.school_year_id)">
            <v-card-title class="bg-primary text-white">
              <v-icon start>mdi-file-document</v-icon>
              SF9 Report Card
            </v-card-title>
            <v-card-text class="pa-6">
              <p class="text-h6 mb-2">School Year {{ doc.school_year_code }}</p>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Quarterly grades and performance report
              </p>
              <v-chip color="success" variant="tonal" size="small">
                <v-icon start size="small">mdi-check-circle</v-icon>
                Available
              </v-chip>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="primary"
                prepend-icon="mdi-eye"
                block
                @click.stop="viewSF9(doc.school_year_id)"
              >
                View Document
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- SF10 Document -->
      <v-row class="mt-6" v-if="sf10Document">
        <v-col cols="12">
          <h2 class="text-h5 font-weight-bold mb-4">
            <v-icon class="mr-2">mdi-folder-open</v-icon>
            SF10 - Permanent Academic Record
          </h2>
        </v-col>
        <v-col cols="12" md="6">
          <v-card hover @click="viewSF10">
            <v-card-title class="bg-secondary text-white">
              <v-icon start>mdi-folder-open</v-icon>
              SF10 Permanent Record
            </v-card-title>
            <v-card-text class="pa-6">
              <p class="text-h6 mb-2">Complete Academic History</p>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Comprehensive record of all your academic achievements across
                all school years
              </p>
              <v-chip color="success" variant="tonal" size="small">
                <v-icon start size="small">mdi-check-circle</v-icon>
                Available
              </v-chip>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="secondary"
                prepend-icon="mdi-eye"
                block
                @click.stop="viewSF10"
              >
                View Document
              </v-btn>
            </v-card-actions>
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
                About Your Documents
              </h3>
              <p class="text-body-2 mb-2">
                <strong>SF9 (Report Card):</strong> Contains your quarterly
                grades, final ratings, and general average for a specific school
                year.
              </p>
              <p class="text-body-2 mb-2">
                <strong>SF10 (Permanent Record):</strong> A comprehensive
                document containing your complete academic history, including
                all school years, grades, and personal information.
              </p>
              <p class="text-body-2 mb-2">
                These documents are official DepEd forms and can be used for
                college applications, scholarships, and employment verification.
              </p>
              <p class="text-body-2">
                <strong>Note:</strong> You can view and print these documents.
                If you notice any errors, please contact your class adviser or
                the school registrar.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStudent, type StudentDocument } from "@/composables/useStudent";

const router = useRouter();
const { loading, error, fetchStudentDocuments, getStudentId } = useStudent();

// Component state
const documents = ref<StudentDocument[]>([]);
const studentId = ref<string | null>(null);

// Computed properties
const sf9Documents = computed(() => {
  return documents.value.filter((doc) => doc.type === "SF9");
});

const sf10Document = computed(() => {
  return documents.value.find((doc) => doc.type === "SF10");
});

// Methods
function viewSF9(schoolYearId: string) {
  if (studentId.value) {
    router.push(`/teacher/documents/sf9/${studentId.value}/${schoolYearId}`);
  }
}

function viewSF10() {
  if (studentId.value) {
    router.push(`/teacher/documents/sf10/${studentId.value}`);
  }
}

async function loadDocuments() {
  studentId.value = await getStudentId();
  const docs = await fetchStudentDocuments();
  documents.value = docs;
}

onMounted(() => {
  loadDocuments();
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
