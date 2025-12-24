<!--
  Teacher Documents Page
  
  Generate and manage SF9, SF10, and certificates
-->

<route lang="yaml">
meta:
  layout: teacher
  requiresRole: teacher
</route>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTeacher } from "@/composables/useTeacher";

const router = useRouter();
const { fetchTeacherClasses, loading } = useTeacher();

const classes = ref<any[]>([]);

onMounted(async () => {
  classes.value = await fetchTeacherClasses();
});
</script>

<template>
  <v-container fluid>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col>
        <v-btn
          class="mb-4"
          prepend-icon="mdi-arrow-left"
          to="/teacher"
          variant="text"
        >
          Back to Dashboard
        </v-btn>
        <h1 class="text-h4 font-weight-bold">Generate Documents</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Create SF9, SF10, and certificates for your students
        </p>
      </v-col>
    </v-row>

    <!-- Document Types -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card
          class="text-center pa-6"
          hover
          @click="router.push('/teacher/documents/sf9')"
        >
          <v-icon class="mb-4" color="primary" size="80">
            mdi-file-document-outline
          </v-icon>
          <v-card-title class="text-h6">SF9 (Report Card)</v-card-title>
          <v-card-text class="text-grey-darken-1">
            Learner's Progress and Achievement Record
          </v-card-text>
          <v-card-actions>
            <v-btn block color="primary" variant="outlined">
              Generate SF9
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card
          class="text-center pa-6"
          hover
          @click="router.push('/teacher/documents/sf10')"
        >
          <v-icon class="mb-4" color="success" size="80">
            mdi-file-chart-outline
          </v-icon>
          <v-card-title class="text-h6">SF10 (Permanent Record)</v-card-title>
          <v-card-text class="text-grey-darken-1">
            Learner's Cumulative Record
          </v-card-text>
          <v-card-actions>
            <v-btn block color="success" variant="outlined">
              Generate SF10
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card
          class="text-center pa-6"
          hover
          @click="router.push('/teacher/certificates')"
        >
          <v-icon class="mb-4" color="warning" size="80">
            mdi-certificate-outline
          </v-icon>
          <v-card-title class="text-h6">Certificates</v-card-title>
          <v-card-text class="text-grey-darken-1">
            Generate student certificates
          </v-card-text>
          <v-card-actions>
            <v-btn block color="warning" variant="outlined">
              Generate Certificates
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Class Overview -->
    <v-row v-if="classes.length > 0" class="mt-8">
      <v-col>
        <h2 class="text-h5 mb-4">Your Classes</h2>
      </v-col>
    </v-row>

    <v-row v-if="classes.length > 0">
      <v-col v-for="cls in classes" :key="cls.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title class="bg-primary text-white">
            {{ cls.section_name }}
          </v-card-title>
          <v-card-subtitle class="mt-2">
            Grade {{ cls.grade_level }} - {{ cls.track }}
            <span v-if="cls.strand"> ({{ cls.strand }})</span>
          </v-card-subtitle>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon class="mr-2" size="small">mdi-account-group</v-icon>
              <span class="text-grey-darken-1">
                {{ cls.student_count || 0 }} students
              </span>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              block
              color="primary"
              variant="text"
              @click="router.push(`/teacher/classes/${cls.id}`)"
            >
              View Class
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col>
        <v-progress-linear color="primary" indeterminate />
      </v-col>
    </v-row>

    <!-- No Classes -->
    <v-card v-if="!loading && classes.length === 0" class="mt-4">
      <v-card-text>
        <div class="text-center py-12">
          <v-icon color="grey-lighten-1" size="64">mdi-google-classroom</v-icon>
          <p class="text-h6 mt-4">No Classes Found</p>
          <p class="text-body-2 text-medium-emphasis">
            You don't have any classes assigned yet
          </p>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
