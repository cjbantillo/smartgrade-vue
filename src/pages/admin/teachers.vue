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
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4 font-weight-bold">Teacher Management</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Manage teacher accounts for Ampayon National High School - SHS
            </p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Add Teacher
          </v-btn>
        </div>
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
              variant="outlined"
            />

            <v-table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Employee #</th>
                  <th>Approved Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="teacher in filteredApprovedTeachers"
                  :key="teacher.user_id"
                >
                  <td>
                    <div class="font-weight-medium">
                      {{ teacher.first_name }} {{ teacher.middle_name || "" }}
                      {{ teacher.last_name }}
                    </div>
                  </td>
                  <td>{{ teacher.email }}</td>
                  <td>{{ teacher.teacher?.department || "N/A" }}</td>
                  <td>{{ teacher.teacher?.employee_number || "N/A" }}</td>
                  <td>{{ formatDate(teacher.approved_at) }}</td>
                  <td>
                    <v-chip
                      :color="teacher.is_active ? 'success' : 'error'"
                      size="small"
                    >
                      {{ teacher.is_active ? "Active" : "Inactive" }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="openEditDialog(teacher)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="openDeleteDialog(teacher)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

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

    <!-- Create/Edit Teacher Dialog -->
    <v-dialog v-model="teacherFormDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingTeacher ? "Edit Teacher" : "Add New Teacher" }}
        </v-card-title>

        <v-card-text>
          <v-form ref="teacherForm" @submit.prevent="handleSaveTeacher">
            <v-text-field
              v-model="teacherFormData.first_name"
              label="First Name"
              required
              class="mb-4"
            />

            <v-text-field
              v-model="teacherFormData.middle_name"
              label="Middle Name"
              class="mb-4"
            />

            <v-text-field
              v-model="teacherFormData.last_name"
              label="Last Name"
              required
              class="mb-4"
            />

            <v-text-field
              v-model="teacherFormData.email"
              label="Email (@deped.gov.ph)"
              type="email"
              required
              :disabled="editingTeacher"
              class="mb-4"
            />

            <v-text-field
              v-model="teacherFormData.employee_number"
              label="Employee Number"
              required
              class="mb-4"
            />

            <v-text-field
              v-model="teacherFormData.department"
              label="Department"
              required
              class="mb-4"
            />

            <v-text-field
              v-model="teacherFormData.specialization"
              label="Specialization"
              class="mb-4"
            />

            <v-checkbox
              v-model="teacherFormData.is_active"
              label="Account Active"
              class="mb-4"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="teacherFormDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="savingTeacher"
            @click="handleSaveTeacher"
          >
            {{ editingTeacher ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Teacher</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Are you sure you want to delete
            <strong
              >{{ selectedTeacher?.first_name }}
              {{ selectedTeacher?.last_name }}</strong
            >?
          </p>
          <v-alert color="error" variant="tonal">
            This action cannot be undone. All associated data will be removed.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteTeacher">
            Delete
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

const authStore = useAuthStore();
const currentTab = ref("pending");
const searchQuery = ref("");
const pendingTeachers = ref<any[]>([]);
const approvedTeachers = ref<any[]>([]);
const approving = ref<string | null>(null);
const rejecting = ref(false);
const rejectDialog = ref(false);
const selectedTeacher = ref<any>(null);
const teacherFormDialog = ref(false);
const editingTeacher = ref<any>(null);
const savingTeacher = ref(false);
const deleting = ref(false);
const deleteDialog = ref(false);

const teacherFormData = ref({
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  employee_number: "",
  department: "",
  specialization: "",
  is_active: true,
});

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const filteredApprovedTeachers = computed(() => {
  if (!searchQuery.value) return approvedTeachers.value;

  const query = searchQuery.value.toLowerCase();
  return approvedTeachers.value.filter(
    (teacher) =>
      teacher.first_name.toLowerCase().includes(query) ||
      teacher.last_name.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query) ||
      teacher.teacher?.department?.toLowerCase().includes(query)
  );
});

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadTeachers() {
  // Fetch pending teachers
  const { data: pending } = await supabase
    .from("profiles")
    .select(
      `
      *,
      teacher:teachers(
        employee_number,
        department
      )
    `
    )
    .eq("role", "teacher")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  pendingTeachers.value = pending || [];

  // Fetch approved teachers
  const { data: approved } = await supabase
    .from("profiles")
    .select(
      `
      *,
      teacher:teachers(
        employee_number,
        department
      )
    `
    )
    .eq("role", "teacher")
    .eq("is_approved", true)
    .order("approved_at", { ascending: false });

  approvedTeachers.value = approved || [];
}

async function approveTeacher(teacher: any) {
  approving.value = teacher.user_id;

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_approved: true,
        approved_by: authStore.user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("user_id", teacher.user_id);

    if (error) throw error;

    // Log the approval
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.id,
      action: "teacher_approved",
      entity_type: "profile",
      entity_id: teacher.user_id,
      new_values: {
        approved: true,
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
        teacher_email: teacher.email,
      },
    });

    snackbar.value = {
      show: true,
      message: `${teacher.first_name} ${teacher.last_name} has been approved`,
      color: "success",
    };

    await loadTeachers();
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error: ${error.message}`,
      color: "error",
    };
  } finally {
    approving.value = null;
  }
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

function openCreateDialog() {
  editingTeacher.value = null;
  teacherFormData.value = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    employee_number: "",
    department: "",
    specialization: "",
    is_active: true,
  };
  teacherFormDialog.value = true;
}

function openEditDialog(teacher: any) {
  editingTeacher.value = teacher;
  teacherFormData.value = {
    first_name: teacher.first_name,
    middle_name: teacher.middle_name,
    last_name: teacher.last_name,
    email: teacher.email,
    employee_number: teacher.teacher?.employee_number || "",
    department: teacher.teacher?.department || "",
    specialization: teacher.teacher?.specialization || "",
    is_active: teacher.is_active,
  };
  teacherFormDialog.value = true;
}

async function handleSaveTeacher() {
  savingTeacher.value = true;

  try {
    if (editingTeacher.value) {
      // UPDATE profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: teacherFormData.value.first_name,
          middle_name: teacherFormData.value.middle_name,
          last_name: teacherFormData.value.last_name,
          is_active: teacherFormData.value.is_active,
        })
        .eq("user_id", editingTeacher.value.user_id);

      if (profileError) throw profileError;

      // UPDATE teacher details
      const { error: teacherError } = await supabase
        .from("teachers")
        .update({
          employee_number: teacherFormData.value.employee_number,
          department: teacherFormData.value.department,
          specialization: teacherFormData.value.specialization,
        })
        .eq("user_id", editingTeacher.value.user_id);

      if (teacherError) throw teacherError;

      // Log the update
      await supabase.from("audit_logs").insert({
        user_id: authStore.user?.id,
        action: "teacher_updated",
        entity_type: "profile",
        entity_id: editingTeacher.value.user_id,
        new_values: teacherFormData.value,
      });

      snackbar.value = {
        show: true,
        message: `${teacherFormData.value.first_name} ${teacherFormData.value.last_name} has been updated`,
        color: "success",
      };
    } else {
      // CREATE - This would typically be done by the teacher registration flow
      snackbar.value = {
        show: true,
        message:
          "Teachers should register through the login page. Manual creation not recommended.",
        color: "warning",
      };
    }

    teacherFormDialog.value = false;
    await loadTeachers();
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error: ${error.message}`,
      color: "error",
    };
  } finally {
    savingTeacher.value = false;
  }
}

function openDeleteDialog(teacher: any) {
  selectedTeacher.value = teacher;
  deleteDialog.value = true;
}

async function handleDeleteTeacher() {
  if (!selectedTeacher.value) return;

  deleting.value = true;

  try {
    // Delete teacher record first
    const { error: teacherError } = await supabase
      .from("teachers")
      .delete()
      .eq("user_id", selectedTeacher.value.user_id);

    if (teacherError) throw teacherError;

    // Delete profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", selectedTeacher.value.user_id);

    if (profileError) throw profileError;

    // Log the deletion
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.id,
      action: "teacher_deleted",
      entity_type: "profile",
      entity_id: selectedTeacher.value.user_id,
      new_values: {
        deleted: true,
        teacher_name: `${selectedTeacher.value.first_name} ${selectedTeacher.value.last_name}`,
      },
    });

    snackbar.value = {
      show: true,
      message: `${selectedTeacher.value.first_name} ${selectedTeacher.value.last_name} has been deleted`,
      color: "success",
    };

    deleteDialog.value = false;
    selectedTeacher.value = null;
    await loadTeachers();
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error: ${error.message}`,
      color: "error",
    };
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  loadTeachers();
});
</script>
