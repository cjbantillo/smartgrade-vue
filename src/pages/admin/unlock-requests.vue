/** * Grade Unlock Requests Page * * Admin capability: Unlock finalized grades
upon formal request * Policy: Provides escalation path for legitimate errors
with audit trail * * CRUD Operations: * - CREATE: Teachers submit unlock
requests (automatic) * - READ: Admin views pending and historical requests * -
UPDATE: Admin approves or rejects requests * - DELETE: Remove processed requests
(optional cleanup) */

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
        <h1 class="text-h4 font-weight-bold">Grade Unlock Requests</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Review and process teacher requests to unlock finalized grades
        </p>
      </v-col>
    </v-row>

    <!-- Tabs for Pending/All -->
    <v-tabs v-model="currentTab" class="mb-4" color="primary">
      <v-tab value="pending">
        <v-icon class="mr-2">mdi-clock-outline</v-icon>
        Pending ({{ pendingRequests.length }})
      </v-tab>
      <v-tab value="all">
        <v-icon class="mr-2">mdi-history</v-icon>
        All Requests ({{ allRequests.length }})
      </v-tab>
    </v-tabs>

    <v-window v-model="currentTab">
      <!-- Pending Requests Tab -->
      <v-window-item value="pending">
        <v-card>
          <v-card-text>
            <v-progress-linear v-if="loading" indeterminate />

            <v-alert
              v-if="!loading && pendingRequests.length === 0"
              color="success"
              icon="mdi-check-circle"
              variant="tonal"
            >
              No pending unlock requests.
            </v-alert>

            <v-table v-else>
              <thead>
                <tr>
                  <th>Request Date</th>
                  <th>Teacher</th>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in pendingRequests" :key="req.id">
                  <td>{{ formatDate(req.created_at) }}</td>
                  <td>{{ req.teacher_name }}</td>
                  <td>{{ req.student_name }}</td>
                  <td>{{ req.subject_name }}</td>
                  <td class="text-truncate" style="max-width: 200px">
                    {{ req.reason }}
                  </td>
                  <td>
                    <v-chip color="warning" size="small"> Pending </v-chip>
                  </td>
                  <td>
                    <v-btn
                      color="success"
                      :loading="processing === req.id"
                      prepend-icon="mdi-check"
                      size="small"
                      @click="openApproveDialog(req)"
                    >
                      Approve
                    </v-btn>
                    <v-btn
                      color="error"
                      prepend-icon="mdi-close"
                      size="small"
                      variant="outlined"
                      @click="openRejectDialog(req)"
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

      <!-- All Requests Tab -->
      <v-window-item value="all">
        <v-card>
          <v-card-text>
            <v-progress-linear v-if="loading" indeterminate />

            <div v-if="!loading" class="d-flex justify-end mb-4">
              <v-btn
                prepend-icon="mdi-download"
                @click="exportRequests"
                :disabled="allRequests.length === 0"
              >
                Export CSV
              </v-btn>
            </div>

            <v-table v-if="!loading">
              <thead>
                <tr>
                  <th>Request Date</th>
                  <th>Teacher</th>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Response Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in allRequests" :key="req.id">
                  <td>{{ formatDate(req.created_at) }}</td>
                  <td>{{ req.teacher_name }}</td>
                  <td>{{ req.student_name }}</td>
                  <td>{{ req.subject_name }}</td>
                  <td>
                    <v-chip :color="getStatusColor(req.status)" size="small">
                      {{ req.status }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(req.response_date) || "Pending" }}</td>
                  <td>
                    <v-btn
                      icon="mdi-eye"
                      size="small"
                      variant="text"
                      @click="openDetailsDialog(req)"
                    />
                    <v-btn
                      v-if="req.status === 'pending'"
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="openDeleteDialog(req)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Approve Dialog -->
    <v-dialog v-model="approveDialog" max-width="500">
      <v-card>
        <v-card-title>Approve Unlock Request</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Approve unlock request for
            <strong>{{ selectedRequest?.student_name }}</strong
            >'s <strong>{{ selectedRequest?.subject_name }}</strong> grades?
          </p>
          <v-textarea
            v-model="adminNotes"
            label="Admin Notes (Optional)"
            placeholder="Record reason for approval..."
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="approveDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            :loading="processing === selectedRequest?.id"
            @click="handleApproveRequest"
          >
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Dialog -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title>Reject Unlock Request</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Reject unlock request for
            <strong>{{ selectedRequest?.student_name }}</strong
            >'s <strong>{{ selectedRequest?.subject_name }}</strong> grades?
          </p>
          <v-textarea
            v-model="adminNotes"
            label="Rejection Reason (Required)"
            placeholder="Explain why this request is being rejected..."
            rows="3"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="rejectDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="processing === selectedRequest?.id"
            @click="handleRejectRequest"
          >
            Reject
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card>
        <v-card-title>Unlock Request Details</v-card-title>
        <v-card-text>
          <v-row v-if="selectedRequest" class="mb-4">
            <v-col cols="12" md="6">
              <p>
                <strong>Teacher:</strong> {{ selectedRequest.teacher_name }}
              </p>
              <p>
                <strong>Student:</strong> {{ selectedRequest.student_name }}
              </p>
              <p>
                <strong>Subject:</strong> {{ selectedRequest.subject_name }}
              </p>
            </v-col>
            <v-col cols="12" md="6">
              <p>
                <strong>Status:</strong>
                <v-chip
                  :color="getStatusColor(selectedRequest.status)"
                  size="small"
                >
                  {{ selectedRequest.status }}
                </v-chip>
              </p>
              <p>
                <strong>Request Date:</strong>
                {{ formatDate(selectedRequest.created_at) }}
              </p>
              <p v-if="selectedRequest.response_date">
                <strong>Response Date:</strong>
                {{ formatDate(selectedRequest.response_date) }}
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <p class="mb-2"><strong>Reason for Unlock:</strong></p>
          <v-alert color="info" variant="tonal">
            {{ selectedRequest?.reason || "No reason provided" }}
          </v-alert>

          <p class="mb-2" v-if="selectedRequest?.admin_notes">
            <strong>Admin Notes:</strong>
          </p>
          <v-alert
            v-if="selectedRequest?.admin_notes"
            color="warning"
            variant="tonal"
          >
            {{ selectedRequest.admin_notes }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Request</v-card-title>
        <v-card-text>
          Are you sure you want to delete this unlock request?
          <v-alert color="error" variant="tonal" class="mt-4">
            This action cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteRequest">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
      <template #actions>
        <v-btn @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const currentTab = ref("pending");
const loading = ref(false);
const processing = ref<string | null>(null);
const deleting = ref(false);

const allRequests = ref<any[]>([]);
const pendingRequests = computed(() =>
  allRequests.value.filter((r) => r.status === "pending")
);

const selectedRequest = ref<any>(null);
const approveDialog = ref(false);
const rejectDialog = ref(false);
const detailsDialog = ref(false);
const deleteDialog = ref(false);
const adminNotes = ref("");

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "error",
  };
  return colors[status] || "info";
}

async function loadRequests() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("grade_unlock_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allRequests.value = data || [];
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error loading requests: ${error.message}`,
      color: "error",
    };
  } finally {
    loading.value = false;
  }
}

function openApproveDialog(request: any) {
  selectedRequest.value = request;
  adminNotes.value = "";
  approveDialog.value = true;
}

function openRejectDialog(request: any) {
  selectedRequest.value = request;
  adminNotes.value = "";
  rejectDialog.value = true;
}

function openDetailsDialog(request: any) {
  selectedRequest.value = request;
  detailsDialog.value = true;
}

function openDeleteDialog(request: any) {
  selectedRequest.value = request;
  deleteDialog.value = true;
}

async function handleApproveRequest() {
  if (!selectedRequest.value) return;

  processing.value = selectedRequest.value.id;

  try {
    // UPDATE request status
    const { error: updateError } = await supabase
      .from("grade_unlock_requests")
      .update({
        status: "approved",
        response_date: new Date().toISOString(),
        admin_notes: adminNotes.value,
      })
      .eq("id", selectedRequest.value.id);

    if (updateError) throw updateError;

    // Unlock the grades by updating finalization status
    const { error: unlockError } = await supabase
      .from("grade_finalization_status")
      .update({
        is_finalized: false,
        last_unlocked_by: authStore.user?.id,
        last_unlocked_at: new Date().toISOString(),
        unlock_reason: adminNotes.value || "Admin approval",
        unlock_count: selectedRequest.value.unlock_count + 1,
      })
      .match({
        student_id: selectedRequest.value.student_id,
        school_year_id: selectedRequest.value.school_year_id,
      });

    if (unlockError) throw unlockError;

    // Log the approval
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.id,
      action: "grade_unlock_approved",
      entity_type: "grade_unlock_request",
      entity_id: selectedRequest.value.id,
      new_values: {
        request_id: selectedRequest.value.id,
        student_id: selectedRequest.value.student_id,
        admin_notes: adminNotes.value,
      },
    });

    snackbar.value = {
      show: true,
      message: "Unlock request approved. Grades have been unlocked.",
      color: "success",
    };

    approveDialog.value = false;
    adminNotes.value = "";
    await loadRequests();
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error: ${error.message}`,
      color: "error",
    };
  } finally {
    processing.value = null;
  }
}

async function handleRejectRequest() {
  if (!selectedRequest.value || !adminNotes.value.trim()) {
    snackbar.value = {
      show: true,
      message: "Rejection reason is required",
      color: "warning",
    };
    return;
  }

  processing.value = selectedRequest.value.id;

  try {
    // UPDATE request status
    const { error: updateError } = await supabase
      .from("grade_unlock_requests")
      .update({
        status: "rejected",
        response_date: new Date().toISOString(),
        admin_notes: adminNotes.value,
      })
      .eq("id", selectedRequest.value.id);

    if (updateError) throw updateError;

    // Log the rejection
    await supabase.from("audit_logs").insert({
      user_id: authStore.user?.id,
      action: "grade_unlock_rejected",
      entity_type: "grade_unlock_request",
      entity_id: selectedRequest.value.id,
      new_values: {
        request_id: selectedRequest.value.id,
        student_id: selectedRequest.value.student_id,
        admin_notes: adminNotes.value,
      },
    });

    snackbar.value = {
      show: true,
      message: "Unlock request rejected.",
      color: "warning",
    };

    rejectDialog.value = false;
    adminNotes.value = "";
    await loadRequests();
  } catch (error: any) {
    snackbar.value = {
      show: true,
      message: `Error: ${error.message}`,
      color: "error",
    };
  } finally {
    processing.value = null;
  }
}

async function handleDeleteRequest() {
  if (!selectedRequest.value) return;

  deleting.value = true;

  try {
    const { error } = await supabase
      .from("grade_unlock_requests")
      .delete()
      .eq("id", selectedRequest.value.id);

    if (error) throw error;

    snackbar.value = {
      show: true,
      message: "Unlock request deleted.",
      color: "success",
    };

    deleteDialog.value = false;
    await loadRequests();
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

function exportRequests() {
  if (allRequests.value.length === 0) return;

  // Create CSV headers
  const headers = [
    "Request Date",
    "Teacher",
    "Student",
    "Subject",
    "Reason",
    "Status",
    "Response Date",
    "Admin Notes",
  ];

  // Create CSV rows
  const rows = allRequests.value.map((req) => [
    formatDate(req.created_at),
    req.teacher_name,
    req.student_name,
    req.subject_name,
    req.reason,
    req.status,
    formatDate(req.response_date) || "",
    req.admin_notes || "",
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",")
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        )
        .join(",")
    ),
  ].join("\n");

  // Download CSV
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `unlock-requests-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

onMounted(() => {
  loadRequests();
});
</script>
