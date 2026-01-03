<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Section Management</h1>
            <p class="text-grey">Create and manage class sections</p>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            Add Section
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="section in sections"
        :key="section.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card elevation="4" class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-google-classroom</v-icon>
            {{ section.name }}
          </v-card-title>
          <v-card-text>
            <div class="mb-2">
              <strong>Adviser:</strong>
              {{ section.adviser_name || "Not assigned" }}
            </div>
            <div class="mb-2">
              <strong>School Year:</strong> {{ section.school_year || "N/A" }}
            </div>
            <div>
              <strong>Students:</strong> {{ section.student_count || 0 }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" color="primary" @click="openDialog(section)"
              >Edit</v-btn
            >
            <v-btn variant="text" color="error" @click="confirmDelete(section)"
              >Delete</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="!sections.length && !loading" cols="12">
        <v-alert type="info" variant="tonal"
          >No sections found. Create one to get started.</v-alert
        >
      </v-col>
    </v-row>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{
          editMode ? "Edit Section" : "Add Section"
        }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="valid">
            <v-text-field
              v-model="form.name"
              label="Section Name"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-select
              v-model="form.adviser_teacher_id"
              :items="teachers"
              item-title="full_name"
              item-value="id"
              label="Adviser"
              density="comfortable"
              clearable
            />
            <v-select
              v-model="form.school_year_id"
              :items="schoolYears"
              item-title="year_label"
              item-value="id"
              label="School Year"
              :rules="[rules.required]"
              density="comfortable"
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
            @click="saveSection"
          >
            {{ editMode ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Section</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ sectionToDelete?.name }}</strong
          >?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteSection"
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

interface Section {
  id: number;
  name: string;
  adviser_teacher_id: number | null;
  adviser_name?: string;
  school_year_id: number;
  school_year?: string;
  student_count?: number;
}

interface Teacher {
  id: number;
  full_name: string;
}

interface SchoolYear {
  id: number;
  year_label: string;
}

const sections = ref<Section[]>([]);
const teachers = ref<Teacher[]>([]);
const schoolYears = ref<SchoolYear[]>([]);
const loading = ref(false);

const dialog = ref(false);
const editMode = ref(false);
const formRef = ref();
const valid = ref(false);
const saving = ref(false);

const deleteDialog = ref(false);
const sectionToDelete = ref<Section | null>(null);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const form = ref({
  id: 0,
  name: "",
  adviser_teacher_id: null as number | null,
  school_year_id: 0,
});

const rules = {
  required: (v: any) => !!v || "Required",
};

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function fetchSections() {
  loading.value = true;
  const { data, error } = await supabase
    .from("sections")
    .select(
      `
      id, name, adviser_teacher_id, school_year_id,
      teachers(user_id, users(first_name, last_name)),
      school_years(year_label)
    `
    )
    .order("name");

  if (error) {
    notify(error.message, "error");
  } else {
    sections.value = (data || []).map((s: any) => ({
      ...s,
      adviser_name: s.teachers?.users
        ? `${s.teachers.users.first_name} ${s.teachers.users.last_name}`
        : null,
      school_year: s.school_years?.year_label,
    }));
  }
  loading.value = false;
}

async function fetchTeachers() {
  const { data } = await supabase
    .from("teachers")
    .select("id, users(first_name, last_name)");

  teachers.value = (data || []).map((t: any) => ({
    id: t.id,
    full_name: t.users
      ? `${t.users.first_name} ${t.users.last_name}`
      : "Unknown",
  }));
}

async function fetchSchoolYears() {
  const { data } = await supabase
    .from("school_years")
    .select("id, year_label")
    .order("year_label", { ascending: false });

  schoolYears.value = data || [];
}

function openDialog(section?: Section) {
  if (section) {
    editMode.value = true;
    form.value = {
      id: section.id,
      name: section.name,
      adviser_teacher_id: section.adviser_teacher_id,
      school_year_id: section.school_year_id,
    };
  } else {
    editMode.value = false;
    form.value = {
      id: 0,
      name: "",
      adviser_teacher_id: null,
      school_year_id: schoolYears.value[0]?.id || 0,
    };
  }
  dialog.value = true;
}

async function saveSection() {
  if (!valid.value) return;
  saving.value = true;

  const payload = {
    name: form.value.name,
    adviser_teacher_id: form.value.adviser_teacher_id,
    school_year_id: form.value.school_year_id,
  };

  if (editMode.value) {
    const { error } = await supabase
      .from("sections")
      .update(payload)
      .eq("id", form.value.id);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("Section updated");
      dialog.value = false;
      fetchSections();
    }
  } else {
    const { error } = await supabase.from("sections").insert(payload);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("Section created");
      dialog.value = false;
      fetchSections();
    }
  }
  saving.value = false;
}

function confirmDelete(section: Section) {
  sectionToDelete.value = section;
  deleteDialog.value = true;
}

async function deleteSection() {
  if (!sectionToDelete.value) return;
  deleting.value = true;

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", sectionToDelete.value.id);

  if (error) {
    notify(error.message, "error");
  } else {
    notify("Section deleted");
    deleteDialog.value = false;
    fetchSections();
  }
  deleting.value = false;
}

onMounted(() => {
  fetchSections();
  fetchTeachers();
  fetchSchoolYears();
});
</script>
