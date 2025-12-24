<route lang="yaml">
meta:
  layout: teacher
</route>

<template>
  <div>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Teacher Dashboard</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          Welcome back, {{ authStore.profile?.email }}
        </p>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-subtitle-2 text-grey-darken-1">My Classes</p>
                <h2 class="text-h4">{{ stats.totalClasses }}</h2>
              </div>
              <v-icon color="primary" size="48">mdi-google-classroom</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-subtitle-2 text-grey-darken-1">Total Students</p>
                <h2 class="text-h4">{{ stats.totalStudents }}</h2>
              </div>
              <v-icon color="success" size="48">mdi-account-group</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-subtitle-2 text-grey-darken-1">Active Period</p>
                <h2 class="text-h5">{{ activePeriod }}</h2>
              </div>
              <v-icon color="info" size="48">mdi-calendar-check</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-4">
      <v-col>
        <h2 class="text-h5 mb-4">Quick Actions</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="3" md="6">
        <v-card
          class="text-center pa-4"
          hover
          @click="$router.push('/teacher/classes')"
        >
          <v-icon class="mb-2" color="primary" size="64">
            mdi-google-classroom
          </v-icon>
          <v-card-title class="text-h6">Manage Classes</v-card-title>
          <v-card-text class="text-grey-darken-1">
            Create classes, enroll students, view rosters
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3" md="6">
        <v-card class="text-center pa-4" disabled hover>
          <v-icon class="mb-2" color="grey" size="64">
            mdi-pencil-box-outline
          </v-icon>
          <v-card-title class="text-h6">Enter Grades</v-card-title>
          <v-card-text class="text-grey-darken-1">
            Coming in Phase 7
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3" md="6">
        <v-card class="text-center pa-4" disabled hover>
          <v-icon class="mb-2" color="grey" size="64">
            mdi-certificate-outline
          </v-icon>
          <v-card-title class="text-h6">Generate Documents</v-card-title>
          <v-card-text class="text-grey-darken-1">
            SF9, SF10, Certificates
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3" md="6">
        <v-card class="text-center pa-4" disabled hover>
          <v-icon class="mb-2" color="grey" size="64"> mdi-history </v-icon>
          <v-card-title class="text-h6">My Activity</v-card-title>
          <v-card-text class="text-grey-darken-1">
            View your audit logs
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Classes -->
    <v-row v-if="recentClasses.length > 0" class="mt-6">
      <v-col>
        <h2 class="text-h5 mb-4">Recent Classes</h2>
      </v-col>
    </v-row>

    <v-row v-if="recentClasses.length > 0">
      <v-col
        v-for="cls in recentClasses"
        :key="cls.id"
        cols="12"
        lg="4"
        md="6"
      >
        <v-card hover @click="$router.push(`/teacher/classes/${cls.id}`)">
          <v-card-title class="bg-primary">
            <div class="d-flex align-center justify-space-between">
              <span class="text-white">{{ cls.subject_code }}</span>
              <v-chip color="white" size="small" variant="flat">
                {{ cls.section }}
              </v-chip>
            </div>
          </v-card-title>
          <v-card-subtitle class="mt-2">
            {{ cls.subject_name }}
          </v-card-subtitle>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <span class="text-grey-darken-1">
                <v-icon size="small">mdi-account-group</v-icon>
                {{ cls.student_count }} students
              </span>
              <span class="text-grey-darken-1">
                Q{{ cls.grading_period }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col>
        <v-progress-linear color="primary" indeterminate />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useTeacher } from '@/composables/useTeacher'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const { fetchTeacherClasses, loading } = useTeacher()

  const stats = ref({
    totalClasses: 0,
    totalStudents: 0,
  })

  const recentClasses = ref<any[]>([])
  const activePeriod = ref('S.Y. 2024-2025')

  onMounted(async () => {
    const classes = await fetchTeacherClasses()
    stats.value.totalClasses = classes.length
    stats.value.totalStudents = classes.reduce(
      (sum, cls) => sum + (cls.student_count || 0),
      0,
    )

    // Show up to 3 most recent classes
    recentClasses.value = classes.slice(0, 3)
  })
</script>
