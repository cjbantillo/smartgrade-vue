/** * Grade Unlock Requests Page * * Admin capability: Unlock finalized grades
upon formal request * Policy: Provides escalation path for legitimate errors
with audit trail * * Flow (from step-one-policy-adjustments.md): * 1. Teacher
clicks "Request Unlock" button * 2. System generates unlock request * 3. Admin
reviews reason and approves/denies * 4. If approved, grades return to UNLOCKED
state * 5. All actions logged in audit_logs */

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

    <!-- Placeholder Notice -->
    <v-row>
      <v-col>
        <v-card>
          <v-card-text>
            <v-alert border="start" color="info" variant="tonal">
              <v-alert-title class="mb-2">
                <v-icon>mdi-information</v-icon>
                Feature Under Development
              </v-alert-title>
              <div class="text-body-2">
                <p class="mb-2"><strong>Grade unlock workflow:</strong></p>
                <ol class="ml-4">
                  <li>Teacher discovers error in finalized grades</li>
                  <li>
                    Teacher clicks "Request Unlock" button in grading interface
                  </li>
                  <li>
                    System creates unlock request with student/subject details
                  </li>
                  <li>Admin reviews request and reason here</li>
                  <li>Admin approves or denies with optional notes</li>
                  <li>If approved, grades transition to UNLOCKED state</li>
                  <li>Teacher corrects grades and re-finalizes</li>
                  <li>All actions logged in audit trail</li>
                </ol>
                <p class="mt-4 mb-0">
                  <strong>Note:</strong> Unlock requests will appear here once
                  the teacher grading module (Phase 6) is implemented. This
                  ensures proper separation of concerns between admin oversight
                  and teacher operations.
                </p>
              </div>
            </v-alert>

            <!-- Mock UI Preview -->
            <div class="mt-6">
              <h3 class="text-h6 mb-4">Preview: Unlock Request Table</h3>
              <v-table>
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
                  <tr>
                    <td
                      class="text-center text-medium-emphasis py-8"
                      colspan="7"
                    >
                      No unlock requests at this time
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Data Model Reference -->
            <v-expansion-panels class="mt-6">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-database</v-icon>
                  Database Schema Reference
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="mb-2">
                    <strong>grade_finalization_status table fields:</strong>
                  </p>
                  <ul class="ml-4 text-body-2">
                    <li><code>is_finalized</code>: boolean (locked state)</li>
                    <li>
                      <code>finalized_by</code>: teacher who locked grades
                    </li>
                    <li>
                      <code>finalized_at</code>: timestamp of finalization
                    </li>
                    <li><code>unlock_count</code>: number of times unlocked</li>
                    <li><code>last_unlocked_by</code>: admin who unlocked</li>
                    <li><code>last_unlocked_at</code>: timestamp of unlock</li>
                    <li><code>unlock_reason</code>: admin's explanation</li>
                  </ul>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
// This page will be fully implemented in Phase 6 when teacher grading module is complete
// Unlock requests are generated from the teacher's grading interface
</script>
