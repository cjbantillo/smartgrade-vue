<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Subject Management</h1>
            <p class="text-grey">Add and manage academic subjects</p>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            Add Subject
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card elevation="4">
          <v-card-title>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search subjects"
              single-line
              hide-details
              density="compact"
              style="max-width: 300px"
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="subjects"
            :search="search"
            :loading="loading"
          >
            <template #item.subject_type="{ item }">
              <v-chip :color="typeColor(item.subject_type)" size="small" label>
                {{ item.subject_type }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="small" variant="text" icon @click="openDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                icon
                color="error"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{
          editMode ? "Edit Subject" : "Add Subject"
        }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="valid">
            <v-text-field
              v-model="form.subject_code"
              label="Subject Code"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-text-field
              v-model="form.subject_name"
              label="Subject Name"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-text-field
              v-model.number="form.units"
              label="Units"
              type="number"
              min="1"
              :rules="[rules.required]"
              density="comfortable"
            />
            <v-select
              v-model="form.subject_type"
              :items="['Core', 'Applied', 'Specialized']"
              label="Type"
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
            @click="saveSubject"
          >
            {{ editMode ? "Update" : "Create" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Subject</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ subjectToDelete?.subject_name }}</strong
          >?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteSubject"
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

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  units: number;
  subject_type: string;
}

const headers = [
  { title: "Code", key: "subject_code" },
  { title: "Name", key: "subject_name" },
  { title: "Units", key: "units" },
  { title: "Type", key: "subject_type" },
  { title: "Actions", key: "actions", sortable: false },
];

const subjects = ref<Subject[]>([]);
const loading = ref(false);
const search = ref("");

const dialog = ref(false);
const editMode = ref(false);
const formRef = ref();
const valid = ref(false);
const saving = ref(false);

const deleteDialog = ref(false);
const subjectToDelete = ref<Subject | null>(null);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const form = ref({
  id: 0,
  subject_code: "",
  subject_name: "",
  units: 3,
  subject_type: "Core",
});

const rules = {
  required: (v: any) => !!v || "Required",
};

function typeColor(type: string) {
  const colors: Record<string, string> = {
    Core: "primary",
    Applied: "success",
    Specialized: "warning",
  };
  return colors[type] || "grey";
}

function notify(message: string, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

async function fetchSubjects() {
  loading.value = true;
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("subject_code");

  if (error) {
    notify(error.message, "error");
  } else {
    subjects.value = data || [];
  }
  loading.value = false;
}

function openDialog(subject?: Subject) {
  if (subject) {
    editMode.value = true;
    form.value = { ...subject };
  } else {
    editMode.value = false;
    form.value = {
      id: 0,
      subject_code: "",
      subject_name: "",
      units: 3,
      subject_type: "Core",
    };
  }
  dialog.value = true;
}

async function saveSubject() {
  if (!valid.value) return;
  saving.value = true;

  const payload = {
    subject_code: form.value.subject_code,
    subject_name: form.value.subject_name,
    units: form.value.units,
    subject_type: form.value.subject_type,
  };

  if (editMode.value) {
    const { error } = await supabase
      .from("subjects")
      .update(payload)
      .eq("id", form.value.id);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("Subject updated");
      dialog.value = false;
      fetchSubjects();
    }
  } else {
    const { error } = await supabase.from("subjects").insert(payload);

    if (error) {
      notify(error.message, "error");
    } else {
      notify("Subject created");
      dialog.value = false;
      fetchSubjects();
    }
  }
  saving.value = false;
}

function confirmDelete(subject: Subject) {
  subjectToDelete.value = subject;
  deleteDialog.value = true;
}

async function deleteSubject() {
  if (!subjectToDelete.value) return;
  deleting.value = true;

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectToDelete.value.id);

  if (error) {
    notify(error.message, "error");
  } else {
    notify("Subject deleted");
    deleteDialog.value = false;
    fetchSubjects();
  }
  deleting.value = false;
}

onMounted(fetchSubjects);
</script>
