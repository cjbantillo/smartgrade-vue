/** * Teacher Management Page * * Admin capability: Approve teacher accounts
affiliated with Ampayon National High School - SHS * Policy: Ensures only
authorized personnel access the system */

<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
</route>

<template>
  <v-container fluid>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col>
        <v-btn
          class="mb-4"
          prepend-icon="mdi-arrow-left"
          to="/admin"
          variant="text"
        >
          Back to Dashboard
        </v-btn>
        <h1 class="text-h4 font-weight-bold">Teacher Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Approve teacher accounts for Ampayon National High School - SHS
        </p>
      </v-col>
    </v-row>

    <!-- Tabs for Pending/Approved -->
    <v-tabs v-model="currentTab" class="mb-4" color="primary">
      <v-tab value="pending">
        <v-icon class="mr-2">mdi-account-clock</v-icon>
        Pending Approval ({{ pendingTeachers.length }})
      </v-tab>
      <v-tab value="approved">
        <v-icon class="mr-2">mdi-account-check</v-icon>
        Approved Teachers ({{ approvedTeachers.length }})
      </v-tab>
    </v-tabs>

    <v-window v-model="currentTab">
      <!-- Pending Teachers Tab -->
      <v-window-item value="pending">
        <v-card>
          <v-card-text>
            <v-alert
              v-if="pendingTeachers.length === 0"
              class="mb-4"
              color="success"
              icon="mdi-check-circle"
              variant="tonal"
            >
              No pending teacher approvals. All teacher accounts are up to date.
            </v-alert>

            <v-table v-else>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Employee #</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in pendingTeachers" :key="teacher.user_id">
                  <td>
                    <div class="font-weight-medium">
                      {{ teacher.first_name }} {{ teacher.middle_name || "" }}
                      {{ teacher.last_name }}
                    </div>
                  </td>
                  <td>{{ teacher.email }}</td>
                  <td>{{ teacher.teacher?.department || "N/A" }}</td>
                  <td>{{ teacher.teacher?.employee_number || "N/A" }}</td>
                  <td>{{ formatDate(teacher.created_at) }}</td>
                  <td>
                    <v-btn
                      class="mr-2"
                      color="success"
                      :loading="approving === teacher.user_id"
                      prepend-icon="mdi-check"
                      size="small"
                      @click="approveTeacher(teacher)"
                    >
                      Approve
                    </v-btn>
                    <v-btn
                      color="error"
                      prepend-icon="mdi-close"
                      size="small"
                      variant="outlined"
                      @click="openRejectDialog(teacher)"
                    >
                      Reject
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Approved Teachers Tab -->
      <v-window-item value="approved">
        <v-card>
          <v-card-text>
            <v-text-field
              v-model="searchQuery"
              append-inner-icon="mdi-magnify"
              clearable
              density="compact"
              label="Search teachers..."
              class="mb-4"
              variant="outlined"
            />

            <v-data-table
              :headers="approvedHeaders"
              :items="filteredApprovedTeachers"
              :loading="loading"
              class="elevation-1"
              item-value="id"
            >
              <template #[`item.name`]="{ item }">
                {{ getFullName(item) }}
              </template>

              <template #[`item.email`]="{ item }">
                {{ getEmail(item) }}
              </template>

              <template #[`item.employee_number`]="{ item }">
                {{ item.employee_number || "Not set" }}
              </template>

              <template #[`item.department`]="{ item }">
                {{ item.department || "Not set" }}
              </template>

              <template #[`item.approved_at`]="{ item }">
                {{ formatDate(item.profiles?.approved_at) }}
              </template>

              <template #[`item.status`]="{ item }">
                <v-chip
                  :color="item.profiles?.is_active ? 'success' : 'error'"
                  size="small"
                >
                  {{ item.profiles?.is_active ? "Active" : "Inactive" }}
                </v-chip>
              </template>

              <template #[`item.actions`]="{ item }">
                <v-btn
                  class="mr-2"
                  color="primary"
                  size="small"
                  variant="tonal"
                  icon="mdi-pencil"
                  @click="openEditDialog(item)"
                />
                <v-btn
                  v-if="item.profiles?.is_active"
                  color="error"
                  size="small"
                  variant="tonal"
                  icon="mdi-account-off"
                  @click="handleDeactivate(item)"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Edit Teacher Dialog -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5"> Edit Teacher Data </v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="teacherForm.employee_number"
              label="Employee Number *"
              placeholder="Enter employee number"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="teacherForm.department"
              label="Department *"
              placeholder="e.g., Senior High School"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="teacherForm.specialization"
              label="Specialization"
              placeholder="e.g., Mathematics, Science"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="teacherForm.contact_number"
              label="Contact Number"
              placeholder="e.g., 09XXXXXXXXX"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="saveTeacher"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Confirmation Dialog -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title>Reject Teacher Account</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Are you sure you want to reject the account for
            <strong
              >{{ selectedTeacher?.first_name }}
              {{ selectedTeacher?.last_name }}</strong
            >?
          </p>
          <v-alert color="warning" variant="tonal">
            This will prevent the teacher from accessing the system.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="rejectDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="rejecting" @click="rejectTeacher">
            Reject Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
      <template #actions>
        <v-btn @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";
import { useAdmin } from "@/composables/useAdmin";

const authStore = useAuthStore();
const {
  loading,
  error,
  fetchTeachers,
  fetchPendingTeachers,
  approveTeacher: approveTeacherApi,
  upsertTeacher,
  deactivateTeacher: deactivateTeacherApi,
} = useAdmin();

const currentTab = ref("pending");
const searchQuery = ref("");
const pendingTeachers = ref<any[]>([]);
const approvedTeachers = ref<any[]>([]);
const allTeachers = ref<any[]>([]);
const approving = ref<string | null>(null);
const rejecting = ref(false);
const rejectDialog = ref(false);
const selectedTeacher = ref<any>(null);
const editDialog = ref(false);
const editingTeacher = ref<any>(null);
const teacherForm = ref({
  employee_number: "",
  department: "",
  specialization: "",
  contact_number: "",
});

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const filteredApprovedTeachers = computed(() => {
  if (!searchQuery.value) return approvedTeachers.value;

  const query = searchQuery.value.toLowerCase();
  return approvedTeachers.value.filter((teacher) => {
    const firstName = teacher.profiles?.first_name?.toLowerCase() || "";
    const lastName = teacher.profiles?.last_name?.toLowerCase() || "";
    const email = teacher.profiles?.email?.toLowerCase() || "";
    const department = teacher.department?.toLowerCase() || "";

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      email.includes(query) ||
      department.includes(query)
    );
  });
});

const approvedHeaders = [
  { title: "Name", value: "name", key: "name" },
  { title: "Email", value: "email", key: "email" },
  {
    title: "Employee Number",
    value: "employee_number",
    key: "employee_number",
  },
  { title: "Department", value: "department", key: "department" },
  { title: "Approved Date", value: "approved_at", key: "approved_at" },
  { title: "Status", value: "status", key: "status" },
  { title: "Actions", value: "actions", key: "actions", sortable: false },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadTeachers() {
  // Fetch pending teachers from useAdmin composable
  pendingTeachers.value = await fetchPendingTeachers();

  // Fetch all teachers with profile data
  allTeachers.value = await fetchTeachers();

  // Filter approved teachers
  approvedTeachers.value = allTeachers.value.filter(
    (t: any) => t.profiles?.is_approved
  );
}

async function approveTeacher(teacher: any) {
  if (!authStore.profile?.user_id) {
    showSnackbar("Admin user not found", "error");
    return;
  }

  approving.value = teacher.user_id;

  try {
    const success = await approveTeacherApi(
      teacher.user_id,
      authStore.profile.user_id
    );

    if (success) {
      // Log the approval
      await supabase.from("audit_logs").insert({
        user_id: authStore.profile.user_id,
        action: "teacher_approved",
        entity_type: "profile",
        entity_id: teacher.user_id,
        new_values: {
          approved: true,
          teacher_name: `${teacher.first_name} ${teacher.last_name}`,
          teacher_email: teacher.email,
        },
      });

      showSnackbar(
        `${teacher.first_name} ${teacher.last_name} has been approved`,
        "success"
      );
      await loadTeachers();
    } else {
      showSnackbar(error.value || "Failed to approve teacher", "error");
    }
  } catch (err: any) {
    showSnackbar(`Error: ${err.message}`, "error");
  } finally {
    approving.value = null;
  }
}

function openEditDialog(teacher: any) {
  editingTeacher.value = teacher;
  teacherForm.value = {
    employee_number: teacher.employee_number || "",
    department: teacher.department || "",
    specialization: teacher.specialization || "",
    contact_number: teacher.contact_number || "",
  };
  editDialog.value = true;
}

async function saveTeacher() {
  if (!editingTeacher.value) return;

  const teacherData = {
    ...teacherForm.value,
    user_id: editingTeacher.value.user_id,
  };

  const success = await upsertTeacher(teacherData, editingTeacher.value.id);

  if (success) {
    showSnackbar("Teacher data updated successfully", "success");
    editDialog.value = false;
    await loadTeachers();
  } else {
    showSnackbar(error.value || "Failed to update teacher", "error");
  }
}

async function handleDeactivate(teacher: any) {
  if (
    !confirm(
      `Are you sure you want to deactivate ${teacher.profiles?.first_name} ${teacher.profiles?.last_name}?`
    )
  ) {
    return;
  }

  const success = await deactivateTeacherApi(teacher.user_id);

  if (success) {
    showSnackbar("Teacher deactivated successfully", "success");
    await loadTeachers();
  } else {
    showSnackbar(error.value || "Failed to deactivate teacher", "error");
  }
}

function showSnackbar(
  message: string,
  color: "success" | "error" | "warning" = "success"
) {
  snackbar.value = {
    show: true,
    message,
    color,
  };
}

function getFullName(item: any) {
  if (item.profiles) {
    return `${item.profiles.first_name || ""} ${
      item.profiles.last_name || ""
    }`.trim();
  }
  return `${item.first_name || ""} ${item.last_name || ""}`.trim();
}

function getEmail(item: any) {
  return item.profiles?.email || item.email || "";
}

function openRejectDialog(teacher: any) {
  selectedTeacher.value = teacher;
  rejectDialog.value = true;
}

async function rejectTeacher() {
  if (!selectedTeacher.value) return;

  rejecting.value = true;

  try {
    // Set account to inactive (soft reject)
    const { error } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        is_approved: false,
      })
      .eq("user_id", selectedTeacher.value.user_id);

    if (error) throw error;

    // Log the rejection
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.id,
      action: "teacher_rejected",
      entity_type: "profile",
      entity_id: selectedTeacher.value.user_id,
      new_values: {
        rejected: true,
        teacher_name: `${selectedTeacher.value.first_name} ${selectedTeacher.value.last_name}`,
        teacher_email: selectedTeacher.value.email,
      },
    });

    snackbar.value = {
      show: true,
      message: `${selectedTeacher.value.first_name} ${selectedTeacher.value.last_name}'s account has been rejected`,
      color: "warning",
    };

    rejectDialog.value = false;
    selectedTeacher.value = null;
    await loadTeachers();
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error: ${error.message}`,
      color: "error",
    };
  } finally {
    rejecting.value = false;
  }
}

onMounted(() => {
  loadTeachers();
});
</script>
