/** * School Year Management Page * * Admin capability: Manage academic school
years * Important: Only one school year can be active at a time */

<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
</route>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useSystemSettings } from "@/composables/useSystemSettings";

const {
  loading,
  error,
  fetchSchoolYears,
  createSchoolYear,
  updateSchoolYear,
  setActiveSchoolYear,
  deleteSchoolYear,
  fetchGradingPeriods,
  createGradingPeriod,
  updateGradingPeriod,
  setActiveGradingPeriod,
} = useSystemSettings();

// State
const schoolYears = ref<any[]>([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const periodDialog = ref(false);
const editingYear = ref<any>(null);
const editingPeriod = ref<any>(null);
const selectedYearForPeriods = ref<any>(null);
const gradingPeriods = ref<any[]>([]);
const expandedRows = ref<string[]>([]);
const yearForm = ref({
  year_code: "",
  year_start: "",
  year_end: "",
});

const periodForm = ref({
  period_name: "",
  period_number: 1,
  start_date: "",
  end_date: "",
});

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Headers
const headers = [
  { title: "School Year", value: "year_code", key: "year_code" },
  { title: "Start Date", value: "year_start", key: "year_start" },
  { title: "End Date", value: "year_end", key: "year_end" },
  { title: "Status", value: "is_active", key: "is_active" },
  { title: "Actions", value: "actions", key: "actions", sortable: false },
];

// Methods
async function loadSchoolYears() {
  schoolYears.value = await fetchSchoolYears();
}

function openCreateDialog() {
  editingYear.value = null;
  yearForm.value = {
    year_code: "",
    year_start: "",
    year_end: "",
  };
  dialog.value = true;
}

function openEditDialog(year: any) {
  editingYear.value = year;
  yearForm.value = {
    year_code: year.year_code,
    year_start: year.year_start,
    year_end: year.year_end,
  };
  dialog.value = true;
}

async function saveSchoolYear() {
  let success = false;

  if (editingYear.value) {
    // Update existing
    success = await updateSchoolYear(editingYear.value.id, yearForm.value);
  } else {
    // Create new
    success = await createSchoolYear(yearForm.value);
  }

  if (success) {
    showSnackbar(
      editingYear.value
        ? "School year updated successfully"
        : "School year created successfully",
      "success"
    );
    dialog.value = false;
    await loadSchoolYears();
  } else {
    showSnackbar(error.value || "Failed to save school year", "error");
  }
}

async function handleSetActive(year: any) {
  const success = await setActiveSchoolYear(year.id);

  if (success) {
    showSnackbar(`${year.year_code} set as active school year`, "success");
    await loadSchoolYears();
  } else {
    showSnackbar(error.value || "Failed to set active school year", "error");
  }
}

function openDeleteDialog(year: any) {
  editingYear.value = year;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (!editingYear.value) {
    return;
  }

  const success = await deleteSchoolYear(editingYear.value.id);

  if (success) {
    showSnackbar("School year deleted successfully", "success");
    deleteDialog.value = false;
    await loadSchoolYears();
  } else {
    showSnackbar(error.value || "Failed to delete school year", "error");
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function toggleExpand(year: any) {
  const index = expandedRows.value.indexOf(year.id);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(year.id);
    await loadGradingPeriods(year.id);
  }
}

async function loadGradingPeriods(schoolYearId: string) {
  selectedYearForPeriods.value = schoolYears.value.find(
    (y) => y.id === schoolYearId
  );
  gradingPeriods.value = await fetchGradingPeriods(schoolYearId);
}

function openPeriodDialog(year: any, period: any = null) {
  selectedYearForPeriods.value = year;
  editingPeriod.value = period;
  if (period) {
    periodForm.value = {
      period_name: period.period_name,
      period_number: period.period_number,
      start_date: period.start_date,
      end_date: period.end_date,
    };
  } else {
    periodForm.value = {
      period_name: "",
      period_number: (gradingPeriods.value.length || 0) + 1,
      start_date: "",
      end_date: "",
    };
  }
  periodDialog.value = true;
}

async function savePeriod() {
  if (!selectedYearForPeriods.value) return;

  let success = false;
  if (editingPeriod.value) {
    success = await updateGradingPeriod(
      editingPeriod.value.id,
      periodForm.value
    );
  } else {
    success = await createGradingPeriod({
      ...periodForm.value,
      school_year_id: selectedYearForPeriods.value.id,
    });
  }

  if (success) {
    showSnackbar(
      editingPeriod.value ? "Grading period updated" : "Grading period created",
      "success"
    );
    periodDialog.value = false;
    await loadGradingPeriods(selectedYearForPeriods.value.id);
  } else {
    showSnackbar(error.value || "Failed to save grading period", "error");
  }
}

async function handleSetActivePeriod(period: any) {
  if (!selectedYearForPeriods.value) return;

  const success = await setActiveGradingPeriod(
    period.id,
    selectedYearForPeriods.value.id
  );

  if (success) {
    showSnackbar(`${period.period_name} set as active period`, "success");
    await loadGradingPeriods(selectedYearForPeriods.value.id);
  } else {
    showSnackbar(error.value || "Failed to set active period", "error");
  }
}

function showSnackbar(
  message: string,
  color: "success" | "error" | "warning" = "success"
) {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

onMounted(() => {
  loadSchoolYears();
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
          to="/admin"
          variant="text"
        >
          Back to Dashboard
        </v-btn>
        <h1 class="text-h4 font-weight-bold">School Year Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Manage academic school years for Ampayon National High School
        </p>
      </v-col>
      <v-col cols="auto" class="d-flex align-center">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Add School Year
        </v-btn>
      </v-col>
    </v-row>

    <!-- School Years Table -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="schoolYears"
          :loading="loading"
          class="elevation-1"
          item-value="id"
          show-expand
          :expanded="expandedRows"
        >
          <template #[`item.year_start`]="{ item }">
            {{ formatDate(item.year_start) }}
          </template>

          <template #[`item.year_end`]="{ item }">
            {{ formatDate(item.year_end) }}
          </template>

          <template #[`item.is_active`]="{ item }">
            <v-chip
              :color="item.is_active ? 'success' : 'default'"
              size="small"
            >
              {{ item.is_active ? "Active" : "Inactive" }}
            </v-chip>
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              v-if="!item.is_active"
              color="success"
              size="small"
              variant="tonal"
              class="mr-2"
              @click="handleSetActive(item)"
            >
              Set Active
            </v-btn>
            <v-btn
              color="info"
              size="small"
              variant="tonal"
              icon="mdi-calendar-clock"
              class="mr-2"
              @click="toggleExpand(item)"
            >
              <v-tooltip activator="parent" location="top">
                Manage Grading Periods
              </v-tooltip>
            </v-btn>
            <v-btn
              color="primary"
              size="small"
              variant="tonal"
              icon="mdi-pencil"
              class="mr-2"
              @click="openEditDialog(item)"
            />
            <v-btn
              color="error"
              size="small"
              variant="tonal"
              icon="mdi-delete"
              @click="openDeleteDialog(item)"
            />
          </template>

          <!-- Expanded Row: Grading Periods -->
          <template #expanded-row="{ item }">
            <tr>
              <td colspan="6" class="pa-4" style="background-color: #f5f5f5">
                <div class="d-flex justify-space-between align-center mb-4">
                  <h3 class="text-h6">
                    Grading Periods for {{ item.year_code }}
                  </h3>
                  <v-btn
                    color="primary"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="openPeriodDialog(item)"
                  >
                    Add Period
                  </v-btn>
                </div>

                <v-alert
                  v-if="gradingPeriods.length === 0"
                  color="info"
                  variant="tonal"
                >
                  No grading periods defined for this school year. Click "Add
                  Period" to create one.
                </v-alert>

                <v-table v-else density="compact">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="period in gradingPeriods" :key="period.id">
                      <td>{{ period.period_number }}</td>
                      <td>{{ period.period_name }}</td>
                      <td>{{ formatDate(period.start_date) }}</td>
                      <td>{{ formatDate(period.end_date) }}</td>
                      <td>
                        <v-chip
                          :color="period.is_active ? 'success' : 'default'"
                          size="small"
                        >
                          {{ period.is_active ? "Active" : "Inactive" }}
                        </v-chip>
                      </td>
                      <td>
                        <v-btn
                          v-if="!period.is_active"
                          color="success"
                          size="x-small"
                          variant="tonal"
                          class="mr-2"
                          @click="handleSetActivePeriod(period)"
                        >
                          Set Active
                        </v-btn>
                        <v-btn
                          color="primary"
                          size="x-small"
                          variant="tonal"
                          icon="mdi-pencil"
                          @click="openPeriodDialog(item, period)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          {{ editingYear ? "Edit School Year" : "Add School Year" }}
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="yearForm.year_code"
              label="School Year Code *"
              placeholder="2024-2025"
              variant="outlined"
              class="mb-3"
              hint="Format: YYYY-YYYY"
              persistent-hint
            />
            <v-text-field
              v-model="yearForm.year_start"
              label="Start Date *"
              type="date"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="yearForm.year_end"
              label="End Date *"
              type="date"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="saveSchoolYear"
          >
            {{ editingYear ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5"> Confirm Delete </v-card-title>
        <v-card-text>
          <p>
            Are you sure you want to delete school year
            <strong>{{ editingYear?.year_code }}</strong
            >?
          </p>
          <v-alert class="mt-4" color="warning" variant="tonal">
            This action cannot be undone. All associated data may be affected.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false"> Cancel </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="loading"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Grading Period Dialog -->
    <v-dialog v-model="periodDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          {{ editingPeriod ? "Edit Grading Period" : "Add Grading Period" }}
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="periodForm.period_name"
                  label="Period Name *"
                  placeholder="1st Quarter"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="periodForm.period_number"
                  label="Period Number *"
                  type="number"
                  min="1"
                  max="4"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="periodForm.start_date"
                  label="Start Date *"
                  type="date"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="periodForm.end_date"
                  label="End Date *"
                  type="date"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="periodDialog = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="savePeriod"
          >
            {{ editingPeriod ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
