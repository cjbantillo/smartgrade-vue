<!--
  Teacher Activity Page
  
  View teacher's own audit logs
-->

<route lang="yaml">
meta:
  layout: teacher
  requiresRole: teacher
</route>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const logs = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const filters = ref({
  action: null as string | null,
  dateFrom: "",
  dateTo: "",
  search: "",
});

const page = ref(1);
const itemsPerPage = ref(25);

const actionTypes = [
  "class_created",
  "student_enrolled",
  "student_unenrolled",
  "grades_finalized",
  "certificate_generated",
  "document_generated",
];

const filteredLogs = computed(() => {
  let result = logs.value;

  if (filters.value.action) {
    result = result.filter((log) => log.action === filters.value.action);
  }

  if (filters.value.dateFrom) {
    result = result.filter(
      (log) => new Date(log.created_at) >= new Date(filters.value.dateFrom)
    );
  }

  if (filters.value.dateTo) {
    result = result.filter(
      (log) => new Date(log.created_at) <= new Date(filters.value.dateTo)
    );
  }

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    result = result.filter(
      (log) =>
        log.metadata?.description?.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.entity_type.toLowerCase().includes(searchLower)
    );
  }

  return result;
});

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredLogs.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.ceil(filteredLogs.value.length / itemsPerPage.value)
);

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAction = (action: string) => {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getActionColor = (action: string) => {
  if (
    action.includes("created") ||
    action.includes("enrolled") ||
    action.includes("generated")
  )
    return "success";
  if (action.includes("deleted") || action.includes("unenrolled"))
    return "error";
  if (action.includes("finalized") || action.includes("updated"))
    return "warning";
  return "info";
};

const clearFilters = () => {
  filters.value = {
    action: null,
    dateFrom: "",
    dateTo: "",
    search: "",
  };
};

const fetchLogs = async () => {
  loading.value = true;
  error.value = null;

  try {
    const user = await authStore.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error: fetchError } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (fetchError) throw fetchError;

    logs.value = data || [];
  } catch (err: any) {
    error.value = err.message;
    console.error("Error fetching activity logs:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <v-container fluid>
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col>
        <v-btn
          class="mb-4"
          prepend-icon="mdi-arrow-left"
          to="/teacher"
          variant="text"
        >
          Back to Dashboard
        </v-btn>
        <h1 class="text-h4 font-weight-bold">My Activity</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          View your activity history and actions
        </p>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.action"
              clearable
              :items="actionTypes"
              label="Action Type"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateFrom"
              label="From Date"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateTo"
              label="To Date"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              block
              color="secondary"
              variant="outlined"
              @click="clearFilters"
            >
              Clear Filters
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="filters.search"
              clearable
              label="Search activity..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Activity Table -->
    <v-card :loading="loading">
      <v-card-text>
        <v-data-table
          :headers="[
            { title: 'Timestamp', key: 'created_at', sortable: true },
            { title: 'Action', key: 'action', sortable: true },
            { title: 'Entity Type', key: 'entity_type', sortable: true },
            { title: 'Details', key: 'metadata', sortable: false },
          ]"
          :items="paginatedLogs"
          :items-per-page="itemsPerPage"
          hide-default-footer
        >
          <template #item.created_at="{ item }">
            <div class="text-caption">
              {{ formatDateTime(item.created_at) }}
            </div>
          </template>

          <template #item.action="{ item }">
            <v-chip :color="getActionColor(item.action)" size="small">
              {{ formatAction(item.action) }}
            </v-chip>
          </template>

          <template #item.entity_type="{ item }">
            <span class="font-weight-medium">{{ item.entity_type }}</span>
          </template>

          <template #item.metadata="{ item }">
            <div class="text-caption">
              {{
                item.metadata?.description ||
                item.metadata?.reason ||
                "No details"
              }}
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
              <p class="text-h6 mt-4">No activity found</p>
              <p class="text-body-2 text-medium-emphasis">
                Your actions will appear here
              </p>
            </div>
          </template>
        </v-data-table>

        <!-- Pagination -->
        <div
          v-if="filteredLogs.length > 0"
          class="d-flex justify-center align-center mt-4"
        >
          <v-pagination
            v-model="page"
            :length="totalPages"
            :total-visible="7"
          />
          <v-select
            v-model="itemsPerPage"
            :items="[10, 25, 50, 100]"
            density="compact"
            variant="outlined"
            class="ml-4"
            style="max-width: 100px"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
