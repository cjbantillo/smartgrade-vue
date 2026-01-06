<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">School Settings</h1>
        <p class="text-grey mb-6">Configure school branding and information</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="4">
          <v-card-title>School Information</v-card-title>
          <v-card-text>
            <v-form
              ref="formRef"
              v-model="valid"
              @submit.prevent="saveSettings"
            >
              <v-text-field
                v-model="form.school_code"
                label="School Code"
                :rules="[rules.required]"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="form.school_name"
                label="School Name"
                :rules="[rules.required]"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="form.principal_name"
                label="Principal Name"
                :rules="[rules.required]"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="form.address"
                label="School Address"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="form.school_email"
                label="School Email"
                type="email"
                density="comfortable"
                class="mb-4"
              />

              <v-divider class="mb-4" />

              <div class="text-subtitle-1 font-weight-medium mb-2">
                School Logo
              </div>
              <div class="d-flex align-center gap-4 mb-4">
                <v-avatar size="80" color="grey-lighten-3" rounded>
                  <v-img
                    v-if="logoPreview"
                    :src="logoPreview"
                    @error="handleImageError"
                  />
                  <v-icon v-else size="40" color="grey">mdi-image</v-icon>
                </v-avatar>
                <div>
                  <v-file-input
                    v-model="logoFile"
                    label="Upload Logo"
                    accept="image/*"
                    prepend-icon=""
                    prepend-inner-icon="mdi-camera"
                    density="compact"
                    variant="outlined"
                    style="max-width: 300px"
                    @update:model-value="previewLogo"
                  />
                  <div class="text-caption text-grey">PNG or JPG, max 2MB</div>
                  <div
                    v-if="form.logo_path"
                    class="text-caption text-success mt-1"
                  >
                    <v-icon size="small">mdi-check</v-icon> Logo saved:
                    {{ form.logo_path }}
                  </div>
                  <div v-else class="text-caption text-warning mt-1">
                    <v-icon size="small">mdi-alert</v-icon> No logo uploaded yet
                  </div>
                </div>
              </div>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                :loading="saving"
                :disabled="!valid"
                prepend-icon="mdi-content-save"
              >
                Save Settings
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="4" class="mb-4">
          <v-card-title>Preview</v-card-title>
          <v-card-text class="text-center">
            <v-avatar size="100" color="grey-lighten-3" rounded class="mb-4">
              <v-img
                v-if="logoPreview"
                :src="logoPreview"
                cover
                @error="onLogoError"
              >
                <template #placeholder>
                  <v-icon size="50" color="grey">mdi-school</v-icon>
                </template>
              </v-img>
              <v-icon v-else size="50" color="grey">mdi-school</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold">
              {{ form.school_name || "School Name" }}
            </h3>
            <p class="text-body-2 text-grey">
              {{ form.address || "School Address" }}
            </p>
            <v-divider class="my-3" />
            <p class="text-body-2">
              <strong>Principal:</strong> {{ form.principal_name || "N/A" }}
            </p>
          </v-card-text>
        </v-card>

        <v-card elevation="4">
          <v-card-title>Quick Stats</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-account-group</v-icon>
                </template>
                <v-list-item-title>Total Users</v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ stats.users }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-school</v-icon>
                </template>
                <v-list-item-title>Students</v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ stats.students }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-account-tie</v-icon>
                </template>
                <v-list-item-title>Teachers</v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ stats.teachers }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";

const formRef = ref();
const valid = ref(false);
const saving = ref(false);
const logoFile = ref<File[]>([]);
const logoPreview = ref("");

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const form = ref({
  school_id: 1,
  school_code: "",
  school_name: "",
  principal_name: "",
  address: "",
  school_email: "",
  logo_path: "",
});

const stats = ref({
  users: 0,
  students: 0,
  teachers: 0,
});

const rules = {
  required: (v: string) => !!v || "Required",
};

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

function previewLogo() {
  if (logoFile.value && logoFile.value.length > 0) {
    const file = logoFile.value[0];
    if (file) {
      logoPreview.value = URL.createObjectURL(file);
    }
  }
}

function handleImageError() {
  console.error("Failed to load image from URL:", logoPreview.value);
  notify("Failed to load logo image", "warning");
}

function onLogoError() {
  console.error("Logo failed to load:", logoPreview.value);
  // Clear the preview if it fails to load
  logoPreview.value = "";
}

async function fetchSettings() {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .limit(1)
    .single();

  console.log("Fetched school data:", data);
  console.log("Fetch error:", error);

  if (error) {
    // Create default if not exists
    console.log("No school settings found, using defaults");
  } else if (data) {
    form.value = {
      school_id: data.school_id,
      school_code: data.school_code || "",
      school_name: data.school_name || "",
      principal_name: data.principal_name || "",
      address: data.address || "",
      school_email: data.school_email || "",
      logo_path: data.logo_path || "",
    };

    console.log("Logo path from DB:", data.logo_path);

    if (data.logo_path) {
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(data.logo_path);

      console.log("Generated public URL:", urlData.publicUrl);
      logoPreview.value = urlData.publicUrl;
    } else {
      console.log("No logo_path in database");
      logoPreview.value = "";
    }
  }
}

async function fetchStats() {
  const [usersRes, studentsRes, teachersRes] = await Promise.all([
    supabase.from("users").select("user_id", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("student_id", { count: "exact", head: true }),
    supabase
      .from("teachers")
      .select("teacher_id", { count: "exact", head: true }),
  ]);

  stats.value = {
    users: usersRes.count || 0,
    students: studentsRes.count || 0,
    teachers: teachersRes.count || 0,
  };
}

async function saveSettings() {
  if (!valid.value) return;
  saving.value = true;

  console.log("=== SAVE SETTINGS STARTED ===");
  console.log("Logo file selected:", logoFile.value);

  let logoPath = form.value.logo_path;

  // Upload logo if new file selected
  // Note: v-file-input returns a File object directly, not an array
  if (logoFile.value && logoFile.value instanceof File) {
    const file = logoFile.value;
    console.log("File to upload:", file);

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `school_logo_${Date.now()}.${fileExt}`;

      console.log("Uploading file:", fileName, "Size:", file.size);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        notify(`Upload failed: ${uploadError.message}`, "error");
        saving.value = false;
        return;
      }

      console.log("Upload successful:", uploadData);
      logoPath = uploadData.path;
      console.log("Logo path set to:", logoPath);

      // Get the public URL immediately after upload
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(logoPath);

      console.log("Public URL:", urlData.publicUrl);
      logoPreview.value = urlData.publicUrl;
    }
  } else {
    console.log("No new file selected, keeping existing logo_path:", logoPath);
  }

  const payload = {
    school_code: form.value.school_code,
    school_name: form.value.school_name,
    principal_name: form.value.principal_name,
    address: form.value.address,
    school_email: form.value.school_email,
    logo_path: logoPath,
  };

  console.log("Saving payload:", payload);

  // Check if school exists first
  const { data: existingSchool } = await supabase
    .from("schools")
    .select("school_id")
    .eq("school_id", form.value.school_id)
    .single();

  let error;
  if (existingSchool) {
    // Update existing
    const result = await supabase
      .from("schools")
      .update(payload)
      .eq("school_id", form.value.school_id);
    error = result.error;
  } else {
    // Insert new
    const result = await supabase
      .from("schools")
      .insert({ school_id: form.value.school_id, ...payload });
    error = result.error;
  }

  if (error) {
    notify(error.message, "error");
  } else {
    notify("Settings saved successfully");
    // Clear the file input
    logoFile.value = [];
    fetchSettings();
  }
  saving.value = false;
}

onMounted(() => {
  fetchSettings();
  fetchStats();
});
</script>

<style scoped>
.gap-4 {
  gap: 1rem;
}
</style>
