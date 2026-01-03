<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">School Year Management</h1>
            <p class="text-grey">Manage academic years and set active year</p>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            Add School Year
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="sy in schoolYears" :key="sy.id" cols="12" sm="6" md="4">
        <v-card
          elevation="4"
          :class="{ 'border-primary': sy.is_active }"
          :style="sy.is_active ? 'border: 2px solid' : ''"
        >
          <v-card-title class="d-flex align-center">
            <v-icon :color="sy.is_active ? 'primary' : 'grey'" class="mr-2">
              mdi-calendar-range
            </v-icon>
            {{ sy.year_label }}
            <v-chip
              v-if="sy.is_active"
              color="primary"
              size="small"
              class="ml-2"
              >Active</v-chip
            >
          </v-card-title>
          <v-card-text>
            <div class="mb-1">
              <strong>Start:</strong> {{ formatDate(sy.start_date) }}
            </div>
            <div><strong>End:</strong> {{ formatDate(sy.end_date) }}</div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              v-if="!sy.is_active"
              variant="tonal"
              color="primary"
              size="small"
              @click="setActive(sy.id)"
            >
              Set Active
            </v-btn>
            <v-spacer />
            <v-btn variant="text" size="small" @click="openDialog(sy)"
              >Edit</v-btn
            >
            <v-btn
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(sy)"
              >Delete</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="!schoolYears.length && !loading" cols="12">
        <v-alert type="info" variant="tonal"
          >No school years found. Create one to get started.</v-alert
        >
      </v-col>
    </v-row>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{
          editMode ? "Edit School Year" : "Add School Year"
        }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="valid">
            <v-text-field
              v-model="form.year_label"
              label="Year Label (e.g. 2025-2026)"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-text-field
              v-model="form.start_date"
              label="Start Date"
              type="date"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-text-field
              v-model="form.end_date"
              label="End Date"
              type="date"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-switch
              v-model="form.is_active"
              label="Set as Active"
              color="primary"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!valid"
            @click="saveSchoolYear"
          >
            {{ editMode ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete School Year</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ syToDelete?.year_label }}</strong
          >?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteSchoolYear"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";

interface SchoolYear {
  id: number;
  year_label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const schoolYears = ref<SchoolYear[]>([]);
const loading = ref(false);

const dialog = ref(false);
const editMode = ref(false);
const formRef = ref();
const valid = ref(false);
const saving = ref(false);

const deleteDialog = ref(false);
const syToDelete = ref<SchoolYear | null>(null);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const form = ref({
  id: 0,
  year_label: "",
  start_date: "",
  end_date: "",
  is_active: false,
});

const rules = {
  required: (v: any) => !!v || "Required",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function fetchSchoolYears() {
  loading.value = true;
  const { data, error } = await supabase
    .from("school_years")
    .select("*")
    .order("year_label", { ascending: false });

  if (error) {
    notify(error.message, "error");
  } else {
    schoolYears.value = data || [];
  }
  loading.value = false;
}

function openDialog(sy?: SchoolYear) {
  if (sy) {
    editMode.value = true;
    form.value = { ...sy };
  } else {
    editMode.value = false;
    const currentYear = new Date().getFullYear();
    form.value = {
      id: 0,
      year_label: `${currentYear}-${currentYear + 1}`,
      start_date: `${currentYear}-06-01`,
      end_date: `${currentYear + 1}-03-31`,
      is_active: false,
    };
  }
  dialog.value = true;
}

async function setActive(id: number) {
  // Deactivate all first
  await supabase.from("school_years").update({ is_active: false }).neq("id", 0);
  // Activate selected
  const { error } = await supabase
    .from("school_years")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    notify(error.message, "error");
  } else {
    notify("School year activated");
    fetchSchoolYears();
  }
}

async function saveSchoolYear() {
  if (!valid.value) return;
  saving.value = true;

  // If setting as active, deactivate others first
  if (form.value.is_active) {
    await supabase
      .from("school_years")
      .update({ is_active: false })
      .neq("id", 0);
  }

  const payload = {
    year_label: form.value.year_label,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
    is_active: form.value.is_active,
  };

  if (editMode.value) {
    const { error } = await supabase
      .from("school_years")
      .update(payload)
      .eq("id", form.value.id);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("School year updated");
      dialog.value = false;
      fetchSchoolYears();
    }
  } else {
    const { error } = await supabase.from("school_years").insert(payload);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("School year created");
      dialog.value = false;
      fetchSchoolYears();
    }
  }
  saving.value = false;
}

function confirmDelete(sy: SchoolYear) {
  syToDelete.value = sy;
  deleteDialog.value = true;
}

async function deleteSchoolYear() {
  if (!syToDelete.value) return;
  deleting.value = true;

  const { error } = await supabase
    .from("school_years")
    .delete()
    .eq("id", syToDelete.value.id);

  if (error) {
    notify(error.message, "error");
  } else {
    notify("School year deleted");
    deleteDialog.value = false;
    fetchSchoolYears();
  }
  deleting.value = false;
}

onMounted(fetchSchoolYears);
</script>
