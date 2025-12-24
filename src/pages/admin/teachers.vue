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
      <v-col cols="auto" class="d-flex align-center">
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="openPreRegisterDialog"
        >
          Pre-Register Teacher
        </v-btn>
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
          <v-textarea
            v-model="rejectReason"
            label="Reason for Rejection *"
            placeholder="Explain why this account is being rejected..."
            variant="outlined"
            rows="3"
            class="mb-2"
          />
          <v-alert color="warning" variant="tonal">
            This will prevent the teacher from accessing the system.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="rejectDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="rejecting"
            :disabled="!rejectReason"
            @click="confirmRejectTeacher"
          >
            Reject Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pre-Register Teacher Dialog -->
    <v-dialog v-model="preRegisterDialog" max-width="700px">
      <v-card>
        <v-card-title class="text-h5"> Pre-Register Teacher </v-card-title>
        <v-card-text>
          <v-alert class="mb-4" color="info" variant="tonal">
            Pre-register a teacher before they sign up. When they create an
            account with this email, their profile will be auto-populated.
          </v-alert>
          <v-form ref="preRegisterForm">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="preRegisterData.first_name"
                  label="First Name *"
                  variant="outlined"
                  :rules="[(v) => !!v || 'First name is required']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="preRegisterData.middle_name"
                  label="Middle Name"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="preRegisterData.last_name"
                  label="Last Name *"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Last name is required']"
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model="preRegisterData.email"
              label="Email *"
              type="email"
              variant="outlined"
              placeholder="teacher@deped.gov.ph"
              class="mb-3"
              :rules="emailRules"
              :error-messages="emailError"
              @input="validateEmail"
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="preRegisterData.employee_number"
                  label="Employee Number"
                  variant="outlined"
                  placeholder="EMP-12345"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="preRegisterData.department"
                  label="Department"
                  variant="outlined"
                  placeholder="Senior High School"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="preRegisterData.specialization"
                  label="Specialization"
                  variant="outlined"
                  placeholder="Mathematics, Science, etc."
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="preRegisterData.contact_number"
                  label="Contact Number"
                  variant="outlined"
                  placeholder="09XXXXXXXXX"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="preRegisterDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            :disabled="!isPreRegisterFormValid"
            @click="submitPreRegister"
          >
            Pre-Register
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
  rejectTeacher: rejectTeacherApi,
  preRegisterTeacher: preRegisterTeacherApi,
} = useAdmin();

const currentTab = ref("pending");
const searchQuery = ref("");
const pendingTeachers = ref<any[]>([]);
const approvedTeachers = ref<any[]>([]);
const allTeachers = ref<any[]>([]);
const approving = ref<string | null>(null);
const rejecting = ref(false);
const rejectDialog = ref(false);
const rejectReason = ref("");
const selectedTeacher = ref<any>(null);
const editDialog = ref(false);
const preRegisterDialog = ref(false);
const emailError = ref("");
const editingTeacher = ref<any>(null);
const teacherForm = ref({
  employee_number: "",
  department: "",
  specialization: "",
  contact_number: "",
});

const preRegisterData = ref({
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
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

// Email validation rules
const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) =>
    /^[a-zA-Z0-9._%+-]+@deped\.gov\.ph$/.test(v) ||
    "Email must be a valid @deped.gov.ph address",
];

const isPreRegisterFormValid = computed(() => {
  return (
    preRegisterData.value.first_name &&
    preRegisterData.value.last_name &&
    preRegisterData.value.email &&
    /^[a-zA-Z0-9._%+-]+@deped\.gov\.ph$/.test(preRegisterData.value.email) &&
    !emailError.value
  );
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
  rejectReason.value = "";
  rejectDialog.value = true;
}

async function confirmRejectTeacher() {
  if (!selectedTeacher.value || !rejectReason.value) return;
  if (!authStore.profile?.user_id) {
    showSnackbar("Admin user not found", "error");
    return;
  }

  rejecting.value = true;

  try {
    const success = await rejectTeacherApi(
      selectedTeacher.value.user_id,
      rejectReason.value,
      authStore.profile.user_id
    );

    if (success) {
      showSnackbar("Teacher account rejected", "success");
      rejectDialog.value = false;
      selectedTeacher.value = null;
      rejectReason.value = "";
      await loadTeachers();
    } else {
      showSnackbar(error.value || "Failed to reject teacher", "error");
    }
  } catch (err) {
    showSnackbar("An error occurred", "error");
  } finally {
    rejecting.value = false;
  }
}

function openPreRegisterDialog() {
  preRegisterData.value = {
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    employee_number: "",
    department: "",
    specialization: "",
    contact_number: "",
  };
  emailError.value = "";
  preRegisterDialog.value = true;
}

function validateEmail() {
  const depedEmailRegex = /^[a-zA-Z0-9._%+-]+@deped\.gov\.ph$/;
  if (
    preRegisterData.value.email &&
    !depedEmailRegex.test(preRegisterData.value.email)
  ) {
    emailError.value = "Email must be a valid @deped.gov.ph address";
  } else {
    emailError.value = "";
  }
}

async function submitPreRegister() {
  if (!isPreRegisterFormValid.value) return;
  if (!authStore.profile?.user_id) {
    showSnackbar("Admin user not found", "error");
    return;
  }

  const success = await preRegisterTeacherApi(
    preRegisterData.value,
    authStore.profile.user_id
  );

  if (success) {
    showSnackbar(
      "Teacher pre-registered successfully. They will be auto-approved when they sign up.",
      "success"
    );
    preRegisterDialog.value = false;
    await loadTeachers();
  } else {
    showSnackbar(error.value || "Failed to pre-register teacher", "error");
  }
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
