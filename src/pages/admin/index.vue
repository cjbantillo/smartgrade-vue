/** * Admin Dashboard * * Admin-only features (from
step-one-policy-adjustments.md): * - Approve teacher accounts * - Unlock
finalized grades (with reason) * - View system audit logs * - Manage system
settings * * Admin CANNOT: * - Enroll students * - Edit grades directly * -
Generate certificates/SF9/SF10 */

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
        <h1 class="text-h4 font-weight-bold">Admin Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          System oversight and teacher management
        </p>
      </v-col>
    </v-row>

    <!-- Quick Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="warning" size="40">mdi-account-clock</v-icon>
              <div class="ml-4">
                <div class="text-h4">{{ pendingTeachers }}</div>
                <div class="text-caption text-medium-emphasis">
                  Pending Teachers
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="success" size="40">mdi-account-check</v-icon>
              <div class="ml-4">
                <div class="text-h4">{{ approvedTeachers }}</div>
                <div class="text-caption text-medium-emphasis">
                  Approved Teachers
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="error" size="40">mdi-lock-open-alert</v-icon>
              <div class="ml-4">
                <div class="text-h4">0</div>
                <div class="text-caption text-medium-emphasis">
                  Unlock Requests
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-icon color="info" size="40">mdi-history</v-icon>
              <div class="ml-4">
                <div class="text-h4">{{ recentAuditCount }}</div>
                <div class="text-caption text-medium-emphasis">
                  Recent Activities
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Admin Actions -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary"
              >mdi-account-multiple-check</v-icon
            >
            Teacher Approvals
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              Review and approve teacher accounts for Ampayon National High
              School - SHS
            </p>
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-account-check"
              to="/admin/teachers"
              variant="flat"
            >
              Manage Teachers
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="warning">mdi-lock-open-variant</v-icon>
            Grade Unlock Requests
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              Review teacher requests to unlock finalized grades for corrections
            </p>
            <v-btn
              block
              color="warning"
              prepend-icon="mdi-lock-open"
              to="/admin/unlock-requests"
              variant="flat"
            >
              View Requests
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="info">mdi-text-box-multiple</v-icon>
            Audit Logs
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              View complete system activity history for accountability
            </p>
            <v-btn
              block
              color="info"
              prepend-icon="mdi-history"
              to="/admin/audit-logs"
              variant="flat"
            >
              View Logs
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-cog</v-icon>
            System Settings
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              Configure school-wide parameters and grading thresholds
            </p>
            <v-btn
              block
              color="success"
              prepend-icon="mdi-cog-outline"
              to="/admin/settings"
              variant="flat"
            >
              Manage Settings
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Important Notices -->
    <v-row class="mt-6">
      <v-col>
        <v-alert border="start" color="info" variant="tonal">
          <v-alert-title class="mb-2">
            <v-icon>mdi-information</v-icon>
            Admin Role Restrictions
          </v-alert-title>
          <div class="text-body-2">
            <p class="mb-1">
              <strong
                >Admins serve as system overseers, not primary
                operators.</strong
              >
            </p>
            <ul class="ml-4">
              <li>
                Cannot enroll students in classes (teacher responsibility)
              </li>
              <li>Cannot edit grades directly (must unlock first)</li>
              <li>Cannot generate certificates or SF9/SF10 forms</li>
            </ul>
          </div>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/services/supabase";

const pendingTeachers = ref(0);
const approvedTeachers = ref(0);
const recentAuditCount = ref(0);

onMounted(async () => {
  // Fetch pending teachers count
  const { count: pending } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher")
    .eq("is_approved", false);

  pendingTeachers.value = pending || 0;

  // Fetch approved teachers count
  const { count: approved } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher")
    .eq("is_approved", true);

  approvedTeachers.value = approved || 0;

  // Fetch recent audit logs count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: auditCount } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  recentAuditCount.value = auditCount || 0;
});
</script>
