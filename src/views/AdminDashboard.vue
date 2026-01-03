<template>
  <v-container fluid class="pa-6 dashboard-shell">
    <v-row>
      <v-col cols="12">
        <v-card class="hero-card" elevation="8">
          <div class="hero-content">
            <div>
              <div class="text-caption text-uppercase text-grey-darken-1 mb-1">
                Admin
              </div>
              <div class="text-h4 font-weight-bold">
                School Operations Dashboard
              </div>
              <div class="text-body-2 text-grey-darken-1">
                Monitor academic health, keep staff aligned, and act fast on
                risk.
              </div>
              <div class="d-flex flex-wrap align-center gap-2 mt-3">
                <v-chip
                  color="primary"
                  variant="elevated"
                  label
                  prepend-icon="mdi-calendar"
                  >{{ term }}</v-chip
                >
                <v-chip
                  color="success"
                  variant="tonal"
                  label
                  prepend-icon="mdi-shield-check"
                  >Compliant</v-chip
                >
                <v-chip
                  color="warning"
                  variant="tonal"
                  label
                  prepend-icon="mdi-bell-ring"
                  >{{ notifications }} alerts</v-chip
                >
              </div>
            </div>
            <div class="d-flex flex-column align-end gap-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                @click="refreshData"
                :loading="refreshing"
                >Refresh</v-btn
              >
              <div class="text-caption text-grey">
                Last sync: {{ lastRefreshed }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2" dense>
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card elevation="4" class="stat-card">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey-darken-1">
                {{ stat.title }}
              </div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div
                class="text-caption"
                :class="
                  stat.trend.startsWith('+') ? 'text-success' : 'text-error'
                "
              >
                {{ stat.trend }} vs last period
              </div>
            </div>
            <v-avatar size="44" :color="stat.color" variant="tonal">
              <v-icon size="26">{{ stat.icon }}</v-icon>
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4" dense>
      <v-col cols="12" md="8">
        <v-card elevation="6" class="h-100">
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                User Management
              </div>
              <div class="text-caption text-grey-darken-1">
                Control access for admins, teachers, and staff.
              </div>
            </div>
            <div class="d-flex gap-2">
              <v-text-field
                v-model="search"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-magnify"
                placeholder="Search users"
                style="max-width: 220px"
              />
              <v-btn
                color="primary"
                prepend-icon="mdi-account-plus"
                @click="newUserDialog = true"
                >Add User</v-btn
              >
            </div>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">Name</th>
                  <th class="text-left">Role</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Last Active</th>
                  <th class="text-left" style="width: 160px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>
                    <div class="font-weight-medium">{{ user.name }}</div>
                    <div class="text-caption text-grey-darken-1">
                      {{ user.email }}
                    </div>
                  </td>
                  <td>{{ user.role }}</td>
                  <td>
                    <v-chip
                      :color="statusColor(user.status)"
                      size="small"
                      label
                      variant="tonal"
                      >{{ user.status }}</v-chip
                    >
                  </td>
                  <td class="text-grey-darken-1">{{ user.lastActive }}</td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <v-btn
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        @click="toggleStatus(user.id)"
                      >
                        {{ user.status === "active" ? "Disable" : "Activate" }}
                      </v-btn>
                      <v-btn
                        size="x-small"
                        variant="text"
                        color="error"
                        @click="removeUser(user.id)"
                        >Remove</v-btn
                      >
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredUsers.length">
                  <td colspan="5" class="text-center py-6 text-grey">
                    No users match your search.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="6" class="mb-4">
          <v-card-title class="text-subtitle-1 font-weight-bold"
            >School Health</v-card-title
          >
          <v-card-text class="d-flex flex-column gap-3">
            <div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">Attendance</span>
                <span class="text-body-2 font-weight-medium"
                  >{{ metrics.attendance }}%</span
                >
              </div>
              <v-progress-linear
                color="primary"
                height="8"
                :model-value="metrics.attendance"
                rounded
              />
            </div>
            <div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">Submission Rate</span>
                <span class="text-body-2 font-weight-medium"
                  >{{ metrics.submissionRate }}%</span
                >
              </div>
              <v-progress-linear
                color="success"
                height="8"
                :model-value="metrics.submissionRate"
                rounded
              />
            </div>
            <div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">Support Tickets</span>
                <span class="text-body-2 font-weight-medium"
                  >{{ metrics.openTickets }} open</span
                >
              </div>
              <v-progress-linear
                color="warning"
                height="8"
                :model-value="ticketLoad"
                rounded
              />
            </div>
          </v-card-text>
        </v-card>

        <v-card elevation="6">
          <v-card-title class="text-subtitle-1 font-weight-bold"
            >Quick Actions</v-card-title
          >
          <v-card-text class="d-flex flex-column gap-2">
            <v-btn
              block
              variant="tonal"
              prepend-icon="mdi-shield-account"
              color="primary"
              @click="notify('Audit trail exported')"
              >Export Audit Trail</v-btn
            >
            <v-btn
              block
              variant="tonal"
              prepend-icon="mdi-email"
              color="secondary"
              @click="notify('Parents notified')"
              >Notify Parents</v-btn
            >
            <v-btn
              block
              variant="outlined"
              prepend-icon="mdi-cloud-refresh"
              color="primary"
              @click="refreshData"
              >Resync Supabase</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4" dense>
      <v-col cols="12">
        <v-card elevation="6">
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                School Settings
              </div>
              <div class="text-caption text-grey-darken-1">
                Update academic profile and platform defaults.
              </div>
            </div>
            <div class="text-caption text-grey">
              Last saved: {{ lastSaved || "Not yet saved" }}
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-form ref="settingsForm" @submit.prevent="saveSettings">
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="settings.schoolName"
                    label="School Name"
                    required
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="settings.academicYear"
                    label="Academic Year"
                    required
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="settings.gradingScale"
                    :items="gradingScales"
                    label="Grading Scale"
                    density="comfortable"
                    required
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="settings.term"
                    :items="terms"
                    label="Current Term"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="settings.timezone"
                    :items="timezones"
                    label="Timezone"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="settings.enableNotifications"
                    inset
                    label="Notify staff on grade changes"
                    color="primary"
                  />
                  <v-switch
                    v-model="settings.enableTwoFactor"
                    inset
                    label="Require 2FA for admins"
                    color="success"
                  />
                </v-col>
              </v-row>

              <div class="d-flex justify-end gap-2 mt-2">
                <v-btn variant="text" color="secondary" @click="resetSettings"
                  >Reset</v-btn
                >
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="saving"
                  prepend-icon="mdi-content-save"
                  >Save Settings</v-btn
                >
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="newUserDialog" max-width="480">
      <v-card>
        <v-card-title class="text-h6">Add User</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="addUser">
            <v-text-field
              v-model="newUser.name"
              label="Full Name"
              required
              density="comfortable"
            />
            <v-text-field
              v-model="newUser.email"
              label="Email"
              required
              density="comfortable"
              type="email"
            />
            <v-select
              v-model="newUser.role"
              :items="roles"
              label="Role"
              required
              density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="d-flex justify-end">
          <v-btn variant="text" @click="newUserDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="addUser"
            prepend-icon="mdi-account-plus"
            >Add</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="2600"
      variant="flat"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

type UserStatus = "active" | "invited" | "suspended";
type UserRole = "Admin" | "Teacher" | "Staff";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
};

type Stat = {
  title: string;
  value: string;
  trend: string;
  icon: string;
  color: string;
};

const term = ref("SY 2025-2026");
const notifications = ref(3);
const lastRefreshed = ref("Just now");
const refreshing = ref(false);

const stats = ref<Stat[]>([
  {
    title: "Enrolled Students",
    value: "1,240",
    trend: "+3.1%",
    icon: "mdi-school",
    color: "primary",
  },
  {
    title: "Active Teachers",
    value: "68",
    trend: "+1.4%",
    icon: "mdi-account-tie",
    color: "success",
  },
  {
    title: "Average GPA",
    value: "3.42",
    trend: "+0.05",
    icon: "mdi-chart-line",
    color: "info",
  },
  {
    title: "Open Tickets",
    value: "12",
    trend: "-2",
    icon: "mdi-lifebuoy",
    color: "warning",
  },
]);

const users = ref<User[]>([
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.j@smartgrade.edu",
    role: "Admin",
    status: "active",
    lastActive: "Today",
  },
  {
    id: 2,
    name: "Mark Lee",
    email: "mlee@smartgrade.edu",
    role: "Teacher",
    status: "active",
    lastActive: "2h ago",
  },
  {
    id: 3,
    name: "Dana Cruz",
    email: "dcruz@smartgrade.edu",
    role: "Staff",
    status: "invited",
    lastActive: "Pending",
  },
  {
    id: 4,
    name: "Rowena Tan",
    email: "rtan@smartgrade.edu",
    role: "Teacher",
    status: "suspended",
    lastActive: "3d ago",
  },
]);

const metrics = reactive({
  attendance: 94,
  submissionRate: 88,
  openTickets: 12,
});

const settings = reactive({
  schoolName: "SmartGrade Academy",
  academicYear: "2025-2026",
  gradingScale: "Percentage",
  term: "2nd Semester",
  timezone: "Asia/Manila",
  enableNotifications: true,
  enableTwoFactor: true,
});

const gradingScales = ["Percentage", "Letter", "Points"];
const terms = ["1st Semester", "2nd Semester", "Summer"];
const timezones = ["Asia/Manila", "Asia/Singapore", "UTC"];
const roles: UserRole[] = ["Admin", "Teacher", "Staff"];

const search = ref("");
const saving = ref(false);
const lastSaved = ref<string | null>(null);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("primary");
const newUserDialog = ref(false);
const newUser = reactive({ name: "", email: "", role: "Teacher" as UserRole });

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const termVal = search.value.toLowerCase();
  return users.value.filter((u) =>
    [u.name, u.email, u.role, u.status].some((field) =>
      field.toLowerCase().includes(termVal)
    )
  );
});

const ticketLoad = computed(() => Math.min(100, metrics.openTickets * 10));

function statusColor(status: UserStatus) {
  if (status === "active") return "success";
  if (status === "invited") return "warning";
  return "error";
}

function notify(message: string, color: string = "primary") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

function refreshData() {
  if (refreshing.value) return;
  refreshing.value = true;
  setTimeout(() => {
    lastRefreshed.value = "Just refreshed";
    notify("Data refreshed", "primary");
    refreshing.value = false;
  }, 900);
}

function toggleStatus(id: number) {
  const user = users.value.find((u) => u.id === id);
  if (!user) return;
  user.status = user.status === "active" ? "suspended" : "active";
  notify(`User ${user.status === "active" ? "activated" : "disabled"}`);
}

function removeUser(id: number) {
  users.value = users.value.filter((u) => u.id !== id);
  notify("User removed", "error");
}

function addUser() {
  if (!newUser.name || !newUser.email) {
    notify("Name and email are required", "error");
    return;
  }

  const nextId = Math.max(0, ...users.value.map((u) => u.id)) + 1;
  users.value.push({
    id: nextId,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    status: "invited",
    lastActive: "Pending",
  });

  Object.assign(newUser, { name: "", email: "", role: "Teacher" as UserRole });
  newUserDialog.value = false;
  notify("Invitation sent", "success");
}

async function saveSettings() {
  saving.value = true;
  // mimic save delay
  setTimeout(() => {
    saving.value = false;
    lastSaved.value = new Date().toLocaleString();
    notify("Settings saved", "success");
  }, 800);
}

function resetSettings() {
  Object.assign(settings, {
    schoolName: "SmartGrade Academy",
    academicYear: "2025-2026",
    gradingScale: "Percentage",
    term: "2nd Semester",
    timezone: "Asia/Manila",
    enableNotifications: true,
    enableTwoFactor: true,
  });
  notify("Settings reset", "secondary");
}
</script>

<style scoped>
.dashboard-shell {
  background: linear-gradient(135deg, #f4f6fb 0%, #eef2ff 100%);
  min-height: 100vh;
}

.hero-card {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 35%, #0ea5e9 100%);
  color: #fff;
  border-radius: 16px;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  border-radius: 14px;
  padding: 1rem;
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.h-100 {
  height: 100%;
}
</style>
