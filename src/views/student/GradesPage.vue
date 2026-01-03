<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My Grades</h1>
        <p class="text-grey mb-6">View your final grades for all subjects</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSemester"
          :items="semesters"
          item-title="name"
          item-value="id"
          label="Select Semester"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-text class="pa-0">
            <v-table density="comfortable">
              <thead>
                <tr class="bg-primary">
                  <th class="white--text">Subject Code</th>
                  <th class="white--text">Subject Name</th>
                  <th class="white--text text-center">Units</th>
                  <th class="white--text text-center">Final Grade</th>
                  <th class="white--text">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grade in grades" :key="grade.code">
                  <td class="text-grey">{{ grade.code }}</td>
                  <td class="font-weight-medium">{{ grade.name }}</td>
                  <td class="text-center">{{ grade.units }}</td>
                  <td class="text-center">
                    <span class="text-h6 font-weight-bold">{{
                      grade.final_grade
                    }}</span>
                  </td>
                  <td>
                    <v-chip
                      :color="grade.final_grade >= 75 ? 'success' : 'error'"
                      size="small"
                      label
                    >
                      {{ grade.final_grade >= 75 ? "Passed" : "Failed" }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-3">
                  <td colspan="2" class="font-weight-bold">
                    General Weighted Average
                  </td>
                  <td class="text-center font-weight-bold">{{ totalUnits }}</td>
                  <td class="text-center">
                    <span class="text-h5 font-weight-bold text-primary">{{
                      gwa
                    }}</span>
                  </td>
                  <td>
                    <v-chip
                      :color="
                        Number(gwa) >= 90
                          ? 'warning'
                          : Number(gwa) >= 75
                          ? 'success'
                          : 'error'
                      "
                      size="small"
                      label
                    >
                      {{
                        Number(gwa) >= 90
                          ? "With Honors"
                          : Number(gwa) >= 75
                          ? "Passed"
                          : "Failed"
                      }}
                    </v-chip>
                  </td>
                </tr>
              </tfoot>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title>Grade Legend</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td>90-100</td>
                  <td>
                    <v-chip color="warning" size="x-small">With Honors</v-chip>
                  </td>
                </tr>
                <tr>
                  <td>75-89</td>
                  <td>
                    <v-chip color="success" size="x-small">Passed</v-chip>
                  </td>
                </tr>
                <tr>
                  <td>Below 75</td>
                  <td><v-chip color="error" size="x-small">Failed</v-chip></td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="4">
          <v-card-title>Performance Summary</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <span>Highest Grade:</span>
              <strong class="text-success">{{ highestGrade }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span>Lowest Grade:</span>
              <strong class="text-warning">{{ lowestGrade }}</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span>Subjects Failed:</span>
              <strong
                :class="failedCount > 0 ? 'text-error' : 'text-success'"
                >{{ failedCount }}</strong
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface Grade {
  code: string;
  name: string;
  units: number;
  final_grade: number;
}

const semesters = ref([
  { id: 1, name: "1st Semester" },
  { id: 2, name: "2nd Semester" },
]);
const selectedSemester = ref(1);

const grades = ref<Grade[]>([]);

const totalUnits = computed(() =>
  grades.value.reduce((sum, g) => sum + g.units, 0)
);

const gwa = computed(() => {
  if (!grades.value.length) return "0.00";
  const totalWeighted = grades.value.reduce(
    (sum, g) => sum + g.final_grade * g.units,
    0
  );
  return (totalWeighted / totalUnits.value).toFixed(2);
});

const highestGrade = computed(() => {
  if (!grades.value.length) return 0;
  return Math.max(...grades.value.map((g) => g.final_grade));
});

const lowestGrade = computed(() => {
  if (!grades.value.length) return 0;
  return Math.min(...grades.value.map((g) => g.final_grade));
});

const failedCount = computed(
  () => grades.value.filter((g) => g.final_grade < 75).length
);

function fetchGrades() {
  // Mock data
  grades.value = [
    {
      code: "ORAL-COMM",
      name: "Oral Communication",
      units: 3,
      final_grade: 88,
    },
    {
      code: "RWS",
      name: "Reading and Writing Skills",
      units: 3,
      final_grade: 85,
    },
    {
      code: "KOM-PAN",
      name: "Komunikasyon at Pananaliksik",
      units: 3,
      final_grade: 90,
    },
    {
      code: "GEN-MATH",
      name: "General Mathematics",
      units: 3,
      final_grade: 82,
    },
    { code: "ELS", name: "Earth and Life Science", units: 3, final_grade: 87 },
    { code: "PERDEV", name: "Personal Development", units: 3, final_grade: 92 },
    {
      code: "PE-HEALTH",
      name: "Physical Education and Health",
      units: 2,
      final_grade: 95,
    },
    {
      code: "21ST-LIT",
      name: "21st Century Literature",
      units: 3,
      final_grade: 89,
    },
  ];
}

onMounted(fetchGrades);
</script>
