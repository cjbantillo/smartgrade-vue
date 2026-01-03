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
                v-model="form.school_address"
                label="School Address"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="form.contact_number"
                label="Contact Number"
                density="comfortable"
                class="mb-2"
              />
              <v-text-field
                v-model="form.email"
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
                  <v-img v-if="logoPreview" :src="logoPreview" />
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
              <v-img v-if="logoPreview" :src="logoPreview" />
              <v-icon v-else size="50" color="grey">mdi-school</v-icon>
            </v-avatar>
            <h3 class="text-h6 font-weight-bold">
              {{ form.school_name || "School Name" }}
            </h3>
            <p class="text-body-2 text-grey">
              {{ form.school_address || "School Address" }}
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
  id: 1,
  school_name: "",
  principal_name: "",
  school_address: "",
  contact_number: "",
  email: "",
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

async function fetchSettings() {
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    // Create default if not exists
    console.log("No school settings found, using defaults");
  } else if (data) {
    form.value = {
      id: data.id,
      school_name: data.school_name || "",
      principal_name: data.principal_name || "",
      school_address: data.school_address || "",
      contact_number: data.contact_number || "",
      email: data.email || "",
      logo_path: data.logo_path || "",
    };
    if (data.logo_path) {
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(data.logo_path);
      logoPreview.value = urlData.publicUrl;
    }
  }
}

async function fetchStats() {
  const [usersRes, studentsRes, teachersRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
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

  let logoPath = form.value.logo_path;

  // Upload logo if new file selected
  if (logoFile.value && logoFile.value.length > 0) {
    const file = logoFile.value[0];
    if (file) {
      const fileName = `logo_${Date.now()}.${file.name.split(".").pop()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        notify(uploadError.message, "error");
        saving.value = false;
        return;
      }
      logoPath = uploadData.path;
    }
  }

  const payload = {
    school_name: form.value.school_name,
    principal_name: form.value.principal_name,
    school_address: form.value.school_address,
    contact_number: form.value.contact_number,
    email: form.value.email,
    logo_path: logoPath,
  };

  const { error } = await supabase
    .from("schools")
    .upsert({ id: form.value.id, ...payload });

  if (error) {
    notify(error.message, "error");
  } else {
    notify("Settings saved successfully");
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
