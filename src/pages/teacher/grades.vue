<!--
  Teacher Grades Page
  
  Manage student grades for assigned classes
-->

<route lang="yaml">
meta:
  layout: teacher
  requiresRole: teacher
</route>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useTeacher } from "@/composables/useTeacher";

const { fetchTeacherClasses, loading, error } = useTeacher();

const classes = ref<any[]>([]);
const selectedClass = ref<any>(null);
const gradingPeriod = ref<number>(1);

const fetchData = async () => {
  classes.value = await fetchTeacherClasses();
  if (classes.value.length > 0 && !selectedClass.value) {
    selectedClass.value = classes.value[0];
  }
};

const quarterOptions = [
  { title: "1st Quarter", value: 1 },
  { title: "2nd Quarter", value: 2 },
  { title: "3rd Quarter", value: 3 },
  { title: "4th Quarter", value: 4 },
];

onMounted(() => {
  fetchData();
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
        <h1 class="text-h4 font-weight-bold">Enter Grades</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Record and manage student grades for your classes
        </p>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <!-- Class & Quarter Selection -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedClass"
              :items="classes"
              :loading="loading"
              item-title="section_name"
              item-value="id"
              label="Select Class"
              return-object
              variant="outlined"
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <v-list-item-title>{{
                    item.raw.section_name
                  }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Grade {{ item.raw.grade_level }} - {{ item.raw.track }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="gradingPeriod"
              :items="quarterOptions"
              label="Grading Period"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Grades Table -->
    <v-card v-if="selectedClass" :loading="loading">
      <v-card-title class="d-flex align-center justify-space-between">
        <span
          >{{ selectedClass.section_name }} - Quarter {{ gradingPeriod }}</span
        >
        <v-btn color="primary" prepend-icon="mdi-content-save">
          Save Grades
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert class="mb-4" type="info" variant="tonal">
          <div class="text-body-2">
            <strong>Grade Entry:</strong> Enter grades for each subject
            component. Final grade is automatically calculated.
          </div>
        </v-alert>

        <div class="text-center py-12">
          <v-icon color="grey-lighten-1" size="64"
            >mdi-clipboard-text-outline</v-icon
          >
          <p class="text-h6 mt-4">Grade Entry Coming Soon</p>
          <p class="text-body-2 text-medium-emphasis">
            This feature will allow you to enter and manage student grades
          </p>
        </div>
      </v-card-text>
    </v-card>

    <!-- No Classes -->
    <v-card v-else-if="!loading && classes.length === 0">
      <v-card-text>
        <div class="text-center py-12">
          <v-icon color="grey-lighten-1" size="64">mdi-google-classroom</v-icon>
          <p class="text-h6 mt-4">No Classes Found</p>
          <p class="text-body-2 text-medium-emphasis">
            You don't have any classes assigned yet
          </p>
          <v-btn class="mt-4" color="primary" to="/teacher/classes">
            View Classes
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
