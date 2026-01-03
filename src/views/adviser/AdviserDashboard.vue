<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="mb-6">
          <h1 class="text-h4 font-weight-bold">Adviser Dashboard</h1>
          <p class="text-grey">
            Manage your sections, encode grades, and generate documents
          </p>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="4" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-google-classroom</v-icon>
            My Sections
          </v-card-title>
          <v-card-text>
            <v-row v-if="sections.length">
              <v-col
                v-for="section in sections"
                :key="section.id"
                cols="12"
                sm="6"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-h6">{{
                    section.name
                  }}</v-card-title>
                  <v-card-subtitle>{{ section.school_year }}</v-card-subtitle>
                  <v-card-text>
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-chip size="small" color="primary" variant="tonal">
                        {{ section.student_count || 0 }} students
                      </v-chip>
                      <v-chip size="small" color="success" variant="tonal">
                        {{ section.subject_count || 0 }} subjects
                      </v-chip>
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      variant="text"
                      color="primary"
                      :to="`/adviser/grades?section=${section.id}`"
                    >
                      Encode Grades
                    </v-btn>
                    <v-btn
                      variant="text"
                      :to="`/adviser/documents?section=${section.id}`"
                    >
                      Documents
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <v-alert v-else type="info" variant="tonal">
              No sections assigned. Contact admin to be assigned as adviser.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon color="warning" class="mr-2">mdi-clock-outline</v-icon>
            Recent Activity
          </v-card-title>
          <v-card-text>
            <v-list v-if="activities.length" density="compact">
              <v-list-item v-for="(activity, i) in activities" :key="i">
                <template #prepend>
                  <v-icon :color="activity.color" size="small">{{
                    activity.icon
                  }}</v-icon>
                </template>
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.time }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-grey text-center py-4">
              No recent activity
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="4" class="mb-4">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text class="d-flex flex-column gap-2">
            <v-btn
              block
              variant="tonal"
              color="primary"
              prepend-icon="mdi-clipboard-edit"
              to="/adviser/grades"
            >
              Encode Grades
            </v-btn>
            <v-btn
              block
              variant="tonal"
              color="success"
              prepend-icon="mdi-file-document"
              to="/adviser/documents"
            >
              Document Center
            </v-btn>
            <v-btn
              block
              variant="tonal"
              color="info"
              prepend-icon="mdi-account-school"
              to="/adviser/students"
            >
              Manage Students
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card elevation="4">
          <v-card-title>Stats</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-grey">Total Students</span>
              <span class="text-h6 font-weight-bold">{{ stats.students }}</span>
            </div>
            <div class="d-flex justify-space-between align-center mb-3">
              <span class="text-grey">Grades Encoded</span>
              <span class="text-h6 font-weight-bold">{{
                stats.gradesEncoded
              }}</span>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span class="text-grey">SF9 Generated</span>
              <span class="text-h6 font-weight-bold">{{
                stats.sf9Generated
              }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

interface Section {
  id: number;
  name: string;
  school_year?: string;
  student_count?: number;
  subject_count?: number;
}

interface Activity {
  title: string;
  time: string;
  icon: string;
  color: string;
}

const sections = ref<Section[]>([]);
const activities = ref<Activity[]>([]);
const stats = ref({
  students: 0,
  gradesEncoded: 0,
  sf9Generated: 0,
});

async function fetchSections() {
  // Get teacher ID from current user
  const { data: teacherData } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", authStore.user?.id)
    .single();

  if (!teacherData) return;

  const { data, error } = await supabase
    .from("sections")
    .select(
      `
      id, name,
      school_years(year_label)
    `
    )
    .eq("adviser_teacher_id", teacherData.id);

  if (!error && data) {
    sections.value = data.map((s: any) => ({
      id: s.id,
      name: s.name,
      school_year: s.school_years?.year_label,
      student_count: 0,
      subject_count: 0,
    }));

    // Fetch counts for each section
    for (const section of sections.value) {
      const { count: studentCount } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("section_id", section.id);

      section.student_count = studentCount || 0;
    }
  }
}

async function fetchStats() {
  const { data: teacherData } = await supabase
    .from("teachers")
    .select("id")
    .eq("user_id", authStore.user?.id)
    .single();

  if (!teacherData) return;

  // Count students in adviser's sections
  const sectionIds = sections.value.map((s) => s.id);
  if (sectionIds.length > 0) {
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .in("section_id", sectionIds);

    stats.value.students = count || 0;
  }

  // Mock data for now
  stats.value.gradesEncoded = 45;
  stats.value.sf9Generated = 12;
}

function loadActivities() {
  activities.value = [
    {
      title: "Encoded grades for Grade 11 - STEM A",
      time: "2 hours ago",
      icon: "mdi-pencil",
      color: "primary",
    },
    {
      title: "Generated SF9 for Juan Dela Cruz",
      time: "Yesterday",
      icon: "mdi-file-document",
      color: "success",
    },
    {
      title: "Enrolled 5 new students",
      time: "2 days ago",
      icon: "mdi-account-plus",
      color: "info",
    },
  ];
}

onMounted(async () => {
  await fetchSections();
  await fetchStats();
  loadActivities();
});
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
