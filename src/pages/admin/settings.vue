/** * System Settings Page * * Admin capability: Configure school identity,
signatories, and grading rules * Critical for white-labeling the system for
Ampayon National High School */

<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
</route>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useSystemSettings } from "@/composables/useSystemSettings";

const { loading, error, fetchSettings, updateSettings, uploadSchoolLogo } =
  useSystemSettings();

// State
const settings = ref({
  school_name: "",
  school_id: "",
  school_logo: "",
  principal_name: "",
  superintendent_name: "",
  passing_grade: 75,
  honors_threshold: 90,
  high_honors_threshold: 95,
  highest_honors_threshold: 98,
});

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");
const logoFile = ref<File | null>(null);
const uploadingLogo = ref(false);

// Methods
async function loadSettings() {
  const data = await fetchSettings();
  settings.value = {
    school_name: data.school_name || "",
    school_id: data.school_id || "",
    school_logo: data.school_logo || "",
    principal_name: data.principal_name || "",
    superintendent_name: data.superintendent_name || "",
    passing_grade: data.passing_grade || 75,
    honors_threshold: data.honors_threshold || 90,
    high_honors_threshold: data.high_honors_threshold || 95,
    highest_honors_threshold: data.highest_honors_threshold || 98,
  };
}

async function handleLogoUpload(file: File | File[] | null) {
  // Handle different v-file-input return types
  const fileToUpload = Array.isArray(file) ? file[0] : file;

  if (!fileToUpload) {
    return;
  }

  logoFile.value = fileToUpload;
  uploadingLogo.value = true;

  try {
    const url = await uploadSchoolLogo(fileToUpload);
    if (url) {
      settings.value.school_logo = url;
      showSnackbar("Logo uploaded successfully", "success");
    } else {
      showSnackbar(error.value || "Failed to upload logo", "error");
    }
  } catch (err) {
    showSnackbar("Error uploading logo", "error");
  } finally {
    uploadingLogo.value = false;
  }
}

async function saveSettings() {
  const success = await updateSettings(settings.value);

  if (success) {
    showSnackbar("Settings saved successfully", "success");
    await loadSettings();
  } else {
    showSnackbar(error.value || "Failed to save settings", "error");
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
  loadSettings();
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
        <h1 class="text-h4 font-weight-bold">System Settings</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Configure school identity, signatories, and grading configuration for
          Ampayon National High School
        </p>
      </v-col>
    </v-row>

    <v-row>
      <!-- School Identity Section -->
      <v-col cols="12" md="6">
        <v-card class="mb-6">
          <v-card-title class="bg-primary text-white">
            <v-icon class="mr-2" icon="mdi-school" />
            School Identity
          </v-card-title>
          <v-card-text class="pa-6">
            <!-- School Logo -->
            <div class="mb-6">
              <div class="text-subtitle-2 mb-2">School Logo</div>
              <v-card v-if="settings.school_logo" class="mb-4" outlined>
                <v-img
                  :src="settings.school_logo"
                  alt="School Logo"
                  height="200"
                  contain
                />
              </v-card>
              <v-file-input
                accept="image/*"
                label="Upload School Logo"
                prepend-icon="mdi-camera"
                variant="outlined"
                :loading="uploadingLogo"
                @update:model-value="handleLogoUpload"
              />
              <div class="text-caption text-medium-emphasis">
                Recommended: PNG or JPG, minimum 300x300px
              </div>
            </div>

            <!-- School Name -->
            <v-text-field
              v-model="settings.school_name"
              label="School Name *"
              placeholder="Ampayon National High School"
              variant="outlined"
              class="mb-4"
            />

            <!-- School ID -->
            <v-text-field
              v-model="settings.school_id"
              label="School ID *"
              placeholder="123456"
              variant="outlined"
            />
          </v-card-text>
        </v-card>

        <!-- Grading Configuration Section -->
        <v-card>
          <v-card-title class="bg-success text-white">
            <v-icon class="mr-2" icon="mdi-calculator" />
            Grading Configuration
          </v-card-title>
          <v-card-text class="pa-6">
            <!-- Passing Grade -->
            <v-text-field
              v-model.number="settings.passing_grade"
              label="Passing Grade *"
              type="number"
              min="60"
              max="100"
              variant="outlined"
              class="mb-4"
              hint="Minimum grade required to pass (default: 75)"
              persistent-hint
            />

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-4">Honors Thresholds</div>

            <!-- With Honors -->
            <v-text-field
              v-model.number="settings.honors_threshold"
              label="With Honors *"
              type="number"
              min="85"
              max="100"
              variant="outlined"
              class="mb-4"
              hint="Minimum GPA for 'With Honors' (default: 90)"
              persistent-hint
            />

            <!-- With High Honors -->
            <v-text-field
              v-model.number="settings.high_honors_threshold"
              label="With High Honors *"
              type="number"
              min="90"
              max="100"
              variant="outlined"
              class="mb-4"
              hint="Minimum GPA for 'With High Honors' (default: 95)"
              persistent-hint
            />

            <!-- With Highest Honors -->
            <v-text-field
              v-model.number="settings.highest_honors_threshold"
              label="With Highest Honors *"
              type="number"
              min="95"
              max="100"
              variant="outlined"
              hint="Minimum GPA for 'With Highest Honors' (default: 98)"
              persistent-hint
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Signatories Section -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="bg-info text-white">
            <v-icon class="mr-2" icon="mdi-account-tie" />
            Document Signatories
          </v-card-title>
          <v-card-text class="pa-6">
            <v-alert class="mb-6" color="info" variant="tonal">
              These names will appear on SF9, SF10, and certificate documents
            </v-alert>

            <!-- Principal Name -->
            <v-text-field
              v-model="settings.principal_name"
              label="Principal Name *"
              placeholder="Dr. Juan Dela Cruz"
              variant="outlined"
              class="mb-4"
              hint="Full name with title (e.g., Dr., Prof.)"
              persistent-hint
            />

            <!-- Superintendent Name -->
            <v-text-field
              v-model="settings.superintendent_name"
              label="Schools Division Superintendent *"
              placeholder="Dr. Maria Santos"
              variant="outlined"
              hint="Full name with title"
              persistent-hint
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Action Buttons -->
    <v-row>
      <v-col class="d-flex justify-end">
        <v-btn
          color="grey"
          variant="outlined"
          class="mr-4"
          @click="loadSettings"
        >
          <v-icon left> mdi-refresh </v-icon>
          Reset
        </v-btn>
        <v-btn
          color="primary"
          size="large"
          variant="flat"
          :loading="loading"
          @click="saveSettings"
        >
          <v-icon left> mdi-content-save </v-icon>
          Save Settings
        </v-btn>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
