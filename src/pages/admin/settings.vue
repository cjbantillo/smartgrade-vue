<template>
  <div class="pa-6">
    <v-card>
      <v-card-title>System Settings</v-card-title>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate />

        <v-alert
          v-if="error"
          type="error"
          closable
          class="mb-4"
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <v-form
          v-if="settings"
          ref="settingsForm"
          @submit.prevent="handleSaveSettings"
        >
          <v-row>
            <!-- School Information -->
            <v-col cols="12">
              <h3 class="text-h6 font-weight-bold mb-4">School Information</h3>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.school_name"
                label="School Name"
                hint="Full name of the school"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.current_school_year"
                label="Current School Year"
                hint="Format: 2024-2025"
              />
            </v-col>

            <!-- Grade Thresholds -->
            <v-col cols="12">
              <h3 class="text-h6 font-weight-bold mb-4 mt-4">
                Grade Thresholds
              </h3>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.passing_grade"
                label="Passing Grade"
                type="number"
                min="0"
                max="100"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.honors_with_honors_threshold"
                label="With Honors Threshold (GPA)"
                type="number"
                min="0"
                max="100"
                hint="Minimum GPA for With Honors"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.honors_with_high_honors_threshold"
                label="With High Honors Threshold (GPA)"
                type="number"
                min="0"
                max="100"
                hint="Minimum GPA for With High Honors"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.honors_with_highest_honors_threshold"
                label="With Highest Honors Threshold (GPA)"
                type="number"
                min="0"
                max="100"
                hint="Minimum GPA for With Highest Honors"
              />
            </v-col>

            <!-- Grading Percentages -->
            <v-col cols="12">
              <h3 class="text-h6 font-weight-bold mb-4 mt-4">
                DepEd Grading Formula Percentages
              </h3>
              <v-alert type="info" class="mb-4">
                These percentages must sum to 100% for proper GPA calculation.
              </v-alert>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.written_work_percentage"
                label="Written Work (%)"
                type="number"
                min="0"
                max="100"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.performance_task_percentage"
                label="Performance Task (%)"
                type="number"
                min="0"
                max="100"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.quarterly_assessment_percentage"
                label="Quarterly Assessment (%)"
                type="number"
                min="0"
                max="100"
              />
            </v-col>

            <!-- Total Percentage Display -->
            <v-col cols="12">
              <v-progress-linear
                :value="totalPercentage"
                :color="totalPercentage === 100 ? 'success' : 'warning'"
              />
              <p class="text-body-2 mt-2">
                Total: <strong>{{ totalPercentage }}%</strong>
                <v-icon
                  v-if="totalPercentage === 100"
                  color="success"
                  size="small"
                >
                  mdi-check
                </v-icon>
                <v-icon v-else color="warning" size="small"> mdi-alert </v-icon>
              </p>
            </v-col>

            <!-- Action Buttons -->
            <v-col cols="12" class="d-flex gap-2 justify-end">
              <v-btn @click="handleReset">Reset</v-btn>
              <v-btn
                color="primary"
                :loading="saving"
                @click="handleSaveSettings"
              >
                Save Settings
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Audit History -->
    <v-card class="mt-6">
      <v-card-title>Settings Change History</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="auditHeaders"
          :items="auditLogs"
          items-per-page="10"
          hover
        >
          <template #item.action="{ item }">
            <v-chip size="small" label>
              {{ item.action }}
            </v-chip>
          </template>

          <template #item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdmin, type SystemSettings } from "@/composables/useAdmin";
import { useProfileSettings } from "@/composables/useProfileSettings";

const adminComposable = useAdmin();
const profileComposable = useProfileSettings();

const settings = ref<SystemSettings | null>(null);
const formData = ref({
  school_name: "",
  current_school_year: "",
  passing_grade: 75,
  honors_with_honors_threshold: 90,
  honors_with_high_honors_threshold: 95,
  honors_with_highest_honors_threshold: 98,
  written_work_percentage: 30,
  performance_task_percentage: 50,
  quarterly_assessment_percentage: 20,
});

const auditLogs = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const auditHeaders = [
  { title: "Action", key: "action" },
  { title: "Changed By", key: "user_email" },
  { title: "Date", key: "created_at" },
];

const totalPercentage = computed(() => {
  return (
    formData.value.written_work_percentage +
    formData.value.performance_task_percentage +
    formData.value.quarterly_assessment_percentage
  );
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const settingsData = await adminComposable.fetchSystemSettings();
    if (settingsData) {
      settings.value = settingsData;
      formData.value = {
        school_name: settingsData.school_name || "",
        current_school_year: settingsData.current_school_year || "",
        passing_grade: settingsData.passing_grade || 75,
        honors_with_honors_threshold:
          settingsData.honors_high_honors_threshold || 90,
        honors_with_high_honors_threshold:
          settingsData.honors_with_honors_threshold || 95,
        honors_with_highest_honors_threshold:
          settingsData.honors_with_highest_honors_threshold || 98,
        written_work_percentage: settingsData.written_work_percentage || 30,
        performance_task_percentage:
          settingsData.performance_task_percentage || 50,
        quarterly_assessment_percentage:
          settingsData.quarterly_assessment_percentage || 20,
      };
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load settings";
  } finally {
    loading.value = false;
  }
};

const loadAuditLogs = async () => {
  try {
    const logs = await adminComposable.fetchAuditLogs({
      table_name: "system_settings",
      limit: 50,
    });
    auditLogs.value = logs;
  } catch (err) {
    console.error("Failed to load audit logs:", err);
  }
};

const handleSaveSettings = async () => {
  if (totalPercentage.value !== 100) {
    snackbar.value = {
      show: true,
      message: "Percentages must sum to 100%",
      color: "warning",
    };
    return;
  }

  saving.value = true;
  try {
    if (settings.value) {
      // Update existing settings
      const updated = await adminComposable.updateSystemSettings({
        ...formData.value,
        id: settings.value.id,
      });
      if (updated) {
        settings.value = updated;
        snackbar.value = {
          show: true,
          message: "Settings saved successfully",
          color: "success",
        };
        await loadAuditLogs();
      }
    } else {
      // Create new settings
      const created = await adminComposable.createSystemSettings(
        formData.value
      );
      if (created) {
        settings.value = created;
        snackbar.value = {
          show: true,
          message: "Settings created successfully",
          color: "success",
        };
        await loadAuditLogs();
      }
    }
  } catch (err) {
    snackbar.value = {
      show: true,
      message: err instanceof Error ? err.message : "Failed to save settings",
      color: "error",
    };
  } finally {
    saving.value = false;
  }
};

const handleReset = () => {
  if (settings.value) {
    formData.value = {
      school_name: settings.value.school_name || "",
      current_school_year: settings.value.current_school_year || "",
      passing_grade: settings.value.passing_grade || 75,
      honors_with_honors_threshold:
        settings.value.honors_high_honors_threshold || 90,
      honors_with_high_honors_threshold:
        settings.value.honors_with_honors_threshold || 95,
      honors_with_highest_honors_threshold:
        settings.value.honors_with_highest_honors_threshold || 98,
      written_work_percentage: settings.value.written_work_percentage || 30,
      performance_task_percentage:
        settings.value.performance_task_percentage || 50,
      quarterly_assessment_percentage:
        settings.value.quarterly_assessment_percentage || 20,
    };
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(async () => {
  await loadSettings();
  await loadAuditLogs();
});
</script>
