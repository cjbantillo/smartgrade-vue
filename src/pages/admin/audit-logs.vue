/** * Audit Logs Page * * Admin capability: View complete system activity
history * Policy: Read-only access for accountability and compliance monitoring
* * Logged actions (from step-one-policy-adjustments.md): * - teacher_approved:
Admin approves teacher account * - teacher_rejected: Admin rejects teacher
account * - grades_finalized: Teacher locks grades * - grades_unlocked: Admin
unlocks grades * - grades_refinalized: Teacher re-locks after corrections */

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
        <h1 class="text-h4 font-weight-bold">System Audit Logs</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Complete activity history for accountability and compliance
        </p>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.action"
          clearable
          :items="actionTypes"
          label="Action Type"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filters.entityType"
          clearable
          :items="entityTypes"
          label="Entity Type"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="filters.dateFrom"
          label="From Date"
          type="date"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="filters.dateTo"
          label="To Date"
          type="date"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <!-- Logs Table -->
    <v-card>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="text-h6">Activity Logs ({{ totalLogs }})</div>
          <v-btn
            color="primary"
            :loading="loading"
            prepend-icon="mdi-refresh"
            @click="loadLogs"
          >
            Refresh
          </v-btn>
        </div>

        <v-data-table-server
          :headers="headers"
          :items="filteredLogs"
          :items-length="totalLogs"
          :items-per-page="itemsPerPage"
          :loading="loading"
          :page="page"
          class="elevation-1"
          @update:page="
            page = $event;
            handlePageChange();
          "
          @update:items-per-page="
            itemsPerPage = $event;
            handlePageChange();
          "
        >
          <template #[`item.created_at`]="{ item }">
            {{ formatDate(item.created_at) }}
          </template>

          <template #[`item.user`]="{ item }">
            <div>{{ getUserName(item) }}</div>
            <div
              v-if="item.profiles?.email"
              class="text-caption text-medium-emphasis"
            >
              {{ item.profiles.email }}
            </div>
          </template>

          <template #[`item.action`]="{ item }">
            <v-chip :color="getActionColor(item.action)" size="small">
              {{ item.action }}
            </v-chip>
          </template>

          <template #[`item.entity_type`]="{ item }">
            {{ item.entity_type }}
          </template>

          <template #[`item.entity_id`]="{ item }">
            <code class="text-caption"
              >{{ item.entity_id?.substring(0, 8) }}...</code
            >
          </template>

          <template #[`item.ip_address`]="{ item }">
            {{ item.ip_address || "N/A" }}
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              color="primary"
              size="small"
              variant="tonal"
              icon="mdi-eye"
              @click="openDetailDialog(item)"
            />
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="800px">
      <v-card v-if="selectedLog">
        <v-card-title class="text-h5"> Audit Log Details </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <div class="text-subtitle-2 mb-1">Timestamp</div>
              <div>{{ formatDate(selectedLog.created_at) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2 mb-1">User</div>
              <div>{{ getUserName(selectedLog) }}</div>
              <div v-if="selectedLog.profiles?.email" class="text-caption">
                {{ selectedLog.profiles.email }}
              </div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2 mb-1">Action</div>
              <v-chip :color="getActionColor(selectedLog.action)">
                {{ selectedLog.action }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2 mb-1">Entity Type</div>
              <div>{{ selectedLog.entity_type }}</div>
            </v-col>
            <v-col cols="12">
              <div class="text-subtitle-2 mb-1">Entity ID</div>
              <code class="text-caption">{{ selectedLog.entity_id }}</code>
            </v-col>
            <v-col v-if="selectedLog.ip_address" cols="6">
              <div class="text-subtitle-2 mb-1">IP Address</div>
              <div>{{ selectedLog.ip_address }}</div>
            </v-col>
            <v-col v-if="selectedLog.user_agent" cols="6">
              <div class="text-subtitle-2 mb-1">User Agent</div>
              <div class="text-caption">
                {{ selectedLog.user_agent }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row v-if="selectedLog.old_values || selectedLog.new_values">
            <v-col v-if="selectedLog.old_values" cols="6">
              <div class="text-subtitle-2 mb-2">Old Values</div>
              <pre class="bg-grey-lighten-4 pa-3 rounded text-caption">{{
                formatJson(selectedLog.old_values)
              }}</pre>
            </v-col>
            <v-col v-if="selectedLog.new_values" cols="6">
              <div class="text-subtitle-2 mb-2">New Values</div>
              <pre class="bg-grey-lighten-4 pa-3 rounded text-caption">{{
                formatJson(selectedLog.new_values)
              }}</pre>
            </v-col>
          </v-row>

          <v-row v-if="selectedLog.metadata">
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">Metadata</div>
              <pre class="bg-grey-lighten-4 pa-3 rounded text-caption">{{
                formatJson(selectedLog.metadata)
              }}</pre>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.id">
              <td>
                <div class="text-caption">
                  {{ formatDateTime(log.created_at) }}
                </div>
              </td>
              <td>
                <div class="font-weight-medium">
                  {{ log.user_email || "Unknown" }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ log.user_role || "" }}
                </div>
              </td>
              <td>
                <v-chip :color="getActionColor(log.action)" size="small">
                  {{ formatAction(log.action) }}
                </v-chip>
              </td>
              <td>
                <div>{{ log.entity_type }}</div>
                <div class="text-caption text-medium-emphasis">
                  ID: {{ log.entity_id.substring(0, 8) }}...
                </div>
              </td>
              <td>
                <v-btn
                  icon="mdi-eye"
                  size="x-small"
                  variant="text"
                  @click="viewDetails(log)"
                />
              </td>
              <td>{{ log.ip_address || "N/A" }}</td>
            </tr>
          </tbody>
        </v-table>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card v-if="selectedLog">
        <v-card-title>Audit Log Details</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-clock-outline</v-icon>
              </template>
              <v-list-item-title>Timestamp</v-list-item-title>
              <v-list-item-subtitle>{{
                formatDateTime(selectedLog.created_at)
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>User</v-list-item-title>
              <v-list-item-subtitle>{{
                selectedLog.user_email
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-tag</v-icon>
              </template>
              <v-list-item-title>Action</v-list-item-title>
              <v-list-item-subtitle>{{
                formatAction(selectedLog.action)
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-database</v-icon>
              </template>
              <v-list-item-title>Entity</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.entity_type }} ({{
                selectedLog.entity_id
              }})</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4" />

          <div v-if="selectedLog.old_values" class="mb-4">
            <h4 class="text-subtitle-2 mb-2">Old Values:</h4>
            <pre class="text-caption pa-2 bg-grey-lighten-4 rounded">{{
              JSON.stringify(selectedLog.old_values, null, 2)
            }}</pre>
          </div>

          <div v-if="selectedLog.new_values" class="mb-4">
            <h4 class="text-subtitle-2 mb-2">New Values:</h4>
            <pre class="text-caption pa-2 bg-grey-lighten-4 rounded">{{
              JSON.stringify(selectedLog.new_values, null, 2)
            }}</pre>
          </div>

          <div v-if="selectedLog.metadata">
            <h4 class="text-subtitle-2 mb-2">Metadata:</h4>
            <pre class="text-caption pa-2 bg-grey-lighten-4 rounded">{{
              JSON.stringify(selectedLog.metadata, null, 2)
            }}</pre>
          </div>

          <v-list
            v-if="selectedLog.ip_address || selectedLog.user_agent"
            density="compact"
          >
            <v-list-item v-if="selectedLog.ip_address">
              <template #prepend>
                <v-icon>mdi-ip</v-icon>
              </template>
              <v-list-item-title>IP Address</v-list-item-title>
              <v-list-item-subtitle>{{
                selectedLog.ip_address
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedLog.user_agent">
              <template #prepend>
                <v-icon>mdi-laptop</v-icon>
              </template>
              <v-list-item-title>User Agent</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">{{
                selectedLog.user_agent
              }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { supabase } from '@/services/supabase'

  const loading = ref(false)
  const logs = ref<any[]>([])
  const currentPage = ref(1)
  const itemsPerPage = 25
  const detailsDialog = ref(false)
  const selectedLog = ref<any>(null)

  const filters = ref({
    action: null as string | null,
    entityType: null as string | null,
    dateFrom: '',
    dateTo: '',
  })

  const actionTypes = [
    { title: 'Teacher Approved', value: 'teacher_approved' },
    { title: 'Teacher Rejected', value: 'teacher_rejected' },
    { title: 'Grades Finalized', value: 'grades_finalized' },
    { title: 'Grades Unlocked', value: 'grades_unlocked' },
    { title: 'Grades Re-finalized', value: 'grades_refinalized' },
  ]

  const entityTypes = [
    { title: 'Profile', value: 'profile' },
    { title: 'Grade', value: 'grade' },
    { title: 'Student', value: 'student' },
    { title: 'Teacher', value: 'teacher' },
  ]

  const filteredLogs = computed(() => {
    let result = logs.value

    if (filters.value.action) {
      result = result.filter(log => log.action === filters.value.action)
    }

    if (filters.value.entityType) {
      result = result.filter(
        log => log.entity_type === filters.value.entityType,
      )
    }

    if (filters.value.dateFrom) {
      const fromDate = new Date(filters.value.dateFrom)
      result = result.filter(log => new Date(log.created_at) >= fromDate)
    }

    if (filters.value.dateTo) {
      const toDate = new Date(filters.value.dateTo)
      toDate.setHours(23, 59, 59)
      result = result.filter(log => new Date(log.created_at) <= toDate)
    }

    return result
  })

  const totalPages = computed(() =>
    Math.ceil(filteredLogs.value.length / itemsPerPage),
  )

  const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredLogs.value.slice(start, end)
  })

  function formatDateTime (dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatAction (action: string) {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function getActionColor (action: string) {
    const colorMap: Record<string, string> = {
      teacher_approved: 'success',
      teacher_rejected: 'error',
      grades_finalized: 'info',
      grades_unlocked: 'warning',
      grades_refinalized: 'primary',
    }
    return colorMap[action] || 'default'
  }

  function viewDetails (log: any) {
    selectedLog.value = log
    detailsDialog.value = true
  }

  async function loadLogs () {
    loading.value = true

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(
          `
        *,
        user:profiles!audit_logs_user_id_fkey(email, role)
      `,
        )
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      logs.value = (data || []).map((log: any) => ({
        ...log,
        user_email: log.user?.email || 'Unknown',
        user_role: log.user?.role || '',
      }))
    } catch (error: any) {
      console.error('Error loading audit logs:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadLogs()
  })
</script>
