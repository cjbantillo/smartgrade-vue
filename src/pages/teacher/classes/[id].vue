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
          @click="$router.push('/teacher/classes')"
        >
          Back to Classes
        </v-btn>
        <h1 class="text-h4">
          {{ classInfo?.subject_code }} - {{ classInfo?.section }}
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          {{ classInfo?.subject_name }} • {{ classInfo?.school_year }} • Quarter
          {{ classInfo?.grading_period }}
        </p>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-4">
      <v-col>
        <v-btn
          color="primary"
          prepend-icon="mdi-pencil-box-outline"
          size="large"
          @click="$router.push(`/teacher/classes/${classId}/grades`)"
        >
          Manage Grades
        </v-btn>
      </v-col>
    </v-row>

    <!-- Stats -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-subtitle-2 text-grey-darken-1">
                  Enrolled Students
                </p>
                <h2 class="text-h4">{{ students.length }}</h2>
              </div>
              <v-icon color="primary" size="40">mdi-account-group</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Enroll Student Section -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="bg-success text-white">
            <v-icon class="mr-2">mdi-account-plus</v-icon>
            Enroll Student
          </v-card-title>
          <v-card-text class="pt-4">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="searchQuery"
                  clearable
                  hint="Search for students by their LRN or name"
                  label="Search by LRN, First Name, or Last Name"
                  persistent-hint
                  placeholder="Enter at least 2 characters"
                  prepend-icon="mdi-magnify"
                  @input="handleSearch"
                />
              </v-col>
            </v-row>

            <!-- Search Results -->
            <v-list v-if="searchResults.length > 0" class="mt-4">
              <v-list-subheader>Search Results</v-list-subheader>
              <v-list-item
                v-for="student in searchResults"
                :key="student.id"
                :disabled="loading"
                @click="handleEnrollStudent(student.id)"
              >
                <template #prepend>
                  <v-avatar color="primary">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ student.first_name }}
                  {{ student.middle_name ? student.middle_name + " " : ""
                  }}{{ student.last_name }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  LRN: {{ student.lrn }}
                  <span v-if="student.track">• {{ student.track }}</span>
                  <span v-if="student.strand">- {{ student.strand }}</span>
                  • Grade {{ student.grade_level }}
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    color="success"
                    icon="mdi-plus"
                    :loading="loading"
                    variant="text"
                    @click.stop="handleEnrollStudent(student.id)"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-alert
              v-if="
                searchQuery &&
                  searchQuery.length >= 2 &&
                  searchResults.length === 0 &&
                  !searchLoading
              "
              class="mt-4"
              type="info"
            >
              No students found matching "{{ searchQuery }}"
            </v-alert>

            <v-progress-linear
              v-if="searchLoading"
              class="mt-4"
              color="primary"
              indeterminate
            />

            <v-alert v-if="error" class="mt-4" type="error">
              {{ error }}
            </v-alert>

            <v-alert
              v-if="successMessage"
              class="mt-4"
              closable
              type="success"
              @click:close="successMessage = ''"
            >
              {{ successMessage }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Student Roster -->
    <v-row>
      <v-col>
        <v-card>
          <v-card-title class="bg-primary text-white">
            <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
            Class Roster
          </v-card-title>

          <v-card-text
            v-if="students.length === 0 && !loading"
            class="text-center pa-8"
          >
            <v-icon
              color="grey-lighten-1"
              size="80"
            >mdi-account-group-outline</v-icon>
            <h3 class="text-h6 mt-4 mb-2">No Students Enrolled</h3>
            <p class="text-grey-darken-1">
              Use the search above to find and enroll students in this class.
            </p>
          </v-card-text>

          <v-table v-if="students.length > 0">
            <thead>
              <tr>
                <th class="text-left">#</th>
                <th class="text-left">LRN</th>
                <th class="text-left">Name</th>
                <th class="text-left">Track/Strand</th>
                <th class="text-left">Grade Level</th>
                <th class="text-left">Enrolled</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, index) in students" :key="student.id">
                <td>{{ index + 1 }}</td>
                <td>{{ student.lrn }}</td>
                <td>
                  {{ student.first_name }}
                  {{
                    student.middle_name
                      ? student.middle_name.charAt(0) + "."
                      : ""
                  }}
                  {{ student.last_name }}
                </td>
                <td>
                  <span v-if="student.track">
                    {{ student.track }}
                    <span v-if="student.strand">- {{ student.strand }}</span>
                  </span>
                  <span v-else class="text-grey">N/A</span>
                </td>
                <td>Grade {{ student.grade_level }}</td>
                <td>{{ formatDate(student.enrolled_at) }}</td>
                <td>
                  <v-btn
                    color="error"
                    icon="mdi-delete"
                    :loading="loading"
                    size="small"
                    variant="text"
                    @click="
                      handleUnenrollStudent(
                        student.id,
                        student.first_name,
                        student.last_name
                      )
                    "
                  />
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-progress-linear
            v-if="loading"
            color="primary"
            indeterminate
          />
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirm Unenroll Dialog -->
    <v-dialog v-model="unenrollDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-error text-white">
          Confirm Unenrollment
        </v-card-title>
        <v-card-text class="pt-4">
          <p>
            Are you sure you want to remove
            <strong>{{ unenrollStudentName }}</strong> from this class?
          </p>
          <v-alert class="mt-4" type="warning">
            This action cannot be undone. The student will need to be
            re-enrolled manually.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="loading"
            variant="text"
            @click="unenrollDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn color="error" :loading="loading" @click="confirmUnenroll">
            Remove Student
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useTeacher } from '@/composables/useTeacher'

  const route = useRoute()
  const {
    loading,
    error,
    fetchTeacherClasses,
    fetchClassStudents,
    searchStudents,
    enrollStudent,
    unenrollStudent,
  } = useTeacher()

  const classId = ref(route.params.id as string)
  const classInfo = ref<any>(null)
  const students = ref<any[]>([])
  const searchQuery = ref('')
  const searchResults = ref<any[]>([])
  const searchLoading = ref(false)
  const successMessage = ref('')
  const unenrollDialog = ref(false)
  const unenrollStudentId = ref('')
  const unenrollStudentName = ref('')

  async function loadClassData () {
    // Get class info
    const classes = await fetchTeacherClasses()
    classInfo.value = classes.find(c => c.id === classId.value)

    if (!classInfo.value) {
      // Class not found or doesn't belong to this teacher
      return
    }

    // Load students
    await loadStudents()
  }

  async function loadStudents () {
    students.value = await fetchClassStudents(classId.value)
  }

  let searchTimeout: any = null
  async function handleSearch () {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (!searchQuery.value || searchQuery.value.length < 2) {
      searchResults.value = []
      return
    }

    searchTimeout = setTimeout(async () => {
      searchLoading.value = true
      searchResults.value = await searchStudents(searchQuery.value)
      searchLoading.value = false
    }, 300)
  }

  async function handleEnrollStudent (studentId: string) {
    const success = await enrollStudent(classId.value, studentId)

    if (success) {
      successMessage.value = 'Student enrolled successfully!'
      searchQuery.value = ''
      searchResults.value = []
      await loadStudents()

      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  }

  function handleUnenrollStudent (
    enrollmentId: string,
    firstName: string,
    lastName: string,
  ) {
    unenrollStudentId.value = enrollmentId
    unenrollStudentName.value = `${firstName} ${lastName}`
    unenrollDialog.value = true
  }

  async function confirmUnenroll () {
    const success = await unenrollStudent(unenrollStudentId.value)

    if (success) {
      successMessage.value = 'Student removed from class'
      unenrollDialog.value = false
      await loadStudents()

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  }

  function formatDate (dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  onMounted(() => {
    loadClassData()
  })
</script>
