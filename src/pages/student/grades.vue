<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">My Grades</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          View your quarterly and final grades
        </p>
      </v-col>
    </v-row>

    <!-- School Year Selector -->
    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedSchoolYear"
          item-title="year_code"
          item-value="id"
          :items="schoolYears"
          label="Select School Year"
          prepend-inner-icon="mdi-calendar"
          variant="outlined"
          @update:model-value="loadGrades"
        />
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col class="text-center py-12" cols="12">
        <v-progress-circular
          color="primary"
          indeterminate
          size="64"
        />
        <p class="text-h6 mt-4">Loading your grades...</p>
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

    <!-- No Grades -->
    <v-row v-else-if="grades.length === 0">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          No grades available for the selected school year.
        </v-alert>
      </v-col>
    </v-row>

    <!-- Grades Display -->
    <template v-else>
      <!-- GPA Summary -->
      <v-row v-if="currentGPA">
        <v-col cols="12">
          <v-card color="primary" variant="elevated">
            <v-card-text class="pa-6">
              <v-row align="center">
                <v-col class="text-center" cols="12" md="3">
                  <p class="text-h6 text-white mb-2">General Average</p>
                  <p class="text-h2 font-weight-bold text-white">
                    {{ currentGPA.general_average.toFixed(2) }}
                  </p>
                </v-col>
                <v-col class="text-center" cols="12" md="3">
                  <v-chip
                    v-if="currentGPA.honors_designation"
                    :color="honorsColor"
                    size="x-large"
                    variant="elevated"
                  >
                    <v-icon start>mdi-medal</v-icon>
                    {{ currentGPA.honors_designation }}
                  </v-chip>
                  <v-chip v-else color="white" size="large" variant="tonal">
                    No Honors
                  </v-chip>
                </v-col>
                <v-col class="text-center" cols="12" md="3">
                  <p class="text-body-1 text-white mb-2">Status</p>
                  <v-chip
                    :color="currentGPA.is_finalized ? 'success' : 'warning'"
                    size="large"
                    variant="elevated"
                  >
                    {{ currentGPA.is_finalized ? "Finalized" : "Draft" }}
                  </v-chip>
                </v-col>
                <v-col class="text-center" cols="12" md="3">
                  <p class="text-body-1 text-white mb-2">School Year</p>
                  <p class="text-h6 text-white">
                    {{ currentGPA.school_year_code }}
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Grades by Subject -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="bg-grey-lighten-3">
              <v-icon start>mdi-book-open-variant</v-icon>
              Subject Grades
            </v-card-title>
            <v-card-text class="pa-0">
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="subject in subjectGroups"
                  :key="subject.code"
                >
                  <v-expansion-panel-title>
                    <v-row align="center" no-gutters>
                      <v-col cols="6">
                        <strong>{{ subject.name }}</strong>
                        <br>
                        <span class="text-caption text-medium-emphasis">{{
                          subject.code
                        }}</span>
                      </v-col>
                      <v-col class="text-right" cols="3">
                        <v-chip
                          v-if="subject.final_grade"
                          :color="getGradeColor(subject.final_grade)"
                          size="small"
                        >
                          Final: {{ subject.final_grade.toFixed(2) }}
                        </v-chip>
                      </v-col>
                      <v-col class="text-right" cols="3">
                        <span class="text-caption text-medium-emphasis">
                          {{ subject.teacher_name }}
                        </span>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>Quarter</th>
                          <th class="text-center">Written Work</th>
                          <th class="text-center">Performance Task</th>
                          <th class="text-center">Quarterly Assessment</th>
                          <th class="text-center">Quarterly Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="grade in subject.grades" :key="grade.id">
                          <td>
                            <strong>Q{{ grade.grading_period }}</strong>
                          </td>
                          <td class="text-center">
                            {{
                              grade.written_work !== null
                                ? grade.written_work.toFixed(2)
                                : "N/A"
                            }}
                          </td>
                          <td class="text-center">
                            {{
                              grade.performance_task !== null
                                ? grade.performance_task.toFixed(2)
                                : "N/A"
                            }}
                          </td>
                          <td class="text-center">
                            {{
                              grade.quarterly_assessment !== null
                                ? grade.quarterly_assessment.toFixed(2)
                                : "N/A"
                            }}
                          </td>
                          <td class="text-center">
                            <v-chip
                              v-if="grade.quarterly_grade !== null"
                              :color="getGradeColor(grade.quarterly_grade)"
                              size="small"
                            >
                              {{ grade.quarterly_grade.toFixed(2) }}
                            </v-chip>
                            <span v-else class="text-medium-emphasis">N/A</span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot v-if="subject.final_grade">
                        <tr class="bg-grey-lighten-4">
                          <td class="text-right" colspan="4">
                            <strong>Final Grade:</strong>
                          </td>
                          <td class="text-center">
                            <v-chip
                              :color="getGradeColor(subject.final_grade)"
                              size="small"
                            >
                              {{ subject.final_grade.toFixed(2) }}
                            </v-chip>
                          </td>
                        </tr>
                        <tr class="bg-grey-lighten-4">
                          <td class="text-right" colspan="4">
                            <strong>Remarks:</strong>
                          </td>
                          <td class="text-center">
                            <v-chip
                              :color="
                                subject.remarks === 'PASSED'
                                  ? 'success'
                                  : 'error'
                              "
                              size="small"
                              variant="tonal"
                            >
                              {{ subject.remarks || "N/A" }}
                            </v-chip>
                          </td>
                        </tr>
                      </tfoot>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Grade Legend -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="bg-info">
              <v-icon start>mdi-information</v-icon>
              Grading System
            </v-card-title>
            <v-card-text class="pa-4">
              <p class="text-body-2 mb-4">
                <strong>DepEd Grading Formula:</strong> Quarterly Grade =
                (Written Work × 30%) + (Performance Task × 50%) + (Quarterly
                Assessment × 20%)
              </p>
              <v-row>
                <v-col cols="12" md="6">
                  <p class="text-body-2 font-weight-bold mb-2">Grade Scale:</p>
                  <ul class="text-body-2">
                    <li>
                      <v-chip
                        class="mr-1"
                        color="purple"
                        size="x-small"
                      />
                      98-100: Outstanding
                    </li>
                    <li>
                      <v-chip
                        class="mr-1"
                        color="deep-purple"
                        size="x-small"
                      />
                      95-97: Very Satisfactory
                    </li>
                    <li>
                      <v-chip
                        class="mr-1"
                        color="indigo"
                        size="x-small"
                      />
                      90-94: Satisfactory
                    </li>
                    <li>
                      <v-chip class="mr-1" color="blue" size="x-small" />
                      85-89: Fairly Satisfactory
                    </li>
                    <li>
                      <v-chip
                        class="mr-1"
                        color="green"
                        size="x-small"
                      />
                      75-84: Passed
                    </li>
                    <li>
                      <v-chip class="mr-1" color="red" size="x-small" />
                      Below 75: Failed
                    </li>
                  </ul>
                </v-col>
                <v-col cols="12" md="6">
                  <p class="text-body-2 font-weight-bold mb-2">
                    Honors Criteria:
                  </p>
                  <ul class="text-body-2">
                    <li>
                      <v-chip
                        class="mr-1"
                        color="purple"
                        size="x-small"
                      />
                      98+: With Highest Honors
                    </li>
                    <li>
                      <v-chip
                        class="mr-1"
                        color="deep-purple"
                        size="x-small"
                      />
                      95-97.99: With High Honors
                    </li>
                    <li>
                      <v-chip
                        class="mr-1"
                        color="indigo"
                        size="x-small"
                      />
                      90-94.99: With Honors
                    </li>
                  </ul>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { type StudentGrade, useStudent } from '@/composables/useStudent'
  import { supabase } from '@/services/supabase'

  const { loading, error, fetchStudentGrades, fetchStudentGPA } = useStudent()

  // Component state
  const grades = ref<StudentGrade[]>([])
  const gpaData = ref<any[]>([])
  const schoolYears = ref<any[]>([])
  const selectedSchoolYear = ref<string>('')

  // Computed properties
  const currentGPA = computed(() => {
    return (
      gpaData.value.find(
        gpa => gpa.school_year_id === selectedSchoolYear.value,
      ) || null
    )
  })

  const honorsColor = computed(() => {
    if (!currentGPA.value) return 'grey'
    const gpa = currentGPA.value.general_average
    if (gpa >= 98) return 'purple'
    if (gpa >= 95) return 'deep-purple'
    if (gpa >= 90) return 'indigo'
    return 'grey'
  })

  const subjectGroups = computed(() => {
    const groups = new Map<string, any>()

    for (const grade of grades.value) {
      const key = grade.subject_code

      if (!groups.has(key)) {
        groups.set(key, {
          code: grade.subject_code,
          name: grade.subject_name,
          teacher_name: grade.teacher_name,
          final_grade: grade.final_grade,
          remarks: grade.remarks,
          grades: [],
        })
      }

      groups.get(key)!.grades.push(grade)
    }

    // Sort grades within each subject by grading period
    for (const group of groups.values()) {
      group.grades.sort(
        (a: StudentGrade, b: StudentGrade) => a.grading_period - b.grading_period,
      )
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    )
  })

  // Methods
  function getGradeColor (grade: number): string {
    if (grade >= 98) return 'purple'
    if (grade >= 95) return 'deep-purple'
    if (grade >= 90) return 'indigo'
    if (grade >= 85) return 'blue'
    if (grade >= 75) return 'green'
    return 'red'
  }

  async function loadSchoolYears () {
    try {
      const { data, error: fetchError } = await supabase
        .from('school_years')
        .select('*')
        .order('year_start', { ascending: false })

      if (fetchError) {
        console.error('Error loading school years:', fetchError)
        return
      }

      schoolYears.value = data || []

      // Set active school year as default
      const activeYear = schoolYears.value.find(y => y.is_active)
      if (activeYear) {
        selectedSchoolYear.value = activeYear.id
      } else if (schoolYears.value.length > 0) {
        selectedSchoolYear.value = schoolYears.value[0].id
      }

      // Load grades for selected year
      if (selectedSchoolYear.value) {
        await loadGrades()
      }
    } catch (error_) {
      console.error('Unexpected error loading school years:', error_)
    }
  }

  async function loadGrades () {
    if (!selectedSchoolYear.value) return

    // Fetch grades and GPA in parallel
    const [gradesData, gpaDataResult] = await Promise.all([
      fetchStudentGrades(selectedSchoolYear.value),
      fetchStudentGPA(),
    ])

    grades.value = gradesData
    gpaData.value = gpaDataResult
  }

  onMounted(() => {
    loadSchoolYears()
  })
</script>

<route lang="yaml">
meta:
  requiresAuth: true
  requiresRole: student
  layout: student
</route>

<style scoped>
.v-expansion-panel-title {
  background-color: #f5f5f5;
}
</style>
