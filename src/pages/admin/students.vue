<route lang="yaml">
meta:
  layout: admin
  requiresRole: admin
</route>

<template>
  <div>
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
        <h1 class="text-h4 font-weight-bold">Student Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Manage student records and enrollment information
        </p>
      </v-col>
      <v-col class="d-flex align-center" cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Student
        </v-btn>
      </v-col>
    </v-row>

    <!-- Students Table Card -->
    <v-card>
      <v-card-text>
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          class="mb-4"
          clearable
          density="compact"
          label="Search students..."
          variant="outlined"
        />

        <v-data-table
          :headers="headers"
          :items="students"
          :loading="loading"
          :search="search"
          class="elevation-1"
          item-value="id"
        >
          <template #[`item.actions`]="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              color="primary"
              variant="tonal"
              class="mr-2"
              @click="editStudent(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              color="error"
              variant="tonal"
              @click="confirmDelete(item)"
            />
          </template>

          <template #item.is_archived="{ item }">
            <v-chip :color="item.is_archived ? 'grey' : 'success'" size="small">
              {{ item.is_archived ? "Archived" : "Active" }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add/Edit Student Dialog -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h5">
          {{ editMode ? "Edit Student" : "Add New Student" }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <!-- Personal Information -->
              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mb-2">
                  Personal Information
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.first_name"
                  label="First Name *"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.middle_name"
                  label="Middle Name"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.last_name"
                  label="Last Name *"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.email"
                  label="Email *"
                  variant="outlined"
                  density="compact"
                  type="email"
                  :rules="[rules.required, rules.email]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.contact_number"
                  label="Contact Number"
                  variant="outlined"
                  density="compact"
                  placeholder="09XXXXXXXXX"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.birth_date"
                  label="Birth Date *"
                  variant="outlined"
                  density="compact"
                  type="date"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.birth_place"
                  label="Birth Place"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.gender"
                  label="Gender *"
                  variant="outlined"
                  density="compact"
                  :items="['Male', 'Female']"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.address"
                  label="Address"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <!-- Academic Information -->
              <v-col cols="12" class="mt-4">
                <div class="text-subtitle-1 font-weight-bold mb-2">
                  Academic Information
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.student_number"
                  label="Student Number *"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.lrn"
                  label="LRN (12 digits) *"
                  variant="outlined"
                  density="compact"
                  maxlength="12"
                  :rules="[rules.required, rules.lrn]"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.grade_level"
                  label="Grade Level *"
                  variant="outlined"
                  density="compact"
                  :items="['11', '12']"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.track"
                  label="Track *"
                  variant="outlined"
                  density="compact"
                  :items="tracks"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.strand"
                  label="Strand *"
                  variant="outlined"
                  density="compact"
                  :items="getStrandsForTrack(formData.track)"
                  :rules="[rules.required]"
                  :disabled="!formData.track"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.section"
                  label="Section *"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.enrollment_date"
                  label="Enrollment Date *"
                  variant="outlined"
                  density="compact"
                  type="date"
                  :rules="[rules.required]"
                />
              </v-col>

              <!-- Guardian Information -->
              <v-col cols="12" class="mt-4">
                <div class="text-subtitle-1 font-weight-bold mb-2">
                  Guardian Information
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.guardian_name"
                  label="Guardian Name"
                  variant="outlined"
                  density="compact"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.guardian_contact"
                  label="Guardian Contact"
                  variant="outlined"
                  density="compact"
                  placeholder="09XXXXXXXXX"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog"> Cancel </v-btn>
          <v-btn color="primary" variant="flat" @click="saveStudent">
            {{ editMode ? "Update" : "Save" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5"> Confirm Delete </v-card-title>

        <v-card-text>
          Are you sure you want to delete student
          <strong
            >{{ studentToDelete?.first_name }}
            {{ studentToDelete?.last_name }}</strong
          >? This action cannot be undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false"> Cancel </v-btn>
          <v-btn color="error" variant="flat" @click="deleteStudent">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

// State
const search = ref("");
const dialog = ref(false);
const deleteDialog = ref(false);
const editMode = ref(false);
const loading = ref(false);
const formRef = ref();

// Mock data (will be replaced with Supabase calls)
const students = ref([
  {
    id: "1",
    student_number: "STU-2024-001",
    lrn: "123456789001",
    first_name: "Maria",
    middle_name: "Garcia",
    last_name: "Santos",
    email: "maria.santos@deped.gov.ph",
    grade_level: "11",
    track: "Academic",
    strand: "STEM",
    section: "Einstein",
    is_archived: false,
  },
]);

const studentToDelete = ref<any>(null);

// Form data
const formData = ref({
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  contact_number: "",
  birth_date: "",
  birth_place: "",
  gender: "",
  address: "",
  student_number: "",
  lrn: "",
  grade_level: "",
  track: "",
  strand: "",
  section: "",
  enrollment_date: "",
  guardian_name: "",
  guardian_contact: "",
});

// Table headers
const headers = [
  { title: "Student Number", key: "student_number" },
  { title: "LRN", key: "lrn" },
  {
    title: "Name",
    key: "first_name",
    value: (item: any) => `${item.first_name} ${item.last_name}`,
  },
  { title: "Grade", key: "grade_level" },
  { title: "Track", key: "track" },
  { title: "Strand", key: "strand" },
  { title: "Section", key: "section" },
  { title: "Status", key: "is_archived" },
  { title: "Actions", key: "actions", sortable: false },
];

// Track/Strand options
const tracks = ["Academic", "TVL", "Arts & Design", "Sports"];

const strandsByTrack: Record<string, string[]> = {
  Academic: ["STEM", "ABM", "HUMSS", "GAS"],
  TVL: ["ICT", "Home Economics", "Agri-Fishery", "Industrial Arts"],
  "Arts & Design": ["Arts & Design"],
  Sports: ["Sports"],
};

// Validation rules
const rules = {
  required: (value: string) => !!value || "This field is required",
  email: (value: string) => {
    if (!value) return true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value) || "Must be a valid email address";
  },
  lrn: (value: string) => {
    if (!value) return true;
    return /^\d{12}$/.test(value) || "LRN must be exactly 12 digits";
  },
};

// Methods
function getStrandsForTrack(track: string) {
  return strandsByTrack[track] || [];
}

function openAddDialog() {
  editMode.value = false;
  formData.value = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    birth_date: "",
    birth_place: "",
    gender: "",
    address: "",
    student_number: "",
    lrn: "",
    grade_level: "",
    track: "",
    strand: "",
    section: "",
    enrollment_date: "",
    guardian_name: "",
    guardian_contact: "",
  };
  dialog.value = true;
}

function editStudent(item: any) {
  editMode.value = true;
  formData.value = { ...item };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  formRef.value?.reset();
}

async function saveStudent() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // TODO: Implement Supabase save logic
  console.log("Saving student:", formData.value);

  closeDialog();
}

function confirmDelete(item: any) {
  studentToDelete.value = item;
  deleteDialog.value = true;
}

function deleteStudent() {
  // TODO: Implement Supabase delete logic
  console.log("Deleting student:", studentToDelete.value);

  deleteDialog.value = false;
  studentToDelete.value = null;
}
</script>
