<template>
  <v-container fluid class="pa-6">
    <!-- Access Denied -->
    <v-row v-if="accessDenied">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" class="text-center">
          <v-icon size="48" class="mb-2">mdi-shield-alert</v-icon>
          <div class="text-h6">Access Denied</div>
          <div class="text-body-2">
            You do not have permission to access this page.
          </div>
          <v-btn color="primary" class="mt-4" to="/">Go Home</v-btn>
        </v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center flex-wrap">
            <div>
              <h1 class="text-h4 font-weight-bold mb-1">Admin Dashboard</h1>
              <p class="text-body-1 text-grey-darken-1">
                Monitor school operations and manage system settings.
              </p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              @click="loadData"
            >
              Refresh
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Stats Cards -->
      <v-row class="mt-4">
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="4" class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-grey-darken-1">
                  Total Students
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.students }}</div>
              </div>
              <v-avatar color="primary" size="48" variant="tonal">
                <v-icon size="28">mdi-school</v-icon>
              </v-avatar>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card elevation="4" class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-grey-darken-1">
                  Total Teachers
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.teachers }}</div>
              </div>
              <v-avatar color="success" size="48" variant="tonal">
                <v-icon size="28">mdi-account-tie</v-icon>
              </v-avatar>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card elevation="4" class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-grey-darken-1">
                  Total Sections
                </div>
                <div class="text-h4 font-weight-bold">{{ stats.sections }}</div>
              </div>
              <v-avatar color="info" size="48" variant="tonal">
                <v-icon size="28">mdi-google-classroom</v-icon>
              </v-avatar>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card elevation="4" class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-grey-darken-1">
                  Active School Year
                </div>
                <div class="text-h5 font-weight-bold">
                  {{ stats.activeYear || "Not Set" }}
                </div>
              </div>
              <v-avatar color="warning" size="48" variant="tonal">
                <v-icon size="28">mdi-calendar</v-icon>
              </v-avatar>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions & Recent Activity -->
      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <v-card elevation="4" class="h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold">
              Quick Actions
            </v-card-title>
            <v-card-text class="d-flex flex-column gap-2">
              <v-btn
                block
                color="primary"
                variant="tonal"
                prepend-icon="mdi-cog"
                to="/admin/settings"
              >
                School Settings
              </v-btn>
              <v-btn
                block
                color="success"
                variant="tonal"
                prepend-icon="mdi-account-group"
                to="/admin/users"
              >
                User Management
              </v-btn>
              <v-btn
                block
                color="info"
                variant="tonal"
                prepend-icon="mdi-google-classroom"
                to="/admin/sections"
              >
                Section Management
              </v-btn>
              <v-btn
                block
                color="warning"
                variant="tonal"
                prepend-icon="mdi-book-open-variant"
                to="/admin/subjects"
              >
                Subject Management
              </v-btn>
              <v-btn
                block
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-calendar-range"
                to="/admin/school-years"
              >
                School Year Management
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card elevation="4" class="h-100">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-bold"
                >Recent Activity</span
              >
              <v-chip size="small" color="primary" variant="tonal">
                Last 10
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Target</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in auditLogs" :key="log.audit_id">
                    <td>
                      <v-chip
                        :color="getActionColor(log.action)"
                        size="small"
                        label
                      >
                        {{ log.action }}
                      </v-chip>
                    </td>
                    <td>{{ log.user_email || "System" }}</td>
                    <td class="text-grey">{{ log.target_type || "-" }}</td>
                    <td class="text-caption text-grey">
                      {{ formatTime(log.created_at) }}
                    </td>
                  </tr>
                  <tr v-if="!auditLogs.length && !loading">
                    <td colspan="4" class="text-center py-6 text-grey">
                      No recent activity.
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Summary Cards -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card elevation="4">
            <v-card-title class="text-subtitle-1 font-weight-bold">
              System Overview
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary">mdi-book</v-icon>
                  </template>
                  <v-list-item-title>Total Subjects</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold">{{ stats.subjects }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="success">mdi-file-document</v-icon>
                  </template>
                  <v-list-item-title>Documents Generated</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold">{{ stats.documents }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="info">mdi-clipboard-check</v-icon>
                  </template>
                  <v-list-item-title>Grades Recorded</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold">{{ stats.grades }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card elevation="4">
            <v-card-title class="text-subtitle-1 font-weight-bold">
              School Information
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center gap-4">
                <v-avatar size="64" color="grey-lighten-3" rounded>
                  <v-img v-if="schoolInfo.logo" :src="schoolInfo.logo" />
                  <v-icon v-else size="32" color="grey">mdi-school</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ schoolInfo.name || "School Name Not Set" }}
                  </div>
                  <div class="text-body-2 text-grey">
                    Principal: {{ schoolInfo.principal || "Not Set" }}
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const authStore = useAuthStore();

interface AuditLog {
  audit_id: number;
  action: string;
  user_email?: string;
  target_type?: string;
  target_id?: number;
  created_at: string;
}

const loading = ref(false);
const accessDenied = computed(() => authStore.role !== "admin");

const stats = ref({
  students: 0,
  teachers: 0,
  sections: 0,
  subjects: 0,
  documents: 0,
  grades: 0,
  activeYear: "",
});

const schoolInfo = ref({
  name: "",
  principal: "",
  logo: "",
});

const auditLogs = ref<AuditLog[]>([]);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: "success",
    UPDATE: "info",
    DELETE: "error",
    LOGIN: "primary",
    GENERATE: "warning",
    REVOKE: "error",
  };
  return colors[action?.toUpperCase()] || "grey";
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

async function loadData() {
  if (accessDenied.value) return;

  loading.value = true;

  try {
    // Fetch counts in parallel
    const [
      studentsRes,
      teachersRes,
      sectionsRes,
      subjectsRes,
      documentsRes,
      gradesRes,
      activeYearRes,
      schoolRes,
      logsRes,
    ] = await Promise.all([
      supabase
        .from("students")
        .select("student_id", { count: "exact", head: true }),
      supabase
        .from("teachers")
        .select("teacher_id", { count: "exact", head: true }),
      supabase
        .from("sections")
        .select("section_id", { count: "exact", head: true }),
      supabase
        .from("subjects")
        .select("subject_id", { count: "exact", head: true }),
      supabase
        .from("documents")
        .select("document_id", { count: "exact", head: true }),
      supabase
        .from("grades")
        .select("grade_id", { count: "exact", head: true }),
      supabase
        .from("school_years")
        .select("year_label")
        .eq("is_active", true)
        .single(),
      supabase.from("schools").select("*").limit(1).single(),
      supabase
        .from("audit_logs")
        .select("*, users(email)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    stats.value = {
      students: studentsRes.count || 0,
      teachers: teachersRes.count || 0,
      sections: sectionsRes.count || 0,
      subjects: subjectsRes.count || 0,
      documents: documentsRes.count || 0,
      grades: gradesRes.count || 0,
      activeYear: activeYearRes.data?.year_label || "",
    };

    if (schoolRes.data) {
      schoolInfo.value = {
        name: schoolRes.data.school_name || "",
        principal: schoolRes.data.principal_name || "",
        logo: schoolRes.data.logo_path
          ? supabase.storage
              .from("logos")
              .getPublicUrl(schoolRes.data.logo_path).data.publicUrl
          : "",
      };
    }

    if (logsRes.data) {
      auditLogs.value = logsRes.data.map((log: any) => ({
        audit_id: log.audit_id || log.id,
        action: log.action,
        user_email: log.users?.email || log.user_email,
        target_type: log.target_type,
        target_id: log.target_id,
        created_at: log.created_at,
      }));
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    notify("Failed to load data", "error");
  }

  loading.value = false;
}

onMounted(() => {
  if (accessDenied.value) {
    // Redirect after showing message
    setTimeout(() => router.push("/"), 2000);
  } else {
    loadData();
  }
});
</script>

<style scoped>
.h-100 {
  height: 100%;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}
</style>
